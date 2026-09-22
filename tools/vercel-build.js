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

const ENVJS = path.join(ROOT, "assets/js/env.js");
function env() {
  const u = process.env.SUPABASE_URL, k = process.env.SUPABASE_ANON_KEY;
  /* half-set is a mistake worth stopping the build for: the alternative is a
     site quietly wired to whatever the committed env.js still says */
  if ((u && !k) || (k && !u)) { console.error("build: SUPABASE_URL and SUPABASE_ANON_KEY must both be set (only one is)."); process.exit(1); }
  if (u && k) {
    /* the key in env.js reaches every visitor's browser; a service key there
       would hand them the whole database */
    if (/^sb_secret_/.test(k) || /"role"\s*:\s*"service_role"/.test(Buffer.from((k.split(".")[1] || ""), "base64").toString("utf8"))) {
      console.error("build: SUPABASE_ANON_KEY looks like a service_role key — it would be published to the browser. Use the publishable (anon) key.");
      process.exit(1);
    }
    return { url: u, key: k };
  }
  /* On a build server the committed env.js is whoever owned this repo last.
     Falling back to it would publish a working site wired to their database. */
  if (process.env.VERCEL || process.env.CI) {
    console.error("build: SUPABASE_URL and SUPABASE_ANON_KEY are not set on this project — refusing to fall back to the address committed in assets/js/env.js.");
    process.exit(1);
  }
  if (!fs.existsSync(ENVJS)) return null;
  const m = /SUPABASE_URL:\s*"([^"]+)"[\s\S]*?SUPABASE_ANON_KEY:\s*"([^"]+)"/.exec(fs.readFileSync(ENVJS, "utf8"));
  return m ? { url: m[1], key: m[2] } : null;
}
/* The browser needs the same address the build used. Written here, from the
   environment, so a different Supabase project needs no edit to the repo —
   set SUPABASE_URL and SUPABASE_ANON_KEY and this file follows. */
function writeEnvJs(e) {
  const want = `/* Public address of the Coravida database and its publishable key — safe to\n   ship: row-level security decides what the key may read or write.\n   Written by tools/vercel-build.js from SUPABASE_URL / SUPABASE_ANON_KEY. */\nwindow.CV_ENV = { SUPABASE_URL: ${JSON.stringify(e.url)}, SUPABASE_ANON_KEY: ${JSON.stringify(e.key)} };\n`;
  const had = fs.existsSync(ENVJS) ? fs.readFileSync(ENVJS, "utf8") : "";
  if (had !== want) fs.writeFileSync(ENVJS, want);
  console.log("build: assets/js/env.js points at " + e.url);   // every build says which database, not only a build that changes it
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
    writeEnvJs(e);
    // 1. content
    const rows = await (await get(e.url + "/rest/v1/content?key=eq.site&select=data,updated", e.key)).json();
    if (rows.length) {
      fs.writeFileSync(path.join(ROOT, "content/site.json"), JSON.stringify(rows[0].data, null, 2) + "\n");
      console.log("build: content from the database, saved " + rows[0].updated);
    } else console.log("build: the database has no content yet — using content/site.json from the repo");
    // the calendar's fallback copy of which days are gone, so a slow database read
    // shows the office's real state rather than whatever was last committed
    try {
      const av = await (await get(e.url + "/rest/v1/content?key=eq.availability&select=data", e.key)).json();
      const doc = av.length && av[0].data && Array.isArray(av[0].data.taken) ? av[0].data : { taken: [], at: null };
      fs.writeFileSync(path.join(ROOT, "content/availability.json"), JSON.stringify(doc) + "\n");
      console.log("build: availability from the database, " + doc.taken.length + " day(s) taken");
    } catch (err) { console.warn("build: could not read availability — " + err.message); }
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
  /* The site is what a visitor may see. Everything a developer needs stays
     behind: notes, the runbook, the schema, the tooling, anything secret.
     Deny by default — a new file at the root is not published unless it is
     named here or is one of the built pages. */
  const SKIP = new Set([".git", ".github", ".vercel", "_site", "node_modules", "tools", "supabase", "api", "handover", "README.md", "CLAUDE.md", ".gitignore", ".env.local", "package.json", "package-lock.json", "vercel.json"]);
  const DEV = /\.(md|sql|sh|mjs|toml|ya?ml|log|bak)$/i;
  for (const name of fs.readdirSync(ROOT)) {
    if (SKIP.has(name) || name.startsWith(".") || DEV.test(name)) continue;
    fs.cpSync(path.join(ROOT, name), path.join(OUT, name), { recursive: true, filter: p => !/assets\/src(\/|$)/.test(p.replace(ROOT, "")) });
  }
  console.log("build: _site assembled");
})().catch(e => { console.error(e); process.exit(1); });
