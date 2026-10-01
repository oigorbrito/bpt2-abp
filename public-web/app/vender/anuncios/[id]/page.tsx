"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import type { User } from "oidc-client-ts";

import { getCurrentSellerUser } from "../../../../lib/seller-auth";
import {
  attachSellerPhoto,
  getMyListingDetail,
  getSellerPhotoBlob,
  getVehicle,
  removeSellerPhoto,
  reorderSellerPhotos,
  type SellerListingAction,
  type SellerListingDetail,
  type VehicleRef,
  transitionSellerListing,
  updateSellerListing,
  uploadSellerPhoto,
} from "../../../../lib/seller-api";

function optionalNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

function vehicleLabel(vehicle: VehicleRef | null): string {
  if (!vehicle) {
    return "Vehicle canônico indisponível";
  }
  return [vehicle.brand, vehicle.model, vehicle.version, vehicle.modelYear]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map(String)
    .join(" · ");
}

function readinessChecks(detail: SellerListingDetail | null): Array<{ label: string; ok: boolean }> {
  const listing = detail?.listing;
  return [
    { label: "Listing em estado mutável", ok: Boolean(listing && listing.status !== "Archived" && listing.status !== "Moderated") },
    { label: "Vehicle canônico presente", ok: Boolean(listing?.vehicleId) },
  ];
}

function currentStatusLabel(status: string): string {
  switch (status) {
    case "Draft":
      return "Rascunho";
    case "Published":
      return "Publicado";
    case "Paused":
      return "Pausado";
    case "Archived":
      return "Arquivado";
    case "Moderated":
      return "Moderado";
    default:
      return status;
  }
}

function nextActionLabel(status: string): string {
  switch (status) {
    case "Draft":
    case "Paused":
      return "Publicar";
    case "Published":
      return "Pausar";
    case "Archived":
      return "Nenhuma ação de lifecycle";
    case "Moderated":
      return "Aguardar liberação";
    default:
      return "Estado desconhecido";
  }
}

function canPublish(status: string): boolean {
  return status === "Draft" || status === "Paused";
}

function canPause(status: string): boolean {
  return status === "Published";
}

function canArchive(status: string): boolean {
  return status === "Draft" || status === "Published" || status === "Paused";
}

export default function EditSellerListingPage() {
  const params = useParams<{ id: string }>();
  const listingId = params.id;

  const [user, setUser] = useState<User | null>(null);
  const [detail, setDetail] = useState<SellerListingDetail | null>(null);
  const [vehicle, setVehicle] = useState<VehicleRef | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [transitionBusy, setTransitionBusy] = useState<SellerListingAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [manufactureYear, setManufactureYear] = useState("");
  const [mileageKm, setMileageKm] = useState("");
  const [color, setColor] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const currentPhotos = detail?.photos ?? null;
  const checks = readinessChecks(detail);
  const readyToPublish = checks.every((check) => check.ok);

  const reloadOwnedDetail = useCallback(
    async (accessToken: string): Promise<SellerListingDetail | null> => {
      const currentDetail = await getMyListingDetail(accessToken, listingId);
      setDetail(currentDetail);
      return currentDetail;
    },
    [listingId],
  );

  useEffect(() => {
    async function load() {
      try {
        const currentUser = await getCurrentSellerUser();
        setUser(currentUser);
        if (!currentUser) {
          return;
        }

        const currentDetail = await reloadOwnedDetail(currentUser.access_token);
        if (!currentDetail) {
          return;
        }

        const listing = currentDetail.listing;
        setTitle(listing.title);
        setPrice(String(listing.price));
        setDescription(listing.description);
        setManufactureYear(listing.manufactureYear === null ? "" : String(listing.manufactureYear));
        setMileageKm(listing.mileageKm === null ? "" : String(listing.mileageKm));
        setColor(listing.color ?? "");
        setCity(listing.city);
        setStateCode(listing.stateCode);
        setVehicle(await getVehicle(listing.vehicleId));
      } catch (reason: unknown) {
        setError(reason instanceof Error ? reason.message : "Não foi possível abrir este anúncio.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [reloadOwnedDetail]);

  useEffect(() => {
    if (!user || !currentPhotos) {
      return;
    }

    const accessToken = user.access_token;
    const photos = currentPhotos;
    let cancelled = false;
    const createdUrls: string[] = [];

    async function loadPhotoUrls() {
      try {
        const entries = await Promise.all(
          photos.map(async (photo) => {
            const blob = await getSellerPhotoBlob(accessToken, listingId, photo.id);
            const url = URL.createObjectURL(blob);
            createdUrls.push(url);
            return [photo.id, url] as const;
          }),
        );

        if (cancelled) {
          createdUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }

        setPhotoUrls(Object.fromEntries(entries));
      } catch (reason: unknown) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Não foi possível carregar as fotos atuais.");
        }
      }
    }

    void loadPhotoUrls();

    return () => {
      cancelled = true;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [currentPhotos, listingId, user]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !detail) {
      return;
    }

    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const saved = await updateSellerListing(user.access_token, listingId, {
        title,
        price: Number(price),
        concurrencyStamp: detail.listing.concurrencyStamp,
        description,
        manufactureYear: optionalNumber(manufactureYear),
        mileageKm: optionalNumber(mileageKm),
        color: color.trim() || null,
        city,
        stateCode,
      });
      setDetail({ ...detail, listing: saved });
      setNotice("Anúncio salvo. O novo ConcurrencyStamp devolvido pelo backend já está ativo nesta edição.");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o anúncio.");
    } finally {
      setSaving(false);
    }
  }

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    if (!user || !detail || !event.target.files?.length) {
      return;
    }

    const files = Array.from(event.target.files);
    event.target.value = "";
    setError(null);
    setNotice(null);
    setPhotoBusy(true);
    try {
      let photos = detail.photos;
      for (const file of files) {
        const asset = await uploadSellerPhoto(user.access_token, file);
        photos = await attachSellerPhoto(user.access_token, listingId, asset.id);
      }
      setDetail({ ...detail, photos });
      setNotice(`${files.length} foto(s) enviada(s) e anexada(s) ao anúncio.`);
    } catch (reason: unknown) {
      await reloadOwnedDetail(user.access_token);
      setError(reason instanceof Error ? reason.message : "Não foi possível adicionar as fotos.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function movePhoto(index: number, offset: -1 | 1) {
    if (!user || !detail) {
      return;
    }

    const target = index + offset;
    if (target < 0 || target >= detail.photos.length) {
      return;
    }

    const ids = detail.photos.map((photo) => photo.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];

    setError(null);
    setNotice(null);
    setPhotoBusy(true);
    try {
      const photos = await reorderSellerPhotos(user.access_token, listingId, ids);
      setDetail({ ...detail, photos });
      setNotice("Ordem das fotos atualizada. A primeira posição continua sendo a capa derivada da galeria.");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível reordenar as fotos.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto(photoId: string) {
    if (!user || !detail) {
      return;
    }

    setError(null);
    setNotice(null);
    setPhotoBusy(true);
    try {
      await removeSellerPhoto(user.access_token, listingId, photoId);
      await reloadOwnedDetail(user.access_token);
      setNotice("Foto removida e a ordem restante foi normalizada pelo backend.");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível remover a foto.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function runTransition(action: SellerListingAction) {
    if (!user || !detail) {
      return;
    }

    setError(null);
    setNotice(null);
    setTransitionBusy(action);
    try {
      const listing = await transitionSellerListing(user.access_token, listingId, action);
      setDetail({ ...detail, listing });
      setNotice(`Backend aplicou a transição ${action}. Estado atual: ${listing.status}.`);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível alterar o estado do anúncio.");
    } finally {
      setTransitionBusy(null);
    }
  }

  return (
    <main className="shell seller-shell seller-editor-shell">
      <header className="seller-dashboard-header">
        <div>
          <p className="eyebrow">Área do vendedor</p>
          <h1>Editar anúncio.</h1>
          <p className="lede">
            Ownership, mídia e transições continuam validados no backend. Esta tela apenas orquestra os contratos HTTP já existentes.
          </p>
        </div>
        <Link className="secondary-action action-link" href="/vender">
          Meus anúncios
        </Link>
      </header>

      {loading ? <p className="seller-shell-status">Carregando anúncio…</p> : null}
      {error ? <p className="seller-auth-error">{error}</p> : null}
      {notice ? <p className="seller-auth-notice">{notice}</p> : null}

      {!loading && !user ? (
        <section className="seller-auth-card">
          <h2>Sessão necessária</h2>
          <p>Entre pela área do vendedor antes de editar um anúncio.</p>
          <Link className="primary-action action-link" href="/vender">
            Ir para login
          </Link>
        </section>
      ) : null}

      {!loading && user && !detail ? (
        <section className="seller-auth-card">
          <h2>Anúncio não disponível</h2>
          <p>Este Listing não pertence ao Seller autenticado ou não existe.</p>
          <Link className="secondary-action action-link" href="/vender">
            Voltar
          </Link>
        </section>
      ) : null}

      {!loading && user && detail ? (
        <div className="seller-editor-stack">
          <section className="seller-panel seller-editor-panel">
            <div className="seller-edit-summary">
              <div>
                <p className="eyebrow">Status atual</p>
                <h2>{vehicleLabel(vehicle)}</h2>
                <p className="seller-form-help">Estado visível ao vendedor: {currentStatusLabel(detail.listing.status)}.</p>
              </div>
              <p>{detail.photos.length} foto(s) na galeria atual</p>
            </div>

            <section className="seller-readiness-panel" aria-labelledby="readiness-title">
              <div className="seller-panel-heading">
                <div>
                  <p className="eyebrow">Prontidão</p>
                  <h3 id="readiness-title">{readyToPublish ? "Pode ser publicado" : "Publicação bloqueada pelo estado atual"}</h3>
                </div>
              </div>
              <ul className="seller-readiness-list">
                {checks.map((check) => (
                  <li key={check.label} className={check.ok ? "is-ok" : "is-missing"}>
                    {check.ok ? "OK" : "Bloqueia"} · {check.label}
                  </li>
                ))}
              </ul>
              <p className="seller-form-help">Próxima ação: {nextActionLabel(detail.listing.status)}.</p>
            </section>

            <form className="seller-profile-form seller-listing-form" onSubmit={save}>
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
                Vehicle e ownership não são escolhidos nesta edição. Um conflito 409 interrompe o save em vez de sobrescrever uma versão mais nova. Publicação depende apenas de estado mutável e Vehicle canônico.
              </p>

              <button className="primary-action" type="submit" disabled={saving}>
                {saving ? "Salvando…" : "Salvar alterações"}
              </button>
            </form>
          </section>

          <section className="seller-panel seller-photo-panel">
            <div className="seller-panel-heading">
              <div>
                <p className="eyebrow">Galeria</p>
                <h2>Fotos do anúncio</h2>
              </div>
              <label className={`secondary-action seller-upload-action${photoBusy ? " is-disabled" : ""}`}>
                {photoBusy ? "Processando…" : "Adicionar fotos"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={photoBusy}
                  onChange={addPhotos}
                />
              </label>
            </div>

            <p className="seller-form-help">
              JPEG, PNG ou WebP, até 20 MiB por arquivo. O servidor valida os bytes reais e a resposta não expõe chave de storage.
            </p>

            {detail.photos.length === 0 ? (
              <div className="seller-photo-empty">Nenhuma foto anexada ainda.</div>
            ) : (
              <ol className="seller-photo-list">
                {detail.photos.map((photo, index) => (
                  <li key={photo.id} className="seller-photo-row">
                    <div className="seller-photo-preview">
                      {photoUrls[photo.id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoUrls[photo.id]} alt={`Foto ${index + 1} do anúncio`} />
                      ) : (
                        <span>Carregando foto…</span>
                      )}
                    </div>
                    <div className="seller-photo-meta">
                      <strong>Foto {index + 1}{index === 0 ? " · capa" : ""}</strong>
                      <span>Posição {index + 1} da galeria</span>
                    </div>
                    <div className="seller-photo-actions">
                      <button type="button" className="secondary-action compact-action" aria-label={`Mover foto ${index + 1} para cima`} disabled={photoBusy || index === 0} onClick={() => void movePhoto(index, -1)}>
                        Subir
                      </button>
                      <button type="button" className="secondary-action compact-action" aria-label={`Mover foto ${index + 1} para baixo`} disabled={photoBusy || index === detail.photos.length - 1} onClick={() => void movePhoto(index, 1)}>
                        Descer
                      </button>
                      <button type="button" className="secondary-action compact-action" aria-label={`Remover foto ${index + 1}`} disabled={photoBusy} onClick={() => void removePhoto(photo.id)}>
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="seller-panel seller-publish-panel">
            <div>
              <p className="eyebrow">Publicação</p>
              <h2>Estado controlado pelo backend</h2>
              <p className="seller-form-help">
                Publicar, pausar e arquivar chamam somente os commands existentes. Se uma transição não for válida para o estado atual, a API rejeita a tentativa.
              </p>
            </div>

            <div className="seller-transition-actions">
              {canPublish(detail.listing.status) ? (
                <button type="button" className="primary-action" disabled={transitionBusy !== null} onClick={() => void runTransition("publish")}>
                  {transitionBusy === "publish" ? "Publicando…" : "Publicar"}
                </button>
              ) : null}
              {canPause(detail.listing.status) ? (
                <button type="button" className="secondary-action" disabled={transitionBusy !== null} onClick={() => void runTransition("pause")}>
                  {transitionBusy === "pause" ? "Pausando…" : "Pausar"}
                </button>
              ) : null}
              {canArchive(detail.listing.status) ? (
                <button type="button" className="secondary-action" disabled={transitionBusy !== null} onClick={() => void runTransition("archive")}>
                  {transitionBusy === "archive" ? "Arquivando…" : "Arquivar"}
                </button>
              ) : null}
              {detail.listing.status === "Published" ? (
                <Link className="secondary-action action-link" href={`/anuncios/${listingId}`}>
                  Ver anúncio público
                </Link>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
