# Current work

Last verified: **2026-10-03**

Snapshot volatile only.

## Current outcome

- Podium Catalog Feed HTTP V1 is **completed, merged and hosted-E2E validated**.
- BPT2 PR #246 and Podium7 PR #345 are integrated.
- BPT2 focused feed run `36865432643` passed with PostgreSQL + fixture + HTTP smoke.
- Podium7 cross-repository run `36867723586` passed the real `Podium7 -> authenticated HTTP -> BPT2 -> PostgreSQL` path.
- GitHub Pages issue #247 is **completed**:
  - isolated `gh-pages` source confirmed;
  - browser JavaScript PASS observed;
  - same-origin `probe.json` fetch PASS observed;
  - Pages remains a static/browser/report surface only.
- Hosted-staging packaging PR #283 is merged:
  - .NET 10 / ABP API image builds;
  - Next.js standalone public-web image builds;
  - disposable PostgreSQL remains the only authorized staging database mode.
- Follow-up CI fix #286 is merged and the staging image workflow satisfies repository concurrency policy.
- Security/accessibility stale-draft reconciliation is complete:
  - #287 merged protocol-relative `returnTo` hardening;
  - #288 merged public-web response headers;
  - #289 merged consolidated accessibility baseline.
- The stale Sentinel/Palette/Bolt draft backlog was reviewed and closed; old branches were preserved.
- **Open BPT2 pull requests at handoff: 0.**

## Remaining work

Three BPT2 issues remain open and represent distinct work classes.

### #284 — public hosted staging acceptance

This is the next deployment acceptance target.

Goal:

```text
Browser
  -> public HTTPS Next.js
  -> BPT2 API
  -> PostgreSQL staging

Podium7
  -> public HTTPS BPT2 Catalog Feed
  -> Ingestion/Catalog
  -> PostgreSQL staging
```

Repository packaging is ready. The remaining dependency is an explicitly connected/authorized hosting provider account.

The database boundary remains disposable staging only. Do not infer persistent production migration readiness from the CI fresh-schema gate.

### #275 — larger-cardinality typo-search benchmark

This is a separate product-evidence task, not a staging blocker.

Retained decision:
- current substring search remains the production control;
- no trigram candidate is authorized for production until larger-cardinality relevance, false-positive and planner/index evidence is retained;
- if revisited, freeze the workload/targets before observing candidate scores.

### #160 — main-branch integration policy

This remains **ADMIN_ONLY** repository governance work.

Desired outcome:
- direct writes to `main` blocked;
- PR integration required;
- required-check configuration must avoid path-filter deadlocks.

Do not reopen engineering design work to solve this; the missing action is repository administration.

## Cross-repository staging state

Podium7 PR #357 adds the external BPT2 staging acceptance workflow.

It remains open because Podium7 issue #358 tracks a fresh GitHub-hosted runner recurrence: repeated exact-head jobs fail with `steps:null` before repository execution.

Interpretation:
- this is not evidence of a Podium7/BPT2 code regression;
- do not merge #357 on stale PASS;
- merge only after an exact-head run executes repository steps and required checks pass.

## Blockers

| ID | Blocker | Evidence | Disposition |
| --- | --- | --- | --- |
| BR-02 | main integration policy not enforced | #160 | repository administration only |
| BR-03 | **Resolved** — Podium7 integration certification | runs `36865432643` / `36867723586` | no integration blocker |
| BR-04 | **Resolved** — GitHub Pages isolated probe | #247 + browser evidence | static-surface experiment complete |
| BR-05 | external hosted staging resources not provisioned | #284 | requires authorized hosting provider |
| BR-06 | Podium7 runner allocation recurrence | Podium7 #358 / PR #357 | external pre-step blocker |
| BR-07 | larger-cardinality typo evidence not retained | #275 | independent product-evidence task |

## Repository-topology state

- BPT2 backend + `public-web`: ADR 0012 remains `KEEP_MONOREPO`.
- Podium7 ↔ BPT2 colocation remains a separate question.
- Reassessment remains `INSUFFICIENT_EVIDENCE`; no repository migration is authorized.
- One repository does not imply one deploy unit: #283 packages API and public web independently.

## Resume order

1. Refresh live PR/issue state across **all authors**, not only owner-authored PRs.
2. Resume #284 when a hosting provider is connected; deploy disposable PostgreSQL + API first, then build/deploy Next with final public origins.
3. After a real BPT2 staging HTTPS origin exists, configure Podium7 staging variables/secrets and run #357, subject to #358.
4. Treat #275 independently; do not change production search without retained larger-cardinality evidence.
5. Treat #160 as admin-only repository governance.
6. Do not recreate closed cache/performance drafts without current profiling/benchmark evidence.
7. Do not reopen the Pages probe; it is complete.

## Canonical links

- [docs/PRODUCT.md](../PRODUCT.md)
- [docs/QUALITY.md](../QUALITY.md)
- [docs/LOCAL-DEVELOPMENT.md](../LOCAL-DEVELOPMENT.md)
- [ADR 0012 — Repository topology](../adr/0012-repository-topology.md)
- [Plan 0072](../exec-plans/completed/0072-podium-catalog-feed-http-v1.md)
- [Staging packaging](../../deploy/staging/README.md)
