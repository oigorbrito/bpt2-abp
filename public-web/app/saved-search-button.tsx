"use client";

import { useState } from "react";
import { createSavedSearch, type SavedSearchCriteria } from "@/lib/buyer-api";
import { getCurrentBuyerUser, signInBuyer } from "@/lib/buyer-auth";

export default function SavedSearchButton({ criteria }: { criteria: SavedSearchCriteria }) {
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const user = await getCurrentBuyerUser();
      if (!user) {
        await signInBuyer(`${window.location.pathname}${window.location.search}`);
        return;
      }
      await createSavedSearch(user.access_token, criteria);
      setStatus("Busca salva.");
    } catch (reason: unknown) {
      setStatus(reason instanceof Error ? reason.message : "Não foi possível salvar a busca.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <span>
      <button aria-busy={saving} className="secondary-action" disabled={saving} onClick={save} type="button">
        {saving ? "Salvando…" : "Salvar busca"}
      </button>
      {status ? <span aria-live="polite"> {status}</span> : null}
    </span>
  );
}
