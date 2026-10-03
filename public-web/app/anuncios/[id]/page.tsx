/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import FavoriteButton from "./FavoriteButton";
import ReportButton from "./ReportButton";
import WhatsAppContactButton from "./WhatsAppContactButton";
import { getVehicle, vehicleRefLabel } from "@/lib/catalog";
import {
  formatPrice,
  getPublicListing,
  publicPhotoUrl,
  type PublicListing,
  vehicleLabel,
  whatsAppUrl,
} from "@/lib/public-listings";
import { publicUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const loadListing = cache((id: string) => getPublicListing(id));
const loadVehicle = cache((id: string) => getVehicle(id));

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function listingStructuredData(listing: PublicListing): Record<string, unknown> {
  const canonical = publicUrl(`/anuncios/${listing.id}`);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Product", "Vehicle"],
    name: listing.title,
    description: listing.description,
    url: canonical,
    brand: {
      "@type": "Brand",
      name: listing.vehicle.brand,
    },
    model: listing.vehicle.model,
    vehicleConfiguration: listing.vehicle.version,
    offers: {
      "@type": "Offer",
      url: canonical,
      price: listing.price,
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
    },
  };

  if (listing.color) {
    data.color = listing.color;
  }

  if (listing.mileageKm !== null) {
    data.mileageFromOdometer = {
      "@type": "QuantitativeValue",
      value: listing.mileageKm,
      unitCode: "KMT",
    };
  }

  if (listing.photos.length > 0) {
    data.image = listing.photos.map((photo) => publicPhotoUrl(listing.id, photo.id));
  }

  return data;
}

function serializeStructuredData(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function vehicleValue(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = typeof value === "number" ? String(value) : value.trim();
  return text ? text : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await loadListing(id);
  if (!listing) {
    return {
      title: "Anúncio não encontrado",
      robots: { index: false, follow: false },
    };
  }

  const vehicle = vehicleLabel(listing);
  const description = `${vehicle} em ${listing.city}/${listing.stateCode}. ${formatPrice(listing.price)}.`;
  const canonical = publicUrl(`/anuncios/${listing.id}`);
  const firstPhoto = listing.photos[0];
  const socialImage = firstPhoto ? publicPhotoUrl(listing.id, firstPhoto.id) : undefined;

  return {
    title: listing.title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title: listing.title,
      description,
      url: canonical,
      images: socialImage ? [{ url: socialImage, alt: listing.title }] : undefined,
    },
    twitter: {
      card: socialImage ? "summary_large_image" : "summary",
      title: listing.title,
      description,
      images: socialImage ? [socialImage] : undefined,
    },
  };
}

export default async function ListingDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const rawSearchParams = await searchParams;
  const returnTo = firstParam(rawSearchParams.returnTo).trim();
  const listing = await loadListing(id);
  if (!listing) notFound();
  const vehicle = await loadVehicle(listing.vehicleId);
  const contactUrl = whatsAppUrl(listing.seller.whatsAppNumber);
  const structuredData = listingStructuredData(listing);
  const backHref = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  const vehicleHref = `/veiculos/${encodeURIComponent(listing.vehicleId)}`;
  const vehicleTitle = vehicle
    ? vehicleRefLabel(vehicle)
    : [listing.vehicle.brand, listing.vehicle.model, listing.vehicle.version].filter(Boolean).join(" ");
  const vehicleSpecs = vehicle;

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }}
        type="application/ld+json"
      />
      <main className="shell detail-shell">
        <nav className="back-nav" aria-label="Voltar para anúncios"><Link href={backHref}>← Todos os anúncios</Link></nav>
        <article>
          <header className="detail-header">
            <div>
              <p className="eyebrow"><Link href={vehicleHref}>{vehicleLabel(listing)}</Link></p>
              <h1>{listing.title}</h1>
              <p className="detail-location">{listing.city} · {listing.stateCode}</p>
            </div>
            <p className="detail-price">{formatPrice(listing.price)}</p>
          </header>
          <section aria-label="Fotos do anúncio" className="photo-grid">
            {listing.photos.length === 0 ? <div className="detail-photo-placeholder">Este anúncio ainda não tem fotos.</div> : listing.photos.map((photo, index) => (
              <figure className={index === 0 ? "photo-main" : "photo-secondary"} key={photo.id}><img alt={`${listing.title} — foto ${index + 1}`} src={publicPhotoUrl(listing.id, photo.id)} /></figure>
            ))}
          </section>
          <div className="detail-columns">
            <div className="detail-content">
              <section className="detail-section" aria-labelledby="vehicle-identity-title">
                <p className="eyebrow">Veículo canônico</p>
                <h2 id="vehicle-identity-title">Identidade automotiva e ficha canônica</h2>
                <dl className="facts-grid">
                  <div><dt>Marca</dt><dd>{listing.vehicle.brand}</dd></div>
                  <div><dt>Modelo</dt><dd>{listing.vehicle.model}</dd></div>
                  {vehicleValue(listing.vehicle.generation) ? <div><dt>Geração</dt><dd>{vehicleValue(listing.vehicle.generation)}</dd></div> : null}
                  <div><dt>Versão</dt><dd>{listing.vehicle.version}</dd></div>
                  {vehicleValue(listing.vehicle.modelYear) ? <div><dt>Ano do modelo</dt><dd>{vehicleValue(listing.vehicle.modelYear)}</dd></div> : null}
                  {vehicleValue(vehicleSpecs?.powertrain) ? <div><dt>Motorização</dt><dd>{vehicleValue(vehicleSpecs?.powertrain)}</dd></div> : null}
                  {vehicleValue(vehicleSpecs?.transmission) ? <div><dt>Transmissão</dt><dd>{vehicleValue(vehicleSpecs?.transmission)}</dd></div> : null}
                  {vehicleValue(vehicleSpecs?.bodyStyle) ? <div><dt>Carroceria</dt><dd>{vehicleValue(vehicleSpecs?.bodyStyle)}</dd></div> : null}
                </dl>
                <p className="detail-location">
                  <Link href={vehicleHref}>Ver Vehicle Hub · {vehicleTitle}</Link>
                </p>
              </section>
              <section className="detail-section" aria-labelledby="facts-title">
                <p className="eyebrow">Veículo</p><h2 id="facts-title">Dados do anúncio</h2>
                <dl className="facts-grid">
                  <div><dt>Ano do modelo</dt><dd>{listing.vehicle.modelYear}</dd></div>
                  {listing.manufactureYear ? <div><dt>Ano de fabricação</dt><dd>{listing.manufactureYear}</dd></div> : null}
                  {listing.mileageKm !== null ? <div><dt>Quilometragem</dt><dd>{new Intl.NumberFormat("pt-BR").format(listing.mileageKm)} km</dd></div> : null}
                  {listing.color ? <div><dt>Cor</dt><dd>{listing.color}</dd></div> : null}
                  <div><dt>Versão</dt><dd>{listing.vehicle.version}</dd></div>
                </dl>
              </section>
              <section className="detail-section" aria-labelledby="description-title"><p className="eyebrow">Descrição</p><h2 id="description-title">Sobre este veículo</h2><p className="description-text">{listing.description}</p></section>
            </div>
            <aside className="seller-card" aria-labelledby="seller-title">
              <p className="eyebrow">Vendedor</p><h2 id="seller-title"><Link href={`/vendedores/${listing.seller.sellerId}`}>{listing.seller.displayName ?? "Vendedor"}</Link></h2><p>Fale diretamente com o responsável por este anúncio.</p>
              <FavoriteButton listingId={listing.id} />
              <Link className="secondary-action" href="/favoritos">Meus favoritos</Link>
              {contactUrl ? <WhatsAppContactButton listingId={listing.id} /> : <p className="contact-unavailable">Contato indisponível neste momento.</p>}
              <ReportButton listingId={listing.id} />
            </aside>
          </div>
        </article>
      </main>
    </>
  );
}
