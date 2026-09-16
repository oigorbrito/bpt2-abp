# Current work

Last verified: **2026-09-16**

Snapshot volatile only.

## In flight

- Plan 0072 — Podium Catalog Feed HTTP V1 is active.
- Outcome: freeze and prove an explicit external HTTP entrypoint for the already-implemented Podium Catalog Feed V1 without duplicating catalog/reconciliation logic.
- Producer-side preparation is tracked in `oigorbrito/podium7#319`.
- Consumer-side transport-definition issue is `#203`; implementation PR is `#204`.

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
| BR-03 | GitHub-hosted jobs fail before repository steps execute | Plan 0072 exact-head validation and other BPT2 gates | focused Podium feed job returned no steps; multiple unrelated workflows failed simultaneously; same pattern exists in `oigorbrito/podium7#318` | owner/account Actions billing/quota/budget/payment/runner eligibility or GitHub-side account condition must be resolved, then exact-head rerun | code/docs can advance; hosted certification cannot |

## Immediate blocker

Plan 0072 cannot satisfy its execution acceptance criterion until GitHub allocates a hosted runner and the exact-head focused gate executes real repository steps. This is not currently evidence of a code/test failure.

## Remote integration state

- canonical remote repository: `oigorbrito/bpt2-abp`;
- active branch: `feat/podium-catalog-feed-http-v1`;
- issue `#203` defines the external staging transport outcome;
- PR `#204` implements the explicit HTTP boundary and smoke;
- Podium producer work is in `oigorbrito/podium7#319`;
- cross-repository runner blocker is tracked in `oigorbrito/podium7#318`.

## Next closure item

After hosted runner allocation is restored, rerun PR #204 exact-head `BPT2 Podium Catalog Feed Gate`. Close Plan 0072 only when the in-process fixture and HTTP smoke execute real steps and pass; then coordinate one retained end-to-end staging handoff with Podium7.

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
