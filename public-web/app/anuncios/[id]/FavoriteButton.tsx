"use client";

import { useEffect, useState } from "react";
import { addFavorite, isFavorite, removeFavorite } from "../../../lib/buyer-api";
import { getCurrentBuyerUser, signInBuyer } from "../../../lib/buyer-auth";

export default function FavoriteButton({ listingId }: { listingId: string }) {
  const [favorite, setFavorite] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const user = await getCurrentBuyerUser();
      setAuthenticated(Boolean(user));
      if (user) {
        try {
          setFavorite(await isFavorite(user.access_token, listingId));
        } catch {
          setFavorite(false);
        }
      }
    }
    void load();
  }, [listingId]);

  async function toggle() {
    setError(null);
    const user = await getCurrentBuyerUser();
    if (!user) {
      await signInBuyer(`${window.location.pathname}${window.location.search}`);
      return;
    }

    setBusy(true);
    try {
      if (favorite) {
        await removeFavorite(user.access_token, listingId);
        setFavorite(false);
      } else {
        await addFavorite(user.access_token, listingId);
        setFavorite(true);
      }
      setAuthenticated(true);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar o favorito.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button aria-pressed={favorite} className="secondary-action" disabled={busy} type="button" onClick={toggle}>
        {favorite ? "Remover dos favoritos" : authenticated ? "Salvar nos favoritos" : "Entrar e salvar nos favoritos"}
      </button>
      {error ? <p className="seller-auth-error" role="alert">{error}</p> : null}
    </div>
  );
}
