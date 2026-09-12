import argparse, json
from pathlib import Path

STATES = [("BO", "FO"), ("BN", "FO"), ("BO", "FN"), ("BN", "FN")]

def compatible(s, breaking):
    b, f = s
    return not breaking or (b == "BO" and f == "FO") or (b == "BN" and f == "FN")

def run(topology, breaking, rollback):
    start, target = (("BN", "FN"), ("BO", "FO")) if rollback else (("BO", "FO"), ("BN", "FN"))
    if topology == "combined":
        transitions = [target]
    elif not breaking:
        transitions = [("BN", "FO"), target] if not rollback else [("BO", "FN"), target]
    else:
        transitions = [("BO", "FN"), target] if not rollback else [("BN", "FO"), target]
    valid = [compatible(s, breaking) for s in transitions]
    return {"topology": topology, "change": "breaking" if breaking else "compatible", "operation": "rollback" if rollback else "rollout", "start": start, "target": target, "transitions": transitions, "compatible_intermediates": sum(valid), "incompatible_intermediates": len(valid)-sum(valid), "bridge_required": breaking and topology == "split", "contract_handoffs": 0 if topology == "combined" else 1, "checkpoints": 1 if topology == "combined" else 2, "coordination_units": 1 if topology == "combined" else 2, "ordering": "atomic" if topology == "combined" else "backend/frontend"}

def main():
    p = argparse.ArgumentParser(); p.add_argument("--output", required=True); a = p.parse_args()
    rows = [run(t, b, r) for t in ("combined", "split") for b in (False, True) for r in (False, True)]
    out = {"schema": "bpt2.deploy-rollback-topology-rehearsal.v1", "classification": {"execution": "REHEARSED", "deployment": "MODELED"}, "states": [{"backend": b, "frontend": f, "compatible": {"compatible": True, "breaking": compatible((b,f), True)} } for b,f in STATES], "thresholds": {"material_temporal_difference_percent": 20}, "rows": rows}
    Path(a.output).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
if __name__ == "__main__": main()
