#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import tempfile
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = Path("modules/catalog/src/BomPraTi.Catalog.Contracts/VehicleRefDto.cs")
CONTRACT_PROJECT = Path("modules/catalog/src/BomPraTi.Catalog.Contracts/BomPraTi.Catalog.Contracts.csproj")
BASE_TAIL = "    string? Transmission,\n    string? BodyStyle);\n"
COMPAT_TAIL = "    string? Transmission,\n    string? BodyStyle,\n    string? TopologyProbeLabel = null);\n"
BREAK_TAIL = "    string? Transmission,\n    string? BodyKind);\n"

CONSUMERS = {
    "compatible": {
        "F0": """export type VehiclePayload = { bodyStyle?: string | null };\nexport const readBody = (v: VehiclePayload) => v.bodyStyle ?? \"unknown\";\n""",
        "F1": """export type VehiclePayload = { bodyStyle?: string | null; topologyProbeLabel?: string | null };\nexport const readBody = (v: VehiclePayload) => v.bodyStyle ?? \"unknown\";\nexport const readProbe = (v: VehiclePayload) => v.topologyProbeLabel ?? \"unlabeled\";\n""",
    },
    "breaking": {
        "F0": """export type VehiclePayload = { bodyStyle: string | null };\nexport const readBody = (v: VehiclePayload) => v.bodyStyle ?? \"unknown\";\n""",
        "F1": """export type VehiclePayload = { bodyKind: string | null };\nexport const readBody = (v: VehiclePayload) => v.bodyKind ?? \"unknown\";\n""",
        "FB": """export type VehiclePayload = { bodyStyle?: string | null; bodyKind?: string | null };\nexport const readBody = (v: VehiclePayload) => v.bodyKind ?? v.bodyStyle ?? \"unknown\";\n""",
    },
}

SCHEMAS = {
    "compatible": {
        "B0": {"bodyStyle"},
        "B1": {"bodyStyle", "topologyProbeLabel"},
    },
    "breaking": {
        "B0": {"bodyStyle"},
        "B1": {"bodyKind"},
        "BB": {"bodyStyle", "bodyKind"},
    },
}

REQUIRES = {
    "compatible": {"F0": {"bodyStyle"}, "F1": {"bodyStyle"}},
    "breaking": {"F0": {"bodyStyle"}, "F1": {"bodyKind"}, "FB": set()},
}


def run(cmd: list[str], cwd: Path) -> None:
    subprocess.run(cmd, cwd=cwd, check=True)


def copy_backend(dst: Path) -> None:
    shutil.copytree(ROOT, dst, ignore=shutil.ignore_patterns(".git", "public-web", "artifacts", "bin", "obj", "node_modules", ".next"))


def copy_frontend(dst: Path) -> None:
    shutil.copytree(ROOT / "public-web", dst, ignore=shutil.ignore_patterns("node_modules", ".next"))


def patch_contract(root: Path, scenario: str) -> None:
    path = root / CONTRACT
    text = path.read_text(encoding="utf-8")
    if BASE_TAIL not in text:
        raise RuntimeError("VehicleRefDto baseline changed; Plan 0070 workload invalid")
    tail = COMPAT_TAIL if scenario == "compatible" else BREAK_TAIL
    path.write_text(text.replace(BASE_TAIL, tail, 1), encoding="utf-8")


def install_consumer(frontend: Path, scenario: str, version: str) -> None:
    target = frontend / "lib" / "deploy-rollback-probe.ts"
    target.write_text(CONSUMERS[scenario][version], encoding="utf-8")


def compatible(scenario: str, backend: str, frontend: str) -> bool:
    if scenario == "breaking" and frontend == "FB":
        return bool(SCHEMAS[scenario][backend] & {"bodyStyle", "bodyKind"})
    return REQUIRES[scenario][frontend].issubset(SCHEMAS[scenario][backend])


def direct_split_paths(scenario: str) -> list[dict[str, object]]:
    candidates = [
        [("B1", "F0"), ("B1", "F1")],
        [("B0", "F1"), ("B1", "F1")],
    ]
    results = []
    for states in candidates:
        annotated = [{"backend": b, "frontend": f, "compatible": compatible(scenario, b, f)} for b, f in states]
        results.append({"states": annotated, "valid": all(s["compatible"] for s in annotated)})
    return results


def shortest_path(scenario: str, start: tuple[str, str], goal: tuple[str, str], allow_bridge: bool) -> list[tuple[str, str]] | None:
    backends = ["B0", "B1"] + (["BB"] if allow_bridge and scenario == "breaking" else [])
    frontends = ["F0", "F1"] + (["FB"] if allow_bridge and scenario == "breaking" else [])
    q = deque([[start]])
    seen = {start}
    while q:
        path = q.popleft()
        current = path[-1]
        if current == goal:
            return path
        b, f = current
        neighbors = [(nb, f) for nb in backends if nb != b] + [(b, nf) for nf in frontends if nf != f]
        for nxt in neighbors:
            if nxt in seen or not compatible(scenario, *nxt):
                continue
            seen.add(nxt)
            q.append(path + [nxt])
    return None


def states_payload(scenario: str) -> list[dict[str, object]]:
    backends = list(SCHEMAS[scenario])
    frontends = list(REQUIRES[scenario])
    return [
        {"backend": b, "frontend": f, "compatible": compatible(scenario, b, f)}
        for b in backends for f in frontends
    ]


def build_artifacts(scenario: str) -> dict[str, bool]:
    with tempfile.TemporaryDirectory(prefix=f"bpt2-0070-{scenario}-") as td:
        base = Path(td)
        backend = base / "backend"
        frontend = base / "frontend"
        copy_backend(backend)
        copy_frontend(frontend)
        patch_contract(backend, scenario)
        install_consumer(frontend, scenario, "F1")
        run(["dotnet", "build", str(CONTRACT_PROJECT), "--configuration", "Release", "--nologo"], backend)
        run(["npm", "ci", "--no-audit", "--no-fund"], frontend)
        run(["npm", "run", "check"], frontend)
        result = {"backend_contract_build": True, "frontend_install": True, "frontend_check": True}
        if scenario == "breaking":
            install_consumer(frontend, scenario, "FB")
            run(["npm", "run", "check"], frontend)
            result["bridge_frontend_check"] = True
        return result


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", required=True)
    args = ap.parse_args()

    scenarios: dict[str, object] = {}
    for scenario in ("compatible", "breaking"):
        build = build_artifacts(scenario)
        direct = direct_split_paths(scenario)
        rollout_no_bridge = shortest_path(scenario, ("B0", "F0"), ("B1", "F1"), False)
        rollback_no_bridge = shortest_path(scenario, ("B1", "F1"), ("B0", "F0"), False)
        rollout_bridge = shortest_path(scenario, ("B0", "F0"), ("B1", "F1"), True)
        rollback_bridge = shortest_path(scenario, ("B1", "F1"), ("B0", "F0"), True)
        scenarios[scenario] = {
            "build_check": build,
            "state_matrix": states_payload(scenario),
            "combined": {
                "rollout": [["B0", "F0"], ["B1", "F1"]],
                "rollback": [["B1", "F1"], ["B0", "F0"]],
                "rollout_transitions": 1,
                "rollback_transitions": 1,
                "contract_handoffs": 0,
                "intermediate_incompatible_states": 0,
            },
            "split_direct_candidates": direct,
            "split": {
                "rollout_without_bridge": rollout_no_bridge,
                "rollback_without_bridge": rollback_no_bridge,
                "rollout_with_bridge": rollout_bridge,
                "rollback_with_bridge": rollback_bridge,
                "bridge_required": rollout_no_bridge is None or rollback_no_bridge is None,
                "contract_handoffs_minimum": 1,
            },
        }

    comp = scenarios["compatible"]
    brk = scenarios["breaking"]
    assert isinstance(comp, dict) and isinstance(brk, dict)
    assert comp["split"]["bridge_required"] is False
    assert brk["split"]["bridge_required"] is True
    assert all(x["valid"] for x in comp["split_direct_candidates"])
    assert not any(x["valid"] for x in brk["split_direct_candidates"])
    assert brk["split"]["rollout_with_bridge"] is not None
    assert brk["split"]["rollback_with_bridge"] is not None

    payload = {
        "schema": "bpt2.deploy-rollback-topology-rehearsal.v1",
        "source_head": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "evidence_labels": {
            "artifact_build_checks": "OBSERVED_BUILD_CHECK",
            "deployment_state_transitions": "REHEARSED_DEPLOYMENT",
            "production_deployment": "NOT_MEASURED",
        },
        "scenarios": scenarios,
        "claims": {
            "monorepo_equals_atomic_deploy": False,
            "human_productivity_measured": False,
            "production_deploy_measured": False,
        },
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(payload, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
