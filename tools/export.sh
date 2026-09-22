#!/bin/bash
# ==========================================================================
# CORAVIDA — take everything out of the database.   bash tools/export.sh [dir]
# Writes the content rows, the books, the enquiries and the uploaded photographs
# to a folder, so another Supabase project can be filled from it (tools/import.sh).
#   SUPABASE_URL           which project (required — no guessing)
#   SUPABASE_SERVICE_KEY   its service_role key
# Anything not already in the environment is read from .env.local.
# The folder holds customer names, e-mail addresses and telephone numbers:
# it is gitignored, never mirrored, and should be deleted when the move is done.
# ==========================================================================
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-handover/data}"
# .env.local fills the gaps; it never overrides what the caller exported
if [ -f .env.local ]; then
  while IFS='=' read -r k v; do
    case "$k" in ''|\#*) continue ;; esac
    [ -n "${!k:-}" ] || export "$k=$v"
  done < .env.local
fi
URL="${SUPABASE_URL:?set SUPABASE_URL to the project you are exporting FROM}"
KEY="${SUPABASE_SERVICE_KEY:?set SUPABASE_SERVICE_KEY (Supabase → Settings → API → service_role)}"
mkdir -p "$OUT"
echo "· from $URL"
pull () {  # $1 table  $2 query
  local body code
  body=$(curl -s -w '\n%{http_code}' "$URL/rest/v1/$1?$2" -H "apikey: $KEY" -H "Authorization: Bearer $KEY")
  code=${body##*$'\n'}; body=${body%$'\n'*}
  [ "$code" = "200" ] || { echo "!! $1: HTTP $code — ${body:0:200}"; exit 1; }
  printf '%s' "$body" > "$OUT/$1.json"
  printf '  %-10s %s row(s)\n' "$1" "$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).length)' "$OUT/$1.json")"
}
pull content "select=*"
pull records "select=*&limit=100000"
pull inbox   "select=*&limit=100000"
# the photographs the admin uploaded, if any — every one, or a loud failure
mkdir -p "$OUT/uploads"
node -e '
const [url, key, out] = process.argv.slice(1); const fs = require("fs");
(async () => {
  const r = await fetch(url + "/storage/v1/object/list/uploads", { method: "POST", headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify({ prefix: "", limit: 1000 }) });
  if (!r.ok) { console.error("!! uploads: could not be listed — " + r.status); process.exit(1); }
  const names = (await r.json()).filter(x => x.name).map(x => x.name);
  let got = 0;
  for (const n of names) {
    const b = await fetch(url + "/storage/v1/object/uploads/" + encodeURIComponent(n), { headers: { apikey: key, Authorization: "Bearer " + key } });
    if (!b.ok) { console.error("!! uploads: " + n + " — " + b.status); process.exit(1); }
    fs.writeFileSync(out + "/uploads/" + n, Buffer.from(await b.arrayBuffer())); got++;
  }
  console.log("  uploads    " + got + " file(s)" + (got === names.length ? "" : " of " + names.length));
  if (got !== names.length) process.exit(1);
})();' "$URL" "$KEY" "$OUT"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$OUT/.exported-at"
echo "exported into $OUT  ($(cat "$OUT/.exported-at"))"
