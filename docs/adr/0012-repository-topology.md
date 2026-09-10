# ADR 0012 — Repository topology

Status: **Accepted**

Decision: **KEEP_MONOREPO** for the current BPT2 repository topology.

This ADR does **not** claim that monorepos are universally superior, nor that BPT2 must deploy backend and frontend atomically. It records the least-change decision supported by the completed BPT2 evidence series 0062–0070.

## Context

BPT2 currently keeps the ABP backend and `public-web` Next.js application in one polyglot repository. A controlled research series evaluated whether splitting them into independent repositories would produce a material engineering advantage.

The decision criterion is asymmetric by design: changing repository topology introduces migration and ongoing coordination mechanisms, so a split requires demonstrated benefit sufficient to justify that change. Absence of such benefit is not proof of monorepo superiority.

## Evidence matrix

| Dimension | Evidence | Current interpretation |
| --- | --- | --- |
| Historical coupling | Plan 0062: 49 product commits; 13 cross-boundary = 26.53% | Non-trivial cross-boundary change population |
| Direct source dependency | Plan 0062: zero direct frontend/backend path references | Physical separation is not blocked by direct source imports |
| Split coordination | Plan 0063: cross-boundary min integration/revert transactions doubled; contract/client sync candidates 12/13; shared/control-plane paths 13/13 | Split introduces explicit coordination boundaries for historically coupled work |
| Build isolation | Plan 0064: backend and frontend snapshots independently build/check; frontend needed zero copied shared/control-plane files | Split is mechanically feasible |
| Contract drift | Plan 0065: 12/12 contract-sync candidates changed actual contract bytes and would stale the experimental lock | Independent repositories require a real contract publication/versioning discipline |
| CI compute | Plan 0066: split compute +0.96% vs combined | No material compute penalty or benefit demonstrated |
| CI critical path | Plan 0066: modeled split critical path -16.73% | Potential parallelism benefit remained below the preregistered 20% relevance threshold |
| Raw PR lead time | Plan 0067: cross-boundary median 1.84x single-boundary; Cliff's delta 0.343 | Raw higher association observed |
| Size-adjusted PR lead time | Plan 0068: matched ratio 1.38x; delta 0.236; adjusted cross-boundary coefficient not positive/significant | Raw lead-time signal is not robust enough to use as topology-selection evidence |
| Same-change rehearsal | Plan 0069: split compute +8.44%; modeled critical path -11.71%; combined 1 checkpoint vs split 3 | No material temporal difference; split adds explicit integration boundaries in this workload |
| Compatible rollout/rollback | Plan 0070: split path valid without bridge, but needs two transitions per direction and at least one handoff; combined deployment-unit treatment needs one transition | Independent deployment is viable for compatible changes with additional explicit transitions |
| Breaking rollout/rollback | Plan 0070: no valid direct split path; bridge/coordinated rollout required; bridge path needs three transitions per direction | Breaking independent rollout requires compatibility machinery or coordination in this workload |

## Decision

Keep the backend and `public-web` in the **same repository** for the current BPT2 stage.

Rationale:

1. A split is technically feasible, so this is not a feasibility constraint.
2. The studies did not demonstrate a material CI/critical-path advantage for split under preregistered thresholds.
3. The apparent raw lead-time disadvantage of cross-boundary work attenuated after size/scope adjustment and therefore does not justify a topology migration.
4. BPT2 history contains meaningful contract and cross-boundary coupling, and controlled split rehearsals require additional integration/deployment boundaries.
5. Breaking independent rollout requires bridge/versioning or coordinated deployment in the rehearsed workload.
6. With no demonstrated compensating benefit, introducing a repository migration and permanent contract-distribution workflow is not justified by the measured evidence.

This is a **decision under current evidence**, not a proof that the monorepo topology is intrinsically faster, cheaper, safer, or more maintainable.

## Deployment consequence

Repository topology and deployment topology remain separate decisions.

Keeping one repository does not require one deployment unit. Backend and frontend may still be deployed independently if operational requirements justify it, but independent deployment must preserve contract compatibility using explicit versioning/compatibility controls.

## Reopen triggers

Re-evaluate this ADR when at least one of the following becomes true and can be measured:

- organizational ownership or access control requires repository-level isolation;
- real two-runner/two-repository CI demonstrates >=20% critical-path benefit on representative BPT2 changes;
- independent release cadence becomes a product/operations requirement and contract publication/versioning is implemented;
- measured maintenance or developer-flow data demonstrates material cost caused by the combined repository after controlling for change size/scope;
- repository scale causes measurable tooling, checkout, CI, or governance degradation;
- security/compliance requires a repository boundary.

A reopen trigger starts a new evidence cycle; it does not automatically imply migration.

## Consequences

### Positive

- no repository migration is introduced without a demonstrated benefit;
- atomic cross-boundary integration remains available;
- existing CI/path scoping remains usable;
- contract coupling can continue to be improved without first creating a package/distribution boundary.

### Costs / limitations

- repository-level access cannot independently isolate frontend/backend;
- repo growth remains shared;
- teams must continue maintaining path-scoped CI and module boundaries;
- independent deployment still requires explicit compatibility discipline even though source integration is combined.

## Evidence limits

Plans 0066, 0069 and 0070 used controlled/rehearsed environments rather than production deployment infrastructure. Plan 0067/0068 are observational historical analyses. No study measured human productivity, migration labor, or production incident rate. Those claims remain out of scope.
