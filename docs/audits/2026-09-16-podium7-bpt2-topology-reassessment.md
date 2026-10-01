# Podium7 ↔ BPT2 repository topology reassessment — 2026-09-16

Status: **completed evidence update**

## Question

Should `oigorbrito/podium7` and `oigorbrito/bpt2-abp` remain in separate repositories, or be colocated in one polyglot monorepo while preserving their existing bounded-context/runtime/data ownership boundaries?

This study does **not** evaluate full runtime/language unification as the same decision.

## Evidence window

Current-history review used the recent integrated work from 2026-08-27 through 2026-09-16, plus the already-completed BPT2 repository-topology evidence series (Plans 0062–0070 / ADR 0012) for controlled monorepo-vs-split mechanics.

## Observed cross-repository coordination

### 1. Initial structural feed

BPT2 PR #90 integrated the Podium Catalog JSON `2.0` feed using the already-published Podium contract. The BPT2 side added projection, replay/idempotency, redirects and a focused gate. This was primarily a consumer-side implementation against a frozen producer contract; it did not require a simultaneous Podium implementation change.

### 2. Technical identity fields

Podium PR #176 measured consumer-visible coverage of `powertrain`, `transmission`, and `body_style`. BPT2 later projected those fields in PR #127. This was coordinated producer-evidence -> consumer-projection work, but not one atomic producer+consumer implementation change.

### 3. Quantitative enrichment

Podium PR #229 published the separate `podium7.quantitative-enrichment.v1` contract. BPT2 later consumed the pinned producer contract in PR #131 for a consumer/comparability benchmark. Again, this was staged producer publication followed by consumer adoption rather than one simultaneous breaking change.

### 4. External HTTP transport

BPT2 PR #204 and Podium7 PR #319 are the first clear recent same-feature producer+consumer implementation pair that required concurrent changes in both repositories:

- explicit BPT2 HTTP boundary;
- Podium publisher/transport targeting that route;
- two branches / two PRs / two exact heads;
- independent review and CI governance;
- real cross-repository E2E `Podium7 publisher -> HTTP -> BPT2 -> PostgreSQL`;
- coordinated auth, retry, replay, redirects and contract-failure semantics.

This is material new evidence compared with the August deferral, because the coordination cost is now observed rather than hypothetical.

## Comparison against a polyglot monorepo

Prior controlled BPT2 topology work already established that polyglot/path-scoped CI is mechanically feasible and that keeping code in one repository does not require atomic deployment, shared database or collapsed module ownership.

For the Podium7+BPT2 case, a polyglot monorepo could reduce coordination transactions for same-feature changes such as #204/#319 by enabling one branch/PR and one checkout/E2E surface. However, the current history does not yet show that such simultaneous cross-repository changes are frequent enough to establish a material medium/long-term maintenance advantage after accounting for migration work and permanent monorepo governance.

## Evidence table

| Dimension | Two repositories — observed | Polyglot monorepo — supported inference | Current interpretation |
| --- | --- | --- | --- |
| Cross-repo change frequency | Several staged producer/consumer slices; one clear recent simultaneous implementation pair (#204/#319) | Same-feature changes could be atomic in one PR | Benefit exists for #204/#319, frequency not yet high enough to quantify long-term materiality |
| Coordination transactions | #204/#319 requires two branches, two PRs, two heads and independent governance | One branch/PR/checkpoint is feasible | Clear local reduction for simultaneous changes |
| Contract versioning | Already explicit and effective across repos | Still required even in one repo because runtime/deployment independence remains | Repository colocation does not remove compatibility discipline |
| Version-skew exposure | Present between producer/consumer releases, but frozen contracts/pinned revisions reduce risk | Atomic source changes could reduce source-level skew; deployment skew still remains | Moderate possible benefit, not eliminated by monorepo |
| E2E setup | Requires two checkouts/repositories and cross-repo orchestration | One checkout can host producer+consumer E2E | Clear developer-flow simplification for integration work |
| CI isolation | Separate by repository today | Prior path-scoped CI evidence shows independent Python/.NET surfaces are feasible | No feasibility blocker either way |
| CI compute/critical path | Current hosted CI blocked by account-level runner issue, so no current real two-repo timing sample | Prior BPT2 experiments did not show a material split/combined timing advantage under preregistered thresholds | Insufficient current evidence for CI-based migration decision |
| Governance/harness duplication | Two repository trackers, harnesses, PR/review surfaces | Some shared control-plane/docs could consolidate | Potential benefit, not yet measured as time/cost |
| Domain/runtime/data ownership | Strongly separated today | Can remain equally separated in one repo | Neutral; not a reason against monorepo |
| Migration cost | Zero if retained | History import, root-layout, workflow/harness/docs consolidation, ownership rules, required-check strategy, path fixes and rollback plan | Real one-time + ongoing cost; currently not offset by measured recurring savings |
| Language convergence | Not required | Not required | Separate decision; no rewrite authorized |

## Decision

`INSUFFICIENT_EVIDENCE`

There is now enough evidence to reject the earlier claim that cross-repository coordination cost is purely hypothetical. The #204/#319 slice demonstrates a real maintenance/coordination cost and shows a concrete way a polyglot monorepo could simplify one class of work.

However, the observed history still shows that many Podium/BPT2 interactions are staged through stable published contracts rather than frequent simultaneous edits. One expensive same-feature pair is not sufficient to establish that a repository migration plus permanent monorepo governance will reduce total medium/long-term maintenance cost.

Therefore:

- do **not** migrate repositories yet solely from the current sample;
- do **not** interpret this as `KEEP_TWO_REPOS` permanently;
- continue collecting true simultaneous producer+consumer changes and measured coordination cost;
- reopen for migration when repeated evidence shows the recurring savings exceed migration/governance cost;
- if migration is later selected, first use a **polyglot monorepo with zero behavioral rewrite** and preserve existing bounded contexts, runtimes and data ownership;
- evaluate Python -> .NET convergence only as a separate parity-gated study.

## Revisit threshold

A future migration study should become decision-capable when at least one of these is observed with reproducible data:

1. repeated simultaneous producer+consumer implementation slices, not isolated cases;
2. material measured time/steps lost to two-repo coordination, version skew or duplicated governance;
3. representative same-change rehearsal showing monorepo developer-flow/CI benefit large enough to offset migration cost;
4. repository/tooling/ownership/compliance constraints that materially alter the cost model.
