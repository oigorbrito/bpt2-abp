#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from statistics import median

EXPECTED_BPT2_HEAD = "cf08bebae8efdf1904f25355c540ca63478b6573"
EXPECTED_PODIUM_HEAD = "939f0452a9c6d3558e2951a48fe8291796645c33"

BPT2_PROBE = Path("tests/BomPraTi.PodiumCatalogFeedFixture/Program.cs")
PODIUM_PROBE = Path("tests/test_bpt2_adapter.py")
BPT2_FIXTURE = Path("tests/BomPraTi.PodiumCatalogFeedFixture/BomPraTi.PodiumCatalogFeedFixture.csproj")

ROUTING = {
    "podium_only": {"podium": True, "bpt2": False, "e2e": False},
    "bpt2_only": {"podium": False, "bpt2": True, "e2e": False},
    "shared_integration": {"podium": True, "bpt2": True, "e2e": True},
}


def git_head(root: Path) -> str:
    return subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()


def timed(cmd: list[str], cwd: Path, env: dict[str, str] | None = None) -> dict[str, object]:
    started = time.monotonic()
    proc = subprocess.run(cmd, cwd=cwd, env=env, check=False)
    return {"seconds": time.monotonic() - started, "returncode": proc.returncode, "pass": proc.returncode == 0}


def copy_repo(src: Path, dst: Path) -> float:
    started = time.monotonic()
    shutil.copytree(
        src,
        dst,
        ignore=shutil.ignore_patterns(
            ".git", "artifacts", "node_modules", ".next", "bin", "obj", ".venv", "__pycache__"
        ),
    )
    return time.monotonic() - started


def append_marker(path: Path, marker: str) -> float:
    if not path.exists():
        raise RuntimeError(f"rehearsal probe path missing: {path}")
    started = time.monotonic()
    with path.open("a", encoding="utf-8") as handle:
        handle.write(marker)
    return time.monotonic() - started


def apply_change(change_class: str, bpt2: Path, podium: Path) -> dict[str, object]:
    out: dict[str, object] = {"class": change_class, "bpt2_patch_s": 0.0, "podium_patch_s": 0.0}
    if change_class in {"podium_only", "shared_integration"}:
        out["podium_patch_s"] = append_marker(
            podium / PODIUM_PROBE,
            "\n# topology-rehearsal ephemeral marker; source tree is disposable\n",
        )
    if change_class in {"bpt2_only", "shared_integration"}:
        out["bpt2_patch_s"] = append_marker(
            bpt2 / BPT2_PROBE,
            "\n// topology-rehearsal ephemeral marker; source tree is disposable\n",
        )
    return out


def run_class(
    change_class: str,
    bpt2: Path,
    podium: Path,
    e2e_enabled: bool,
    e2e_env: dict[str, str],
) -> dict[str, object]:
    route = ROUTING[change_class]
    result: dict[str, object] = {
        "class": change_class,
        "routing": route,
        "podium": None,
        "bpt2": None,
        "e2e": None,
    }

    if route["podium"]:
        result["podium"] = timed(
            [sys.executable, "-m", "unittest", "tests.test_bpt2_adapter", "-v"],
            podium,
        )

    if route["bpt2"]:
        result["bpt2"] = timed(
            ["dotnet", "build", str(BPT2_FIXTURE), "--configuration", "Release", "--nologo"],
            bpt2,
        )

    if route["e2e"]:
        if e2e_enabled:
            env = os.environ.copy()
            env.update(e2e_env)
            result["e2e"] = timed([sys.executable, "scripts/bpt2_http_e2e.py"], podium, env=env)
        else:
            result["e2e"] = {"seconds": None, "returncode": None, "pass": False, "skipped": True}

    stages = [value for key, value in result.items() if key in {"podium", "bpt2", "e2e"} and isinstance(value, dict)]
    seconds = [float(stage["seconds"]) for stage in stages if stage.get("seconds") is not None]
    result["compute_s"] = sum(seconds)
    result["pass"] = all(bool(stage.get("pass")) for stage in stages) if stages else False
    return result


def treatment(
    name: str,
    source_bpt2: Path,
    source_podium: Path,
    rep: int,
    change_class: str,
    e2e_enabled: bool,
    e2e_env: dict[str, str],
) -> dict[str, object]:
    with tempfile.TemporaryDirectory(prefix=f"podium-bpt2-{name}-{change_class}-{rep}-") as td:
        base = Path(td)
        if name == "split":
            bpt2 = base / "bpt2-repo"
            podium = base / "podium7-repo"
        elif name == "monorepo":
            workspace = base / "workspace"
            workspace.mkdir()
            bpt2 = workspace / "bpt2"
            podium = workspace / "podium7"
        else:
            raise ValueError(name)

        bpt2_copy_s = copy_repo(source_bpt2, bpt2)
        podium_copy_s = copy_repo(source_podium, podium)
        patch = apply_change(change_class, bpt2, podium)
        executed = run_class(change_class, bpt2, podium, e2e_enabled=e2e_enabled, e2e_env=e2e_env)

        structural = {
            "integration_transactions": 1 if name == "monorepo" else (2 if change_class == "shared_integration" else 1),
            "handoffs": 0 if name == "monorepo" else (1 if change_class == "shared_integration" else 0),
            "checkpoints": 1 if name == "monorepo" else (3 if change_class == "shared_integration" else 1),
            "ci_surfaces": sum(1 for enabled in ROUTING[change_class].values() if enabled),
            "rollback_units": 1 if name == "monorepo" else (2 if change_class == "shared_integration" else 1),
        }
        materialize_s = bpt2_copy_s + podium_copy_s
        patch_s = float(patch["bpt2_patch_s"]) + float(patch["podium_patch_s"])
        return {
            "name": name,
            "change_class": change_class,
            "materialize_s": materialize_s,
            "bpt2_materialize_s": bpt2_copy_s,
            "podium_materialize_s": podium_copy_s,
            "patch_s": patch_s,
            "execution": executed,
            "compute_s": materialize_s + patch_s + float(executed["compute_s"]),
            "structural": structural,
            "pass": bool(executed["pass"]),
        }


def summarize(pairs: list[dict[str, object]], change_class: str) -> dict[str, object]:
    rows = [row for row in pairs if row["change_class"] == change_class and row["valid"]]
    summary: dict[str, object] = {"valid_pairs": len(rows)}
    if not rows:
        return summary
    split = median(float(row["split"]["compute_s"]) for row in rows)
    mono = median(float(row["monorepo"]["compute_s"]) for row in rows)
    summary.update(
        {
            "split_compute_median_s": split,
            "monorepo_compute_median_s": mono,
            "monorepo_vs_split_delta_pct": ((mono / split) - 1.0) * 100.0 if split else None,
            "temporal_materiality_threshold_pct": 20.0,
            "temporal_difference_material": abs(((mono / split) - 1.0) * 100.0) >= 20.0 if split else None,
            "split_structural": rows[0]["split"]["structural"],
            "monorepo_structural": rows[0]["monorepo"]["structural"],
        }
    )
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Controlled Podium7 ↔ BPT2 split-vs-monorepo rehearsal")
    parser.add_argument("--bpt2-root", type=Path, required=True)
    parser.add_argument("--podium-root", type=Path, required=True)
    parser.add_argument("--pairs", type=int, default=3)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--allow-head-drift", action="store_true")
    parser.add_argument("--e2e", action="store_true", help="Run scripts/bpt2_http_e2e.py for shared integration. Requires live BPT2 host and env credentials.")
    args = parser.parse_args()

    bpt2_root = args.bpt2_root.resolve()
    podium_root = args.podium_root.resolve()
    bpt2_head = git_head(bpt2_root)
    podium_head = git_head(podium_root)

    if not args.allow_head_drift:
        if bpt2_head != EXPECTED_BPT2_HEAD:
            raise SystemExit(f"BPT2 head drift: expected {EXPECTED_BPT2_HEAD}, got {bpt2_head}")
        if podium_head != EXPECTED_PODIUM_HEAD:
            raise SystemExit(f"Podium7 head drift: expected {EXPECTED_PODIUM_HEAD}, got {podium_head}")

    e2e_env = {}
    if args.e2e:
        for key in ("BPT2_BASE_URL", "BPT2_ACCESS_TOKEN"):
            value = os.getenv(key)
            if not value:
                raise SystemExit(f"--e2e requires {key}")
            e2e_env[key] = value

    observations: list[dict[str, object]] = []
    classes = ("podium_only", "bpt2_only", "shared_integration")
    for change_class in classes:
        for rep in range(1, args.pairs + 1):
            order = ["split", "monorepo"] if rep % 2 else ["monorepo", "split"]
            row: dict[str, object] = {"change_class": change_class, "pair": rep, "order": order}
            for name in order:
                row[name] = treatment(
                    name,
                    bpt2_root,
                    podium_root,
                    rep,
                    change_class,
                    e2e_enabled=args.e2e,
                    e2e_env=e2e_env,
                )
            row["valid"] = bool(row["split"]["pass"] and row["monorepo"]["pass"])
            observations.append(row)

    payload = {
        "schema": "bpt2.podium7-topology-rehearsal.v1",
        "heads": {"bpt2": bpt2_head, "podium7": podium_head},
        "expected_heads": {"bpt2": EXPECTED_BPT2_HEAD, "podium7": EXPECTED_PODIUM_HEAD},
        "pairs_per_class": args.pairs,
        "e2e_enabled": args.e2e,
        "routing": ROUTING,
        "observations": observations,
        "summary": {change_class: summarize(observations, change_class) for change_class in classes},
        "interpretation_rules": {
            "timing_materiality_pct": 20.0,
            "structural_counts_are_not_developer_hours": True,
            "monorepo_does_not_imply_shared_database_or_runtime": True,
            "language_convergence_out_of_scope": True,
        },
        "threats_to_validity": [
            "local/controlled execution is not hosted GitHub Actions timing",
            "filesystem and package caches can affect timings",
            "one integration workload does not establish future change distribution",
            "same-repository source colocation does not remove deployment/version compatibility",
            "ephemeral marker changes measure routing and orchestration rather than product behavior",
            "E2E requires an already-running BPT2 host and injected credential; host bootstrap time is not included by this harness",
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(payload["summary"], indent=2, sort_keys=True))

    required = args.pairs * len(classes)
    valid = sum(1 for row in observations if row["valid"])
    if valid != required:
        return 2
    if args.e2e is False:
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
