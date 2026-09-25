export type PublicSeller = {
  sellerId: string;
  displayName: string | null;
  whatsAppNumber: string | null;
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

export async function getPublicSeller(sellerId: string): Promise<PublicSeller | null> {
  // ⚡ Bolt: Use server-side cache/revalidation instead of 'cache: "no-store"'
  // This avoids redundant backend calls for largely static public seller profiles.
  const response = await fetch(
    new URL(`/api/app/seller-public-query/${encodeURIComponent(sellerId)}`, `${serverApiBaseUrl()}/`),
    {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    },
  );

  if (response.status === 404 || response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Public seller lookup failed with HTTP ${response.status}.`);
  }

  return (await response.json()) as PublicSeller | null;
}
