#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

EXPECTED_BPT2_HEAD = "cf08bebae8efdf1904f25355c540ca63478b6573"
EXPECTED_PODIUM_HEAD = "939f0452a9c6d3558e2951a48fe8291796645c33"
EXPECTED_CLASSES = ("podium_only", "bpt2_only", "shared_integration")
EXPECTED_ROUTING = {
    "podium_only": {"podium": True, "bpt2": False, "e2e": False},
    "bpt2_only": {"podium": False, "bpt2": True, "e2e": False},
    "shared_integration": {"podium": True, "bpt2": True, "e2e": True},
}


def load_json(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception as exc:
        raise SystemExit(f"invalid JSON {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise SystemExit(f"artifact root must be an object: {path}")
    return value


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def validate_main(payload: dict, pairs: int) -> None:
    require(payload.get("schema") == "bpt2.podium7-topology-rehearsal.v1", "unexpected rehearsal schema")
    require(payload.get("heads") == {"bpt2": EXPECTED_BPT2_HEAD, "podium7": EXPECTED_PODIUM_HEAD}, "rehearsal heads do not match frozen heads")
    require(payload.get("e2e_enabled") is True, "rehearsal was not executed with real E2E enabled")
    require(payload.get("pairs_per_class") == pairs, f"expected {pairs} pairs per class")

    observations = payload.get("observations")
    require(isinstance(observations, list), "observations must be a list")
    require(len(observations) == pairs * len(EXPECTED_CLASSES), "unexpected observation count")

    seen: set[tuple[str, int]] = set()
    for row in observations:
        require(isinstance(row, dict), "observation must be an object")
        change_class = row.get("change_class")
        pair = row.get("pair")
        require(change_class in EXPECTED_CLASSES, f"unexpected change class: {change_class}")
        require(isinstance(pair, int) and 1 <= pair <= pairs, f"invalid pair index: {pair}")
        require((change_class, pair) not in seen, f"duplicate observation: {change_class}/{pair}")
        seen.add((change_class, pair))
        require(row.get("valid") is True, f"invalid pair: {change_class}/{pair}")

        for treatment in ("split", "monorepo"):
            sample = row.get(treatment)
            require(isinstance(sample, dict), f"missing {treatment} sample for {change_class}/{pair}")
            require(sample.get("pass") is True, f"{treatment} failed for {change_class}/{pair}")
            touched = sample.get("touched_paths")
            require(isinstance(touched, list) and touched, f"missing touched_paths for {treatment} {change_class}/{pair}")
            derived = sample.get("derived_routing")
            require(derived == EXPECTED_ROUTING[change_class], f"derived routing mismatch for {treatment} {change_class}/{pair}: {derived}")
            execution = sample.get("execution")
            require(isinstance(execution, dict) and execution.get("pass") is True, f"execution failed for {treatment} {change_class}/{pair}")

    summary = payload.get("summary")
    require(isinstance(summary, dict), "summary must be an object")
    for change_class in EXPECTED_CLASSES:
        item = summary.get(change_class)
        require(isinstance(item, dict), f"missing summary for {change_class}")
        require(item.get("valid_pairs") == pairs, f"{change_class} does not have {pairs}/{pairs} valid pairs")
        delta = item.get("monorepo_vs_split_delta_pct")
        require(isinstance(delta, (int, float)), f"missing timing delta for {change_class}")
        require(item.get("temporal_materiality_threshold_pct") == 20.0, "timing materiality threshold changed")


def validate_bootstrap(payload: dict) -> None:
    require(payload.get("schema") == "bpt2.podium7-topology-bootstrap.v1", "unexpected bootstrap schema")
    require(payload.get("heads") == {"bpt2": EXPECTED_BPT2_HEAD, "podium7": EXPECTED_PODIUM_HEAD}, "bootstrap heads do not match frozen heads")
    require(payload.get("migrations_source") == "disposable detached worktree", "migrations were not isolated from measured checkout")
    require(payload.get("measured_checkouts_clean") is True, "measured checkouts were not retained clean")
    require(payload.get("excluded_from_paired_harness_timing") is True, "bootstrap timing was not separated from paired measurements")
    timings = payload.get("timings_s")
    require(isinstance(timings, dict), "bootstrap timings missing")
    for key in ("postgres_start_s", "migrations_s", "host_build_s", "host_ready_s", "total_s"):
        require(isinstance(timings.get(key), (int, float)) and timings[key] >= 0, f"invalid bootstrap timing: {key}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate retained Podium7/BPT2 topology rehearsal artifacts")
    parser.add_argument("artifact", type=Path)
    parser.add_argument("--bootstrap", type=Path, required=True)
    parser.add_argument("--pairs", type=int, default=3)
    args = parser.parse_args()

    validate_main(load_json(args.artifact), args.pairs)
    validate_bootstrap(load_json(args.bootstrap))
    print("PODIUM7_BPT2_TOPOLOGY_ARTIFACT: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
