"use client";

import { useState, type FormEvent } from "react";
import { getCurrentBuyerUser } from "@/lib/buyer-auth";

type Props = { listingId: string };

type ContactResponse = { url: string };

export default function WhatsAppContactButton({ listingId }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function contactSeller(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;

    try {
      const user = await getCurrentBuyerUser();
      const body = new FormData(event.currentTarget);
      const headers = new Headers({ Accept: "application/json" });
      if (user?.access_token) headers.set("Authorization", `Bearer ${user.access_token}`);

      const response = await fetch("/api/contact/whatsapp", { method: "POST", body, headers });
      if (!response.ok) throw new Error(`Contato indisponível (HTTP ${response.status}).`);
      const { url } = (await response.json()) as ContactResponse;
      if (!url) throw new Error("Contato indisponível neste momento.");

      if (popup) popup.location.replace(url);
      else window.location.assign(url);
    } catch (cause) {
      popup?.close();
      setError(cause instanceof Error ? cause.message : "Não foi possível abrir o WhatsApp.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action="/api/contact/whatsapp" method="post" target="_blank" onSubmit={contactSeller}>
      <input name="listingId" type="hidden" value={listingId} />
      <button className="whatsapp-cta" aria-busy={busy} type="submit" disabled={busy}>
        {busy ? "Abrindo WhatsApp…" : "Falar no WhatsApp"}
      </button>
      {error ? <p className="contact-unavailable" role="alert">{error}</p> : null}
    </form>
  );
}
