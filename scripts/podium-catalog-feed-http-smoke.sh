#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${BPT_PODIUM_FEED_API_PORT:-5110}"
BASE="http://127.0.0.1:${PORT}"
TMP="${TMPDIR:-/tmp}/bpt2-podium-catalog-feed-http"
RESPONSE="$TMP/response.json"
LOG="$TMP/api.log"
SWAGGER="$TMP/swagger.json"
: "${BPT_DB_CONNECTION:?BPT_DB_CONNECTION is required}"
rm -rf "$TMP"; mkdir -p "$TMP"

export ConnectionStrings__Default="$BPT_DB_CONNECTION"
export ASPNETCORE_URLS="$BASE"
export ASPNETCORE_ENVIRONMENT=Development
export App__SelfUrl="$BASE"
export AuthServer__Authority="$BASE"
export AuthServer__RequireHttpsMetadata=false

API_PID=""
cleanup(){ [[ -z "$API_PID" ]] || kill "$API_PID" >/dev/null 2>&1 || true; }
trap cleanup EXIT

dotnet build "$ROOT/main/BomPraTi/BomPraTi.csproj" --configuration Release --nologo
dotnet "$ROOT/main/BomPraTi/bin/Release/net10.0/BomPraTi.dll" >"$LOG" 2>&1 & API_PID=$!
for _ in $(seq 1 60); do
  curl --fail --silent "$BASE/swagger/v1/swagger.json" -o "$SWAGGER" && break
  sleep 1
done
[[ -s "$SWAGGER" ]] || { cat "$LOG" >&2; exit 1; }

ROUTE='/api/integrations/podium/catalog/v1/vehicles'
python3 - "$SWAGGER" <<'PY'
import json,sys
paths=json.load(open(sys.argv[1],encoding='utf-8'))['paths']
route='/api/integrations/podium/catalog/v1/vehicles'
if route not in paths or 'post' not in paths[route]:
    raise SystemExit(f'Missing POST {route}; podium routes={[(p,list(v)) for p,v in paths.items() if "podium" in p.lower()]}')
print('PODIUM_CATALOG_FEED_HTTP_ROUTE: PASS')
PY

request(){
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  local a=(--silent --show-error --output "$RESPONSE" --write-out '%{http_code}' --request "$method")
  [[ -z "$token" ]] || a+=(-H "Authorization: Bearer $token")
  [[ -z "$body" ]] || a+=(-H 'Content-Type: application/json' --data "$body")
  curl "${a[@]}" "$BASE$path"
}

token(){
  curl --silent -X POST "$BASE/connect/token" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode 'grant_type=password' \
    --data-urlencode 'client_id=BomPraTi_App' \
    --data-urlencode "username=$1" \
    --data-urlencode "password=$2" \
    --data-urlencode 'scope=BomPraTi' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])'
}

status="$(request POST "$ROUTE" '' '{"contractVersion":"2.0","entity":{},"redirectsFrom":[]}')"
[[ "$status" == 401 ]] || { echo "Anonymous import expected 401 got $status" >&2; cat "$RESPONSE" >&2; exit 1; }
echo 'PODIUM_CATALOG_FEED_ANONYMOUS_BLOCKED: PASS'

ADMIN_TOKEN="$(token admin '1q2w3E*')"
USER="podium-feed-user-$(python3 -c 'import uuid; print(uuid.uuid4().hex[:8])')"
USER_PASSWORD='Bpt2-Podium-9!a'
USER_BODY="$(python3 - "$USER" "$USER_PASSWORD" <<'PY'
import json,sys
u,p=sys.argv[1:]
print(json.dumps({'userName':u,'name':'Podium','surname':'Feed','email':f'{u}@example.invalid','password':p,'isActive':True,'lockoutEnabled':True,'roleNames':[]}))
PY
)"
status="$(request POST '/api/identity/users' "$ADMIN_TOKEN" "$USER_BODY")"
[[ "$status" == 200 || "$status" == 201 ]] || { echo "Non-admin user create failed $status: $(cat "$RESPONSE")" >&2; exit 1; }
USER_TOKEN="$(token "$USER" "$USER_PASSWORD")"
status="$(request POST "$ROUTE" "$USER_TOKEN" '{"contractVersion":"2.0","entity":{},"redirectsFrom":[]}')"
[[ "$status" == 403 ]] || { echo "Non-admin import expected 403 got $status" >&2; cat "$RESPONSE" >&2; exit 1; }
echo 'PODIUM_CATALOG_FEED_NON_ADMIN_BLOCKED: PASS'

SUFFIX="$(python3 -c 'import uuid; print(uuid.uuid4().hex[:10])')"
CANONICAL="podium:${SUFFIX}"
REDIRECT="podium-old:${SUFFIX}"
BODY="$(python3 - "$CANONICAL" "$REDIRECT" "$SUFFIX" <<'PY'
import json,sys
canonical,redirect,suffix=sys.argv[1:]
print(json.dumps({
  'contractVersion':'2.0',
  'entity':{
    'id':canonical,
    'make':'Toyota',
    'model':'Corolla',
    'generation':'E210',
    'variant':f'XEi {suffix}',
    'powertrain':'combustion',
    'transmission':'CVT',
    'body_style':'sedan',
    'market':'BR',
    'manufacture_year_from':2024,
    'manufacture_year_to':2024,
    'model_year_from':2025,
    'model_year_to':2025,
    'aliases':[],
    'engine_identifiers':[],
    'external_identifiers':[{'namespace':'fixture','value':suffix}]
  },
  'redirectsFrom':[redirect]
}))
PY
)"

status="$(request POST "$ROUTE" "$ADMIN_TOKEN" "$BODY")"
[[ "$status" == 200 || "$status" == 201 ]] || { echo "Admin import failed $status: $(cat "$RESPONSE")" >&2; exit 1; }
FIRST_VEHICLE="$(python3 - "$RESPONSE" "$CANONICAL" "$REDIRECT" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); canonical=sys.argv[2]; redirect=sys.argv[3]
assert x['canonicalExternalId']==canonical,x
assert x['redirectsFrom']==[redirect],x
assert x['replayed'] is False,x
print(x['vehicleId'])
PY
)"
echo 'PODIUM_CATALOG_FEED_ADMIN_IMPORT: PASS'

status="$(request POST "$ROUTE" "$ADMIN_TOKEN" "$BODY")"
[[ "$status" == 200 || "$status" == 201 ]] || { echo "Admin replay failed $status: $(cat "$RESPONSE")" >&2; exit 1; }
python3 - "$RESPONSE" "$FIRST_VEHICLE" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); expected=sys.argv[2].lower()
assert x['vehicleId'].lower()==expected,x
assert x['replayed'] is True,x
print('PODIUM_CATALOG_FEED_REPLAY: PASS')
PY

echo 'PODIUM CATALOG FEED HTTP: PASSED'
