/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getVehicle, type VehicleRef, vehicleRefLabel } from "@/lib/catalog";
import {
  formatPrice,
  getPublicListings,
  publicPhotoUrl,
  vehicleLabel,
} from "@/lib/public-listings";
import { publicUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
const loadVehicle = cache((id: string) => getVehicle(id));
const loadVehicleIdentityListing = cache((vehicleId: string) =>
  getPublicListings({ vehicleId, skip: 0, take: 1 }),
);

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ skip?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parseSkip(value: string | string[] | undefined): number {
  const parsed = Number(firstParam(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function vehicleStructuredData(vehicle: VehicleRef): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: vehicleRefLabel(vehicle),
    url: publicUrl(`/veiculos/${vehicle.id}`),
    brand: {
      "@type": "Brand",
      name: vehicle.brand,
    },
    model: vehicle.model,
    vehicleConfiguration: vehicle.version,
  };
}

function serializeStructuredData(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await loadVehicle(id);
  if (!vehicle) {
    return {
      title: "Veículo não encontrado",
      robots: { index: false, follow: false },
    };
  }

  const title = `${vehicleRefLabel(vehicle)}${vehicle.modelYear ? ` ${vehicle.modelYear}` : ""}`;
  const description = `Veja a identidade canônica e os anúncios publicados de ${title}.`;
  const canonical = publicUrl(`/veiculos/${vehicle.id}`);
  const listingPage = await loadVehicleIdentityListing(vehicle.id);
  const firstListing = listingPage.items[0];
  const firstPhoto = firstListing?.photos[0];
  const socialImage = firstListing && firstPhoto
    ? publicPhotoUrl(firstListing.id, firstPhoto.id)
    : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      images: socialImage ? [{ url: socialImage, alt: title }] : undefined,
    },
    twitter: {
      card: socialImage ? "summary_large_image" : "summary",
      title,
      description,
      images: socialImage ? [socialImage] : undefined,
    },
  };
}

export default async function VehicleHubPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const vehicle = await loadVehicle(id);
  if (!vehicle) notFound();

  const rawSearch = await searchParams;
  const skip = parseSkip(rawSearch.skip);
  const page = await getPublicListings({ vehicleId: vehicle.id, skip, take: PAGE_SIZE });
  const hasPrevious = skip > 0;
  const hasNext = skip + page.items.length < page.totalCount;
  const structuredData = vehicleStructuredData(vehicle);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }}
        type="application/ld+json"
      />
      <main className="shell detail-shell">
        <nav className="back-nav" aria-label="Voltar para anúncios">
          <Link href="/">← Todos os anúncios</Link>
        </nav>

        <header className="detail-header">
          <div>
            <p className="eyebrow">Vehicle Hub</p>
            <h1>{vehicleRefLabel(vehicle)}</h1>
            <p className="detail-location">Identidade automotiva canônica Bom Pra Ti</p>
          </div>
        </header>

        <section className="detail-section" aria-labelledby="vehicle-identity-title">
          <p className="eyebrow">Catálogo</p>
          <h2 id="vehicle-identity-title">Dados canônicos</h2>
          <dl className="facts-grid">
            <div><dt>Marca</dt><dd>{vehicle.brand}</dd></div>
            <div><dt>Modelo</dt><dd>{vehicle.model}</dd></div>
            {vehicle.generation ? <div><dt>Geração</dt><dd>{vehicle.generation}</dd></div> : null}
            <div><dt>Versão</dt><dd>{vehicle.version}</dd></div>
            {vehicle.modelYear ? <div><dt>Ano do modelo</dt><dd>{vehicle.modelYear}</dd></div> : null}
            {vehicle.powertrain ? <div><dt>Motorização</dt><dd>{vehicle.powertrain}</dd></div> : null}
            {vehicle.transmission ? <div><dt>Transmissão</dt><dd>{vehicle.transmission}</dd></div> : null}
            {vehicle.bodyStyle ? <div><dt>Carroceria</dt><dd>{vehicle.bodyStyle}</dd></div> : null}
          </dl>
        </section>

        <section aria-labelledby="vehicle-listings-title" className="listing-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Disponibilidade</p>
              <h2 id="vehicle-listings-title">Anúncios deste veículo</h2>
            </div>
            <p className="result-count">{page.totalCount} anúncio(s)</p>
          </div>

          {page.items.length === 0 ? (
            <div className="empty-state">
              <h3>Nenhum anúncio publicado agora.</h3>
              <p>O veículo continua no catálogo canônico mesmo sem oferta pública ativa.</p>
            </div>
          ) : (
            <div className="listing-grid">
              {page.items.map((listing) => {
                const cover = listing.photos[0];
                return (
                  <article className="listing-card" key={listing.id}>
                    <Link className="listing-link" href={`/anuncios/${listing.id}`}>
                      <div className="listing-media">
                        {cover ? (
                          <img
                            alt={`Foto de ${listing.title}`}
                            loading="lazy"
                            src={publicPhotoUrl(listing.id, cover.id)}
                          />
                        ) : (
                          <div className="listing-placeholder">Sem foto</div>
                        )}
                      </div>
                      <div className="listing-body">
                        <p className="listing-vehicle">{vehicleLabel(listing)}</p>
                        <h3>{listing.title}</h3>
                        <p className="listing-price">{formatPrice(listing.price)}</p>
                        <p className="listing-location">{listing.city} · {listing.stateCode}</p>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}

          {(hasPrevious || hasNext) ? (
            <nav className="pagination" aria-label="Paginação dos anúncios deste veículo">
              {hasPrevious ? (
                <Link href={`/veiculos/${vehicle.id}?skip=${Math.max(0, skip - PAGE_SIZE)}`}>
                  ← Anteriores
                </Link>
              ) : <span />}
              {hasNext ? (
                <Link href={`/veiculos/${vehicle.id}?skip=${skip + PAGE_SIZE}`}>
                  Próximos →
                </Link>
              ) : null}
            </nav>
          ) : null}
        </section>
      </main>
    </>
  );
}
