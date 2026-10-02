using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BomPraTi.Ingestion.Data.Migrations.Gate
{
    /// <inheritdoc />
    public partial class GateInitialIngestion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IngestionRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Source = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ExternalId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    RawIdentity = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    Confidence = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    Provenance = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    ReconciledVehicleId = table.Column<Guid>(type: "uuid", nullable: true),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyStamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IngestionRecords", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IngestionRecords_ReconciledVehicleId",
                table: "IngestionRecords",
                column: "ReconciledVehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_IngestionRecords_Source_ExternalId",
                table: "IngestionRecords",
                columns: new[] { "Source", "ExternalId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IngestionRecords");
        }
    }
}
