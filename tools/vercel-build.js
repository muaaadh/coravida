/* ==========================================================================
   CORAVIDA — the build Vercel runs.   node tools/vercel-build.js
   1. pull the content the admin published from the database → content/site.json
   2. pull any photographs the admin uploaded → assets/src/, cut their tiers
   3. generate every page (tools/build.js)
   4. assemble _site/ — the pages, the admin, the assets — for Vercel to serve
   Locally the same script works with the values in assets/js/env.js.
   ========================================================================== */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");

function env() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) return { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_ANON_KEY };
  const src = fs.readFileSync(path.join(ROOT, "assets/js/env.js"), "utf8");
  const m = /SUPABASE_URL:\s*"([^"]+)"[\s\S]*?SUPABASE_ANON_KEY:\s*"([^"]+)"/.exec(src);
  return m ? { url: m[1], key: m[2] } : null;
}
async function get(url, key, init) {
  const r = await fetch(url, Object.assign({ headers: { apikey: key, Authorization: "Bearer " + key } }, init || {}));
  if (!r.ok) throw new Error(url + " → " + r.status + " " + (await r.text()).slice(0, 200));
  return r;
}

(async () => {
  const e = env();
  if (!e) { console.log("build: no database address — building from the files in the repo"); }
  else {
    // 1. content
    const rows = await (await get(e.url + "/rest/v1/content?key=eq.site&select=data,updated", e.key)).json();
    if (rows.length) {
      fs.writeFileSync(path.join(ROOT, "content/site.json"), JSON.stringify(rows[0].data, null, 2) + "\n");
      console.log("build: content from the database, saved " + rows[0].updated);
    } else console.log("build: the database has no content yet — using content/site.json from the repo");
    // 2. photographs
    try {
      const list = await (await get(e.url + "/storage/v1/object/list/uploads", e.key, { method: "POST", headers: { apikey: e.key, Authorization: "Bearer " + e.key, "Content-Type": "application/json" }, body: JSON.stringify({ prefix: "", limit: 1000 }) })).json();
      const files = (list || []).filter(f => f.name && /\.(jpe?g|png|webp)$/i.test(f.name));
      if (files.length) {
        fs.mkdirSync(path.join(ROOT, "assets/src"), { recursive: true });
        for (const f of files) {
          const dest = path.join(ROOT, "assets/src", f.name);
          if (fs.existsSync(dest)) continue;
          const r = await get(e.url + "/storage/v1/object/public/uploads/" + encodeURIComponent(f.name), e.key);
          fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
        }
        console.log("build: " + files.length + " uploaded photograph(s)");
      }
    } catch (err) { console.warn("build: could not list uploads — " + err.message); }
  }
  // tiers for anything in assets/src
  if (fs.existsSync(path.join(ROOT, "assets/src")) && fs.readdirSync(path.join(ROOT, "assets/src")).length) {
    execSync("node tools/tiers.js", { cwd: ROOT, stdio: "inherit" });
  }
  // 3. pages
  execSync("node tools/build.js", { cwd: ROOT, stdio: "inherit" });
  // 4. assemble
  const OUT = path.join(ROOT, "_site");
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
  const SKIP = new Set([".git", ".github", ".vercel", "_site", "node_modules", "tools", "supabase", "api", "README.md", ".gitignore", ".env.local", "package.json", "package-lock.json", "vercel.json"]);
  for (const name of fs.readdirSync(ROOT)) {
    if (SKIP.has(name) || name.startsWith(".")) continue;
    fs.cpSync(path.join(ROOT, name), path.join(OUT, name), { recursive: true, filter: p => !/assets\/src(\/|$)/.test(p.replace(ROOT, "")) });
  }
  console.log("build: _site assembled");
})().catch(e => { console.error(e); process.exit(1); });
