using System.Text.Json;
using BomPraTi.Catalog.Contracts;
using BomPraTi.Ingestion.Contracts;
using BomPraTi.Ingestion.Data;
using BomPraTi.Ingestion.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Validation;

namespace BomPraTi.Ingestion.Services;

[Authorize(Roles = "admin")]
public class PodiumCatalogFeedAppService : IPodiumCatalogFeedAppService, ITransientDependency
{
    private const string Source = "podium7";
    private const string SupportedContractVersion = "2.0";

    private readonly IngestionDbContext _dbContext;
    private readonly ICanonicalVehicleAdminAppService _catalogAdmin;
    private readonly IVehicleCatalogReader _vehicles;

    public PodiumCatalogFeedAppService(
        IngestionDbContext dbContext,
        ICanonicalVehicleAdminAppService catalogAdmin,
        IVehicleCatalogReader vehicles)
    {
        _dbContext = dbContext;
        _catalogAdmin = catalogAdmin;
        _vehicles = vehicles;
    }

    public async Task<PodiumCatalogImportResultDto> ImportAsync(
        PodiumCatalogVehicleInput input,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(input);

        if (!string.Equals(input.ContractVersion, SupportedContractVersion, StringComparison.Ordinal))
        {
            throw new AbpValidationException(
                $"Unsupported Podium catalog contract version '{input.ContractVersion}'. Expected '{SupportedContractVersion}'.");
        }

        var entity = input.Entity ?? throw new AbpValidationException("Podium entity is required.");
        var canonicalExternalId = RequireText(entity.Id, 256, "entity.id");
        var make = RequireText(entity.Make, 128, "entity.make");
        var model = RequireText(entity.Model, 128, "entity.model");
        var generation = OptionalText(entity.Generation, 128, "entity.generation");
        var variant = RequireText(entity.Variant, 180, "entity.variant");
        var powertrain = OptionalOpaqueText(entity.Powertrain);
        var transmission = OptionalOpaqueText(entity.Transmission);
        var bodyStyle = OptionalOpaqueText(entity.BodyStyle);
        var externalIdentifiers = NormalizeExternalIdentifiers(entity.ExternalIdentifiers);
        var modelYear = ResolveModelYear(entity.ModelYearFrom, entity.ModelYearTo);
        var redirects = NormalizeRedirects(input.RedirectsFrom, canonicalExternalId);

        var requestedExternalIds = redirects.Prepend(canonicalExternalId).ToArray();
        var existingRecords = await _dbContext.Records
            .Where(x => x.Source == Source && requestedExternalIds.Contains(x.ExternalId))
            .ToListAsync(cancellationToken);

        var mappedVehicleIds = existingRecords
            .Where(x => x.ReconciledVehicleId.HasValue)
            .Select(x => x.ReconciledVehicleId!.Value)
            .Distinct()
            .ToArray();

        if (mappedVehicleIds.Length > 1)
        {
            throw new InvalidOperationException(
                "Podium canonical/redirect identities are already linked to different BPT2 Vehicles.");
        }

        Guid vehicleId;
        var replayed = false;

        if (mappedVehicleIds.Length == 1)
        {
            vehicleId = mappedVehicleIds[0];
            if (await _vehicles.GetAsync(vehicleId, cancellationToken) is null)
            {
                throw new EntityNotFoundException(typeof(VehicleRefDto), vehicleId);
            }

            replayed = true;
        }
        else
        {
            var pendingCanonical = existingRecords.SingleOrDefault(x => x.ExternalId == canonicalExternalId);
            if (pendingCanonical is not null)
            {
                throw new InvalidOperationException(
                    "The Podium canonical identity already exists in pending ingestion state and cannot be rematched by labels.");
            }

            var created = await _catalogAdmin.CreateAsync(
                new CreateCanonicalVehicleInput
                {
                    BrandName = make,
                    ModelName = model,
                    GenerationName = generation,
                    GenerationStartYear = null,
                    GenerationEndYear = null,
                    VersionName = variant,
                    ModelYear = modelYear,
                    Powertrain = powertrain,
                    Transmission = transmission,
                    BodyStyle = bodyStyle
                },
                cancellationToken);
            vehicleId = created.Id;
        }

        await _catalogAdmin.SynchronizeTechnicalIdentityAsync(
            vehicleId,
            new SynchronizeCanonicalVehicleTechnicalIdentityInput
            {
                Powertrain = powertrain,
                Transmission = transmission,
                BodyStyle = bodyStyle
            },
            cancellationToken);

        await _catalogAdmin.SynchronizeExternalIdentifiersAsync(
            vehicleId,
            new SynchronizeCanonicalVehicleExternalIdentifiersInput
            {
                Authority = Source,
                Identifiers = externalIdentifiers
                    .Select(x => new CanonicalVehicleExternalIdentifierInput
                    {
                        Namespace = x.Namespace,
                        Value = x.Value
                    })
                    .ToArray()
            },
            cancellationToken);

        var rawIdentity = BuildRawIdentity(
            input,
            canonicalExternalId,
            make,
            model,
            generation,
            variant,
            modelYear,
            powertrain,
            transmission,
            bodyStyle,
            externalIdentifiers);
        const string provenance = "Podium 7 Catalog JSON Contract 2.0 canonical projection";

        foreach (var externalId in requestedExternalIds)
        {
            var record = existingRecords.SingleOrDefault(x => x.ExternalId == externalId);
            if (record is null)
            {
                record = new IngestionRecord(
                    Guid.NewGuid(),
                    Source,
                    externalId,
                    rawIdentity,
                    1.0m,
                    provenance);
                record.ReconcileTo(vehicleId);
                await _dbContext.Records.AddAsync(record, cancellationToken);
                continue;
            }

            if (record.ReconciledVehicleId.HasValue && record.ReconciledVehicleId.Value != vehicleId)
            {
                throw new InvalidOperationException(
                    $"Podium identity '{externalId}' is already linked to a different BPT2 Vehicle.");
            }

            if (!record.ReconciledVehicleId.HasValue)
            {
                record.ReconcileTo(vehicleId);
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new PodiumCatalogImportResultDto(
            vehicleId,
            canonicalExternalId,
            redirects,
            replayed);
    }

    private static int? ResolveModelYear(int? from, int? to)
    {
        if (!from.HasValue && !to.HasValue)
        {
            return null;
        }

        if (from.HasValue && to.HasValue && from.Value == to.Value)
        {
            return from.Value;
        }

        throw new AbpValidationException(
            "Podium model-year ranges cannot be projected into the current scalar BPT2 Vehicle.ModelYear without losing semantics.");
    }

    private static IReadOnlyList<string> NormalizeRedirects(
        IReadOnlyList<string>? redirects,
        string canonicalExternalId)
    {
        if (redirects is null || redirects.Count == 0)
        {
            return Array.Empty<string>();
        }

        return redirects
            .Select(x => RequireText(x, 256, "redirectsFrom"))
            .Where(x => !string.Equals(x, canonicalExternalId, StringComparison.Ordinal))
            .Distinct(StringComparer.Ordinal)
            .OrderBy(x => x, StringComparer.Ordinal)
            .ToArray();
    }

    private static IReadOnlyList<PodiumExternalIdentifierInput> NormalizeExternalIdentifiers(
        IReadOnlyList<PodiumExternalIdentifierInput>? identifiers)
    {
        if (identifiers is null || identifiers.Count == 0)
        {
            return Array.Empty<PodiumExternalIdentifierInput>();
        }

        return identifiers
            .Select(x =>
            {
                ArgumentNullException.ThrowIfNull(x);
                return new PodiumExternalIdentifierInput
                {
                    Namespace = RequireOpaqueText(x.Namespace, "entity.external_identifiers.namespace"),
                    Value = RequireOpaqueText(x.Value, "entity.external_identifiers.value")
                };
            })
            .DistinctBy(x => (x.Namespace, x.Value))
            .OrderBy(x => x.Namespace, StringComparer.Ordinal)
            .ThenBy(x => x.Value, StringComparer.Ordinal)
            .ToArray();
    }

    private static string BuildRawIdentity(
        PodiumCatalogVehicleInput input,
        string canonicalExternalId,
        string make,
        string model,
        string? generation,
        string variant,
        int? modelYear,
        string? powertrain,
        string? transmission,
        string? bodyStyle,
        IReadOnlyList<PodiumExternalIdentifierInput> externalIdentifiers)
    {
        var summary = JsonSerializer.Serialize(new
        {
            contractVersion = input.ContractVersion,
            id = canonicalExternalId,
            make,
            model,
            generation,
            variant,
            modelYear,
            powertrain,
            transmission,
            bodyStyle,
            externalIdentifiers = externalIdentifiers.Select(x => new { x.Namespace, x.Value })
        });

        return summary.Length <= 1024 ? summary : summary[..1024];
    }

    private static string RequireText(string? value, int maxLength, string field)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            throw new AbpValidationException($"Podium field '{field}' is required.");
        }

        if (trimmed.Length > maxLength)
        {
            throw new AbpValidationException($"Podium field '{field}' cannot exceed {maxLength} characters.");
        }

        return trimmed;
    }

    private static string? OptionalText(string? value, int maxLength, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
        {
            throw new AbpValidationException($"Podium field '{field}' cannot exceed {maxLength} characters.");
        }

        return trimmed;
    }

    private static string? OptionalOpaqueText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string RequireOpaqueText(string? value, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new AbpValidationException($"Podium field '{field}' is required.");
        }

        return value;
    }
}
