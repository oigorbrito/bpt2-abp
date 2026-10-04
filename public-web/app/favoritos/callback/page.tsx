"use client";

import { useEffect, useState } from "react";
import { getBuyerUserManager } from "../../../lib/buyer-auth";

export default function BuyerCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function completeSignIn() {
      try {
        const user = await getBuyerUserManager().signinRedirectCallback();
        const state = user.state as { returnTo?: string } | undefined;
        const returnTo = state?.returnTo?.startsWith("/") && !state.returnTo.startsWith("//") ? state.returnTo : "/favoritos";
        window.location.replace(returnTo);
      } catch (reason: unknown) {
        setError(reason instanceof Error ? reason.message : "Não foi possível concluir o login.");
      }
    }
    void completeSignIn();
  }, []);

  return (
    <main className="shell seller-shell">
      <p className="eyebrow">Conta do comprador</p>
      <h1>Concluindo login…</h1>
      {error ? <p className="seller-auth-error" role="alert">{error}</p> : null}
    </main>
  );
}
