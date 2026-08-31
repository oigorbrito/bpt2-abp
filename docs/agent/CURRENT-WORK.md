# Current work

Last verified: **2026-08-31**

Snapshot volatile only.

## In flight

- Wave `PRODUCT-WAVE-SELLER-OPS-01`: Seller inventory/readiness drill-down and queue work surface.
- The wave is merged into `origin/main` via PR [#175](https://github.com/tihotm/bpt2-abp/pull/175) at `341b3793186ec26474734440f823867e7b90a04b`.
- Wave block completed and integrated:
  - inventory status queues now expose direct lifecycle actions where backend allows them;
  - listing edit surface now shows current lifecycle context and publish authority instead of an invented readiness checklist;
  - publication readiness is reduced to actual mutability/canonical-vehicle authority.
- Current control-plane artifacts:
  - [docs/baselines/POST_MVP_OPERATIONAL_BASELINE_V1.md](../baselines/POST_MVP_OPERATIONAL_BASELINE_V1.md)
  - [docs/closure/POST_MVP_OPERATIONAL_CLOSURE_MATRIX.md](../closure/POST_MVP_OPERATIONAL_CLOSURE_MATRIX.md)

## Blocker register

| ID | Blocker | Affects | Evidence | Required unblock | Can wave continue? |
| --- | --- | --- | --- | --- | --- |
| BR-01 | Browser/DB runtime unavailable on this machine | end-to-end Seller smoke | previous documented fresh-environment probe remains blocked by missing disposable runtime | PostgreSQL-capable runtime / browser smoke env | yes |
| BR-02 | `#160` main-branch integration policy remains administrative | repository administration | open issue #160 and branch-protection/ruleset enforcement remain unresolved | repository administration authority | yes |

## Immediate blocker

Repo-internal work is integrated. Remaining validation is external: browser/DB smoke and repository administration.

## Remote integration state

- remote repository moved to `tihotm/bpt2-abp`;
- PR [#175](https://github.com/tihotm/bpt2-abp/pull/175) merged successfully;
- `main` on the remote now includes the Seller Operations wave and the reconstructed baseline.

## Next closure item

Keep the current wave in `COMPLETE_EXTERNAL_VALIDATION_PENDING` while the remaining external runtime smoke and `#160` administrative blocker finalize.

## Canonical links

- [docs/PRODUCT.md](../PRODUCT.md)
- [docs/QUALITY.md](../QUALITY.md)
- [docs/LOCAL-DEVELOPMENT.md](../LOCAL-DEVELOPMENT.md)
- [docs/baselines/POST_MVP_OPERATIONAL_BASELINE_V1.md](../baselines/POST_MVP_OPERATIONAL_BASELINE_V1.md)
- [docs/closure/POST_MVP_OPERATIONAL_CLOSURE_MATRIX.md](../closure/POST_MVP_OPERATIONAL_CLOSURE_MATRIX.md)

## Source of runtime truth

- product: [`../PRODUCT.md`](../PRODUCT.md);
- coverage: [`../audits/2026-08-27-unified-functional-coverage-matrix.md`](../audits/2026-08-27-unified-functional-coverage-matrix.md);
- discovery baseline: [`../audits/2026-08-29-advanced-discovery-baseline.md`](../audits/2026-08-29-advanced-discovery-baseline.md);
- typo scoring: [`../audits/2026-08-30-discovery-typo-scoring-comparison.md`](../audits/2026-08-30-discovery-typo-scoring-comparison.md);
- metamorphic: [`../audits/2026-08-30-discovery-metamorphic-typo-robustness.md`](../audits/2026-08-30-discovery-metamorphic-typo-robustness.md);
- workflow concurrency: [`../audits/2026-08-30-workflow-concurrency-probe.md`](../audits/2026-08-30-workflow-concurrency-probe.md);
- generated facts: [`../generated/repository-facts.md`](../generated/repository-facts.md).

## Update rule

Atualize somente quando mudar outcome, plano, acceptance target ou blocker real.
