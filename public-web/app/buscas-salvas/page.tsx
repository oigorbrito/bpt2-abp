"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "oidc-client-ts";
import {
  deleteSavedSearch,
  getMySavedSearches,
  getSavedSearchMatches,
  setSavedSearchEmailEachNewMatch,
  setSavedSearchMonitoring,
  type SavedSearch,
  type SavedSearchAlertMatch,
} from "../../lib/buyer-api";
import { getCurrentBuyerUser, getBuyerUserManager, signInBuyer } from "../../lib/buyer-auth";

function searchHref(search: SavedSearch): string {
  const params = new URLSearchParams();
  const setText = (name: string, value?: string) => {
    if (value) params.set(name, value);
  };
  const setNumber = (name: string, value?: number) => {
    if (value !== undefined) params.set(name, String(value));
  };

  setText("vehicleId", search.vehicleId);
  setText("sellerId", search.sellerId);
  setText("query", search.query);
  setText("brand", search.brand);
  setText("model", search.model);
  setText("color", search.color);
  setText("city", search.city);
  setText("stateCode", search.stateCode);
  setNumber("minModelYear", search.minModelYear);
  setNumber("maxModelYear", search.maxModelYear);
  setNumber("minPrice", search.minPrice);
  setNumber("maxPrice", search.maxPrice);
  setNumber("minMileageKm", search.minMileageKm);
  setNumber("maxMileageKm", search.maxMileageKm);
  return params.size > 0 ? `/?${params.toString()}` : "/";
}

function searchLabel(search: SavedSearch): string {
  const parts = [
    search.query,
    search.brand,
    search.model,
    search.color ? `cor ${search.color}` : undefined,
    search.city,
    search.stateCode,
    search.vehicleId ? "veículo específico" : undefined,
    search.sellerId ? "vendedor específico" : undefined,
    search.minModelYear !== undefined ? `a partir de ${search.minModelYear}` : undefined,
    search.maxModelYear !== undefined ? `até ${search.maxModelYear}` : undefined,
    search.minPrice !== undefined ? `mín. R$ ${search.minPrice}` : undefined,
    search.maxPrice !== undefined ? `máx. R$ ${search.maxPrice}` : undefined,
    search.minMileageKm !== undefined ? `mín. ${search.minMileageKm} km` : undefined,
    search.maxMileageKm !== undefined ? `máx. ${search.maxMileageKm} km` : undefined,
  ].filter(Boolean);
  return parts.join(" · ") || "Todos os anúncios públicos";
}

export default function SavedSearchesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [matchesBySearch, setMatchesBySearch] = useState<Record<string, SavedSearchAlertMatch[]>>({});
  const [openMatchesId, setOpenMatchesId] = useState<string | null>(null);
  const [loadingMatchesId, setLoadingMatchesId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const currentUser = await getCurrentBuyerUser();
        setUser(currentUser);
        if (currentUser) setItems(await getMySavedSearches(currentUser.access_token));
      } catch (reason: unknown) {
        setError(reason instanceof Error ? reason.message : "Não foi possível carregar suas buscas salvas.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function toggleMonitoring(item: SavedSearch) {
    if (!user) return;
    setError(null);
    setUpdatingId(item.id);
    try {
      const updated = await setSavedSearchMonitoring(user.access_token, item.id, !item.alertEnabled);
      setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar o monitoramento.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleEmailEachNewMatch(item: SavedSearch) {
    if (!user) return;
    setError(null);
    setUpdatingId(item.id);
    try {
      const updated = await setSavedSearchEmailEachNewMatch(
        user.access_token,
        item.id,
        !item.emailEachNewMatchEnabled,
      );
      setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar os emails desta busca.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function toggleMatches(item: SavedSearch) {
    if (!user) return;
    if (openMatchesId === item.id) {
      setOpenMatchesId(null);
      return;
    }

    setError(null);
    setOpenMatchesId(item.id);
    if (Object.hasOwn(matchesBySearch, item.id)) return;

    setLoadingMatchesId(item.id);
    try {
      const matches = await getSavedSearchMatches(user.access_token, item.id);
      setMatchesBySearch((current) => ({ ...current, [item.id]: matches }));
    } catch (reason: unknown) {
      setOpenMatchesId(null);
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar as ofertas detectadas.");
    } finally {
      setLoadingMatchesId(null);
    }
  }

  async function remove(id: string) {
    if (!user) return;
    setError(null);
    try {
      await deleteSavedSearch(user.access_token, id);
      setItems((current) => current.filter((item) => item.id !== id));
      setMatchesBySearch((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      if (openMatchesId === id) setOpenMatchesId(null);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível remover a busca salva.");
    }
  }

  return (
    <main className="shell seller-shell">
      <nav className="back-nav" aria-label="Voltar para anúncios">
        <Link href="/">← Todos os anúncios</Link>
      </nav>
      <header className="seller-dashboard-header">
        <div>
          <p className="eyebrow">Conta do comprador</p>
          <h1>Buscas salvas.</h1>
          <p className="lede">Guarde filtros de descoberta para reabrir o mesmo conjunto lógico de resultados.</p>
        </div>
        {user ? (
          <button className="secondary-action" type="button" onClick={() => getBuyerUserManager().signoutRedirect()}>
            Sair
          </button>
        ) : null}
      </header>

      {loading ? <p className="seller-shell-status">Verificando sessão…</p> : null}
      {error ? <p className="seller-auth-error" role="alert">{error}</p> : null}

      {!loading && !user ? (
        <section className="seller-auth-card">
          <h2>Entre para acessar suas buscas salvas</h2>
          <p>A autenticação Buyer continua usando Authorization Code + PKCE.</p>
          <button className="primary-action" type="button" onClick={() => signInBuyer("/buscas-salvas")}>
            Entrar
          </button>
        </section>
      ) : null}

      {!loading && user ? (
        <section className="listing-section" aria-labelledby="saved-search-list-title">
          <div className="section-heading">
            <h2 id="saved-search-list-title">Critérios salvos</h2>
            <p className="result-count">{items.length} busca(s)</p>
          </div>
          {items.length === 0 ? (
            <div className="empty-state">
              <h3>Nenhuma busca salva.</h3>
              <p>Refine a descoberta na página inicial e use “Salvar busca”.</p>
            </div>
          ) : (
            <div className="listing-grid">
              {items.map((item) => {
                const matchesOpen = openMatchesId === item.id;
                const matchesLoading = loadingMatchesId === item.id;
                const matches = matchesBySearch[item.id];

                return (
                  <article className="listing-card" key={item.id}>
                    <div className="listing-body">
                      <h3>{searchLabel(item)}</h3>
                      <p>Salva em {new Date(item.createdAtUtc).toLocaleString("pt-BR")}</p>
                      <p>
                        <Link href={searchHref(item)}>Ver resultados</Link>
                      </p>
                      <p aria-live="polite">
                        {item.alertEnabled
                          ? "Monitoramento ativo para novas ofertas compatíveis."
                          : "Monitoramento de novas ofertas desligado."}
                      </p>
                      <button
                        className="secondary-action"
                        disabled={updatingId === item.id}
                        type="button"
                        onClick={() => void toggleMonitoring(item)}
                      >
                        {updatingId === item.id
                          ? "Atualizando…"
                          : item.alertEnabled
                            ? "Desativar monitoramento"
                            : "Monitorar novas ofertas"}
                      </button>
                      <p aria-live="polite">
                        {item.emailEachNewMatchEnabled
                          ? "Email ativo: um email para cada nova oferta detectada nesta busca."
                          : "Emails por nova oferta desligados."}
                      </p>
                      <button
                        className="secondary-action"
                        disabled={updatingId === item.id}
                        type="button"
                        onClick={() => void toggleEmailEachNewMatch(item)}
                      >
                        {updatingId === item.id
                          ? "Atualizando…"
                          : item.emailEachNewMatchEnabled
                            ? "Parar emails por nova oferta"
                            : "Receber um email por nova oferta"}
                      </button>
                      <button
                        aria-expanded={matchesOpen}
                        className="secondary-action"
                        type="button"
                        onClick={() => void toggleMatches(item)}
                      >
                        {matchesOpen ? "Ocultar ofertas detectadas" : "Ver ofertas detectadas"}
                      </button>
                      {matchesOpen ? (
                        <div aria-live="polite">
                          {matchesLoading ? <p>Carregando ofertas detectadas…</p> : null}
                          {!matchesLoading && matches?.length === 0 ? (
                            <p>Nenhuma nova oferta foi detectada para esta busca.</p>
                          ) : null}
                          {!matchesLoading && matches && matches.length > 0 ? (
                            <>
                              <ul>
                                {matches.map((match) => (
                                  <li key={match.id}>
                                    <Link href={`/anuncios/${encodeURIComponent(match.listingId)}`}>
                                      Abrir oferta detectada
                                    </Link>{" "}
                                    · detectada em {new Date(match.detectedAtUtc).toLocaleString("pt-BR")}
                                  </li>
                                ))}
                              </ul>
                              <p>
                                O registro de detecção é histórico. A disponibilidade atual continua sendo decidida pelo anúncio público.
                              </p>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                      <button className="secondary-action" type="button" onClick={() => void remove(item.id)}>
                        Remover busca
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
