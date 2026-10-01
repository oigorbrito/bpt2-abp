# Current work

Last verified: **2026-10-01**

Snapshot volatile only.

## Current outcome

- Podium Catalog Feed HTTP V1 is **completed, merged and hosted-E2E validated**.
- BPT2 PR #246 and Podium7 PR #345 are integrated.
- BPT2 focused feed gate run `36865432643` passed with PostgreSQL + fixture + HTTP smoke.
- Podium7 cross-repository E2E run `36867723586` passed the real `Podium7 -> authenticated HTTP -> BPT2 -> PostgreSQL` path.
- Plan 0072 is archived under `docs/exec-plans/completed/`.
- The deleted 2026-09-16 Podium7/BPT2 topology reassessment was restored through PR #253.
- Listing action accessibility cleanup was consolidated and merged through PR #254.
- **No BPT2 pull request is open at this handoff.**

## Next acceptance target

No product/integration implementation is currently pending in BPT2.

The only live experiment is GitHub Pages issue #247:

- repository Pages is enabled;
- isolated `gh-pages` contains only `index.html`, `probe.json` and `.nojekyll`;
- Pages is a static/browser/report surface only;
- it must not receive BPT2/Podium credentials or be treated as .NET/Python/PostgreSQL E2E;
- scheduled publication watch remains active until a real deployment/site response is confirmed.

## Blockers

| ID | Blocker | Evidence | Disposition |
| --- | --- | --- | --- |
| BR-02 | main integration policy is still tracked by #160 | repository administration | keep PR-based integration |
| BR-03 | **Resolved** — Podium7 integration certification | hosted BPT2 + cross-repo E2E PASS | no integration blocker remains |
| BR-04 | Pages publication not yet empirically confirmed | #247 + `gh-pages` probe | monitor only; do not block product integration |

## Repository-topology state

- BPT2 backend + `public-web`: ADR 0012 remains `KEEP_MONOREPO`.
- Podium7 ↔ BPT2 repo colocation remains a separate question.
- Restored reassessment result remains `INSUFFICIENT_EVIDENCE`; no migration is authorized.

## Canonical links

- [docs/PRODUCT.md](../PRODUCT.md)
- [docs/QUALITY.md](../QUALITY.md)
- [docs/LOCAL-DEVELOPMENT.md](../LOCAL-DEVELOPMENT.md)
- [ADR 0012 — Repository topology](../adr/0012-repository-topology.md)
- [Plan 0072](../exec-plans/completed/0072-podium-catalog-feed-http-v1.md)
- [Podium7/BPT2 topology reassessment](../audits/2026-09-16-podium7-bpt2-topology-reassessment.md)

## Resume rule

Refresh live GitHub state first. Do not reopen completed integration work unless current evidence invalidates the accepted result.
