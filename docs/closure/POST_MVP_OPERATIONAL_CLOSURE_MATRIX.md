# POST_MVP_OPERATIONAL_CLOSURE_MATRIX

Status: canonical closure matrix for `POST_MVP_OPERATIONAL_BASELINE_V1`

This matrix is the work-selection authority for the current baseline phase. It does not replace `docs/PRODUCT.md`; it traces baseline concerns to disposition.

## Reading rules

- `BASELINE_CLOSURE` means the item still blocks closure of the current phase.
- `POST_BASELINE` means the capability remains a possible future expansion, but it is not required to close the current baseline and may have a closed historical boundary rather than active authorized work.
- `EXTERNAL` means the item depends on provider, license, credential, deployment, or another outside authority.
- `ADMIN` means the item depends on repository/cloud/production administration.
- `PRODUCT_DECISION` means the item needs a bounded product call before work can proceed.
- `RESEARCH` means the item needs more evidence before it can be placed in baseline closure or expansion.

## Matrix

| ID | Area | Baseline requirement / capability | Current state | Evidence | Gap | Authority | Next action |
| -- | ---- | --------------------------------- | ------------- | -------- | --- | --------- | ----------- |
| BPT2-001 | Documentary authority | Single current baseline with explicit control plane | PASS | `docs/PRODUCT.md`, `docs/QUALITY.md`, `docs/LOCAL-DEVELOPMENT.md`, this baseline | None for current phase | `../PRODUCT.md`, `../QUALITY.md`, `../LOCAL-DEVELOPMENT.md`, `../baselines/POST_MVP_OPERATIONAL_BASELINE_V1.md` | Maintain only via material re-baseline |
| BPT2-002 | Core seller journey | Seller registration/login, listing lifecycle, photos, lead handling | PASS | Product authority and merged gates already recorded | None for current phase | `../PRODUCT.md` | Reopen only for new product gap |
| BPT2-003 | Core buyer journey | Discovery, detail, WhatsApp, favorites, saved searches, reports | PASS | Product authority and merged gates already recorded | None for current phase | `../PRODUCT.md` | Reopen only for new product gap |
| BPT2-004 | Catalog / vehicle identity | Canonical catalog and vehicle-hub authority | PASS | Product authority + ADR set | None for current phase | `../PRODUCT.md`, `../adr/` | Reopen only for new product gap |
| BPT2-005 | Saved-search automation | Claim/retry runner and email engineering boundary | PASS | Product authority + audit set | External activation remains separate | `../PRODUCT.md`, `../audits/` | Treat external activation as deployment dependency |
| BPT2-006 | Workflow concurrency | Superseded PR runs are isolated/cancelled correctly | PASS | `../audits/2026-08-30-workflow-concurrency-probe.md` and merged PR #172 | None | `../audits/2026-08-30-workflow-concurrency-probe.md` | Keep as repo-internal guard |
| BPT2-007 | Main integration policy | Enforce branch-protection / ruleset policy | ADMIN | Open issue #160, revalidated 2026-09-10 | Requires repository administration | Issue #160 | Resolve only with admin authority |
| BPT2-008 | Recommendations | Ground truth before similar/upgrade experiments | POST_BASELINE | Closed issue #113 preserves the evidence boundary | Relevance ground truth/directional objective absent; no autonomous recommender work authorized | Closed issue #113 (historical authority) | Reopen only when exposure-aware behavioral evidence or scoped reviewed qrels/product objective exists |
| BPT2-009 | Market intelligence | Source authority and stable binding | POST_BASELINE | Closed issue #114 preserves the evidence boundary | Concrete product quantity and authorized/licensed provider data contract absent | Closed issue #114 (historical authority) | Reopen only when product quantity and authorized provider/source contract are explicit |
| BPT2-010 | Trust / inspection | Vehicle history and inspection trust contracts | POST_BASELINE | Closed issue #115 preserves the evidence boundary | Provider authority, physical Listing-instance identity, privacy/purpose and assertion semantics absent | Closed issue #115 (historical authority) | Reopen only when provider/identity/privacy contracts exist |
| BPT2-011 | Geographic radius | True radius semantics beyond municipality identity | POST_BASELINE | Closed issue #116 preserves the evidence boundary; municipality identity already delivered | Listing physical-point authority/privacy contract absent; municipality centroid and routing remain distinct semantics | Closed issue #116 (historical authority) | Reopen only when Listing-point semantics/privacy are explicitly authorized |
| BPT2-012 | Operational readiness | Fresh build, migrations, PostgreSQL-backed runtime, and documented gate flow | PASS | `../LOCAL-DEVELOPMENT.md`, `../QUALITY.md`, fresh-migration evidence, and PR #185 exact-head run `33761113685` on `66fb58623ef9b8fb2ee8f81b414dd885957bb3ad` | None for the measured clean PostgreSQL + API + production `public-web` SSR/HTTP boundary | `../LOCAL-DEVELOPMENT.md`, `.github/workflows/listing-decision-support-runtime-gate.yml` | Keep the reproducible remote runtime gate as operational evidence; define a separate target before claiming browser-engine/hydration coverage |

## Resolution summary

- `BASELINE_CLOSURE`: none currently require new engineering work.
- `POST_BASELINE`: #113, #114, #115 and #116 are **closed historical evidence boundaries**, not open autonomous implementation work. Their capabilities may be reopened only when the authority/evidence preconditions recorded in those issues exist.
- `ADMIN`: #160 is the only open issue and remains repository-administration work.
- `EXTERNAL`: none currently required to close the baseline.
- Current autonomous repo-internal product queue: **none identified by this matrix**.
- Operational readiness has reproducible remote evidence for fresh PostgreSQL + API + production Next.js SSR/HTTP. Browser-engine automation is outside that measured claim unless separately specified.

## Authority

When this matrix conflicts with older audits or planning artifacts, use the current baseline and product/quality authorities first. Historical audits and closed issues remain evidence/boundaries, not current command.
