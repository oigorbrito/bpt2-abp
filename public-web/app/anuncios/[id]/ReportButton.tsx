"use client";

import { useEffect, useState } from "react";
import { isListingReported, reportListing } from "../../../lib/buyer-api";
import { getCurrentBuyerUser, signInBuyer } from "../../../lib/buyer-auth";

export default function ReportButton({ listingId }: { listingId: string }) {
  const [reported, setReported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const user = await getCurrentBuyerUser();
      if (!user) return;
      try {
        setReported(await isListingReported(user.access_token, listingId));
      } catch {
        setReported(false);
      }
    }
    void load();
  }, [listingId]);

  async function report() {
    setError(null);
    const user = await getCurrentBuyerUser();
    if (!user) {
      await signInBuyer(`${window.location.pathname}${window.location.search}`);
      return;
    }

    setBusy(true);
    try {
      await reportListing(user.access_token, listingId);
      setReported(true);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível sinalizar o anúncio.");
    } finally {
      setBusy(false);
    }
  }

  const labelText = busy
    ? "Sinalizando…"
    : reported
    ? "Anúncio sinalizado"
    : "Sinalizar anúncio";

  return (
    <div>
      <button className="secondary-action" disabled={busy || reported} aria-busy={busy} type="button" onClick={report}>
        {labelText}
      </button>
      {error ? <p className="seller-auth-error" role="alert">{error}</p> : null}
    </div>
  );
}
