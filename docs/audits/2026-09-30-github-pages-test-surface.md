# GitHub Pages test-surface assessment — 2026-09-30

Status: **EMPIRICAL PROBE PREPARED / PUBLICATION SETTING PENDING**

## Question

Can GitHub Pages replace the currently blocked GitHub-hosted CI/runtime path for Podium7 → BPT2 integration testing, or provide a useful narrower test surface?

## Current evidence

### Hosted runner state

On 2026-09-30 both the historical integration heads and the current-main integration PRs were exercised again.

Observed on current-main candidates:

- BPT2 focused Podium Catalog Feed job was created and completed with failure before repository execution;
- Podium7 `tests` and `minimum-python` jobs did the same;
- job step records are absent (`steps: null`);
- therefore no current hosted code PASS or code FAIL can be inferred.

### Pages service boundary

GitHub Pages is a static hosting surface for HTML/CSS/JavaScript/static files. It does not provide the .NET host, Python process, PostgreSQL service, or privileged server-side secret storage required by the real Podium7 → BPT2 feed E2E.

Branch-source Pages deployment is also represented by a Pages workflow run on GitHub. Therefore Pages is not assumed to bypass the current runner/account problem until a real Pages deployment executes.

## Safe empirical probe

An isolated `gh-pages` branch was created with only:

- `index.html`;
- `probe.json`;
- `.nojekyll`.

The branch intentionally excludes the private repository tree, credentials, test fixtures, internal docs and application source.

Probe contract: `bpt2.github-pages-static-probe.v1`.

The page tests only:

1. static HTML delivery;
2. browser JavaScript execution;
3. same-origin fetch of a static JSON file.

It explicitly does **not** test:

- BPT2 .NET runtime;
- PostgreSQL;
- Podium7 Python runtime;
- authenticated Podium feed transport;
- replay/redirect persistence;
- production behavior.

## Security boundary

Do not place `BPT2_ACCESS_TOKEN`, admin credentials, provider secrets, private artifacts or sensitive fixtures in Pages/JavaScript.

The current feed route requires a privileged bearer credential. Browser-side Pages execution is therefore not an authorized driver for that route.

## Empirical hypotheses

| Hypothesis | Current result |
| --- | --- |
| Pages can host the full Podium7 → BPT2 E2E | **REJECTED by service boundary** |
| Pages can replace the .NET/PostgreSQL test host | **REJECTED** |
| Pages can safely drive the privileged feed with a bearer token | **REJECTED** |
| Pages can host static/browser probes and retained non-sensitive reports | **SUPPORTED IN PRINCIPLE; publication not yet observed** |
| Branch-source Pages bypasses the current Actions runner problem | **UNPROVEN**; GitHub still represents Pages deployment as a workflow |
| A minimal isolated Pages branch avoids publishing private repo content | **ENCODED**; current `gh-pages` tree contains only the three probe files |

## Publication acceptance

Pages becomes empirically useful only if all of the following are observed:

1. repository Pages source is configured to `gh-pages` root;
2. a real Pages deployment completes;
3. the published page returns HTTP 200;
4. JavaScript reports `PASS`;
5. same-origin `probe.json` fetch reports `PASS`;
6. no private repository content is reachable through the published site;
7. no credential or privileged integration request is introduced.

## Disposition

Use GitHub Pages, if publication succeeds, as a **static test/report surface only**.

Do not use it as a substitute for the required integration certification:

`Podium7 publisher -> authenticated HTTP -> BPT2 Ingestion -> PostgreSQL -> replay/redirect assertions`.

That path still requires a real backend/runtime environment.
