"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "oidc-client-ts";

import { getCurrentSellerUser } from "../../../../lib/seller-auth";
import {
  createSellerListing,
  getVehicleCatalog,
  type VehicleRef,
} from "../../../../lib/seller-api";

function optionalNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

function vehicleLabel(vehicle: VehicleRef): string {
  const parts = [vehicle.brand, vehicle.model, vehicle.version, vehicle.modelYear]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map(String);
  return parts.join(" · ");
}

export default function NewSellerListingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<VehicleRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vehicleId, setVehicleId] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [manufactureYear, setManufactureYear] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [color, setColor] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const currentUser = await getCurrentSellerUser();
        setUser(currentUser);
        if (!currentUser) {
          return;
        }

        const catalog = await getVehicleCatalog();
        setVehicles(catalog);
        setVehicleId(catalog[0]?.id ?? "");
      } catch (reason: unknown) {
        setError(reason instanceof Error ? reason.message : "Não foi possível abrir o novo anúncio.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !vehicleId) {
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const created = await createSellerListing(user.access_token, {
        vehicleId,
        title,
        price: Number(price),
        description,
        manufactureYear: optionalNumber(manufactureYear),
        mileageKm: optionalNumber(mileageKm),
        color: color.trim() || null,
        city,
        stateCode,
      });
      router.push(`/vender/anuncios/${created.id}`);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível criar o Draft.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="shell seller-shell seller-editor-shell">
      <header className="seller-dashboard-header">
        <div>
          <p className="eyebrow">Área do vendedor</p>
          <h1>Novo anúncio.</h1>
          <p className="lede">
            Escolha um Vehicle do catálogo canônico. O anúncio nasce como Draft e continua privado até publicação.
          </p>
        </div>
        <Link className="secondary-action action-link" href="/vender">
          Meus anúncios
        </Link>
      </header>

      {loading ? <p className="seller-shell-status">Carregando sessão e catálogo…</p> : null}
      {error ? <p className="seller-auth-error" role="alert">{error}</p> : null}

      {!loading && !user ? (
        <section className="seller-auth-card">
          <h2>Sessão necessária</h2>
          <p>Entre pela área do vendedor antes de criar um anúncio.</p>
          <Link className="primary-action action-link" href="/vender">
            Ir para login
          </Link>
        </section>
      ) : null}

      {!loading && user ? (
        <section className="seller-panel seller-editor-panel">
          <form className="seller-profile-form seller-listing-form" onSubmit={createDraft}>
            <label>
              Vehicle canônico
              <select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} required>
                {vehicles.length === 0 ? <option value="">Nenhum Vehicle disponível</option> : null}
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicleLabel(vehicle)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Título
              <input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>

            <label>
              Preço
              <input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required />
            </label>

            <label>
              Descrição
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows={7} />
            </label>

            <div className="seller-form-grid">
              <label>
                Ano de fabricação
                <input type="number" value={manufactureYear} onChange={(event) => setManufactureYear(event.target.value)} />
              </label>
              <label>
                Quilometragem
                <input type="number" min="0" value={mileageKm} onChange={(event) => setMileageKm(event.target.value)} />
              </label>
              <label>
                Cor
                <input value={color} onChange={(event) => setColor(event.target.value)} />
              </label>
              <label>
                Cidade
                <input value={city} onChange={(event) => setCity(event.target.value)} required />
              </label>
              <label>
                UF
                <input value={stateCode} onChange={(event) => setStateCode(event.target.value)} required />
              </label>
            </div>

            <p className="seller-form-help">
              Ownership, Vehicle válido e demais regras continuam validados no backend; o frontend só envia os campos do contrato existente.
            </p>

            <button className="primary-action" type="submit" disabled={saving || vehicles.length === 0}>
              {saving ? "Criando Draft…" : "Criar Draft"}
            </button>
          </form>
        </section>
      ) : null}
    </main>
  );
}
