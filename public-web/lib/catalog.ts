export type VehicleRef = {
  id: string;
  brand: string;
  model: string;
  generation: string | null;
  version: string;
  modelYear: number | null;
  powertrain: string | null;
  transmission: string | null;
  bodyStyle: string | null;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function serverApiBaseUrl(): string {
  const value = process.env.BPT_API_BASE_URL ?? process.env.NEXT_PUBLIC_BPT_API_BASE_URL;
  if (!value) {
    throw new Error("BPT_API_BASE_URL or NEXT_PUBLIC_BPT_API_BASE_URL is required at runtime.");
  }

  return trimTrailingSlash(value);
}

export async function getVehicleCatalogPage(
  skip = 0,
  take = 100,
  query?: string,
): Promise<VehicleRef[]> {
  const url = new URL("/api/app/vehicle-catalog", `${serverApiBaseUrl()}/`);
  url.searchParams.set("skip", String(Math.max(0, skip)));
  url.searchParams.set("take", String(take));
  if (query?.trim()) {
    url.searchParams.set("query", query.trim());
  }

  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Vehicle Catalog list failed with HTTP ${response.status}.`);
  }

  return (await response.json()) as VehicleRef[];
}

export async function getVehicle(id: string): Promise<VehicleRef | null> {
  const response = await fetch(
    new URL(`/api/app/vehicle-catalog/${encodeURIComponent(id)}`, `${serverApiBaseUrl()}/`),
    {
      cache: "no-store",
      headers: { Accept: "application/json" },
    },
  );

  if (response.status === 404 || response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Vehicle Catalog detail failed with HTTP ${response.status}.`);
  }

  const vehicle = (await response.json()) as VehicleRef | null;
  return vehicle ?? null;
}

export function vehicleRefLabel(vehicle: VehicleRef): string {
  return [vehicle.brand, vehicle.model, vehicle.version]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");
}

export function vehicleSelectorLabel(vehicle: VehicleRef): string {
  const identity = [vehicle.brand, vehicle.model, vehicle.generation, vehicle.version]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" · ");
  return vehicle.modelYear ? `${identity} · ${vehicle.modelYear}` : identity;
}
