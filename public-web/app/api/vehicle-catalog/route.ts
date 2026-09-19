import { NextResponse } from "next/server";
import { getVehicleCatalogPage } from "@/lib/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const items = await getVehicleCatalogPage(0, 12, query);
    // ⚡ Bolt: Allow browser and CDN to cache search results to offload backend
    return NextResponse.json(items, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar o catálogo agora." },
      { status: 502 },
    );
  }
}
