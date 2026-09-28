export type SellerProfile = {
  id: string;
  displayName: string;
  whatsAppNumber: string;
};

export type UpdateSellerProfileInput = {
  displayName: string;
  whatsAppNumber: string;
};

export type SellerListing = {
  id: string;
  sellerId: string;
  vehicleId: string;
  title: string;
  price: number;
  description: string;
  manufactureYear: number | null;
  mileageKm: number | null;
  color: string | null;
  city: string;
  stateCode: string;
  status: string;
  concurrencyStamp: string;
};

export type SellerLeadOutcome = "Won" | "Lost";

export type SellerLead = {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerUserId: string | null;
  channel: string;
  createdAtUtc: string;
  contactedAtUtc: string | null;
  closedAtUtc: string | null;
  outcome: SellerLeadOutcome | null;
};

export type SellerListingPhoto = {
  id: string;
  mediaAssetId: string;
  sortOrder: number;
};

export type SellerListingDetail = {
  listing: SellerListing;
  photos: SellerListingPhoto[];
};

export type MediaAssetRef = {
  id: string;
  contentType: string;
  length: number;
};

export type VehicleRef = {
  id: string;
  brand: string;
  model: string;
  generation: string | null;
  version: string;
  modelYear: number | null;
};

export type CreateListingInput = {
  vehicleId: string;
  title: string;
  price: number;
  description: string;
  manufactureYear: number | null;
  mileageKm: number | null;
  color: string | null;
  city: string;
  stateCode: string;
};

export type UpdateListingInput = Omit<CreateListingInput, "vehicleId"> & {
  concurrencyStamp: string;
};

export type SellerListingAction = "publish" | "pause" | "archive";

function apiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BPT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_BPT_AUTHORITY ??
    "http://127.0.0.1:5093"
  ).replace(/\/$/, "");
}

async function apiRequest(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (init?.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("Sua sessão expirou. Entre novamente para continuar.");
  }

  if (response.status === 409) {
    if (path.startsWith("/api/app/listing-command")) {
      throw new Error("Este anúncio mudou desde que você o abriu. Recarregue antes de salvar novamente.");
    }
    throw new Error("A operação conflita com o estado atual. Recarregue os dados antes de tentar novamente.");
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `A API Seller respondeu ${response.status}${detail ? `: ${detail}` : "."}`,
    );
  }

  return response;
}

async function publicRequest(path: string): Promise<Response> {
  const response = await fetch(`${apiBaseUrl()}${path}`, { next: { revalidate: 3600 } });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `A API de catálogo respondeu ${response.status}${detail ? `: ${detail}` : "."}`,
    );
  }
  return response;
}

export async function getSellerProfile(accessToken: string): Promise<SellerProfile | null> {
  const response = await apiRequest("/api/app/seller-profile/current", accessToken);
  if (response.status === 204) {
    return null;
  }

  return (await response.json()) as SellerProfile;
}

export async function upsertSellerProfile(
  accessToken: string,
  input: UpdateSellerProfileInput,
): Promise<SellerProfile> {
  const response = await apiRequest("/api/app/seller-profile/upsert", accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return (await response.json()) as SellerProfile;
}

export async function getMyListings(accessToken: string): Promise<SellerListing[]> {
  const response = await apiRequest("/api/app/seller-listing-query/mine", accessToken);
  return (await response.json()) as SellerListing[];
}

export async function getMyLeads(accessToken: string): Promise<SellerLead[]> {
  const response = await apiRequest("/api/app/seller-lead-query/mine", accessToken);
  return (await response.json()) as SellerLead[];
}

export async function markSellerLeadContacted(accessToken: string, leadId: string): Promise<void> {
  await apiRequest(
    `/api/app/seller-lead-command/mark-contacted/${encodeURIComponent(leadId)}`,
    accessToken,
    { method: "POST" },
  );
}

export async function closeSellerLead(
  accessToken: string,
  leadId: string,
  outcome: SellerLeadOutcome,
): Promise<void> {
  await apiRequest(
    `/api/app/seller-lead-command/close/${encodeURIComponent(leadId)}`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ outcome }),
    },
  );
}

export async function getMyListingDetail(
  accessToken: string,
  listingId: string,
): Promise<SellerListingDetail | null> {
  const response = await apiRequest(
    `/api/app/seller-listing-query/mine-by-id/${encodeURIComponent(listingId)}`,
    accessToken,
  );
  if (response.status === 204) {
    return null;
  }
  return (await response.json()) as SellerListingDetail;
}

export async function getSellerPhotoBlob(
  accessToken: string,
  listingId: string,
  photoId: string,
): Promise<Blob> {
  const response = await apiRequest(
    `/api/app/seller-listing-query/mine-photo?listingId=${encodeURIComponent(listingId)}&photoId=${encodeURIComponent(photoId)}`,
    accessToken,
  );
  return response.blob();
}

export async function getVehicleCatalog(take = 50): Promise<VehicleRef[]> {
  const response = await publicRequest(`/api/app/vehicle-catalog?take=${take}`);
  return (await response.json()) as VehicleRef[];
}

export async function getVehicle(vehicleId: string): Promise<VehicleRef | null> {
  const response = await publicRequest(`/api/app/vehicle-catalog/${encodeURIComponent(vehicleId)}`);
  if (response.status === 204) {
    return null;
  }
  return (await response.json()) as VehicleRef;
}

export async function createSellerListing(
  accessToken: string,
  input: CreateListingInput,
): Promise<SellerListing> {
  const response = await apiRequest("/api/app/listing-command", accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return (await response.json()) as SellerListing;
}

export async function updateSellerListing(
  accessToken: string,
  listingId: string,
  input: UpdateListingInput,
): Promise<SellerListing> {
  const response = await apiRequest(
    `/api/app/listing-command?listingId=${encodeURIComponent(listingId)}`,
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
  return (await response.json()) as SellerListing;
}

export async function uploadSellerPhoto(
  accessToken: string,
  file: File,
): Promise<MediaAssetRef> {
  const form = new FormData();
  form.append("content", file);
  const response = await apiRequest("/api/app/media-upload/upload", accessToken, {
    method: "POST",
    body: form,
  });
  return (await response.json()) as MediaAssetRef;
}

export async function attachSellerPhoto(
  accessToken: string,
  listingId: string,
  mediaAssetId: string,
): Promise<SellerListingPhoto[]> {
  const response = await apiRequest(
    `/api/app/listing-photo/attach/${encodeURIComponent(listingId)}`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ mediaAssetId }),
    },
  );
  return (await response.json()) as SellerListingPhoto[];
}

export async function reorderSellerPhotos(
  accessToken: string,
  listingId: string,
  photoIds: string[],
): Promise<SellerListingPhoto[]> {
  const response = await apiRequest(
    `/api/app/listing-photo/reorder/${encodeURIComponent(listingId)}`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ photoIds }),
    },
  );
  return (await response.json()) as SellerListingPhoto[];
}

export async function removeSellerPhoto(
  accessToken: string,
  listingId: string,
  photoId: string,
): Promise<void> {
  await apiRequest(
    `/api/app/listing-photo?listingId=${encodeURIComponent(listingId)}&photoId=${encodeURIComponent(photoId)}`,
    accessToken,
    { method: "DELETE" },
  );
}

export async function transitionSellerListing(
  accessToken: string,
  listingId: string,
  action: SellerListingAction,
): Promise<SellerListing> {
  const response = await apiRequest(
    `/api/app/listing-command/${action}/${encodeURIComponent(listingId)}`,
    accessToken,
    { method: "POST" },
  );
  return (await response.json()) as SellerListing;
}
