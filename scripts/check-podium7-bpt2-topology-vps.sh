#!/usr/bin/env bash
set -euo pipefail

EXPECTED_BPT2_HEAD='cf08bebae8efdf1904f25355c540ca63478b6573'
EXPECTED_PODIUM_HEAD='939f0452a9c6d3558e2951a48fe8291796645c33'
BPT2_ROOT="${BPT2_ROOT:-${1:-}}"
PODIUM_ROOT="${PODIUM_ROOT:-${2:-}}"

fail=0
check(){ if "$@"; then printf 'PASS  %s\n' "$*"; else printf 'FAIL  %s\n' "$*"; fail=1; fi; }

for cmd in git docker dotnet python3 bash curl; do
  if command -v "$cmd" >/dev/null 2>&1; then echo "PASS  command:$cmd"; else echo "FAIL  command:$cmd"; fail=1; fi
done

if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then echo 'PASS  docker-daemon'; else echo 'FAIL  docker-daemon'; fail=1; fi
fi

CPU="$(getconf _NPROCESSORS_ONLN 2>/dev/null || nproc)"
MEM_KB="$(awk '/MemTotal:/ {print $2}' /proc/meminfo)"
MEM_GB="$(python3 -c 'import sys; print(round(int(sys.argv[1])/1024/1024,2))' "$MEM_KB")"
DISK_KB="$(df -Pk . | awk 'NR==2 {print $4}')"
DISK_GB="$(python3 -c 'import sys; print(round(int(sys.argv[1])/1024/1024,2))' "$DISK_KB")"

echo "INFO  cpu=$CPU"
echo "INFO  ram_gb=$MEM_GB"
echo "INFO  free_disk_gb=$DISK_GB"

python3 - "$CPU" "$MEM_GB" "$DISK_GB" <<'PY'
import sys
cpu=int(sys.argv[1]); ram=float(sys.argv[2]); disk=float(sys.argv[3])
if cpu < 4: print('WARN  CPU below recommended 4 vCPU')
if ram < 8: print('FAIL  RAM below minimum 8 GB'); raise SystemExit(1)
if disk < 30: print('FAIL  free disk below minimum 30 GB'); raise SystemExit(1)
if disk < 60: print('WARN  free disk below preferred 60 GB for benchmark caches/artifacts')
PY
if [[ $? -ne 0 ]]; then fail=1; fi

DOTNET_VERSION="$(dotnet --version 2>/dev/null || true)"
PYTHON_VERSION="$(python3 --version 2>/dev/null || true)"
echo "INFO  dotnet=$DOTNET_VERSION"
echo "INFO  python=$PYTHON_VERSION"
[[ "$DOTNET_VERSION" == 10.* ]] || { echo 'FAIL  .NET SDK 10.x required'; fail=1; }

if [[ -n "$BPT2_ROOT" ]]; then
  BPT2_ROOT="$(cd "$BPT2_ROOT" && pwd)"
  HEAD="$(git -C "$BPT2_ROOT" rev-parse HEAD 2>/dev/null || true)"
  [[ "$HEAD" == "$EXPECTED_BPT2_HEAD" ]] && echo 'PASS  bpt2-head' || { echo "FAIL  bpt2-head=$HEAD"; fail=1; }
  [[ -z "$(git -C "$BPT2_ROOT" status --porcelain 2>/dev/null)" ]] && echo 'PASS  bpt2-clean' || { echo 'FAIL  bpt2-clean'; fail=1; }
fi

if [[ -n "$PODIUM_ROOT" ]]; then
  PODIUM_ROOT="$(cd "$PODIUM_ROOT" && pwd)"
  HEAD="$(git -C "$PODIUM_ROOT" rev-parse HEAD 2>/dev/null || true)"
  [[ "$HEAD" == "$EXPECTED_PODIUM_HEAD" ]] && echo 'PASS  podium-head' || { echo "FAIL  podium-head=$HEAD"; fail=1; }
  [[ -z "$(git -C "$PODIUM_ROOT" status --porcelain 2>/dev/null)" ]] && echo 'PASS  podium-clean' || { echo 'FAIL  podium-clean'; fail=1; }
fi

if [[ "$fail" -ne 0 ]]; then
  echo 'VPS_TOPOLOGY_PREFLIGHT: FAIL'
  exit 2
fi

echo 'VPS_TOPOLOGY_PREFLIGHT: PASS'
