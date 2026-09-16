#!/usr/bin/env bash
set -euo pipefail

EXPECTED_BPT2_HEAD='cf08bebae8efdf1904f25355c540ca63478b6573'
EXPECTED_PODIUM_HEAD='939f0452a9c6d3558e2951a48fe8291796645c33'
PAIRS="${PAIRS:-3}"
PORT="${BPT2_PORT:-5110}"
POSTGRES_PORT="${POSTGRES_PORT:-55432}"
OUTPUT="${OUTPUT:-artifacts/podium7-bpt2-topology-rehearsal.json}"
BPT2_ROOT="${BPT2_ROOT:-}"
PODIUM_ROOT="${PODIUM_ROOT:-}"
: "${BPT2_ADMIN_USER:?BPT2_ADMIN_USER is required}"
: "${BPT2_ADMIN_PASSWORD:?BPT2_ADMIN_PASSWORD is required}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bpt2-root) BPT2_ROOT="$2"; shift 2;;
    --podium-root) PODIUM_ROOT="$2"; shift 2;;
    --pairs) PAIRS="$2"; shift 2;;
    --output) OUTPUT="$2"; shift 2;;
    --port) PORT="$2"; shift 2;;
    --postgres-port) POSTGRES_PORT="$2"; shift 2;;
    *) echo "Unknown argument: $1" >&2; exit 2;;
  esac
done

[[ -n "$BPT2_ROOT" && -n "$PODIUM_ROOT" ]] || { echo 'BPT2_ROOT and PODIUM_ROOT are required' >&2; exit 2; }
BPT2_ROOT="$(cd "$BPT2_ROOT" && pwd)"
PODIUM_ROOT="$(cd "$PODIUM_ROOT" && pwd)"
SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for cmd in git docker dotnet python3 bash curl; do command -v "$cmd" >/dev/null || { echo "$cmd is required" >&2; exit 2; }; done
docker info >/dev/null 2>&1 || { echo 'Docker daemon unavailable' >&2; exit 2; }

BPT2_HEAD="$(git -C "$BPT2_ROOT" rev-parse HEAD)"
PODIUM_HEAD="$(git -C "$PODIUM_ROOT" rev-parse HEAD)"
[[ "$BPT2_HEAD" == "$EXPECTED_BPT2_HEAD" ]] || { echo "BPT2 head drift: $BPT2_HEAD" >&2; exit 2; }
[[ "$PODIUM_HEAD" == "$EXPECTED_PODIUM_HEAD" ]] || { echo "Podium7 head drift: $PODIUM_HEAD" >&2; exit 2; }
[[ -z "$(git -C "$BPT2_ROOT" status --porcelain)" ]] || { echo 'BPT2 measured checkout must be clean' >&2; exit 2; }
[[ -z "$(git -C "$PODIUM_ROOT" status --porcelain)" ]] || { echo 'Podium7 measured checkout must be clean' >&2; exit 2; }

CONTAINER="bpt2-podium-topology-$$"
BASE_URL="http://127.0.0.1:${PORT}"
CONNECTION="Host=127.0.0.1;Port=${POSTGRES_PORT};Database=BomPraTi;Username=postgres;Password=postgres"
BOOTSTRAP_ROOT="$(mktemp -d -t bpt2-topology-bootstrap-XXXXXX)"
HOST_LOG="$(mktemp -t bpt2-topology-host-XXXXXX.log)"
HOST_PID=''
WORKTREE_ADDED=0
START_TOTAL="$(python3 -c 'import time; print(time.monotonic())')"

cleanup(){
  set +e
  [[ -z "$HOST_PID" ]] || kill "$HOST_PID" >/dev/null 2>&1 || true
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  [[ "$WORKTREE_ADDED" != 1 ]] || git -C "$BPT2_ROOT" worktree remove --force "$BOOTSTRAP_ROOT" >/dev/null 2>&1 || true
  rm -rf "$BOOTSTRAP_ROOT" "$HOST_LOG"
}
trap cleanup EXIT

mkdir -p "$(dirname "$OUTPUT")"
OUTPUT="$(python3 -c 'import os,sys; print(os.path.abspath(sys.argv[1]))' "$OUTPUT")"
BOOTSTRAP_OUTPUT="${OUTPUT%.json}.bootstrap.json"
TIMINGS="$(mktemp -t bpt2-topology-times-XXXXXX.json)"
echo '{}' > "$TIMINGS"

measure(){
  local key="$1"; shift
  local start end
  start="$(python3 -c 'import time; print(time.monotonic())')"
  "$@"
  end="$(python3 -c 'import time; print(time.monotonic())')"
  python3 - "$TIMINGS" "$key" "$start" "$end" <<'PY'
import json,pathlib,sys
p=pathlib.Path(sys.argv[1]); d=json.loads(p.read_text()); d[sys.argv[2]]=round(float(sys.argv[4])-float(sys.argv[3]),6); p.write_text(json.dumps(d))
PY
}

git -C "$BPT2_ROOT" worktree add --detach "$BOOTSTRAP_ROOT" "$EXPECTED_BPT2_HEAD" >/dev/null
WORKTREE_ADDED=1

measure postgres_start_s docker run --name "$CONTAINER" -e POSTGRES_DB=BomPraTi -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p "${POSTGRES_PORT}:5432" -d postgres:17-alpine >/dev/null
for _ in $(seq 1 60); do docker exec "$CONTAINER" pg_isready -U postgres -d BomPraTi >/dev/null 2>&1 && break; sleep 1; done
docker exec "$CONTAINER" pg_isready -U postgres -d BomPraTi >/dev/null

export BPT_DB_CONNECTION="$CONNECTION"
measure migrations_s bash -c "cd '$BOOTSTRAP_ROOT' && bash scripts/fresh-migration-gate.sh"
[[ -z "$(git -C "$BPT2_ROOT" status --porcelain)" ]] || { echo 'migration bootstrap mutated measured BPT2 checkout' >&2; exit 2; }

export ConnectionStrings__Default="$CONNECTION" ASPNETCORE_URLS="$BASE_URL" ASPNETCORE_ENVIRONMENT=Development App__SelfUrl="$BASE_URL" AuthServer__Authority="$BASE_URL" AuthServer__RequireHttpsMetadata=false
measure host_build_s dotnet build "$BPT2_ROOT/main/BomPraTi/BomPraTi.csproj" --configuration Release --nologo

dotnet "$BPT2_ROOT/main/BomPraTi/bin/Release/net10.0/BomPraTi.dll" >"$HOST_LOG" 2>&1 & HOST_PID=$!
READY_START="$(python3 -c 'import time; print(time.monotonic())')"
for _ in $(seq 1 60); do curl --fail --silent "$BASE_URL/swagger/v1/swagger.json" >/dev/null && break; sleep 1; done
curl --fail --silent "$BASE_URL/swagger/v1/swagger.json" >/dev/null || { cat "$HOST_LOG" >&2; exit 1; }
READY_END="$(python3 -c 'import time; print(time.monotonic())')"
python3 - "$TIMINGS" "$READY_START" "$READY_END" <<'PY'
import json,pathlib,sys
p=pathlib.Path(sys.argv[1]); d=json.loads(p.read_text()); d['host_ready_s']=round(float(sys.argv[3])-float(sys.argv[2]),6); p.write_text(json.dumps(d))
PY

TOKEN="$(curl --fail --silent -X POST "$BASE_URL/connect/token" -H 'Content-Type: application/x-www-form-urlencoded' --data-urlencode 'grant_type=password' --data-urlencode 'client_id=BomPraTi_App' --data-urlencode "username=$BPT2_ADMIN_USER" --data-urlencode "password=$BPT2_ADMIN_PASSWORD" --data-urlencode 'scope=BomPraTi' | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')"
export BPT2_BASE_URL="$BASE_URL" BPT2_ACCESS_TOKEN="$TOKEN"

(cd "$PODIUM_ROOT" && python3 scripts/bpt2_http_e2e.py)
python3 "$SCRIPT_ROOT/rehearse-podium7-bpt2-topology.py" --bpt2-root "$BPT2_ROOT" --podium-root "$PODIUM_ROOT" --pairs "$PAIRS" --e2e --output "$OUTPUT"

[[ -z "$(git -C "$BPT2_ROOT" status --porcelain)" ]] || { echo 'measured BPT2 checkout became dirty' >&2; exit 2; }
[[ -z "$(git -C "$PODIUM_ROOT" status --porcelain)" ]] || { echo 'measured Podium7 checkout became dirty' >&2; exit 2; }

END_TOTAL="$(python3 -c 'import time; print(time.monotonic())')"
python3 - "$TIMINGS" "$BOOTSTRAP_OUTPUT" "$BPT2_HEAD" "$PODIUM_HEAD" "$BASE_URL" "$POSTGRES_PORT" "$START_TOTAL" "$END_TOTAL" <<'PY'
import json,pathlib,sys
src,out,bpt2,podium,base,pg,start,end=sys.argv[1:]
t=json.loads(pathlib.Path(src).read_text()); t['wrapper_total_s']=round(float(end)-float(start),6)
p={'schema':'bpt2.podium7-topology-bootstrap.v1','heads':{'bpt2':bpt2,'podium7':podium},'base_url':base,'postgres_port':int(pg),'migrations_source':'disposable detached worktree','measured_checkouts_clean':True,'timings_s':t,'excluded_from_paired_harness_timing':True}
pathlib.Path(out).write_text(json.dumps(p,indent=2,sort_keys=True)+'\n')
PY
rm -f "$TIMINGS"
echo 'TOPOLOGY_REHEARSAL: PASS'
echo "artifact=$OUTPUT"
echo "bootstrap=$BOOTSTRAP_OUTPUT"
