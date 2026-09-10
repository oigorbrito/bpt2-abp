# Current work

Last verified: **2026-09-10**

Snapshot volatile only.

## In flight

- No product wave is currently active.
- `PRODUCT-WAVE-LISTING-DECISION-SUPPORT-01` is complete for its defined product and SSR/HTTP runtime acceptance.
- Repository-topology evidence series Plans 0062–0070 is complete.
- Plan 0071 records the resulting architecture decision in ADR 0012.

## Repository topology

Current decision: **KEEP_MONOREPO** for the BPT2 backend + `public-web` repository topology.

This is a bounded least-change decision under the measured BPT2 evidence, not a claim that monorepos are universally superior and not a requirement for atomic backend/frontend deployment.

Key evidence:

- split is mechanically build-feasible;
- historical BPT2 work has non-trivial cross-boundary and contract coupling;
- split did not demonstrate a material CI/critical-path advantage under preregistered thresholds;
- raw cross-boundary lead-time association attenuated after size/scope adjustment;
- controlled same-change and deploy/rollback rehearsals showed additional explicit integration/deployment boundaries for split;
- breaking independent rollout required bridge/coordinated rollout in the Plan 0070 workload.

Canonical decision: [`../adr/0012-repository-topology.md`](../adr/0012-repository-topology.md).

## Blocker register

| ID | Blocker | Affects | Evidence | Required unblock | Can work continue? |
| --- | --- | --- | --- | --- | --- |
| BR-01 | Resolved for the defined remote SSR/HTTP runtime validation | Listing decision-support runtime smoke | PR #185 exact-head runtime validation passed with PostgreSQL 17 + real API + production `public-web` SSR | None for measured boundary | yes |
| BR-02 | `#160` main-branch integration policy remains administrative unless remote state has changed | repository administration | last verified state had `main` unprotected and no repository ruleset | repository administration authority / current remote revalidation | yes |

## Immediate blocker

No repo-internal product blocker is registered here. Repository administration issue #160 remains a separate boundary until revalidated.

## Remote integration state

- canonical remote repository: `oigorbrito/bpt2-abp`;
- previous `tihotm/bpt2-abp` location redirects to the canonical repository;
- repository-topology studies through Plan 0070 are integrated into `main`.

## Next closure item

After Plan 0071 is integrated, do not create another architecture benchmark without a new material hypothesis or an ADR 0012 reopen trigger. Reinspect product/quality/issue state and choose the next real product gap by evidence.

## Canonical links

- [docs/PRODUCT.md](../PRODUCT.md)
- [docs/QUALITY.md](../QUALITY.md)
- [docs/LOCAL-DEVELOPMENT.md](../LOCAL-DEVELOPMENT.md)
- [ADR 0012 — Repository topology](../adr/0012-repository-topology.md)
- [docs/baselines/POST_MVP_OPERATIONAL_BASELINE_V1.md](../baselines/POST_MVP_OPERATIONAL_BASELINE_V1.md)
- [docs/closure/POST_MVP_OPERATIONAL_CLOSURE_MATRIX.md](../closure/POST_MVP_OPERATIONAL_CLOSURE_MATRIX.md)

## Source of runtime truth

- product: [`../PRODUCT.md`](../PRODUCT.md);
- coverage: [`../audits/2026-08-27-unified-functional-coverage-matrix.md`](../audits/2026-08-27-unified-functional-coverage-matrix.md);
- discovery baseline: [`../audits/2026-08-29-advanced-discovery-baseline.md`](../audits/2026-08-29-advanced-discovery-baseline.md);
- typo scoring: [`../audits/2026-08-30-discovery-typo-scoring-comparison.md`](../audits/2026-08-30-discovery-typo-scoring-comparison.md);
- metamorphic: [`../audits/2026-08-30-discovery-metamorphic-typo-robustness.md`](../audits/2026-08-30-discovery-metamorphic-typo-robustness.md);
- generated facts: [`../generated/repository-facts.md`](../generated/repository-facts.md).

## Update rule

Atualize somente quando mudar outcome, plano, acceptance target ou blocker real.
