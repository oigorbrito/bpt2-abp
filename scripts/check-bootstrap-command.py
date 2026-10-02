#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
script = (ROOT / "scripts/bootstrap-host.sh").read_text(encoding="utf-8")
manifest = (ROOT / ".config/dotnet-tools.json").read_text(encoding="utf-8")

errors: list[str] = []

if '"volo.abp.cli"' not in manifest or '"version": "10.6.1"' not in manifest:
    errors.append("dotnet tool manifest must pin classic Volo.Abp.Cli 10.6.1")

required = [
    "--template app-nolayers",
    "--no-ui",
    "--database-provider ef",
    "--dbms PostgreSQL",
    '--version "$ABP_VERSION"',
    "--skip-installing-libs",
    "--no-open",
]
for token in required:
    if token not in script:
        errors.append(f"classic CLI bootstrap is missing required token: {token}")

forbidden = [
    "--ui-framework",
    "--database-management-system",
    "--skip-migrator",
    "--create-solution-folder",
    "--modern",
]
for token in forbidden:
    if token in script:
        errors.append(f"classic CLI bootstrap contains incompatible/ambiguous token: {token}")

if errors:
    print("BOOTSTRAP CLI DIALECT CHECK: FAILED")
    for error in errors:
        print(f" - {error}")
    sys.exit(1)

print("BOOTSTRAP CLI DIALECT CHECK: PASSED")
