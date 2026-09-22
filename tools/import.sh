#!/bin/bash
# ==========================================================================
# CORAVIDA — fill a fresh database.   bash tools/import.sh [dir]
# Applies the schema, then loads what tools/export.sh wrote. Safe to re-run:
# rows are upserted on their primary key.
# Needs SUPABASE_URL and SUPABASE_SERVICE_KEY for the NEW project, and the
# Supabase CLI linked to it (supabase link --project-ref <ref>).
# ==========================================================================
set -e
cd "$(dirname "$0")/.."
IN="${1:-handover/data}"
[ -f .env.local ] && set -a && . ./.env.local && set +a
URL="${SUPABASE_URL:?set SUPABASE_URL to the new project}"
KEY="${SUPABASE_SERVICE_KEY:?set SUPABASE_SERVICE_KEY for the new project}"
echo "· schema → $URL"
supabase db query --linked -f supabase/schema.sql > /dev/null
push () {  # $1 table  $2 conflict column
  [ -f "$IN/$1.json" ] || { echo "  $1: nothing to load"; return; }
  local n; n=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).length)' "$IN/$1.json")
  [ "$n" = "0" ] && { printf '  %-10s empty\n' "$1"; return; }
  curl -sf -X POST "$URL/rest/v1/$1?on_conflict=$2" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates,return=minimal" \
    --data-binary "@$IN/$1.json" && printf '  %-10s %s row(s)\n' "$1" "$n"
}
push content key
push records id
push inbox   id
if [ -d "$IN/uploads" ] && [ -n "$(ls -A "$IN/uploads" 2>/dev/null)" ]; then
  for f in "$IN/uploads"/*; do
    curl -sf -X POST "$URL/storage/v1/object/uploads/$(basename "$f")" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
      -H "Content-Type: image/jpeg" -H "x-upsert: true" --data-binary "@$f" > /dev/null && echo "  uploads    $(basename "$f")"
  done
fi
echo "loaded from $IN"
