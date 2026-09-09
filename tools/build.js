/* ==========================================================================
   CORAVIDA — site generator.   node tools/build.js
   Emits every HTML page from assets/js/data.js, motion attributes included.
   ========================================================================== */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
global.window = {};
require(path.join(ROOT, "assets/js/data.js"));
const EN = global.window.CV;

/* ---------------------------------------------------------------- I18N --
   English is the source. Each locale file carries `ui` (a dictionary keyed by
   the English string) and `content` (a deep override of the data model). A
   missing translation falls back to English rather than to an empty page. */
const LOCALES = [
  { code: "en", dir: "",     lang: "en", label: "English",  short: "EN" },
  { code: "ru", dir: "ru/",  lang: "ru", label: "Русский",  short: "RU" },
  { code: "zh", dir: "zh/",  lang: "zh-Hans", label: "中文", short: "中文" },
  { code: "de", dir: "de/",  lang: "de", label: "Deutsch",  short: "DE" }
];

function deepMerge(base, over) {
  if (Array.isArray(base)) {
    if (!Array.isArray(over)) return base;
    return base.map((v, i) => (i in over ? deepMerge(v, over[i]) : v));
  }
  if (base && typeof base === "object") {
    if (!over || typeof over !== "object") return base;
    const out = {};
    for (const k of Object.keys(base)) out[k] = k in over ? deepMerge(base[k], over[k]) : base[k];
    for (const k of Object.keys(over)) if (!(k in out)) out[k] = over[k];
    return out;
  }
  return over === undefined ? base : over;
}

let LOC = LOCALES[0], CV = EN, DICT = {};
let AR = "";
const WRITTEN = [];                            // the file list, collected on the English pass                                   // to the site root from the page being written
const MISSING = new Map();
function T(s) {
  if (LOC.code === "en") return s;
  const hit = DICT[s];
  if (hit) return hit;
  if (!MISSING.has(LOC.code)) MISSING.set(LOC.code, new Set());
  MISSING.get(LOC.code).add(s);
  return s;
}

const IMGDIR = path.join(ROOT, "assets/img");
const have = new Set(fs.readdirSync(IMGDIR));
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = n => (CV.rates.currency || "USD") + " " +
  Number(n).toLocaleString(LOC.code === "zh" ? "en-US" : LOC.code === "en" ? "en-US" : LOC.code);
/* the client quotes a package price for a party of seven — never a "from" */
const rate = v => (v.price == null ? T("On request") : money(v.price));
function season(str) {
  if (/year round/i.test(str)) return { v: T("Year"), u: T("round"), k: T("Season") };
  const m = str.match(/^(\w{3})\w*\s*[–-]\s*(\w{3})/);
  return m ? { v: m[1], u: "– " + m[2], k: T("Season") } : { v: str, u: "", k: T("Season") };
}
const ARROW = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 9.5 9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.1" stroke-linecap="square"/></svg>';
const CHEVL = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M7.5 1.5 3 6l4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>';
const CHEVR = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4.5 1.5 9 6l-4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>';

/* the webp header, so every <img> can carry its own intrinsic size */
const POSTER = 1600;   // film stills: the clip takes over before a larger tier pays
const dimCache = new Map();
function dims(file) {
  if (dimCache.has(file)) return dimCache.get(file);
  let d = null;
  try {
    const b = fs.readFileSync(path.join(IMGDIR, file));
    const fmt = b.toString("ascii", 12, 16);
    if (fmt === "VP8X") d = { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    else if (fmt === "VP8 ") d = { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    else if (fmt === "VP8L") {
      const n = b.readUInt32LE(21);
      d = { w: 1 + (n & 0x3fff), h: 1 + ((n >> 14) & 0x3fff) };
    }
  } catch (e) { /* the tier is simply not built yet */ }
  dimCache.set(file, d);
  return d;
}

/* every width that actually exists for a name, smallest first */
const tiers = new Map();
for (const f of have) {
  const m = /^(.+)-(\d+)\.webp$/.exec(f);
  if (!m) continue;
  (tiers.get(m[1]) || tiers.set(m[1], []).get(m[1])).push(+m[2]);
}
tiers.forEach(a => a.sort((x, y) => x - y));

/* responsive <img> */
function img(name, alt, { sizes = "100vw", eager = false, cap = 0 } = {}) {
  let set = tiers.get(name) || [];
  if (!set.length) throw new Error("no image tiers for " + name);
  // a still the film replaces within a second does not need the largest tier
  if (cap) { const under = set.filter(w => w <= cap); if (under.length) set = under; }
  const pick = set[Math.min(1, set.length - 1)];
  const src = `${AR}assets/img/${name}-${pick}.webp`;
  const srcset = set.map(w => `${AR}assets/img/${name}-${w}.webp ${w}w`).join(", ");
  const d = dims(`${name}-${pick}.webp`);
  return `<img src="${src}" srcset="${srcset}" sizes="${sizes}"` +
    (d ? ` width="${d.w}" height="${d.h}"` : "") + ` alt="${esc(alt)}"` +
    (eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"') + ">";
}
/* a poster the browser must not fetch until its clip is cued */
function held(name) {
  return img(name, "", { sizes: "100vw", cap: POSTER })
    .replace(/ src="/, ' data-src="').replace(/ srcset="/, ' data-srcset="');
}

/* animated figure: clip-wipe reveal + inner scale */
function fig(name, alt, { ratio = "r43", href = null, sizes = "(min-width:960px) 58vw, 100vw", z = true, eager = false, anim = "clip", i = null, par = null } = {}) {
  const inner = img(name, alt, { sizes, eager });
  const cls = `fig ${ratio}${z ? " fig--z" : ""}`;
  const a = (anim ? ` data-a="${anim}"${i !== null ? ` style="--i:${i}"` : ""}` : "") + (par ? ` data-par="${par}"` : "");
  return href ? `<a class="${cls}" href="${href}"${a}>${inner}</a>` : `<div class="${cls}"${a}>${inner}</div>`;
}
const link = (href, text) => `<a class="link" href="${href}">${text} ${ARROW}</a>`;
const linkL = (href, text) => `<a class="link link--light" href="${href}">${text} ${ARROW}</a>`;

function head({ title, desc, og, r, path: pagePath }) {
  const alt = LOCALES.map(l =>
    `<link rel="alternate" hreflang="${l.lang}" href="${SITE}${l.dir}${pagePath}">`).join("\n") +
    `\n<link rel="alternate" hreflang="x-default" href="${SITE}${pagePath}">`;
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${r}assets/img/${og}-1600.webp">
<meta property="og:type" content="website">
<link rel="icon" href="${r}assets/img/favicon.png" type="image/png">
<link rel="preload" href="${r}assets/fonts/montserrat-300.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${r}assets/fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${r}assets/css/site.css">
${alt}`;
}

function at(depth) {                            // call before building a page's markup
  AR = "../".repeat(depth + (LOC.dir ? 1 : 0));
  return "../".repeat(depth);                   // and this is the link root
}

function page({ file, pageAttr, r = "", light = false, title, desc, og, main }) {
  const asset = AR;
  const html = `<!doctype html>
<html lang="${LOC.lang}" data-root="${asset}" data-base="${r}" data-page="${pageAttr}" data-path="${file}" data-locale="${LOC.code}">
<head>
${head({ title, desc, og, r: asset, path: file })}
</head>
<body${light ? ' class="light-page"' : ""}>
<a class="skip" href="#main">${T("Skip to content")}</a>
<div data-chrome="header"></div>

<main id="main">
${main}
</main>

<div data-chrome="footer"></div>
<script src="${asset}assets/js/data${LOC.code === "en" ? "" : "." + LOC.code}.js"></script>
<script src="${asset}assets/js/site.js"></script>
</body>
</html>
`;
  if (LOC.code === "en") WRITTEN.push(file);
  const out = path.join(ROOT, LOC.dir, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log("  · " + LOC.dir + file);
}

const cta = (r = "", h = null) => `  <section class="section section--navy center">
    <div class="wrap narrow stack-l" data-stagger>
      <h2 class="d2 lines">${h || T("Tell us when, and we will tell you where")}</h2>
      <div class="acts" data-a="up"><a class="btn btn--white" href="${r}enquire.html">${T("Enquire")}</a></div>
    </div>
  </section>`;

const stats = rows => `<div class="stats" data-stagger>` + rows.map((s, i) =>
  `<div data-a="up" style="--i:${i}"><span class="v">${s.v}${s.u ? `<span class="u">${s.u}</span>` : ""}</span><span class="k">${s.k}</span></div>`).join("") + `</div>`;

const dl = (rows, cls = "") => `<dl class="dl${cls}" data-stagger>` + rows.map((row, i) =>
  `\n        <div data-a="up" style="--i:${Math.min(i, 6)}"><dt>${row[0]}</dt><dd>${row[1]}</dd></div>`).join("") + `\n      </dl>`;

const list = items => `<ul class="stack-s" data-stagger>` + items.map((t, i) =>
  `\n            <li class="small" data-a="up" style="--i:${Math.min(i, 6)}">${t}</li>`).join("") + `\n          </ul>`;

/* ---------------------------------------------------------------- HOME -- */
function home() {
  at(0);
  const v = CV.voyages;
  const feat = ["island-and-snorkelling", "shark-point-and-gulhi", "sunset-adventure"].map(s => v.find(x => x.slug === s));
  const ways = feat.map((x, i) => `            <li data-a="up" style="--i:${i}">
              <a class="way" href="excursions/${x.slug}.html">
                <span class="way__t d4">${x.title}</span>
                <span class="way__m">${x.kind} &middot; ${x.duration} &middot; ${rate(x)}</span>
                ${ARROW}
              </a>
            </li>`).join("\n");

  const slides = CV.hero.clips.map((c, i) => `        <div class="hero__s">
          ${i === 0 ? img(c.poster, c.alt, { sizes: "100vw", eager: true, cap: POSTER }) : held(c.poster)}
          <video data-src="${c.src}" data-max="${c.max}" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>
        </div>`).join("\n");

  const main = `  <section class="hero" data-hero>
    <div class="hero__bg" data-par="0.06">
${slides}
    </div>
    <div class="hero__in stack" data-stagger>
      <p class="eyebrow" data-a="fade">${T("Coravida &middot; Maldives")}</p>
      <h1 class="d1 lines">${T("A quieter way through the atolls")}</h1>
      <p data-a="up">${linkL("excursions.html", T("The excursions"))}</p>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split">
        <div class="split__t stack-l" data-stagger>
          <p class="eyebrow" data-a="up">${T("Charters")}</p>
          <h2 class="d2 lines">${T("The sea, at your own pace")}</h2>
          <p class="lede" data-a="up">${T("Private charters out of Hulhumal&eacute; Marina. One party aboard, a crew of three, and a route drawn the morning you sail.")}</p>
          <ul class="ways" data-stagger>
${ways}
          </ul>
          <p data-a="up">${link("vessel.html", T("Discover our vessels"))}</p>
        </div>
        ${fig(feat[0].img, feat[0].alt, { ratio: "r45", sizes: "(min-width:960px) 58vw, 100vw" })}
      </div>
    </div>
  </section>

  <section class="band">
    <div class="band__bg" data-par="0.1">
      ${img("poster-ray", "", { sizes: "100vw", cap: POSTER })}
      <video data-src="ray" data-max="1080" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>
    </div>
    <div class="band__in wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">${T("Below")}</p>
      <h2 class="d2 lines">${T("And then the water opens")}</h2>
      <p class="lede" data-a="up">${T("Reefs, channels, and whatever is passing through them that morning.")}</p>
    </div>
  </section>

  <section class="section center">
    <div class="wrap stack-xl">
      <div class="narrow stack-l" data-stagger>
        <p class="eyebrow" data-a="up">${T("Our vessels")}</p>
        <h2 class="d2 lines">${T("Tiffany Blanc 14")}</h2>
        <p class="lede measure" data-a="up">${T("Our flagship. Fourteen metres, refitted in 2025 — twelve aboard for the day, four asleep on the water.")}</p>
      </div>
      ${fig("vessel-guests", T("Tiffany Blanc 14 at anchor with guests aboard and swimmers alongside"), { ratio: "r169", sizes: "100vw" })}
      <div class="stack-l">
        ${stats(CV.vessel.stats)}
        <p data-a="up">${link("vessel.html", T("Go aboard"))}</p>
      </div>
    </div>
  </section>

${cta()}`;

  page({
    file: "index.html", pageAttr: "index.html", og: "poster-island",
    title: T("Coravida — Private charters through the Maldivian atolls"),
    desc: T("Private day charters and overnight excursions aboard Tiffany Blanc 14, a 14-metre flybridge cruiser berthed at Hulhumalé Marina, Malé."),
    main
  });
}

/* -------------------------------------------------------------- VESSEL -- */
function vessel() {
  at(0);
  const V = CV.vessel;
  const decks = V.decks.map((d, i) => `  <section class="section${i % 2 ? " section--mist" : ""}">
    <div class="wrap">
      <div class="split${i % 2 ? " split--f" : ""}">
        <div class="split__t stack-l" data-stagger>
          <h2 class="d3 lines">${d.t}</h2>
          <p class="lede" data-a="up">${d.d}</p>
        </div>
        ${fig(d.img, d.alt, { ratio: "r43", sizes: "(min-width:960px) 58vw, 100vw" })}
      </div>
    </div>
  </section>`).join("\n\n");

  const main = `  <section class="hero hero--mid">
    <div class="hero__bg" data-par="0.06">
      ${img("poster-anchor", T("Tiffany Blanc 14 at anchor above a reef edge"), { sizes: "100vw", eager: true, cap: POSTER })}
      <video data-src="anchor" data-max="1080" data-eager muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>
    </div>
    <div class="hero__in stack" data-stagger>
      <p class="eyebrow" data-a="fade">${T("Our vessels")}</p>
      <h1 class="d1 lines">${T("Tiffany Blanc 14")}</h1>
      <p data-a="up">${linkL("enquire.html", T("Enquire"))}</p>
    </div>
  </section>

  <section class="section center">
    <div class="wrap stack-xl">
      <div class="narrow stack-l" data-stagger>
        <p class="eyebrow" data-a="up">${T("Fourteen metres")}</p>
        <h2 class="d2 measure--wide lines">${T("Built for long, flat water")}</h2>
        <p class="lede measure" data-a="up">${T("A flybridge cruiser stripped back and refitted in 2025, run by a crew of three. Twelve aboard for the day, four asleep on the water.")}</p>
      </div>
      ${stats(V.stats)}
    </div>
  </section>

${decks}

  <section class="section">
    <div class="wrap">
      <div class="g2">
        <div class="stack-l" data-stagger>
          <p class="eyebrow" data-a="up">${T("Specification")}</p>
          <h2 class="d3 lines">${T("On paper")}</h2>
          ${dl(V.spec.map(s => [s.k, s.v]))}
        </div>
        <div class="stack-l" data-stagger>
          <p class="eyebrow" data-a="up">${T("Aboard")}</p>
          <h2 class="d3 lines">${T("What is on board")}</h2>
          ${list(V.aboard)}
        </div>
      </div>
    </div>
  </section>

${cta()}`;

  page({
    file: "vessel.html", pageAttr: "vessel.html", og: "aerial-anchor",
    title: T("Tiffany Blanc 14 — Coravida"),
    desc: T("A 14-metre flybridge cruiser refitted in 2025 and run by a crew of three, berthed at Hulhumalé Marina, Malé."),
    main
  });
}

/* ------------------------------------------------------------- VOYAGES -- */
function excursions() {
  at(0);
  const rows = CV.voyages.map((v, i) => `        <a class="vx__row" href="excursions/${v.slug}.html" data-thumb="assets/img/${v.img}-900.webp" data-alt="${esc(v.alt)}" data-a="up" style="--i:${Math.min(i,4)}">
          <span class="vx__n">${String(i + 1).padStart(2, "0")}</span>
          <span class="vx__t">${v.title}</span>
          <span class="vx__m">${v.kind} &middot; ${v.duration} &middot; ${rate(v)}</span>
          <div class="vx__mob">${fig(v.img, v.alt, { ratio: "r169", sizes: "(max-width:899px) 100vw, 1px" })}</div>
        </a>`).join("\n");

  const main = `  <section class="phero">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">${T("Excursions")}</p>
      <h1 class="d1 lines">${T("Four ways to leave the harbour")}</h1>
      <p class="lede" data-a="up">${T("Four ways out of Hulhumal&eacute; Marina, each a private charter of the whole vessel.")}</p>
    </div>
  </section>

  <section class="section--sm">
    <div class="wrap">${fig("beach-aerial", "A boat drawn up on white sand, the reef running out into deep blue", { ratio: "r169", sizes: "100vw", eager: true, par: "0.05" })}</div>
  </section>

  <section class="section">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">${T("The four")}</p>
      <div class="vx">
${rows}
      </div>
    </div>
  </section>

  <section class="section section--mist">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">${T("Rates")}</p>
      <h2 class="d2 lines">${T("What it costs to leave")}</h2>
      <p class="lede measure" data-a="up">${T("Every excursion is a private charter of the whole vessel — crew, fuel and harbour dues included.")}</p>
      <div class="rates" data-stagger>
        <div data-a="up" style="--i:0"><span class="k">${T("Half day")}</span><span class="v num">${money(950)}</span></div>
        <div data-a="up" style="--i:1"><span class="k">${T("Full day")}</span><span class="v num">${money(1350)}</span></div>
      </div>
      <p class="note" data-a="up">${T("Both figures are for a party of seven, for the whole vessel. Any other number aboard is priced on enquiry.")}</p>
    </div>
  </section>

  <section class="section">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">${T("Add-ons")}</p>
      <h2 class="d3 lines">${T("Things we can arrange")}</h2>
      ${dl(CV.addons.map(a => [a.t, `${a.d} <span class="num">${money(a.p)}</span>`]))}
      <p class="note" data-a="up">${T("A fifty percent deposit confirms a date; the balance is due seven days before departure. If the captain calls off a sailing for weather, you move the date or take the money back.")}</p>
    </div>
  </section>

${cta()}`;

  page({
    file: "excursions.html", pageAttr: "excursions.html", light: true, og: "sandbank",
    title: T("Excursions — Coravida"),
    desc: T("Four private excursions aboard Tiffany Blanc 14 out of Hulhumalé: Fish Tank and the Himmafushi sandbank, Shark Point and Gulhi, and two half days including a sunset run."),
    main
  });
}

/* -------------------------------------------------- VOYAGE DETAIL PAGES -- */
function excursionPages() {
  at(1);
  CV.voyages.forEach(v => {
    const r = "../";
    const others = CV.voyages.filter(x => x.slug !== v.slug);
    const shots = v.shots.map((s, i) => `        ${fig(s, `${v.title} — aboard Tiffany Blanc 14`, { ratio: "r43", sizes: "(min-width:760px) 31vw, 100vw", i })}`).join("\n");
    const rail = others.map(o => `        <a class="rail__item card" href="${o.slug}.html">
          ${fig(o.img, o.alt, { ratio: "r34", sizes: "(min-width:760px) 30vw, 78vw", anim: null })}
          <div class="card__m"><div class="kv"><span>${o.duration}</span><span>${o.guests}</span></div><h3 class="d4">${o.title}</h3></div>
        </a>`).join("\n");

    const main = `  <section class="hero hero--mid">
    <div class="hero__bg" data-par="0.06">${img(v.img, v.alt, { r, sizes: "100vw", eager: true })}</div>
    <div class="hero__in stack" data-stagger>
      <p class="eyebrow" data-a="fade">${v.kind} &middot; ${v.area}</p>
      <h1 class="d1 lines">${v.title}</h1>
      <p data-a="up">${linkL(r + "enquire.html", T("Enquire"))}</p>
    </div>
  </section>

  <section class="section center">
    <div class="wrap stack-xl">
      <div class="narrow stack-l" data-stagger>
        <p class="eyebrow" data-a="up">${T("The excursion")}</p>
        <h2 class="d2 measure--wide lines">${v.line}</h2>
        <p class="lede measure" data-a="up">${v.intro}</p>
      </div>
      ${stats([
      { v: v.duration.split(" ")[0], u: v.duration.split(" ").slice(1).join(" "), k: T("Duration") },
      { v: (String(v.guests).match(/\d+/) || ["12"])[0], u: "", k: T("Guests") },
      { v: v.departs.split(" · ")[0], u: "", k: T("Departs") },
      { v: v.plan[v.plan.length - 1].t, u: "", k: T("Returns") }
    ])}
    </div>
  </section>

  <section class="section section--mist">
    <div class="wrap">
      <div class="split">
        <div class="split__t sticky stack-l" data-stagger>
          <p class="eyebrow" data-a="up">${T("The day")}</p>
          <h2 class="d3 lines">${T("How it runs")}</h2>
          <p class="small" data-a="up">${T("Timings are indicative. The captain sets the final route on the morning, for tide, wind and light.")}</p>
        </div>
        <ol class="tl" data-stagger>
${v.plan.map((p, i) => `          <li data-a="up" style="--i:${Math.min(i, 6)}"><span class="tl__t">${p.t}</span><i class="tl__r"></i><div><span class="tl__h">${p.h}</span><p class="tl__d">${p.d}</p></div></li>`).join("\n")}
        </ol>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split">
        <div class="split__t sticky stack-l" data-stagger>
          <p class="eyebrow" data-a="up">${T("Rates")}</p>
          <h2 class="d3 lines">${T("What the rate covers")}</h2>
          <p class="small" data-a="up">${v.price == null
            ? T("Rates on request — we confirm in writing before anything is held.")
            : `<span class="num">${money(v.price)}</span> ` + T("for the whole vessel, seven aboard. Any other number is priced on enquiry.")}</p>
          <p data-a="up">${link(r + "excursions.html", T("All rates"))}</p>
        </div>
        <div class="g2">
          <div class="stack-s"><p class="eyebrow" data-a="up">${T("Included")}</p>${list(v.has)}</div>
          <div class="stack-s"><p class="eyebrow" data-a="up">${T("Not included")}</p>${list([
            T("Alcohol, unless the itinerary says otherwise"),
            T("Diving equipment on non-diving charters"),
            T("Add-ons listed on the excursions page"),
            T("Gratuities")])}</div>
        </div>
      </div>
    </div>
  </section>

  <section class="section--sm">
    <div class="wrap"><div class="g3">
${shots}
      </div></div>
  </section>

  <section class="section">
    <div class="wrap head-wrap">
      <div class="head">
        <div class="stack-s" data-stagger>
          <p class="eyebrow" data-a="up">${T("Also aboard")}</p>
          <h2 class="d3 lines">${T("The others")}</h2>
        </div>
        <div class="rail__nav" data-a="up">
          <button type="button" data-prev aria-label="${T("Previous")}">${CHEVL}</button>
          <button type="button" data-next aria-label="${T("Next")}">${CHEVR}</button>
        </div>
      </div>
    </div>
    <div class="rail" data-a="up"><div class="rail__track">
${rail}
    </div></div>
  </section>

${cta(r)}`;

    page({
      file: `excursions/${v.slug}.html`, pageAttr: "excursions.html", r,
      og: v.img, title: `${v.title} — ${CV.brand.name}`,
      desc: `${v.line} ${v.kind}, ${v.duration}, ${v.area}. ${T("A private charter of Tiffany Blanc 14 from Hulhumalé Marina.")}`,
      main
    });
  });
}

/* ------------------------------------------------------------- GALLERY -- */
function gallery() {
  at(0);
  const items = CV.gallery.map((g, i) => `        <figure data-a="up" style="--i:${i % 3}">
          <button type="button" data-lb="assets/img/${g.img}-1600.webp" data-cap="${esc(g.cap)}" data-alt="${esc(g.cap)}" aria-label="${T("Open")}: ${esc(g.cap)}">
            ${img(g.img, g.cap, { sizes: "(min-width:1100px) 31vw, (min-width:700px) 47vw, 100vw", eager: i < 3 })}
          </button>
        </figure>`).join("\n");

  const main = `  <section class="phero">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">${T("Gallery")}</p>
      <h1 class="d1 lines">${T("What we came back with")}</h1>
      <p class="lede" data-a="up">${T("Our vessels, the atolls, and what is under them.")}</p>
    </div>
  </section>

  <section class="section">
    <div class="wrap"><div class="mosaic" data-stagger>
${items}
    </div></div>
  </section>

${cta("", T("Come and take your own"))}`;

  page({
    file: "gallery.html", pageAttr: "gallery.html", light: true, og: "sandbank",
    title: T("Gallery — Coravida"),
    desc: T("Photographs of Tiffany Blanc 14, the Maldivian atolls she runs through, and the reefs below them."),
    main
  });
}

/* --------------------------------------------------------------- ABOUT -- */
function about() {
  at(0);
  const main = `  <section class="phero">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">${T("About")}</p>
      <h1 class="d1 lines">${T("A small operation, run properly")}</h1>
      <p class="lede" data-a="up">${T("A small fleet out of Hulhumal&eacute; Marina, and a crew who know every boat in it.")}</p>
    </div>
  </section>

  <section class="section--sm">
    <div class="wrap">${fig("aerial-marina", T("Tiffany Blanc 14 leaving Hulhumalé Marina, seen from the air"), { ratio: "r169", sizes: "100vw", eager: true, par: "0.05" })}</div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split">
        <div class="split__t sticky stack-l" data-stagger>
          <p class="eyebrow" data-a="up">${T("The company")}</p>
          <h2 class="d2 lines">${T("The boat you were shown is the boat you sail on")}</h2>
        </div>
        <div class="stack-l" data-stagger>
          <p class="lede measure--wide" data-a="up">${T("We keep the fleet small on purpose. The boat you were shown is the boat you sail on, nothing is shared with another party, and nothing is subcontracted.")}</p>
          <p class="lede measure--wide" data-a="up">${T("Three crew take her out, and it is the same three every sailing &mdash; a captain who reads the weather, a chef, and a deckhand who has the ladder down before you ask.")}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split">
        <div class="split__t sticky stack-l" data-stagger>
          <p class="eyebrow" data-a="up">${T("The crew")}</p>
          <h2 class="d3 lines">${T("Three people, every sailing")}</h2>
        </div>
        ${dl([
          [T("Captain"), T("Reads the weather, sets the route, and decides whether the day happens at all.")],
          [T("Chef"), T("Cooks aboard, off the Mal&eacute; market that morning.")],
          [T("Deckhand"), T("Lines, tanks, tender and ladder, and the rinse down afterwards.")]
        ])}
      </div>
    </div>
  </section>

  <section class="section section--mist">
    <div class="wrap">
      <div class="split split--f">
        <div class="split__t stack-l" data-stagger>
          <p class="eyebrow" data-a="up">${T("Reef and rubbish")}</p>
          <h2 class="d3 lines">${T("What we do about it")}</h2>
          ${list([T("No single-use plastic aboard."), T("Reef-safe sunscreen supplied."), T("We anchor on sand, never on coral.")])}
        </div>
        ${fig("ray-sand", "A stingray moving across pale sand in shallow water", { ratio: "r43", sizes: "(min-width:960px) 58vw, 100vw" })}
      </div>
    </div>
  </section>

${cta()}`;

  page({
    file: "about.html", pageAttr: "about.html", light: true, og: "aerial-marina",
    title: T("About — Coravida"),
    desc: T("Coravida runs a small fleet out of Hulhumalé Marina, crewed by the same people on every sailing."),
    main
  });
}

/* ------------------------------------------------------------- CONTACT -- */
function contact() {
  at(0);
  const faq = `<div class="acc" data-stagger>` + CV.faq.map((f, i) => `
        <div class="acc__i" data-a="up" style="--i:${Math.min(i, 5)}"><button class="acc__b" type="button">${f.q}<i aria-hidden="true"></i></button>
          <div class="acc__p"><div><p class="small">${f.a}</p></div></div></div>`).join("") + `
      </div>`;

  const main = `  <section class="phero">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">${T("Contact")}</p>
      <h1 class="d1 lines">${T("Talk to the crew")}</h1>
      <p class="lede" data-a="up">${T("A telephone number, a jetty, and someone who answers before the boat leaves.")}</p>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split">
        <div class="split__t sticky stack-l" data-stagger>
          <p class="eyebrow" data-a="up">${T("Reach us")}</p>
          ${dl([
            [T("Telephone"), `<a href="${CV.brand.phoneHref}">${CV.brand.phone}</a>`],
            [T("WhatsApp"), `<a href="${CV.brand.whatsappHref}" rel="noopener">${CV.brand.phone}</a>`],
            [T("Email"), `<a href="mailto:${CV.brand.email}">${CV.brand.email}</a>`],
            [T("Berth"), CV.brand.marina],
            [T("Office"), CV.brand.address.join(", ")],
            [T("Hours"), CV.brand.hours]
          ])}
        </div>
        <div data-a="up">
          <form data-ok="okC" class="stack-l" novalidate>
            <div class="fg fg2">
              <div class="field"><label for="n">${T("Name")}</label><input id="n" name="name" type="text" autocomplete="name" required></div>
              <div class="field"><label for="e">${T("Email")}</label><input id="e" name="email" type="email" autocomplete="email" required></div>
            </div>
            <div class="fg fg2">
              <div class="field"><label for="t">${T("Telephone")}</label><input id="t" name="phone" type="tel" autocomplete="tel"></div>
              <div class="field"><label for="s">${T("Subject")}</label><select id="s" name="subject">
                <option>${T("General enquiry")}</option><option>${T("Charter dates")}</option><option>${T("Diving")}</option><option>${T("A celebration")}</option><option>${T("Press")}</option>
              </select></div>
            </div>
            <div class="field"><label for="m">${T("Message")}</label><textarea id="m" name="message" required></textarea></div>
            <div class="acts"><button class="btn" type="submit">${T("Send")}</button></div>
            <p class="note">${T("A demonstration form &mdash; nothing is sent.")}</p>
          </form>
          <div class="ok" id="okC">
            <div class="stack-l">
              <p class="eyebrow">${T("Received")}</p>
              <h2 class="d2">${T("Thank you")}</h2>
              <p class="lede measure">${T("The crew reply within a day, usually sooner.")}</p>
              <div class="acts"><a class="btn btn--ghost" href="index.html">${T("Back to the harbour")}</a></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--mist">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">${T("Questions")}</p>
      <h2 class="d2 lines">${T("Before you sail")}</h2>
      ${faq}
    </div>
  </section>

  <section class="section--sm section--tail">
    <div class="wrap">
      <figure>
        ${fig("aerial-marina", T("Tiffany Blanc 14 leaving Hulhumalé Marina"), { ratio: "r169", sizes: "100vw", par: "0.05" })}
        <figcaption class="cap" data-a="up"><span class="k">${T("Hulhumal&eacute; Marina")}</span><span class="d4">${T("Ten minutes from Velana International Airport")}</span></figcaption>
      </figure>
    </div>
  </section>

${cta("", T("Or simply tell us your dates"))}`;

  page({
    file: "contact.html", pageAttr: "contact.html", light: true, og: "aerial-marina",
    title: T("Contact — Coravida"),
    desc: T("Telephone, WhatsApp and email for Coravida, plus the berth at Hulhumalé Marina and answers to the usual questions."),
    main
  });
}

/* ------------------------------------------------------------- ENQUIRE -- */
function enquire() {
  at(0);
  const chips = CV.voyages.map((v, i) => `              <input type="radio" id="v${i}" name="excursion" value="${v.slug}"${i === 0 ? " checked" : ""}>
              <label for="v${i}">${v.title} &middot; ${v.kind}</label>`).join("\n");
  const extras = CV.addons.map((a, i) => `              <input type="checkbox" id="x${i}" name="extra" value="${a.t.toLowerCase().replace(/[^a-z]+/g, "-")}" data-label="${esc(a.t)}" data-price="${a.p}">
              <label for="x${i}">${a.t} &middot; ${a.p}</label>`).join("\n");

  const main = `  <section class="hero hero--mid">
    <div class="hero__bg" data-par="0.06">
      ${img("vessel-guests", T("Tiffany Blanc 14 at anchor with guests aboard"), { sizes: "100vw", eager: true })}
    </div>
    <div class="hero__in stack" data-stagger>
      <p class="eyebrow" data-a="fade">${T("Enquire")}</p>
      <h1 class="d1 lines">${T("Reserve a vessel")}</h1>
      <p class="lede lede--light" data-a="up">${T("Four short steps. Nothing is charged and no date is held until we have written back.")}</p>
    </div>
  </section>

  <section class="section">
    <div class="wrap narrow">
      <ul class="steps" data-a="up">
        <li class="on">${T("Excursion")}</li><li>${T("Dates")}</li><li>${T("Details")}</li><li>${T("Review")}</li>
      </ul>

      <form id="enquire" novalidate>
        <div class="step on">
          <div class="stack-l">
            <div class="stack-s"><p class="eyebrow">${T("Step one")}</p><h2 class="d3">${T("Which excursion?")}</h2></div>
            <div class="chips">
${chips}
            </div>
            <p class="note">${T("Every excursion is a private charter of the whole vessel. If none of these fit, choose the closest and tell us in step three.")}</p>
            <div class="acts"><button class="btn" type="button" data-next>${T("Continue")}</button></div>
          </div>
        </div>

        <div class="step">
          <div class="stack-l">
            <div class="stack-s"><p class="eyebrow">${T("Step two")}</p><h2 class="d3">${T("When, and how many?")}</h2></div>
            <div class="fg fg2">
              <div class="field"><label for="d1">${T("Preferred date")}</label><input type="date" id="d1" name="date" required></div>
              <div class="field"><label for="d2">${T("Alternative date")}</label><input type="date" id="d2" name="alt"></div>
            </div>
            <div class="fg fg2">
              <div class="field"><label for="g">${T("Guests")}</label><select id="g" name="guests" required>
${[2, 4, 6, 7, 8, 10, 12].map(n => `                <option value="${n}"${n === CV.rates.pax ? " selected" : ""}>${n} ${T("guests")}${n === CV.rates.pax ? " · " + T("priced") : ""}</option>`).join("\n")}
              </select></div>
              <div class="field"><label for="p">${T("Departure point")}</label><select id="p" name="pickup">
                <option>${T("Hulhumal&eacute; Marina")}</option><option>${T("Velana International Airport jetty")}</option>
                <option>${T("Mal&eacute;, west harbour")}</option><option>${T("A resort in North or South Mal&eacute; Atoll")}</option>
              </select></div>
            </div>
            <div class="acts"><button class="btn btn--ghost" type="button" data-prev>${T("Back")}</button><button class="btn" type="button" data-next>${T("Continue")}</button></div>
          </div>
        </div>

        <div class="step">
          <div class="stack-l">
            <div class="stack-s"><p class="eyebrow">${T("Step three")}</p><h2 class="d3">${T("Anything to add?")}</h2></div>
            <div class="chips">
${extras}
            </div>
            <div class="fg fg2">
              <div class="field"><label for="nm">${T("Name")}</label><input type="text" id="nm" name="name" autocomplete="name" required></div>
              <div class="field"><label for="em">${T("Email")}</label><input type="email" id="em" name="email" autocomplete="email" required></div>
            </div>
            <div class="fg fg2">
              <div class="field"><label for="ph">${T("Telephone or WhatsApp")}</label><input type="tel" id="ph" name="phone" autocomplete="tel"></div>
              <div class="field"><label for="st">${T("Where are you staying?")}</label><input type="text" id="st" name="staying" placeholder="${T("Resort, guesthouse or hotel")}"></div>
            </div>
            <div class="field"><label for="no">${T("Anything we should know")}</label><textarea id="no" name="notes" placeholder="${T("Diet, diving certification, occasion, children aboard")}"></textarea></div>
            <div class="acts"><button class="btn btn--ghost" type="button" data-prev>${T("Back")}</button><button class="btn" type="button" data-next>${T("Review")}</button></div>
          </div>
        </div>

        <div class="step">
          <div class="stack-l">
            <div class="stack-s"><p class="eyebrow">${T("Step four")}</p><h2 class="d3">${T("Does this look right?")}</h2></div>
            <div class="sum">
              <div class="sum__r"><span class="k">${T("Excursion")}</span><span data-s-v>&mdash;</span></div>
              <div class="sum__r"><span class="k">${T("Where")}</span><span data-s-a>&mdash;</span></div>
              <div class="sum__r"><span class="k">${T("Date")}</span><span data-s-d>&mdash;</span></div>
              <div class="sum__r"><span class="k">${T("Guests")}</span><span data-s-g>&mdash;</span></div>
              <div class="sum__r"><span class="k">${T("Add-ons")}</span><span data-s-e>&mdash;</span></div>
              <div class="sum__t"><span class="k">${T("Indicative total")}</span><span class="v" data-s-t>&mdash;</span></div>
            </div>
            <p class="note">${T("Package rates cover a party of seven, for the whole vessel; any other number aboard is priced on enquiry. We confirm the final figure in writing before anything is held. This form is a demonstration and sends nothing.")}</p>
            <div class="acts"><button class="btn btn--ghost" type="button" data-prev>${T("Back")}</button><button class="btn" type="submit">${T("Send the enquiry")}</button></div>
          </div>
        </div>
      </form>

      <div class="ok" id="enquireOk">
        <div class="stack-l">
          <p class="eyebrow">${T("Received")}</p>
          <h2 class="d2">${T("We have it")}</h2>
          <p class="lede measure">${T("The crew reply within a day, usually sooner. If your dates are tight, call the marina office.")}</p>
          <div class="acts"><a class="btn" href="index.html">${T("Back to the harbour")}</a><a class="btn btn--ghost" href="${CV.brand.phoneHref}">${CV.brand.phone}</a></div>
        </div>
      </div>
    </div>
  </section>`;

  page({
    file: "enquire.html", pageAttr: "enquire.html", og: "vessel-guests",
    title: T("Enquire — Coravida"),
    desc: T("Reserve Tiffany Blanc 14 for a day, a sunset or twelve nights at anchor."),
    main
  });
}

/* ----------------------------------------------------------------- 404 -- */
function notfound() {
  at(0);
  const main = `  <section class="phero">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">404</p>
      <h1 class="d2 lines">${T("This one drifted")}</h1>
      <p class="lede measure" data-a="up">${T("The page you asked for is not at this address.")}</p>
      <div class="acts" data-a="up">
        <a class="btn" href="index.html">${T("Back to the harbour")}</a>
        <a class="btn btn--ghost" href="excursions.html">${T("See the excursions")}</a>
      </div>
    </div>
  </section>

  <section class="section--sm section--tail">
    <div class="wrap">${fig("aerial-anchor", T("Tiffany Blanc 14 alone at anchor above a reef edge"), { ratio: "r169", sizes: "100vw", par: "0.05" })}</div>
  </section>`;

  page({
    file: "404.html", pageAttr: "404.html", light: true, og: "aerial-anchor",
    title: T("Not found — Coravida"), desc: T("That page is not at this address."), main
  });
}

const SITE = "https://muaaadh.github.io/coravida/";

for (const loc of LOCALES) {
  LOC = loc;
  if (loc.code === "en") { CV = EN; DICT = {}; }
  else {
    const src = require(path.join(__dirname, "i18n", loc.code + ".js"));
    DICT = src.ui || {};
    CV = deepMerge(EN, src.content || {});
    CV.ui = src.chrome || {};                  // the strings site.js needs at runtime
    fs.mkdirSync(path.join(ROOT, "assets/js"), { recursive: true });
    fs.writeFileSync(path.join(ROOT, `assets/js/data.${loc.code}.js`),
      "/* Generated by tools/build.js — edit tools/i18n/" + loc.code + ".js, not this. */\n" +
      "(function(){var w=typeof window!==\"undefined\"?window:global;w.CV=" +
      JSON.stringify(CV, null, 1) + ";})();\n");
  }
  console.log(loc.code + ":");
  home(); vessel(); excursions(); excursionPages(); gallery(); about(); contact(); enquire(); notfound();
}

/* one sitemap for all four languages, each URL declaring its alternates */
const urls = [];
for (const loc of LOCALES) for (const f of WRITTEN) if (!/404\.html$/.test(f)) urls.push(loc.dir + f);
fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  urls.map(u => {
    const file = u.replace(/^(ru|zh|de)\//, "");
    const alts = LOCALES.map(l =>
      `    <xhtml:link rel="alternate" hreflang="${l.lang}" href="${SITE}${l.dir}${file}"/>`).join("\n");
    return `  <url>\n    <loc>${SITE}${u}</loc>\n${alts}\n` +
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${file}"/>\n  </url>`;
  }).join("\n") + "\n</urlset>\n");
console.log(`\nsitemap.xml — ${urls.length} URLs`);

let gaps = 0;
for (const [code, set] of MISSING) {
  gaps += set.size;
  console.log(`\n${code}: ${set.size} untranslated`);
  [...set].slice(0, 12).forEach(s => console.log("   ¬ " + s));
}
console.log(gaps ? `\n${gaps} strings still in English` : "\nevery string translated");
