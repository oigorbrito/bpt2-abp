# Current work

Last verified: **2026-10-03**

Snapshot volatile only.

## Current outcome

- Podium Catalog Feed HTTP V1 is **completed, merged and hosted-E2E validated**.
- BPT2 PR #246 and Podium7 PR #345 are integrated.
- BPT2 focused feed gate run `36865432643` passed with PostgreSQL + fixture + HTTP smoke.
- Podium7 cross-repository E2E run `36867723586` passed the real `Podium7 -> authenticated HTTP -> BPT2 -> PostgreSQL` path.
- Plan 0072 is archived under `docs/exec-plans/completed/`.
- The 2026-09-16 Podium7/BPT2 topology reassessment is restored on `main`.
- Listing/favorites accessibility consolidations are merged.
- GitHub Pages issue #247 is **completed**:
  - Pages deploys from isolated `gh-pages`;
  - browser JavaScript PASS observed;
  - same-origin `probe.json` fetch PASS observed;
  - Pages remains a static/browser/report surface only.
- Hosted-staging packaging PR #283 is merged:
  - .NET 10 / ABP API image builds;
  - Next.js standalone public-web image builds;
  - staging image gate passes on exact head.

## Next acceptance target

The active deployment experiment is **issue #284 — public hosted staging acceptance**.

Goal:

```text
Browser
  -> public HTTPS Next.js
  -> public/private BPT2 API boundary
  -> PostgreSQL staging

Podium7
  -> public HTTPS BPT2 Catalog Feed
  -> Ingestion/Catalog
  -> PostgreSQL staging
```

The current repository authorizes a **disposable staging database only** because domain module migration authority remains CI/fresh-schema oriented. This does not establish persistent production migration readiness.

Expected sequence:

1. provision disposable PostgreSQL 18 staging;
2. deploy the BPT2 API image and obtain its real HTTPS origin;
3. deploy/build the Next.js image with the real public API/Auth/Web origins;
4. configure CORS, redirect URLs and Buyer/Seller OpenIddict roots for the hosted web origin;
5. validate the browser-visible marketplace over public HTTPS;
6. configure Podium7 GitHub Environment `bpt2-staging`;
7. execute Podium7 external staging acceptance against the deployed BPT2.

## Blockers

| ID | Blocker | Evidence | Disposition |
| --- | --- | --- | --- |
| BR-02 | main integration policy is still tracked by #160 | repository administration | keep PR-based integration |
| BR-03 | **Resolved** — Podium7 integration certification | hosted BPT2 + cross-repo E2E PASS | no integration blocker remains |
| BR-04 | **Resolved** — GitHub Pages isolated probe | #247 + Pages run `37156941398` + owner browser evidence | static-surface experiment complete |
| BR-05 | external hosted staging resources are not provisioned | #284 | requires a connected/authorized hosting provider account |
| BR-06 | Podium7 GitHub-hosted runners again fail pre-step | Podium7 #358; PR #357 jobs repeatedly report `steps:null` | external CI allocation blocker; do not infer code failure |

## Repository-topology state

- BPT2 backend + `public-web`: ADR 0012 remains `KEEP_MONOREPO`.
- Podium7 ↔ BPT2 repo colocation remains a separate question.
- Restored reassessment result remains `INSUFFICIENT_EVIDENCE`; no migration is authorized.
- Keeping backend/frontend in one repository does not require one deployment unit; #283 packages API and public web independently.

## Canonical links

- [docs/PRODUCT.md](../PRODUCT.md)
- [docs/QUALITY.md](../QUALITY.md)
- [docs/LOCAL-DEVELOPMENT.md](../LOCAL-DEVELOPMENT.md)
- [ADR 0012 — Repository topology](../adr/0012-repository-topology.md)
- [Plan 0072](../exec-plans/completed/0072-podium-catalog-feed-http-v1.md)
- [Podium7/BPT2 topology reassessment](../audits/2026-09-16-podium7-bpt2-topology-reassessment.md)
- [Staging packaging](../../deploy/staging/README.md)

## Resume rule

Refresh live GitHub state first.

Do not reopen the Pages probe: it is complete.

Resume with issue #284. Deploy the packaged API + web only into a disposable staging database until durable production migration authority exists. After a real BPT2 staging HTTPS origin exists, run Podium7 PR #357 / the external staging acceptance workflow, subject to the runner blocker tracked in Podium7 #358.
