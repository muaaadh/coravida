#!/bin/bash
# Push content/site.json into the database row the Vercel build reads.
# Needs the service key in .env.local as SUPABASE_SERVICE_KEY (never committed).
cd "$(dirname "$0")/.."
[ -f .env.local ] && set -a && . ./.env.local && set +a
KEY="${SUPABASE_SERVICE_KEY:-}"
URL="${SUPABASE_URL:-$(grep -o 'https://[a-z0-9]*\.supabase\.co' assets/js/env.js | head -1)}"
if [ -z "$KEY" ]; then echo "content-up: no SUPABASE_SERVICE_KEY in .env.local — content/site.json NOT sent to the database (publish it from the admin instead)"; exit 0; fi
node -e '
const fs = require("fs"); const d = JSON.parse(fs.readFileSync("content/site.json", "utf8"));
fetch(process.argv[1] + "/rest/v1/content?key=eq.site", { method: "PATCH", headers: { apikey: process.argv[2], Authorization: "Bearer " + process.argv[2], "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ data: d, updated: new Date().toISOString() }) })
  .then(async r => { const j = await r.json(); if (!r.ok || !j.length) { console.error("content-up: " + r.status + " " + JSON.stringify(j).slice(0, 200)); process.exit(1); } console.log("content-up: site.json is in the database (" + j[0].data.hero.clips.length + " hero clips)"); });
' "$URL" "$KEY"
