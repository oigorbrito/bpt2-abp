# Current work

Last verified: **2026-10-03**

Snapshot volatile only.

## Current outcome

- Podium Catalog Feed HTTP V1 is completed and hosted-E2E validated.
- BPT2 #246 / Podium7 #345 are integrated.
- BPT2 run `36865432643` and cross-repo run `36867723586` passed.
- Pages #247 is complete: isolated `gh-pages`, browser JS PASS, same-origin JSON PASS.
- Staging packaging #283 is merged; #286 fixed its workflow concurrency guard.
- Security/accessibility cleanup is merged:
  - #287 protocol-relative `returnTo` hardening;
  - #288 public-web response headers;
  - #289 consolidated accessibility baseline.
- Stale Sentinel/Palette/Bolt drafts were reviewed and closed; branches were preserved.
- **Open BPT2 PRs at handoff: 0.**

## Pages follow-up decision

The Pages experiment is closed and must not be reopened as a probe task.

The current published BPT2 page is intentionally a minimal static capability probe, not the product frontend. Owner-provided browser evidence on 2026-10-03 confirmed:

- `JavaScript: PASS`;
- `Same-origin JSON fetch: PASS`;
- project path `/bpt2-abp/`;
- probe schema `bpt2.github-pages-static-probe.v1`.

Comparison with `oigorbrito/rpy` established the preferred pattern if BPT2 later needs a visual Pages surface:

- use an explicit GitHub Actions Pages workflow;
- build a narrow static artifact from approved frontend assets;
- publish with `upload-pages-artifact` + `deploy-pages`;
- keep backend/API/PostgreSQL/authenticated Podium transport outside Pages;
- do not publish the repository tree and do not rely on Pages for runtime behavior.

For BPT2, a future visual Pages surface should be treated as a separate product/documentation task. Prefer either a deliberately static shell derived from `public-web` or a proven Next.js static export subset; do not assume the full Next.js application is Pages-compatible.

This follow-up is **not a blocker for #284** and does not change the backend + `public-web` monorepo decision.

## Remaining work

### #284 — public hosted staging acceptance

Next deployment target.

```text
Browser -> HTTPS Next.js -> BPT2 API -> disposable PostgreSQL
Podium7 -> HTTPS Catalog Feed -> BPT2 -> disposable PostgreSQL
```

Packaging is ready. External resource creation requires an authorized hosting provider.

Persistent production migration readiness is **not** established; staging DB remains disposable-only.

### #275 — larger-cardinality typo benchmark

Independent product-evidence task, not a staging blocker.

Keep substring search as production control until a frozen larger workload proves a trigram candidate improves relevance without violating false-positive/regression bounds and planner/index constraints.

### #160 — main integration policy

`ADMIN_ONLY`.

Desired outcome: block direct writes to `main`, require PR integration, and avoid required-check rules that deadlock path-filtered PRs.

## Cross-repository staging

Podium7 #357 adds the external BPT2 staging acceptance workflow.

Podium7 #358 tracks the current hosted-runner recurrence: exact-head jobs repeatedly fail with `steps:null` before repository execution.

Do not treat this as a code regression and do not merge #357 on stale PASS.

## Blockers

| ID | State | Disposition |
| --- | --- | --- |
| BR-02 | #160 main policy absent | admin-only |
| BR-03 | integration certification resolved | no blocker |
| BR-04 | Pages #247 resolved | do not reopen |
| BR-05 | #284 staging resources absent | provider/account required |
| BR-06 | Podium7 #358 pre-runner failure | external blocker |
| BR-07 | #275 larger typo evidence absent | independent benchmark |

## Topology

- BPT2 backend + `public-web`: ADR 0012 remains `KEEP_MONOREPO`.
- Podium7 ↔ BPT2 colocation remains `INSUFFICIENT_EVIDENCE`; no migration authorized.
- #283 demonstrates monorepo does not require a single deploy unit.

## Resume order

1. Refresh live PR/issue state across **all authors**.
2. Resume #284 when a hosting provider is connected.
3. After a real BPT2 HTTPS staging origin exists, configure/run Podium7 #357 subject to #358.
4. Treat any visual Pages work as a separate follow-up: use the RPY-style explicit static-artifact workflow and keep backend/runtime out of Pages.
5. Treat #275 independently; require retained larger-cardinality evidence before production search changes.
6. Treat #160 as repository administration only.
7. Do not revive closed cache/performance drafts without current profiling/benchmark evidence.
8. Do not reopen Pages #247.

## Canonical links

- [PRODUCT](../PRODUCT.md)
- [QUALITY](../QUALITY.md)
- [LOCAL DEVELOPMENT](../LOCAL-DEVELOPMENT.md)
- [ADR 0012](../adr/0012-repository-topology.md)
- [Plan 0072](../exec-plans/completed/0072-podium-catalog-feed-http-v1.md)
- [Staging packaging](../../deploy/staging/README.md)
