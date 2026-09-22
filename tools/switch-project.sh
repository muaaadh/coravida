#!/bin/bash
# ==========================================================================
# CORAVIDA — point this clone at another Supabase project and fill it.
#   bash tools/switch-project.sh <ref>
# Asks for the two secrets it needs (they are never echoed, never committed,
# never leave this machine), then: links the CLI, applies the schema, loads the
# content, the books and the enquiries from handover/data, uploads the media
# library, and checks the result. Safe to run twice.
# ==========================================================================
set -euo pipefail
cd "$(dirname "$0")/.."
REF="${1:?usage: bash tools/switch-project.sh <project-ref>}"
URL="https://$REF.supabase.co"
echo "· switching this clone to $URL"

# the two secrets: from the environment when they are there, otherwise asked for.
# A terminal that cannot prompt (no tty) gets a clear instruction instead of a hang.
KEY="${SUPABASE_SERVICE_KEY:-}"; DBPASS="${SUPABASE_DB_PASSWORD:-}"
if [ -z "$KEY" ] || [ -z "$DBPASS" ]; then
  if [ ! -t 0 ]; then
    echo "!! no terminal to ask on. Run it with the two secrets in the environment instead:"
    echo "   SUPABASE_SERVICE_KEY='…' SUPABASE_DB_PASSWORD='…' bash tools/switch-project.sh $REF"
    exit 1
  fi
  [ -n "$KEY" ] || { read -rsp "  service_role key (Supabase → Settings → API): " KEY; echo; }
  [ -n "$DBPASS" ] || { read -rsp "  database password (set when the project was created): " DBPASS; echo; }
fi
[ -n "$KEY" ] || { echo "!! no key given"; exit 1; }
[ -n "$DBPASS" ] || { echo "!! no password given"; exit 1; }

# does the key belong to this project, and does it work?
code=$(curl -s -o /dev/null -w '%{http_code}' "$URL/rest/v1/" -H "apikey: $KEY" -H "Authorization: Bearer $KEY")
case "$code" in 200|404) ;; *) echo "!! that key was refused by $URL (HTTP $code)"; exit 1 ;; esac
echo "  key accepted"

# .env.local keeps the values for every other tool; replace, never duplicate
touch .env.local
python3 - "$URL" "$KEY" "$DBPASS" <<'PY'
import sys, re, pathlib
url, key, dbp = sys.argv[1:4]
p = pathlib.Path(".env.local"); lines = p.read_text().splitlines()
want = {"SUPABASE_URL": url, "SUPABASE_SERVICE_KEY": key, "SUPABASE_DB_PASSWORD": dbp}
out, seen = [], set()
for l in lines:
    k = l.split("=", 1)[0].strip()
    if k in want: out.append(f"{k}={want[k]}"); seen.add(k)
    else: out.append(l)
for k, v in want.items():
    if k not in seen: out.append(f"{k}={v}")
p.write_text("\n".join(out) + "\n")
print("  .env.local now names", url)
PY

export SUPABASE_URL="$URL" SUPABASE_SERVICE_KEY="$KEY" SUPABASE_DB_PASSWORD="$DBPASS"
echo "· linking the CLI"
supabase link --project-ref "$REF" >/dev/null
[ "$(cat supabase/.temp/project-ref)" = "$REF" ] || { echo "!! the link did not take"; exit 1; }

echo "· schema and data"
bash tools/import.sh handover/data first

echo "· media library (about 1.1 GB — a few minutes)"
bash tools/media-push.sh

echo "· checking"
supabase db query --linked "select 'content' t, count(*) n from public.content union all select 'records', count(*) from public.records union all select 'inbox', count(*) from public.inbox union all select 'buckets', count(*) from storage.buckets" 2>/dev/null | grep -E '"t"|"n"' | paste - - | sed 's/^/    /'
echo
echo "Next: on the new Vercel project set"
echo "  SUPABASE_URL=$URL"
echo "  SUPABASE_ANON_KEY=<the publishable key from Settings → API>"
echo "  MEDIA_URL=$URL/storage/v1/object/public/media/"
echo "  SITE_URL=<the address it is served from, with a trailing slash>"
echo "  CV_DYNAMIC=1"
echo "then redeploy. Close sign-ups and create the office's user before anyone uses the admin."
