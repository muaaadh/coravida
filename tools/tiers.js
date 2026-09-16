/* ==========================================================================
   CORAVIDA — photograph tiers for admin uploads.   node tools/tiers.js
   The admin commits an original to assets/src/<name>.jpg; this cuts the same
   webp tiers tools/images.sh makes (900 / 1200 / 1600 / 2200, never wider
   than the source) so build.js can discover them. Needs `sharp`:
       npm i --no-save sharp
   The Vercel build runs this before every build, so a local run is only
   needed to preview an upload before it is published.
   ========================================================================== */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "assets/src"), OUT = path.join(ROOT, "assets/img");
const WIDTHS = [900, 1200, 1600, 2200];
/* the hero posters, the logo and the sea's caustics are cut by hand; an upload may not take their names */
const RESERVED = /^(poster-|logo|favicon|caustics|icon)/;

if (!fs.existsSync(SRC)) { console.log("tiers: nothing in assets/src"); process.exit(0); }
const files = fs.readdirSync(SRC).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
if (!files.length) { console.log("tiers: nothing in assets/src"); process.exit(0); }

let sharp;
try { sharp = require("sharp"); }
catch (e) { console.error("tiers: `sharp` is not installed — run  npm i --no-save sharp"); process.exit(1); }

(async () => {
  let made = 0;
  for (const f of files) {
    const name = f.replace(/\.[^.]+$/, "");
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) { console.warn("tiers: skipping " + f + " — use lower-case letters, digits and hyphens"); continue; }
    if (RESERVED.test(name)) { console.warn("tiers: skipping " + f + " — that name belongs to the site's own artwork"); continue; }
    const src = path.join(SRC, f), stat = fs.statSync(src);
    const first = path.join(OUT, `${name}-${WIDTHS[0]}.webp`);
    if (fs.existsSync(first) && fs.statSync(first).mtimeMs >= stat.mtimeMs) continue;   // already cut
    const meta = await sharp(src).rotate().metadata();
    const w0 = meta.width || 0;
    /* never wider than the source; a small photograph still gets its one soft
       tier so a page that names it builds instead of failing */
    let widths = WIDTHS.filter(w => w <= w0);
    if (!widths.length) { console.warn("tiers: " + f + " is only " + w0 + "px wide — it will look soft"); widths = [WIDTHS[0]]; }
    for (const w of widths) {
      await sharp(src).rotate().resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 78, effort: 6, smartSubsample: true })
        .toFile(path.join(OUT, `${name}-${w}.webp`));
    }
    made++;
    console.log(`  ${name.padEnd(18)} ${widths.join("/")}  (source ${w0}px)`);
  }
  console.log(made ? `tiers: ${made} photograph(s) cut` : "tiers: everything already cut");
})().catch(e => { console.error(e); process.exit(1); });
