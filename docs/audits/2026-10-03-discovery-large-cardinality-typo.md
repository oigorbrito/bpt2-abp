# Discovery typo larger-cardinality benchmark — 2026-10-03

Issue: #275

Status: benchmark evidence only. This document does **not** authorize fuzzy search in production, a product cutoff, a ranking fallback, or a production index.

## Frozen experiment

- production control: current normalized substring behavior;
- scorer candidates: `similarity`, `word_similarity`, `strict_word_similarity`;
- frozen positive universe: 8 Vehicles from `benchmarks/discovery_br_v1.json`;
- independently generated negative population: 50,000 deterministic rows;
- total candidate cardinality: 50,008;
- frozen typo probes: the 3 existing typo queries and qrels from the discovery fixture;
- cutoff grid fixed in source before execution: 0.30, 0.40, 0.50, 0.60, 0.70, 0.80;
- exact/presentation regression gate: existing discovery baseline must retain MRR=1, Recall=1 and FP=0 on both Catalog and Public metrics;
- PostgreSQL image: `postgres:18.6-alpine`;
- trigram planner probe: four GIN `gin_trgm_ops` indexes with `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`.

The synthetic negatives are deliberately source-defined and scorer-independent. They are not derived from observed score distributions.

## Initial retained run

Initial exact-head run: `37164260314`.

Artifact:
- ID: `11288965898`;
- name: `discovery-large-cardinality-typo-benchmark`;
- ZIP SHA-256: `383852726cdd341fd7b8102ac7b09f0c373e1d1bdcb32eca040cace1b5f2352f`.

The workflow allocated a real hosted runner and completed build, fresh migration, frozen discovery baseline, large-cardinality benchmark and artifact upload successfully.

Across the three frozen typo probes, all three trigram candidates achieved:

- mean MRR: **1.0000**;
- mean Recall@target-count: **1.0000**;
- total non-targets ahead of first target: **0**.

Cutoff eligibility totals across the four frozen target memberships were:

| Method | 0.30 FP | 0.40 FP | 0.50 FP | 0.60 FP | 0.70 FP | 0.80 target hits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `similarity` | 19 | 2 | 0 | 0 | 0 | 0/4 |
| `strict_word_similarity` | 12,519 | 2 | 2 | 0 | 0 | 0/4 |
| `word_similarity` | 18,833 | 12,503 | 2 | 0 | 0 | 0/4 |

All methods retained all 4 target memberships through cutoff 0.70 in the initial run. At cutoff 0.80, all methods rejected all four targets.

This demonstrates why aggregate ranking quality is insufficient for product cutoff selection: the methods have identical top-rank retrieval metrics here while their low-cutoff false-positive surfaces differ materially.

## Decision boundary

The evidence is sufficient to close the specific cardinality gap identified after the bounded eight-Vehicle experiments, but it is **not** sufficient to choose a production scorer or threshold by itself.

A production change is authorized only in a separate minimal PR if the final retained exact-head run confirms:

1. production substring control still misses the frozen typo target memberships;
2. exact/presentation regression gates remain perfect;
3. at least one predeclared cutoff preserves all frozen typo targets with zero synthetic-negative eligibility;
4. planner evidence is retained and reports whether the trigram indexes are actually used;
5. no threshold is selected post hoc outside the predeclared grid.

Until then:

- `PRODUCTION_FUZZY_SEARCH = NOT_AUTHORIZED`
- `PRODUCT_SCORE_THRESHOLD = UNSET`
- `PRODUCTION_INDEX_SELECTION = UNSET`
