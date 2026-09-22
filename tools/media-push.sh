#!/bin/bash
# ==========================================================================
# CORAVIDA — put the media library in Supabase.   bash tools/media-push.sh [--force]
# Uploads assets/img, assets/video and assets/audio into the public `media`
# bucket and writes content/media-manifest.json — the list of what exists and
# how big each photograph is, which is all the build needs once the files
# themselves are no longer in the repository.
#   SUPABASE_URL / SUPABASE_SERVICE_KEY   the project that holds the library
#   --force                               re-upload files already up there
# Files are sent with a year's cache; their names carry their size, so a new
# cut is a new name and nothing ever needs busting.
# ==========================================================================
set -euo pipefail
cd "$(dirname "$0")/.."
FORCE=""; [ "${1:-}" = "--force" ] && FORCE=1
if [ -f .env.local ]; then
  while IFS='=' read -r k v; do
    case "$k" in ''|\#*) continue ;; esac
    [ -n "${!k:-}" ] || export "$k=$v"
  done < .env.local
fi
URL="${SUPABASE_URL:?set SUPABASE_URL to the project that holds the media}"
KEY="${SUPABASE_SERVICE_KEY:?set SUPABASE_SERVICE_KEY for that project}"
echo "· media → $URL/storage/v1/object/public/media/"
FORCE="$FORCE" node -e '
const fs = require("fs"), path = require("path");
const [url, key] = process.argv.slice(1);
const ROOT = process.cwd(), DIRS = ["assets/img", "assets/video", "assets/audio"];
const TYPE = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg" };
/* the webp header, so the manifest can carry every intrinsic size */
function dims(file) {
  try {
    const b = fs.readFileSync(file), fmt = b.toString("ascii", 12, 16);
    if (fmt === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (fmt === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (fmt === "VP8L") { const n = b.readUInt32LE(21); return { w: 1 + (n & 0x3fff), h: 1 + ((n >> 14) & 0x3fff) }; }
  } catch (e) {}
  return null;
}
(async () => {
  // what is already up there
  const listed = new Map();
  for (const prefix of DIRS) {
    let from = 0;
    for (;;) {
      const r = await fetch(url + "/storage/v1/object/list/media", { method: "POST", headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify({ prefix: prefix + "/", limit: 1000, offset: from }) });
      if (!r.ok) { console.error("!! could not list the bucket — " + r.status + " " + (await r.text()).slice(0, 200)); process.exit(1); }
      const page = await r.json();
      page.forEach(o => { if (o.name) listed.set(prefix + "/" + o.name, (o.metadata && o.metadata.size) || 0); });
      if (page.length < 1000) break; from += 1000;
    }
  }
  const manifest = { at: new Date().toISOString(), files: [], video: [], audio: [], dims: {} };
  let sent = 0, skipped = 0, bytes = 0;
  for (const dir of DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs).sort()) {
      const ext = path.extname(name).toLowerCase(), type = TYPE[ext];
      if (!type) continue;
      const file = path.join(abs, name), size = fs.statSync(file).size, key2 = dir + "/" + name;
      if (dir === "assets/img") { manifest.files.push(name); const d = dims(file); if (d) manifest.dims[name] = d; }
      if (dir === "assets/video") manifest.video.push(name);
      if (dir === "assets/audio") manifest.audio.push(name);
      if (!process.env.FORCE && listed.get(key2) === size) { skipped++; continue; }
      const r = await fetch(url + "/storage/v1/object/media/" + key2, { method: "POST", headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": type, "cache-control": "public, max-age=31536000, immutable", "x-upsert": "true" }, body: fs.readFileSync(file) });
      if (!r.ok) { console.error("!! " + key2 + " — " + r.status + " " + (await r.text()).slice(0, 200)); process.exit(1); }
      sent++; bytes += size;
      if (sent % 25 === 0) console.log("  " + sent + " sent…");
    }
  }
  fs.writeFileSync(path.join(ROOT, "content/media-manifest.json"), JSON.stringify(manifest, null, 1) + "\n");
  console.log("  " + sent + " uploaded (" + (bytes / 1048576).toFixed(0) + " MB), " + skipped + " already there");
  console.log("  manifest: " + manifest.files.length + " photograph tiers, " + manifest.video.length + " clip files, " + manifest.audio.length + " track(s)");
})();' "$URL" "$KEY"
echo "MEDIA_URL=$URL/storage/v1/object/public/media/"
