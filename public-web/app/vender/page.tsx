"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import type { User } from "oidc-client-ts";

import { formatPrice } from "../../lib/public-listings";
import {
  closeSellerLead,
  getMyLeads,
  getMyListings,
  getSellerProfile,
  markSellerLeadContacted,
  transitionSellerListing,
  type SellerLead,
  type SellerLeadOutcome,
  type SellerListing,
  type SellerProfile,
  type SellerListingAction,
  upsertSellerProfile,
} from "../../lib/seller-api";
import { getCurrentSellerUser, getSellerUserManager } from "../../lib/seller-auth";

function statusLabel(status: string): string {
  switch (status) {
    case "Draft":
      return "Rascunho";
    case "Published":
      return "Publicado";
    case "Paused":
      return "Pausado";
    case "Archived":
      return "Arquivado";
    default:
      return status;
  }
}

function canEditListing(status: string): boolean {
  return status !== "Archived" && status !== "Moderated";
}

function canPauseListing(status: string): boolean {
  return status === "Published";
}

function canPublishListing(status: string): boolean {
  return status === "Draft" || status === "Paused";
}

function canArchiveListing(status: string): boolean {
  return status === "Draft" || status === "Published" || status === "Paused";
}

function nextListingAction(status: string): string {
  if (status === "Draft" || status === "Paused") return "Publicar";
  if (status === "Published") return "Pausar";
  if (status === "Archived") return "Arquivado";
  if (status === "Moderated") return "Moderado";
  return "Estado desconhecido";
}

type StatusFilter = "all" | "Draft" | "Published" | "Paused" | "Archived";

function readStatusFilter(value: string | null): StatusFilter {
  if (value === "Draft" || value === "Published" || value === "Paused" || value === "Archived") {
    return value;
  }
  return "all";
}

function inventorySummary(listings: SellerListing[]): {
  draft: number;
  published: number;
  paused: number;
  archived: number;
} {
  return listings.reduce(
    (summary, listing) => {
      if (listing.status === "Draft") summary.draft += 1;
      else if (listing.status === "Published") summary.published += 1;
      else if (listing.status === "Paused") summary.paused += 1;
      else if (listing.status === "Archived") summary.archived += 1;
      return summary;
    },
    { draft: 0, published: 0, paused: 0, archived: 0 },
  );
}

function leadStatusLabel(lead: SellerLead): string {
  if (lead.closedAtUtc) {
    return lead.outcome === "Won" ? "Fechado · Vendido" : "Fechado · Sem venda";
  }
  return lead.contactedAtUtc ? "Atendido" : "Novo";
}

function SellerEntryPageContent() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [leads, setLeads] = useState<SellerLead[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [whatsAppNumber, setWhatsAppNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [updatingListingId, setUpdatingListingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeStatus = readStatusFilter(searchParams.get("status"));
  const summary = inventorySummary(listings);
  const filteredListings = useMemo(
    () => (activeStatus === "all" ? listings : listings.filter((listing) => listing.status === activeStatus)),
    [activeStatus, listings],
  );

  function setStatusFilter(next: StatusFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("status");
    } else {
      params.set("status", next);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  useEffect(() => {
    async function loadSellerShell() {
      try {
        const currentUser = await getCurrentSellerUser();
        setUser(currentUser);
        if (!currentUser) return;

        const [currentProfile, currentListings, currentLeads] = await Promise.all([
          getSellerProfile(currentUser.access_token),
          getMyListings(currentUser.access_token),
          getMyLeads(currentUser.access_token),
        ]);

        setProfile(currentProfile);
        setListings(currentListings);
        setLeads(currentLeads);
        setDisplayName(currentProfile?.displayName ?? "");
        setWhatsAppNumber(currentProfile?.whatsAppNumber ?? "");
      } catch (reason: unknown) {
        setError(reason instanceof Error ? reason.message : "Não foi possível carregar a área do vendedor.");
      } finally {
        setLoading(false);
      }
    }

    void loadSellerShell();
  }, []);

  async function signIn() {
    setError(null);
    await getSellerUserManager().signinRedirect();
  }

  async function signOut() {
    setError(null);
    await getSellerUserManager().signoutRedirect();
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    setError(null);
    setNotice(null);
    setSavingProfile(true);
    try {
      const saved = await upsertSellerProfile(user.access_token, { displayName, whatsAppNumber });
      setProfile(saved);
      setDisplayName(saved.displayName);
      setWhatsAppNumber(saved.whatsAppNumber);
      setNotice("Perfil salvo. O WhatsApp exibido abaixo é o valor canônico devolvido pelo backend.");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function reloadLeads(accessToken: string) {
    setLeads(await getMyLeads(accessToken));
  }

  async function markLeadContacted(leadId: string) {
    if (!user) return;
    setError(null);
    setNotice(null);
    setUpdatingLeadId(leadId);
    try {
      await markSellerLeadContacted(user.access_token, leadId);
      await reloadLeads(user.access_token);
      setNotice("Lead marcado como atendido.");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar o Lead.");
    } finally {
      setUpdatingLeadId(null);
    }
  }

  async function closeLead(leadId: string, outcome: SellerLeadOutcome) {
    if (!user) return;
    setError(null);
    setNotice(null);
    setUpdatingLeadId(leadId);
    try {
      await closeSellerLead(user.access_token, leadId, outcome);
      await reloadLeads(user.access_token);
      setNotice(outcome === "Won" ? "Lead encerrado como vendido." : "Lead encerrado sem venda.");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível encerrar o Lead.");
    } finally {
      setUpdatingLeadId(null);
    }
  }

  async function runListingAction(listingId: string, action: SellerListingAction) {
    if (!user) return;

    setError(null);
    setNotice(null);
    setUpdatingListingId(listingId);
    try {
      const updated = await transitionSellerListing(user.access_token, listingId, action);
      setListings((current) => current.map((listing) => (listing.id === listingId ? updated : listing)));
      setNotice(`Anúncio ${action === "publish" ? "publicado" : action === "pause" ? "pausado" : "arquivado"}.`);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar o anúncio.");
    } finally {
      setUpdatingListingId(null);
    }
  }

  return (
    <main className="shell seller-shell">
      <header className="seller-dashboard-header">
        <div>
          <p className="eyebrow">Área do vendedor</p>
          <h1>Seus anúncios.</h1>
          <p className="lede">Perfil, anúncios e contatos são carregados pelas APIs autenticadas do BPT2. Ownership e normalização continuam no backend.</p>
        </div>
        {user ? <button className="secondary-action" type="button" onClick={signOut}>Sair</button> : null}
      </header>

      {loading ? <p className="seller-shell-status">Verificando sessão…</p> : null}
      {error ? <p className="seller-auth-error" role="alert">{error}</p> : null}
      {notice ? <p className="seller-auth-notice">{notice}</p> : null}

      {!loading && !user ? (
        <section className="seller-auth-card" aria-live="polite">
          <h2>Entrar como vendedor</h2>
          <p>A senha é informada somente no Auth Server. Este cliente usa Authorization Code + PKCE.</p>
          <button className="primary-action" type="button" onClick={signIn}>Entrar</button>
        </section>
      ) : null}

      {!loading && user ? (
        <div className="seller-dashboard-grid">
          <section className="seller-panel">
            <div className="seller-panel-heading"><div><p className="eyebrow">Perfil</p><h2>{profile ? "Dados públicos" : "Complete seu perfil"}</h2></div></div>
            <form className="seller-profile-form" onSubmit={saveProfile}>
              <label>Nome de exibição<input name="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required autoComplete="organization" /></label>
              <label>WhatsApp com código do país<input name="whatsAppNumber" value={whatsAppNumber} onChange={(event) => setWhatsAppNumber(event.target.value)} required inputMode="tel" autoComplete="tel" placeholder="+55 (11) 99999-8877" /></label>
              <p className="seller-form-help">Formatação é aceita na entrada; o backend devolve e persiste o número canônico somente com dígitos.</p>
              <button className="primary-action" type="submit" disabled={savingProfile}>{savingProfile ? "Salvando…" : "Salvar perfil"}</button>
            </form>
          </section>

          <section className="seller-panel seller-listings-panel" aria-labelledby="inventory-title">
            <div className="seller-panel-heading"><div><p className="eyebrow">Marketplace</p><h2>Meus anúncios</h2></div><div className="seller-panel-actions"><span className="seller-count">{listings.length}</span><Link className="primary-action action-link" href="/vender/anuncios/novo">Novo anúncio</Link></div></div>
            <div className="seller-summary-grid" aria-label="Resumo do inventário">
              <button type="button" aria-pressed={activeStatus === "Published"} className={`seller-summary-card${activeStatus === "Published" ? " is-active" : ""}`} onClick={() => setStatusFilter("Published")}>
                <strong>{summary.published}</strong>
                <span>Publicados</span>
              </button>
              <button type="button" aria-pressed={activeStatus === "Draft"} className={`seller-summary-card${activeStatus === "Draft" ? " is-active" : ""}`} onClick={() => setStatusFilter("Draft")}>
                <strong>{summary.draft}</strong>
                <span>Rascunhos</span>
              </button>
              <button type="button" aria-pressed={activeStatus === "Paused"} className={`seller-summary-card${activeStatus === "Paused" ? " is-active" : ""}`} onClick={() => setStatusFilter("Paused")}>
                <strong>{summary.paused}</strong>
                <span>Pausados</span>
              </button>
              <button type="button" aria-pressed={activeStatus === "Archived"} className={`seller-summary-card${activeStatus === "Archived" ? " is-active" : ""}`} onClick={() => setStatusFilter("Archived")}>
                <strong>{summary.archived}</strong>
                <span>Arquivados</span>
              </button>
            </div>
            <div className="seller-queue-toolbar">
              <p className="seller-form-help">
                {activeStatus === "all"
                  ? "Mostrando todos os anúncios do inventário."
                  : `Mostrando apenas anúncios com status ${statusLabel(activeStatus)}.`}
              </p>
              {activeStatus !== "all" ? (
                <button type="button" className="secondary-action compact-action" onClick={() => setStatusFilter("all")}>
                  Limpar filtro
                </button>
              ) : null}
            </div>
            {listings.length === 0 ? <div className="empty-state seller-empty-state"><h3>Nenhum anúncio ainda.</h3><p>Crie um Draft escolhendo um Vehicle do catálogo canônico.</p></div> : filteredListings.length === 0 ? <div className="empty-state seller-empty-state"><h3>Nenhum anúncio neste estado.</h3><p>Limpe o filtro ou escolha outro status para continuar.</p></div> : (
              <div className="seller-listing-list">{filteredListings.map((listing) => <article className="seller-listing-row" key={listing.id}><div><p className="seller-listing-status">{statusLabel(listing.status)}</p><h3>{listing.title}</h3><p className="seller-listing-location">{listing.city} / {listing.stateCode}</p><p className="seller-form-help">Próxima ação: {nextListingAction(listing.status)}</p></div><div className="seller-listing-actions"><p className="seller-listing-price">{formatPrice(listing.price)}</p>{canPublishListing(listing.status) ? <button type="button" className="secondary-action compact-action" aria-label={`Publicar ${listing.title}`} disabled={updatingListingId === listing.id} onClick={() => void runListingAction(listing.id, "publish")}>{updatingListingId === listing.id ? "Atualizando…" : "Publicar"}</button> : null}{canPauseListing(listing.status) ? <button type="button" className="secondary-action compact-action" aria-label={`Pausar ${listing.title}`} disabled={updatingListingId === listing.id} onClick={() => void runListingAction(listing.id, "pause")}>{updatingListingId === listing.id ? "Atualizando…" : "Pausar"}</button> : null}{canArchiveListing(listing.status) ? <button type="button" className="secondary-action compact-action" aria-label={`Arquivar ${listing.title}`} disabled={updatingListingId === listing.id} onClick={() => void runListingAction(listing.id, "archive")}>{updatingListingId === listing.id ? "Atualizando…" : "Arquivar"}</button> : null}{canEditListing(listing.status) ? <Link aria-label={`Editar ${listing.title}`} className="secondary-action action-link" href={`/vender/anuncios/${listing.id}`}>Editar</Link> : null}<Link aria-label={`Ver contatos de ${listing.title}`} className="secondary-action action-link" href="#contatos">Ver leads</Link></div></article>)}</div>
            )}
          </section>

          <section className="seller-panel seller-listings-panel" id="contatos" aria-labelledby="contacts-title">
            <div className="seller-panel-heading"><div><p className="eyebrow">Contatos</p><h2>Leads de WhatsApp</h2></div><span className="seller-count">{leads.length}</span></div>
            {leads.length === 0 ? <div className="empty-state seller-empty-state"><h3>Nenhum contato ainda.</h3><p>Quando alguém iniciar um contato pelo WhatsApp de um anúncio seu, ele aparecerá aqui.</p></div> : (
              <div className="seller-listing-list">
                {leads.map((lead) => (
                  <article className="seller-listing-row" key={lead.id}>
                    <div>
                      <p className="seller-listing-status">{leadStatusLabel(lead)} · {lead.channel}</p>
                      <h3>{lead.listingTitle}</h3>
                      <p className="seller-listing-location">Recebido em {new Date(lead.createdAtUtc).toLocaleString("pt-BR")}</p>
                      {lead.contactedAtUtc ? <p className="seller-form-help">Atendido em {new Date(lead.contactedAtUtc).toLocaleString("pt-BR")}</p> : null}
                      {lead.closedAtUtc ? <p className="seller-form-help">Encerrado em {new Date(lead.closedAtUtc).toLocaleString("pt-BR")}</p> : null}
                    </div>
                    <div className="seller-listing-actions">
                      <p className="seller-form-help">{lead.buyerUserId ? "Buyer autenticado" : "Contato anônimo"}</p>
                      {!lead.closedAtUtc && !lead.contactedAtUtc ? <button className="primary-action" type="button" disabled={updatingLeadId === lead.id} onClick={() => void markLeadContacted(lead.id)}>{updatingLeadId === lead.id ? "Atualizando…" : "Marcar como atendido"}</button> : null}
                      {!lead.closedAtUtc ? <button className="primary-action" type="button" disabled={updatingLeadId === lead.id} onClick={() => void closeLead(lead.id, "Won")}>{updatingLeadId === lead.id ? "Atualizando…" : "Marcar como vendido"}</button> : null}
                      {!lead.closedAtUtc ? <button className="secondary-action" type="button" disabled={updatingLeadId === lead.id} onClick={() => void closeLead(lead.id, "Lost")}>{updatingLeadId === lead.id ? "Atualizando…" : "Encerrar sem venda"}</button> : null}
                      <Link className="secondary-action action-link" href={`/vender/anuncios/${lead.listingId}`}>Ver anúncio</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default function SellerEntryPage() {
  return (
    <Suspense
      fallback={
        <main className="shell seller-shell">
          <p className="seller-shell-status">Carregando área do vendedor…</p>
        </main>
      }
    >
      <SellerEntryPageContent />
    </Suspense>
  );
}
