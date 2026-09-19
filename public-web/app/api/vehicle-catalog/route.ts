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
    return NextResponse.json(items);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar o catálogo agora." },
      { status: 502 },
    );
  }
}
