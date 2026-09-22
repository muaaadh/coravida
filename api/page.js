// Every page of the site, rendered when it is asked for, from the content the
// office last published. No rebuild, no deploy, no GitHub in the loop: press
// Publish in the admin and the next request renders the new words.
//
// The same generator writes the site into the repository (node tools/build.js)
// and renders it here, so a page cannot drift between the two — the pages this
// returns are byte-identical to the built ones for the same content.
//
// Vercel's edge holds each page for a minute and will serve a stale copy for a
// day while it fetches a fresh one, so a visitor almost never waits for this,
// and the database is asked about once a minute however busy the site is.
const fs = require("fs");
const os = require("os");
const path = require("path");

const BUILD = path.join(__dirname, "..", "tools", "build.js");
const FALLBACK = path.join(__dirname, "..", "content", "site.json");
const CACHE = "public, max-age=0, s-maxage=60, stale-while-revalidate=86400";

let held = null;          // { updated, pages, scripts } — kept between warm invocations

/* what the office last published; the copy in the repository if the database
   cannot be reached, so a page always answers */
async function content() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return { updated: "repo", data: JSON.parse(fs.readFileSync(FALLBACK, "utf8")) };
  try {
    const r = await fetch(url + "/rest/v1/content?key=eq.site&select=data,updated", { headers: { apikey: key, Authorization: "Bearer " + key } });
    if (!r.ok) throw new Error(String(r.status));
    const rows = await r.json();
    if (rows.length) return { updated: rows[0].updated, data: rows[0].data };
  } catch (e) { /* fall through to the copy that shipped with the code */ }
  return { updated: "repo", data: JSON.parse(fs.readFileSync(FALLBACK, "utf8")) };
}

/* render everything once per version of the content — 48 pages in about a
   tenth of a second, so there is nothing to gain by rendering one at a time */
function renderAll(c) {
  if (held && held.updated === c.updated) return held;
  const file = path.join(os.tmpdir(), "cv-content.json");
  fs.writeFileSync(file, JSON.stringify(c.data));
  process.env.CV_CONTENT_FILE = file;
  process.env.CV_RENDER = "1";
  Object.keys(require.cache).forEach(k => { if (k.includes(path.join("coravida", "tools")) || k.includes(BUILD) || /tools[\\/](build|i18n)/.test(k)) delete require.cache[k]; });
  const out = require(BUILD);
  held = { updated: c.updated, pages: out.pages, scripts: out.scripts };
  return held;
}

module.exports = async function handler(req, res) {
  try {
    let p = decodeURIComponent((req.query && req.query.p) || new URL(req.url, "http://x").pathname || "");
    p = p.replace(/^\/+/, "");
    if (p === "" || p.endsWith("/")) p += "index.html";
    if (!/\.(html|js)$/.test(p)) p += ".html";                       // /excursions → /excursions.html

    const c = await content();
    const built = renderAll(c);
    const body = built.pages.get(p) || built.scripts.get(p);

    if (!body) {
      const miss = built.pages.get("404.html") || "Not found";
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", CACHE);
      return res.status(404).send(miss);
    }
    res.setHeader("Content-Type", p.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8");
    res.setHeader("Cache-Control", CACHE);
    res.setHeader("X-Coravida-Content", c.updated);                  // which publish this page is
    return res.status(200).send(body);
  } catch (e) {
    /* never leave a visitor with nothing: the page as it was built */
    const p = String((req.query && req.query.p) || "").replace(/^\/+/, "") || "index.html";
    const onDisk = path.join(__dirname, "..", p.endsWith("/") ? p + "index.html" : p);
    if (fs.existsSync(onDisk)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=30");
      return res.status(200).send(fs.readFileSync(onDisk, "utf8"));
    }
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).send("The page could not be rendered.");
  }
};
