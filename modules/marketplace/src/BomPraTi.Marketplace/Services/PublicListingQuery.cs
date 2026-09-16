using BomPraTi.Catalog.Contracts;
using BomPraTi.Media.Contracts;
using BomPraTi.Marketplace.Contracts;
using BomPraTi.Marketplace.Data;
using BomPraTi.Marketplace.Domain;
using BomPraTi.Sellers.Contracts;
using Microsoft.EntityFrameworkCore;
using Volo.Abp.Application.Dtos;
using Volo.Abp.DependencyInjection;

namespace BomPraTi.Marketplace.Services;

public sealed class PublicListingQuery : IPublicListingQuery, ITransientDependency
{
    private readonly MarketplaceDbContext _dbContext;
    private readonly IMediaAssetReader _mediaAssets;
    private readonly IVehicleCatalogReader _vehicleCatalog;
    private readonly ISellerPublicReader _sellers;

    public PublicListingQuery(
        MarketplaceDbContext dbContext,
        IMediaAssetReader mediaAssets,
        IVehicleCatalogReader vehicleCatalog,
        ISellerPublicReader sellers)
    {
        _dbContext = dbContext;
        _mediaAssets = mediaAssets;
        _vehicleCatalog = vehicleCatalog;
        _sellers = sellers;
    }

    public async Task<PublicListingDto?> GetAsync(Guid listingId, CancellationToken cancellationToken = default)
    {
        var listings = await GetManyAsync(new[] { listingId }, cancellationToken);
        return listings.SingleOrDefault();
    }

    public async Task<IReadOnlyList<PublicListingDto>> GetManyAsync(
        IReadOnlyCollection<Guid> listingIds,
        CancellationToken cancellationToken = default)
    {
        var ids = listingIds.Distinct().ToArray();
        if (ids.Length == 0)
        {
            return Array.Empty<PublicListingDto>();
        }

        var rows = await ListingVisibility.PublicOnly(_dbContext.Listings.AsNoTracking())
            .Where(x => ids.Contains(x.Id))
            .OrderBy(x => x.Id)
            .Select(x => new ListingRow(
                x.Id,
                x.SellerId,
                x.VehicleId,
                x.Title,
                x.Price,
                x.Description,
                x.ManufactureYear,
                x.MileageKm,
                x.Color,
                x.City,
                x.StateCode))
            .ToListAsync(cancellationToken);

        return await ProjectRowsAsync(rows, cancellationToken);
    }

    public Task<IReadOnlyList<PublicListingDto>> SearchAsync(
        Guid? vehicleId = null,
        string? query = null,
        int skip = 0,
        int take = 20,
        CancellationToken cancellationToken = default)
    {
        return SearchAsync(
            new PublicListingSearchInput
            {
                VehicleId = vehicleId,
                Query = query,
                Skip = skip,
                Take = take
            },
            cancellationToken);
    }

    public async Task<IReadOnlyList<PublicListingDto>> SearchAsync(
        PublicListingSearchInput input,
        CancellationToken cancellationToken = default)
    {
        var page = await SearchPageAsync(input, cancellationToken);
        return page.Items;
    }

    public async Task<bool> MatchesAsync(
        Guid listingId,
        PublicListingSearchInput input,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(input);
        var listings = await BuildFilteredListingsAsync(input, cancellationToken);
        if (listings is null)
        {
            return false;
        }

        return await listings.AnyAsync(x => x.Id == listingId, cancellationToken);
    }

    public async Task<PagedResultDto<PublicListingDto>> SearchPageAsync(
        PublicListingSearchInput input,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(input);
        var listings = await BuildFilteredListingsAsync(input, cancellationToken);
        if (listings is null)
        {
            return EmptyPage();
        }

        var totalCount = await listings.LongCountAsync(cancellationToken);
        if (totalCount == 0)
        {
            return EmptyPage();
        }

        var boundedSkip = Math.Max(0, input.Skip);
        var boundedTake = Math.Clamp(input.Take, 1, 100);
        var orderedListings = OrderListings(listings, input.Sort);

        var rows = await orderedListings
            .Skip(boundedSkip)
            .Take(boundedTake)
            .Select(x => new ListingRow(
                x.Id,
                x.SellerId,
                x.VehicleId,
                x.Title,
                x.Price,
                x.Description,
                x.ManufactureYear,
                x.MileageKm,
                x.Color,
                x.City,
                x.StateCode))
            .ToListAsync(cancellationToken);

        var items = await ProjectRowsAsync(rows, cancellationToken);
        return new PagedResultDto<PublicListingDto>(totalCount, items);
    }

    private async Task<IQueryable<Listing>?> BuildFilteredListingsAsync(
        PublicListingSearchInput input,
        CancellationToken cancellationToken)
    {
        if (input.MinPrice.HasValue && input.MaxPrice.HasValue && input.MinPrice > input.MaxPrice)
        {
            return null;
        }

        if (input.MinModelYear.HasValue && input.MaxModelYear.HasValue && input.MinModelYear > input.MaxModelYear)
        {
            return null;
        }

        if (input.MinMileageKm.HasValue && input.MaxMileageKm.HasValue && input.MinMileageKm > input.MaxMileageKm)
        {
            return null;
        }

        var listings = ListingVisibility.PublicOnly(_dbContext.Listings.AsNoTracking());

        if (input.VehicleId.HasValue)
        {
            listings = listings.Where(x => x.VehicleId == input.VehicleId.Value);
        }

        if (input.SellerId.HasValue)
        {
            listings = listings.Where(x => x.SellerId == input.SellerId.Value);
        }

        if (HasCatalogFilters(input))
        {
            var vehicleIds = await _vehicleCatalog.FindIdsAsync(
                new VehicleCatalogSearchInput(
                    input.Brand,
                    input.Model,
                    input.MinModelYear,
                    input.MaxModelYear),
                cancellationToken);

            if (vehicleIds.Count == 0)
            {
                return null;
            }

            listings = listings.Where(x => vehicleIds.Contains(x.VehicleId));
        }

        if (!string.IsNullOrWhiteSpace(input.Color))
        {
            var normalizedColor = input.Color.Trim().ToLowerInvariant();
            listings = listings.Where(x => x.Color != null && x.Color.ToLower() == normalizedColor);
        }

        if (!string.IsNullOrWhiteSpace(input.City))
        {
            var normalizedCity = input.City.Trim().ToLowerInvariant();
            listings = listings.Where(x => x.City.ToLower() == normalizedCity);
        }

        if (!string.IsNullOrWhiteSpace(input.StateCode))
        {
            var normalizedStateCode = input.StateCode.Trim().ToUpperInvariant();
            listings = listings.Where(x => x.StateCode == normalizedStateCode);
        }

        if (input.MinPrice.HasValue)
        {
            listings = listings.Where(x => x.Price >= input.MinPrice.Value);
        }

        if (input.MaxPrice.HasValue)
        {
            listings = listings.Where(x => x.Price <= input.MaxPrice.Value);
        }

        if (input.MinMileageKm.HasValue)
        {
            listings = listings.Where(x => x.MileageKm.HasValue && x.MileageKm.Value >= input.MinMileageKm.Value);
        }

        if (input.MaxMileageKm.HasValue)
        {
            listings = listings.Where(x => x.MileageKm.HasValue && x.MileageKm.Value <= input.MaxMileageKm.Value);
        }

        if (!string.IsNullOrWhiteSpace(input.Query))
        {
            var normalized = input.Query.Trim().ToLowerInvariant();
            var vehicleIds = await _vehicleCatalog.FindIdsByTextAsync(input.Query, cancellationToken);
            listings = vehicleIds.Count == 0
                ? listings.Where(x => x.Title.ToLower().Contains(normalized))
                : listings.Where(x =>
                    x.Title.ToLower().Contains(normalized)
                    || vehicleIds.Contains(x.VehicleId));
        }

        return listings;
    }

    private static IOrderedQueryable<Listing> OrderListings(IQueryable<Listing> listings, string? sort)
    {
        return sort?.Trim().ToLowerInvariant() switch
        {
            null or "" => listings.OrderBy(x => x.Id),
            "price-asc" => listings.OrderBy(x => x.Price).ThenBy(x => x.Id),
            "price-desc" => listings.OrderByDescending(x => x.Price).ThenBy(x => x.Id),
            "recent-desc" => listings
                .OrderBy(x => x.FirstPublishedAtUtc == null)
                .ThenByDescending(x => x.FirstPublishedAtUtc)
                .ThenBy(x => x.Id),
            _ => throw new ArgumentException("Unsupported public listing sort.", nameof(sort))
        };
    }

    private static PagedResultDto<PublicListingDto> EmptyPage() =>
        new(0, Array.Empty<PublicListingDto>());

    private async Task<IReadOnlyList<PublicListingDto>> ProjectRowsAsync(
        IReadOnlyList<ListingRow> rows,
        CancellationToken cancellationToken)
    {
        if (rows.Count == 0)
        {
            return Array.Empty<PublicListingDto>();
        }

        var vehicles = await _vehicleCatalog.GetManyAsync(
            rows.Select(x => x.VehicleId).Distinct().ToArray(),
            cancellationToken);
        var vehiclesById = vehicles.ToDictionary(x => x.Id);

        var sellers = await _sellers.GetManyAsync(
            rows.Select(x => x.SellerId).Distinct().ToArray(),
            cancellationToken);
        var sellersById = sellers.ToDictionary(x => x.SellerId);

        var photos = await LoadPhotosAsync(rows.Select(x => x.Id).ToArray(), cancellationToken);
        return rows
            .Where(row => vehiclesById.ContainsKey(row.VehicleId))
            .Select(row => ToDto(
                row,
                vehiclesById[row.VehicleId],
                sellersById.GetValueOrDefault(row.SellerId),
                photos.GetValueOrDefault(row.Id) ?? Array.Empty<PublicListingPhotoDto>()))
            .ToList();
    }

    private static bool HasCatalogFilters(PublicListingSearchInput input)
    {
        return !string.IsNullOrWhiteSpace(input.Brand)
            || !string.IsNullOrWhiteSpace(input.Model)
            || input.MinModelYear.HasValue
            || input.MaxModelYear.HasValue;
    }

    private async Task<Dictionary<Guid, IReadOnlyList<PublicListingPhotoDto>>> LoadPhotosAsync(
        IReadOnlyCollection<Guid> listingIds,
        CancellationToken cancellationToken)
    {
        if (listingIds.Count == 0)
        {
            return new Dictionary<Guid, IReadOnlyList<PublicListingPhotoDto>>();
        }

        var photoRows = await _dbContext.ListingPhotos
            .AsNoTracking()
            .Where(x => listingIds.Contains(x.ListingId))
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Id)
            .Select(x => new PhotoRow(x.Id, x.ListingId, x.MediaAssetId, x.SortOrder))
            .ToListAsync(cancellationToken);

        var mediaAssets = await _mediaAssets.GetManyAsync(
            photoRows.Select(x => x.MediaAssetId).Distinct().ToArray(),
            cancellationToken);
        var mediaById = mediaAssets.ToDictionary(x => x.Id);

        // Optimize photo grouping into a single O(N) pass to eliminate intermediate
        // anonymous object allocations and LINQ GroupBy overhead in high-throughput query paths.
        var photosByListing = new Dictionary<Guid, List<PublicListingPhotoDto>>();
        foreach (var photoRow in photoRows)
        {
            if (mediaById.TryGetValue(photoRow.MediaAssetId, out var media))
            {
                if (!photosByListing.TryGetValue(photoRow.ListingId, out var list))
                {
                    list = new List<PublicListingPhotoDto>();
                    photosByListing[photoRow.ListingId] = list;
                }

                list.Add(new PublicListingPhotoDto(
                    photoRow.Id,
                    photoRow.MediaAssetId,
                    media.ContentType,
                    media.Length,
                    photoRow.SortOrder));
            }
        }

        return photosByListing.ToDictionary(
            kvp => kvp.Key,
            kvp => (IReadOnlyList<PublicListingPhotoDto>)kvp.Value);
    }

    private static PublicListingDto ToDto(
        ListingRow row,
        VehicleRefDto vehicle,
        SellerPublicContactDto? seller,
        IReadOnlyList<PublicListingPhotoDto> photos) =>
        new(
            row.Id,
            row.VehicleId,
            new PublicListingVehicleDto(
                vehicle.Id,
                vehicle.Brand,
                vehicle.Model,
                vehicle.Generation,
                vehicle.Version,
                vehicle.ModelYear),
            new PublicListingSellerDto(row.SellerId, seller?.DisplayName, seller?.WhatsAppNumber),
            row.Title,
            row.Price,
            row.Description,
            row.ManufactureYear,
            row.MileageKm,
            row.Color,
            row.City,
            row.StateCode,
            photos);

    private sealed record ListingRow(
        Guid Id,
        Guid SellerId,
        Guid VehicleId,
        string Title,
        decimal Price,
        string Description,
        int? ManufactureYear,
        int? MileageKm,
        string? Color,
        string City,
        string StateCode);

    private sealed record PhotoRow(Guid Id, Guid ListingId, Guid MediaAssetId, int SortOrder);
}
