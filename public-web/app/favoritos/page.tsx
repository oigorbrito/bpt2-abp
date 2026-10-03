"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "oidc-client-ts";
import {
  getMyFavoritePriceDropMatches,
  getMyFavorites,
  removeFavorite,
  type FavoritePriceDropMatch,
} from "../../lib/buyer-api";
import { getCurrentBuyerUser, getBuyerUserManager, signInBuyer } from "../../lib/buyer-auth";
import { formatPrice, type PublicListing } from "../../lib/public-listings";

export default function FavoritesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<PublicListing[]>([]);
  const [priceDrops, setPriceDrops] = useState<FavoritePriceDropMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const currentUser = await getCurrentBuyerUser();
        setUser(currentUser);
        if (currentUser) {
          const [favoriteItems, priceDropItems] = await Promise.all([
            getMyFavorites(currentUser.access_token),
            getMyFavoritePriceDropMatches(currentUser.access_token),
          ]);
          setFavorites(favoriteItems);
          setPriceDrops(priceDropItems);
        }
      } catch (reason: unknown) {
        setError(reason instanceof Error ? reason.message : "Não foi possível carregar seus favoritos.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function remove(listingId: string) {
    if (!user) return;
    setError(null);
    setRemovingId(listingId);
    try {
      await removeFavorite(user.access_token, listingId);
      setFavorites((items) => items.filter((item) => item.id !== listingId));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível remover o favorito.");
    } finally {
      setRemovingId(null);
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
          <h1>Meus favoritos.</h1>
          <p className="lede">Salve anúncios publicados e acompanhe quedas de preço já detectadas.</p>
        </div>
        {user ? (
          <button className="secondary-action" type="button" onClick={() => getBuyerUserManager().signoutRedirect()}>
            Sair
          </button>
        ) : null}
      </header>

      {loading ? <p className="seller-shell-status">Verificando sessão…</p> : null}
      {error ? <p className="seller-auth-error">{error}</p> : null}

      {!loading && !user ? (
        <section className="seller-auth-card">
          <h2>Entre para salvar favoritos</h2>
          <p>A senha fica no Auth Server. O cliente Buyer usa Authorization Code + PKCE.</p>
          <button className="primary-action" type="button" onClick={() => signInBuyer("/favoritos")}>
            Entrar
          </button>
        </section>
      ) : null}

      {!loading && user ? (
        <>
          <section className="listing-section" aria-labelledby="favorite-list-title">
            <div className="section-heading">
              <h2 id="favorite-list-title">Anúncios salvos</h2>
              <p className="result-count">{favorites.length} favorito(s)</p>
            </div>
            {favorites.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhum favorito público agora.</h3>
                <p>Salve um anúncio na página de detalhes. Se ele for pausado, deixa de aparecer aqui.</p>
              </div>
            ) : (
              <div className="listing-grid">
                {favorites.map((listing) => (
                  <article className="listing-card" key={listing.id}>
                    <div className="listing-body">
                      <h3><Link href={`/anuncios/${listing.id}`}>{listing.title}</Link></h3>
                      <p className="listing-price">{formatPrice(listing.price)}</p>
                      <p className="listing-location">{listing.city} · {listing.stateCode}</p>
                      <button
                        aria-busy={removingId === listing.id}
                        aria-label={`Remover ${listing.title} dos favoritos`}
                        className="secondary-action"
                        disabled={removingId === listing.id}
                        type="button"
                        onClick={() => void remove(listing.id)}
                      >
                        {removingId === listing.id ? "Removendo…" : "Remover dos favoritos"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="listing-section" aria-labelledby="price-drop-list-title">
            <div className="section-heading">
              <h2 id="price-drop-list-title">Quedas de preço detectadas</h2>
              <p className="result-count">{priceDrops.length} queda(s)</p>
            </div>
            {priceDrops.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhuma queda de preço detectada.</h3>
                <p>Quando um anúncio já favoritado ficar mais barato, o histórico aparecerá aqui.</p>
              </div>
            ) : (
              <div className="listing-grid">
                {priceDrops.map((match) => (
                  <article className="listing-card" key={match.id}>
                    <div className="listing-body">
                      <h3><Link href={`/anuncios/${match.listingId}`}>Ver anúncio</Link></h3>
                      <p className="listing-price">
                        {formatPrice(match.previousPrice)} → {formatPrice(match.newPrice)}
                      </p>
                      <p>Detectada em {new Date(match.detectedAtUtc).toLocaleString("pt-BR")}</p>
                      <p className="listing-location">
                        Este é um registro histórico. A página do anúncio informa se a oferta continua pública.
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
