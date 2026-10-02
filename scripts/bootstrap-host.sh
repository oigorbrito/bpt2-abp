#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAIN="$ROOT/main"
HOST_PROJECT="$MAIN/BomPraTi/BomPraTi.csproj"
ABP_VERSION="10.6.1"

command -v dotnet >/dev/null || { echo "dotnet SDK is required (net10.0)." >&2; exit 2; }

major="$(dotnet --version | cut -d. -f1)"
if [[ "$major" -lt 10 ]]; then
  echo ".NET SDK 10+ is required; found $(dotnet --version)." >&2
  exit 2
fi

if [[ -f "$HOST_PROJECT" ]]; then
  echo "Using materialized ABP host at ${HOST_PROJECT#$ROOT/}."
  exit 0
fi

mkdir -p "$MAIN"
if [[ -n "$(find "$MAIN" -mindepth 1 -maxdepth 1 ! -name '.gitkeep' -print -quit)" ]]; then
  echo "main/ contains files but no BomPraTi host project; refusing to overwrite it." >&2
  exit 3
fi

dotnet tool restore
rm -f "$MAIN/.gitkeep"

dotnet tool run abp new BomPraTi \
  --template app-nolayers \
  --no-ui \
  --database-provider ef \
  --dbms PostgreSQL \
  --version "$ABP_VERSION" \
  --skip-installing-libs \
  --no-open \
  --output-folder "$MAIN"

python3 "$ROOT/scripts/wire-host.py"

echo
printf 'Host generated and wired.\n'
