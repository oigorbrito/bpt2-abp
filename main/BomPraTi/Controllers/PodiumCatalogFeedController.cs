using BomPraTi.Ingestion.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BomPraTi.Controllers;

[ApiController]
[Authorize(Roles = "admin")]
[Route("api/integrations/podium/catalog/v1/vehicles")]
public sealed class PodiumCatalogFeedController : ControllerBase
{
    private readonly IPodiumCatalogFeedAppService _feed;

    public PodiumCatalogFeedController(IPodiumCatalogFeedAppService feed)
    {
        _feed = feed;
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public Task<PodiumCatalogImportResultDto> ImportAsync(
        [FromBody] PodiumCatalogVehicleInput input,
        CancellationToken cancellationToken)
    {
        return _feed.ImportAsync(input, cancellationToken);
    }
}
