#!/bin/bash
# ==========================================================================
# CORAVIDA — take everything out of the database.   bash tools/export.sh [dir]
# Writes the content rows, the books, the enquiries and the uploaded photographs
# to a folder, so another Supabase project can be filled from it (tools/import.sh).
# Needs SUPABASE_URL and SUPABASE_SERVICE_KEY — from the environment, or .env.local.
# ==========================================================================
set -e
cd "$(dirname "$0")/.."
OUT="${1:-handover/data}"
[ -f .env.local ] && set -a && . ./.env.local && set +a
URL="${SUPABASE_URL:-$(grep -o 'https://[a-z0-9]*\.supabase\.co' assets/js/env.js | head -1)}"
KEY="${SUPABASE_SERVICE_KEY:?set SUPABASE_SERVICE_KEY (Supabase → Settings → API → service_role)}"
mkdir -p "$OUT"
pull () {  # $1 table  $2 query
  curl -sf "$URL/rest/v1/$1?$2" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -o "$OUT/$1.json"
  printf '  %-10s %s row(s)\n' "$1" "$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).length)' "$OUT/$1.json")"
}
echo "· from $URL"
pull content "select=*"
pull records "select=*&limit=100000"
pull inbox   "select=*&limit=100000"
# the photographs the admin uploaded, if any
mkdir -p "$OUT/uploads"
node -e '
const [url, key, out] = process.argv.slice(1); const fs = require("fs");
(async () => {
  const r = await fetch(url + "/storage/v1/object/list/uploads", { method: "POST", headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify({ prefix: "", limit: 1000 }) });
  const list = r.ok ? await r.json() : [];
  for (const f of list.filter(x => x.name)) {
    const b = await fetch(url + "/storage/v1/object/uploads/" + encodeURIComponent(f.name), { headers: { apikey: key, Authorization: "Bearer " + key } });
    if (b.ok) fs.writeFileSync(out + "/uploads/" + f.name, Buffer.from(await b.arrayBuffer()));
  }
  console.log("  uploads    " + list.filter(x => x.name).length + " file(s)");
})();' "$URL" "$KEY" "$OUT"
echo "exported into $OUT"
