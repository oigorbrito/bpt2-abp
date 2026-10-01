# Current work

Last verified: **2026-10-01**

Snapshot volatile only.

## In flight

- Plan 0072 — Podium Catalog Feed HTTP V1 is **completed and integrated** via PR #246.
- Consumer route: `POST /api/integrations/podium/catalog/v1/vehicles`.
- Podium7 producer counterpart is **completed and integrated** via `oigorbrito/podium7#345`.
- Exact-head BPT2 focused feed gate and Podium7 cross-repository E2E both executed real hosted steps and passed on 2026-10-01.
- Existing BPT2 repository-topology decision remains `KEEP_MONOREPO` for backend + `public-web`; Podium7 ↔ BPT2 repository topology remains a separate question.

## Acceptance target

The exact current-main integration must:

- expose the explicit HTTP route in Swagger;
- reject anonymous access with 401;
- reject authenticated non-admin access with 403;
- return 400 for invalid Catalog JSON 2.0 projection inputs;
- import a valid Podium vehicle into PostgreSQL;
- preserve canonical ID, redirects, replay identity and VehicleId;
- execute the focused in-process fixture plus PostgreSQL-backed HTTP smoke.

## Blockers

| ID | Blocker | Evidence | Disposition |
| --- | --- | --- | --- |
| BR-02 | main integration policy is still tracked by #160 | repository administration | keep PR-based integration |
| BR-03 | **Resolved for Podium7 integration certification** | BPT2 run `36865432643` passed with PostgreSQL + fixture + HTTP smoke; Podium7 run `36867723586` passed real cross-repo HTTP E2E | preserve evidence; no integration blocker remains |
| BR-04 | GitHub Pages cannot host .NET/Python/PostgreSQL and branch publishing still deploys through a Pages workflow | GitHub Pages documentation + empirical runner state | Pages may be tested only as static/browser/report surface, not as replacement for integration runtime |

## GitHub Pages experiment boundary

A static Pages probe may be used to test publication and browser-only checks. It must not contain credentials, bearer tokens, private artifacts, or claim to execute the privileged Podium → BPT2 feed path.

## Canonical links

- [docs/PRODUCT.md](../PRODUCT.md)
- [docs/QUALITY.md](../QUALITY.md)
- [docs/LOCAL-DEVELOPMENT.md](../LOCAL-DEVELOPMENT.md)
- [ADR 0012 — Repository topology](../adr/0012-repository-topology.md)
- [Plan 0072](../exec-plans/completed/0072-podium-catalog-feed-http-v1.md)

## Update rule

Atualize somente quando mudar outcome, acceptance target ou blocker real.
