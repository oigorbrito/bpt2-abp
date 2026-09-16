# Current work

Last verified: **2026-09-16**

Snapshot volatile only.

## In flight

- Plan 0072 — Podium Catalog Feed HTTP V1 is active.
- Outcome: freeze and prove an explicit external HTTP entrypoint for the already-implemented Podium Catalog Feed V1 without duplicating catalog/reconciliation logic.
- Producer-side preparation is tracked in `oigorbrito/podium7#319`.
- Consumer-side transport-definition issue is `#203`.

Active plan: [`../exec-plans/active/0072-podium-catalog-feed-http-v1.md`](../exec-plans/active/0072-podium-catalog-feed-http-v1.md).

## Current acceptance target

`POST /api/integrations/podium/catalog/v1/vehicles` must be exposed in Swagger, require authorization, accept the existing Podium Catalog JSON `2.0` input through `IPodiumCatalogFeedAppService`, preserve replay/redirect semantics, and pass the dedicated PostgreSQL-backed Podium feed gate including HTTP smoke.

## Architecture boundary

- BPT2 Ingestion owns provenance/import/reconciliation state.
- BPT2 Catalog remains canonical for marketplace vehicle identity.
- Podium remains producer of the versioned external identity contract.
- HTTP is an adapter boundary only; the controller must not reimplement import semantics.
- No shared database, label rematching, enrichment/Comparator expansion, or production credential is part of this slice.

## Authorization state

The existing feed app service is protected by role `admin`; the explicit HTTP adapter preserves that boundary for this slice. A narrower machine-client scope/policy remains a separate decision and must not be simulated with a committed credential.

## Blocker register

| ID | Blocker | Affects | Evidence | Required unblock | Can work continue? |
| --- | --- | --- | --- | --- | --- |
| BR-02 | `#160` main-branch integration policy remains administrative unless remote state has changed | repository administration | last verified state had `main` unprotected and no repository ruleset | repository administration authority / current remote revalidation | yes |

## Immediate blocker

No repo-internal blocker is currently known for Plan 0072. CI execution on the exact branch is the next evidence target.

## Remote integration state

- canonical remote repository: `oigorbrito/bpt2-abp`;
- active branch: `feat/podium-catalog-feed-http-v1`;
- issue `#203` defines the external staging transport outcome;
- Podium producer work is in `oigorbrito/podium7#319`.

## Next closure item

Run the dedicated Podium catalog feed gate with the new HTTP smoke, fix any exact-head failures, self-review the route/auth boundary, then close Plan 0072 only when the focused integration evidence is green.

## Canonical links

- [docs/PRODUCT.md](../PRODUCT.md)
- [docs/QUALITY.md](../QUALITY.md)
- [docs/SECURITY.md](../SECURITY.md)
- [docs/ENGINEERING.md](../ENGINEERING.md)
- [Plan 0072](../exec-plans/active/0072-podium-catalog-feed-http-v1.md)

## Source of runtime truth

- product: [`../PRODUCT.md`](../PRODUCT.md);
- generated facts: [`../generated/repository-facts.md`](../generated/repository-facts.md).

## Update rule

Atualize somente quando mudar outcome, plano, acceptance target ou blocker real.
