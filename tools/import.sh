#!/bin/bash
# ==========================================================================
# CORAVIDA — fill another database.   bash tools/import.sh [dir] [mode]
#   mode  first   (default) the schema, then every row exactly as exported
#         gap     only rows that are not there yet — for the enquiries and
#                 edits that arrived after the first pass. Never overwrites
#                 what the office has since changed on the new project.
#   SUPABASE_URL / SUPABASE_SERVICE_KEY   the project being filled
# The Supabase CLI must be linked to that same project; this refuses to run if
# it is linked somewhere else, because the schema goes through the CLI.
# ==========================================================================
set -euo pipefail
cd "$(dirname "$0")/.."
IN="${1:-handover/data}"
MODE="${2:-first}"
if [ -f .env.local ]; then
  while IFS='=' read -r k v; do
    case "$k" in ''|\#*) continue ;; esac
    [ -n "${!k:-}" ] || export "$k=$v"
  done < .env.local
fi
URL="${SUPABASE_URL:?set SUPABASE_URL to the project you are filling}"
KEY="${SUPABASE_SERVICE_KEY:?set SUPABASE_SERVICE_KEY for that project}"
REF="$(printf '%s' "$URL" | sed -E 's#https?://([^.]+)\..*#\1#')"
LINKED="$(cat supabase/.temp/project-ref 2>/dev/null || true)"
[ -n "$LINKED" ] || { echo "!! the Supabase CLI is not linked — run: supabase link --project-ref $REF"; exit 1; }
[ "$LINKED" = "$REF" ] || { echo "!! the CLI is linked to $LINKED but SUPABASE_URL is $REF — run: supabase link --project-ref $REF"; exit 1; }
echo "· $MODE → $URL"

if [ "$MODE" = "first" ]; then
  echo "  schema…"
  supabase db query --linked -f supabase/schema.sql > /dev/null
fi

push () {  # $1 table  $2 conflict column
  [ -f "$IN/$1.json" ] || { printf '  %-10s nothing to load\n' "$1"; return; }
  local n; n=$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).length)' "$IN/$1.json")
  [ "$n" = "0" ] && { printf '  %-10s empty\n' "$1"; return; }
  # first pass: the exported row wins. gap pass: a row already there is left alone.
  local prefer="resolution=merge-duplicates,return=minimal"
  [ "$MODE" = "gap" ] && prefer="resolution=ignore-duplicates,return=minimal"
  local body code
  body=$(curl -s -w '\n%{http_code}' -X POST "$URL/rest/v1/$1?on_conflict=$2" \
    -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -H "Prefer: $prefer" \
    --data-binary "@$IN/$1.json")
  code=${body##*$'\n'}; body=${body%$'\n'*}
  case "$code" in 2*) printf '  %-10s %s row(s)\n' "$1" "$n" ;;
    *) echo "!! $1: HTTP $code — ${body:0:300}"; exit 1 ;; esac
}
push content key
push records id
push inbox   id

if [ -d "$IN/uploads" ] && [ -n "$(ls -A "$IN/uploads" 2>/dev/null)" ]; then
  for f in "$IN/uploads"/*; do
    code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$URL/storage/v1/object/uploads/$(basename "$f")" \
      -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Content-Type: $(case "${f##*.}" in png) echo image/png ;; webp) echo image/webp ;; *) echo image/jpeg ;; esac)" -H "x-upsert: true" --data-binary "@$f")
    case "$code" in 2*) echo "  uploads    $(basename "$f")" ;; *) echo "!! uploads: $(basename "$f") — HTTP $code"; exit 1 ;; esac
  done
fi
# what is actually in there now
supabase db query --linked "select 'content' as t, count(*) from public.content union all select 'records', count(*) from public.records union all select 'inbox', count(*) from public.inbox" 2>/dev/null | grep -A20 '"rows"' | grep -E '"count"|"t"' | paste - - | sed 's/^/  now: /' || true
echo "loaded from $IN"
