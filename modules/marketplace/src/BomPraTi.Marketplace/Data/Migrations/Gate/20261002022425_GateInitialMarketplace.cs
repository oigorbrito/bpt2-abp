using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BomPraTi.Marketplace.Data.Migrations.Gate
{
    /// <inheritdoc />
    public partial class GateInitialMarketplace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MarketplaceFavoritePriceDropMatches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ListingId = table.Column<Guid>(type: "uuid", nullable: false),
                    ListingPriceChangeId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreviousPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    NewPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DetectedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketplaceFavoritePriceDropMatches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketplaceFavorites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ListingId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketplaceFavorites", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketplaceLeads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ListingId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Channel = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ContactedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ClosedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Outcome = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketplaceLeads", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketplaceListingPhotos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ListingId = table.Column<Guid>(type: "uuid", nullable: false),
                    MediaAssetId = table.Column<Guid>(type: "uuid", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketplaceListingPhotos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketplaceListingPriceChanges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ListingId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreviousPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    NewPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ChangedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketplaceListingPriceChanges", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketplaceListingPromotions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ListingId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartsAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    EndsAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketplaceListingPromotions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketplaceListingReports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ListingId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketplaceListingReports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketplaceListings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SellerId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    ManufactureYear = table.Column<int>(type: "integer", nullable: true),
                    MileageKm = table.Column<int>(type: "integer", nullable: true),
                    Color = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    City = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    StateCode = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    FirstPublishedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketplaceListings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketplaceSavedSearchAlertDeliveryIntents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SavedSearchAlertMatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Channel = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(96)", maxLength: 96, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    LastAttemptAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    NextAttemptAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    LeaseExpiresAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    RecipientFingerprint = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    ProviderMessageId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketplaceSavedSearchAlertDeliveryIntents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketplaceSavedSearchAlertDetectionRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ListingId = table.Column<Guid>(type: "uuid", nullable: false),
                    EnqueuedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    LastAttemptAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    NextAttemptAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ProcessedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketplaceSavedSearchAlertDetectionRequests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketplaceSavedSearchAlertMatches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SavedSearchId = table.Column<Guid>(type: "uuid", nullable: false),
                    ListingId = table.Column<Guid>(type: "uuid", nullable: false),
                    DetectedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketplaceSavedSearchAlertMatches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketplaceSavedSearchEmailProviderEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ProviderEventId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ProviderMessageId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    EventType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ReceivedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketplaceSavedSearchEmailProviderEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketplaceSavedSearches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CriteriaKey = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: true),
                    SellerId = table.Column<Guid>(type: "uuid", nullable: true),
                    Brand = table.Column<string>(type: "text", nullable: true),
                    Model = table.Column<string>(type: "text", nullable: true),
                    Color = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    City = table.Column<string>(type: "text", nullable: true),
                    StateCode = table.Column<string>(type: "text", nullable: true),
                    MinModelYear = table.Column<int>(type: "integer", nullable: true),
                    MaxModelYear = table.Column<int>(type: "integer", nullable: true),
                    MinPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    MaxPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    MinMileageKm = table.Column<int>(type: "integer", nullable: true),
                    MaxMileageKm = table.Column<int>(type: "integer", nullable: true),
                    Query = table.Column<string>(type: "text", nullable: true),
                    AlertEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AlertEnabledAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    EmailEachNewMatchEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    EmailEachNewMatchEnabledAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketplaceSavedSearches", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceFavoritePriceDropMatches_ListingId_DetectedAtUtc",
                table: "MarketplaceFavoritePriceDropMatches",
                columns: new[] { "ListingId", "DetectedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceFavoritePriceDropMatches_UserId_ListingPriceChan~",
                table: "MarketplaceFavoritePriceDropMatches",
                columns: new[] { "UserId", "ListingPriceChangeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceFavorites_UserId_ListingId",
                table: "MarketplaceFavorites",
                columns: new[] { "UserId", "ListingId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceLeads_ListingId_CreatedAtUtc",
                table: "MarketplaceLeads",
                columns: new[] { "ListingId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceListingPhotos_ListingId_MediaAssetId",
                table: "MarketplaceListingPhotos",
                columns: new[] { "ListingId", "MediaAssetId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceListingPhotos_ListingId_SortOrder",
                table: "MarketplaceListingPhotos",
                columns: new[] { "ListingId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceListingPriceChanges_ListingId_ChangedAtUtc",
                table: "MarketplaceListingPriceChanges",
                columns: new[] { "ListingId", "ChangedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceListingPromotions_ListingId",
                table: "MarketplaceListingPromotions",
                column: "ListingId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceListingPromotions_StartsAtUtc_EndsAtUtc",
                table: "MarketplaceListingPromotions",
                columns: new[] { "StartsAtUtc", "EndsAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceListingReports_ListingId_CreatedAtUtc",
                table: "MarketplaceListingReports",
                columns: new[] { "ListingId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceListingReports_UserId_ListingId",
                table: "MarketplaceListingReports",
                columns: new[] { "UserId", "ListingId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceListings_SellerId_Status",
                table: "MarketplaceListings",
                columns: new[] { "SellerId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceListings_Status_VehicleId",
                table: "MarketplaceListings",
                columns: new[] { "Status", "VehicleId" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceSavedSearchAlertDeliveryIntents_IdempotencyKey",
                table: "MarketplaceSavedSearchAlertDeliveryIntents",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceSavedSearchAlertDeliveryIntents_SavedSearchAlert~",
                table: "MarketplaceSavedSearchAlertDeliveryIntents",
                columns: new[] { "SavedSearchAlertMatchId", "Channel" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceSavedSearchAlertDeliveryIntents_Status_NextAttem~",
                table: "MarketplaceSavedSearchAlertDeliveryIntents",
                columns: new[] { "Status", "NextAttemptAtUtc", "LeaseExpiresAtUtc", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceSavedSearchAlertDetectionRequests_ListingId",
                table: "MarketplaceSavedSearchAlertDetectionRequests",
                column: "ListingId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceSavedSearchAlertDetectionRequests_ProcessedAtUtc~",
                table: "MarketplaceSavedSearchAlertDetectionRequests",
                columns: new[] { "ProcessedAtUtc", "NextAttemptAtUtc", "EnqueuedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceSavedSearchAlertMatches_SavedSearchId_DetectedAt~",
                table: "MarketplaceSavedSearchAlertMatches",
                columns: new[] { "SavedSearchId", "DetectedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceSavedSearchAlertMatches_SavedSearchId_ListingId",
                table: "MarketplaceSavedSearchAlertMatches",
                columns: new[] { "SavedSearchId", "ListingId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceSavedSearchEmailProviderEvents_Provider_Provider~",
                table: "MarketplaceSavedSearchEmailProviderEvents",
                columns: new[] { "Provider", "ProviderEventId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceSavedSearchEmailProviderEvents_ProviderMessageId~",
                table: "MarketplaceSavedSearchEmailProviderEvents",
                columns: new[] { "ProviderMessageId", "ReceivedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceSavedSearches_AlertEnabled_Id",
                table: "MarketplaceSavedSearches",
                columns: new[] { "AlertEnabled", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceSavedSearches_EmailEachNewMatchEnabled_Id",
                table: "MarketplaceSavedSearches",
                columns: new[] { "EmailEachNewMatchEnabled", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceSavedSearches_UserId_CreatedAtUtc",
                table: "MarketplaceSavedSearches",
                columns: new[] { "UserId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketplaceSavedSearches_UserId_CriteriaKey",
                table: "MarketplaceSavedSearches",
                columns: new[] { "UserId", "CriteriaKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MarketplaceFavoritePriceDropMatches");

            migrationBuilder.DropTable(
                name: "MarketplaceFavorites");

            migrationBuilder.DropTable(
                name: "MarketplaceLeads");

            migrationBuilder.DropTable(
                name: "MarketplaceListingPhotos");

            migrationBuilder.DropTable(
                name: "MarketplaceListingPriceChanges");

            migrationBuilder.DropTable(
                name: "MarketplaceListingPromotions");

            migrationBuilder.DropTable(
                name: "MarketplaceListingReports");

            migrationBuilder.DropTable(
                name: "MarketplaceListings");

            migrationBuilder.DropTable(
                name: "MarketplaceSavedSearchAlertDeliveryIntents");

            migrationBuilder.DropTable(
                name: "MarketplaceSavedSearchAlertDetectionRequests");

            migrationBuilder.DropTable(
                name: "MarketplaceSavedSearchAlertMatches");

            migrationBuilder.DropTable(
                name: "MarketplaceSavedSearchEmailProviderEvents");

            migrationBuilder.DropTable(
                name: "MarketplaceSavedSearches");
        }
    }
}
