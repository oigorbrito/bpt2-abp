"use client";

import { useEffect, useState } from "react";

import { getSellerUserManager } from "../../../lib/seller-auth";

export default function SellerCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSellerUserManager()
      .signinRedirectCallback()
      .then(() => {
        window.location.replace("/vender");
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Falha ao concluir o login Seller.");
      });
  }, []);

  return (
    <main className="shell seller-shell">
      <p className="eyebrow">Área do vendedor</p>
      <h1>Concluindo login…</h1>
      {error ? <p className="seller-auth-error" role="alert">{error}</p> : <p className="lede">Validando o retorno do Auth Server.</p>}
    </main>
  );
}
