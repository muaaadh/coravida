/* ==========================================================================
   CORAVIDA — site generator.   node tools/build.js
   Emits every HTML page from assets/js/data.js, motion attributes included.
   ========================================================================== */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
global.window = {};
require(path.join(ROOT, "assets/js/data.js"));
const CV = global.window.CV;

const IMGDIR = path.join(ROOT, "assets/img");
const have = new Set(fs.readdirSync(IMGDIR));
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = n => "USD " + Number(n).toLocaleString("en-US");
function season(str) {
  if (/year round/i.test(str)) return { v: "Year", u: "round", k: "Season" };
  const m = str.match(/^(\w{3})\w*\s*[–-]\s*(\w{3})/);
  return m ? { v: m[1], u: "– " + m[2], k: "Season" } : { v: str, u: "", k: "Season" };
}
const ARROW = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 9.5 9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.1" stroke-linecap="square"/></svg>';
const CHEVL = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M7.5 1.5 3 6l4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>';
const CHEVR = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4.5 1.5 9 6l-4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>';

/* responsive <img> */
function img(name, alt, { r = "", sizes = "100vw", eager = false } = {}) {
  const set = [900, 1600, 2200].filter(w => have.has(`${name}-${w}.webp`));
  const src = `${r}assets/img/${name}-${set[Math.min(1, set.length - 1)]}.webp`;
  const srcset = set.map(w => `${r}assets/img/${name}-${w}.webp ${w}w`).join(", ");
  return `<img src="${src}" srcset="${srcset}" sizes="${sizes}" alt="${esc(alt)}"` +
    (eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"') + ">";
}
/* animated figure: clip-wipe reveal + inner scale */
function fig(name, alt, { ratio = "r43", href = null, r = "", sizes = "(min-width:960px) 58vw, 100vw", z = true, eager = false, anim = "clip", i = null, par = null } = {}) {
  const inner = img(name, alt, { r, sizes, eager });
  const cls = `fig ${ratio}${z ? " fig--z" : ""}`;
  const a = (anim ? ` data-a="${anim}"${i !== null ? ` style="--i:${i}"` : ""}` : "") + (par ? ` data-par="${par}"` : "");
  return href ? `<a class="${cls}" href="${href}"${a}>${inner}</a>` : `<div class="${cls}"${a}>${inner}</div>`;
}
const link = (href, text) => `<a class="link" href="${href}">${text} ${ARROW}</a>`;
const linkL = (href, text) => `<a class="link link--light" href="${href}">${text} ${ARROW}</a>`;

function head({ title, desc, og, r }) {
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
<link rel="stylesheet" href="${r}assets/css/site.css">`;
}

function page({ file, pageAttr, r = "", light = false, title, desc, og, main }) {
  const html = `<!doctype html>
<html lang="en" data-root="${r}" data-page="${pageAttr}">
<head>
${head({ title, desc, og, r })}
</head>
<body${light ? ' class="light-page"' : ""}>
<a class="skip" href="#main">Skip to content</a>
<div data-chrome="header"></div>

<main id="main">
${main}
</main>

<div data-chrome="footer"></div>
<script src="${r}assets/js/data.js"></script>
<script src="${r}assets/js/site.js"></script>
</body>
</html>
`;
  const out = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log("· " + file);
}

const cta = (r = "", h = "Tell us when, and we will tell you where") => `  <section class="section section--navy center">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">Hulhumal&eacute; Marina</p>
      <h2 class="d2 lines">${h}</h2>
      <div class="acts" data-a="up">
        <a class="btn btn--white" href="${r}enquire.html">Reserve the vessel</a>
        <a class="btn btn--line" href="${r}contact.html">Contact us</a>
      </div>
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
  const v = CV.voyages;
  const feat = ["a-day-at-sea", "sandbank-sunset", "twelve-nights-at-anchor"].map(s => v.find(x => x.slug === s));
  const cards = feat.map((x, i) => `        <a class="card" href="voyages/${x.slug}.html" data-stagger>
          ${fig(x.img, x.alt, { ratio: "r34", sizes: "(min-width:760px) 31vw, 100vw", i })}
          <div class="card__m" data-a="up" style="--i:${i}"><div class="kv"><span>${x.duration}</span><span>${x.guests}</span></div>
            <h3 class="d4">${x.title}</h3><p class="small">${x.line}</p>
            <p class="small" style="color:var(--body)">From ${money(x.from)}</p></div>
        </a>`).join("\n");

  const detail = [
    ["champagne", "Sparkling wine poured over a fruit platter on the gunwale", "Poured on the way out"],
    ["platter", "A tray of fruit and sparkling wine set on the bow", "Set before departure"],
    ["floats", "Two guests drifting on floats in deep blue water", "Nowhere to be"]
  ].map(([n, a, c], i) => `        <figure style="margin:0">
          ${fig(n, a, { ratio: "r43", sizes: "(min-width:760px) 31vw, 100vw", i })}
          <figcaption class="cap" data-a="up" style="--i:${i}"><span class="k">${c}</span></figcaption>
        </figure>`).join("\n");

  const mqWords = ["Hulhumal&eacute; Marina", "North Mal&eacute; Atoll", "Twelve guests", "One vessel", "Crew of three", "Since 2019"];
  const mqRun = mqWords.map(w => `<span>${w}<i>&mdash;</i></span>`).join("");

  const main = `  <section class="hero">
    <div class="hero__bg" data-par="0.06">
      ${img("poster-hero", "Tiffany Blanc 14 underway off Malé", { sizes: "100vw", eager: true })}
      <video data-src="hero" data-eager muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>
    </div>
    <div class="hero__in stack" data-stagger>
      <p class="eyebrow" data-a="fade">Coravida &middot; Maldives</p>
      <h1 class="d1 lines">A quieter way through the atolls</h1>
      <p data-a="up">${linkL("voyages.html", "The voyages")}</p>
    </div>
    <div class="hero__cue" aria-hidden="true"><i></i>Scroll</div>
  </section>

  <section class="section center">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">One vessel</p>
      <h2 class="d2 measure--wide lines" style="margin-inline:auto">The sea, at your own pace</h2>
      <p class="lede measure" data-scrub>Private charters out of Hulhumal&eacute; Marina aboard Tiffany Blanc 14. One party aboard, a crew of three, and a route drawn the morning you sail.</p>
      <p data-a="up">${link("vessel.html", "Discover the vessel")}</p>
    </div>
  </section>

  <section class="section--sm" style="padding-top:0">
    <div class="wrap">
      <div class="g3">
${cards}
      </div>
    </div>
  </section>

  <section class="mq" aria-hidden="true">
    <div class="mq__s"><div class="mq__t">${mqRun}${mqRun}</div></div>
  </section>

  <section class="band">
    <div class="band__bg" data-par="0.1">
      ${img("poster-ray", "", { sizes: "100vw" })}
      <video data-src="ray" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>
    </div>
    <div class="band__in wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">Below</p>
      <h2 class="d2 lines">And then the water opens</h2>
      <p class="lede" data-a="up">Reefs, channels, and whatever is passing through them that morning.</p>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split">
        <div class="split__t sticky stack-l" data-stagger>
          <p class="eyebrow" data-a="up">The vessel</p>
          <h2 class="d2 lines">Tiffany Blanc 14</h2>
          <p class="lede" data-a="up">Fourteen metres, refitted in 2025. Twelve aboard for the day, four asleep on the water.</p>
          <p data-a="up">${link("vessel.html", "Go aboard")}</p>
        </div>
        <div class="stack-l">
          ${fig("vessel-guests", "Tiffany Blanc 14 at anchor with guests aboard and swimmers alongside", { ratio: "r43", sizes: "(min-width:960px) 58vw, 100vw" })}
          ${stats(CV.vessel.stats)}
        </div>
      </div>
    </div>
  </section>

  <section class="section--sm" style="padding-bottom:var(--sec)">
    <div class="wrap">
      <div class="g3">
${detail}
      </div>
    </div>
  </section>

${cta()}`;

  page({
    file: "index.html", pageAttr: "index.html", og: "vessel-guests",
    title: "Coravida — Private charters through the Maldivian atolls",
    desc: "Private day charters and overnight voyages aboard Tiffany Blanc 14, a 14-metre flybridge cruiser berthed at Hulhumalé Marina, Malé.",
    main
  });
}

/* -------------------------------------------------------------- VESSEL -- */
function vessel() {
  const V = CV.vessel;
  const decks = V.decks.map((d, i) => `  <section class="section${i % 2 ? " section--mist" : ""}">
    <div class="wrap">
      <div class="split${i % 2 ? " split--f" : ""}">
        <div class="split__t stack-l" data-stagger>
          <p class="eyebrow" data-a="up">${d.n}</p>
          <h2 class="d3 lines">${d.t}</h2>
          <p class="lede" data-a="up">${d.d}</p>
        </div>
        ${fig(d.img, d.alt, { ratio: "r43", sizes: "(min-width:960px) 58vw, 100vw" })}
      </div>
    </div>
  </section>`).join("\n\n");

  const main = `  <section class="hero hero--mid">
    <div class="hero__bg" data-par="0.06">
      ${img("poster-anchor", "Tiffany Blanc 14 at anchor above a reef edge", { sizes: "100vw", eager: true })}
      <video data-src="anchor" data-eager muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>
    </div>
    <div class="hero__in stack" data-stagger>
      <p class="eyebrow" data-a="fade">The vessel</p>
      <h1 class="d1 lines">Tiffany Blanc 14</h1>
      <p data-a="up">${linkL("enquire.html", "Reserve the vessel")}</p>
    </div>
  </section>

  <section class="section center">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">Fourteen metres</p>
      <h2 class="d2 measure--wide lines" style="margin-inline:auto">Built for long, flat water</h2>
      <p class="lede measure" data-scrub>A flybridge cruiser stripped back and refitted in 2025, run by a crew of three. Twelve aboard for the day, four asleep on the water.</p>
    </div>
  </section>

  <section class="section--sm" style="padding-top:0">
    <div class="wrap">${stats(V.stats)}</div>
  </section>

${decks}

  <section class="section">
    <div class="wrap">
      <div class="g2">
        <div class="stack-l" data-stagger>
          <p class="eyebrow" data-a="up">Specification</p>
          <h2 class="d3 lines">On paper</h2>
          ${dl(V.spec.map(s => [s.k, s.v]))}
        </div>
        <div class="stack-l" data-stagger>
          <p class="eyebrow" data-a="up">Aboard</p>
          <h2 class="d3 lines">What is on board</h2>
          ${list(V.aboard)}
        </div>
      </div>
    </div>
  </section>

  <section class="band">
    <div class="band__bg" data-par="0.1">${img("aerial-anchor", "", { sizes: "100vw" })}</div>
    <div class="band__in wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">Capacity</p>
      <h2 class="d2 lines">Twelve aboard for the day. Four asleep on the water.</h2>
    </div>
  </section>

${cta()}`;

  page({
    file: "vessel.html", pageAttr: "vessel.html", og: "aerial-anchor",
    title: "Tiffany Blanc 14 — Coravida",
    desc: "A 14-metre flybridge cruiser refitted in 2025 and run by a crew of three, berthed at Hulhumalé Marina, Malé.",
    main
  });
}

/* ------------------------------------------------------------- VOYAGES -- */
function voyages() {
  const rows = CV.voyages.map((v, i) => `  <section class="section${i % 2 ? " section--mist" : ""}">
    <div class="wrap">
      <div class="split${i % 2 ? " split--f" : ""}">
        <div class="split__t stack-l" data-stagger>
          <p class="eyebrow" data-a="up">${v.kind}</p>
          <h2 class="d2 lines">${v.title}</h2>
          <p class="lede" data-a="up">${v.line}</p>
          <div class="kv" data-a="up"><span>${v.duration}</span><span>${v.guests}</span><span>${v.season}</span></div>
          <p class="small" data-a="up">From ${money(v.from)} &middot; the whole vessel</p>
          <p data-a="up">${link(`voyages/${v.slug}.html`, "See the voyage")}</p>
        </div>
        ${fig(v.img, v.alt, { ratio: "r32", href: `voyages/${v.slug}.html`, sizes: "(min-width:960px) 58vw, 100vw" })}
      </div>
    </div>
  </section>`).join("\n\n");

  const main = `  <section class="phero">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">Voyages</p>
      <h1 class="d1 lines">Five ways to leave the harbour</h1>
      <p class="lede" data-scrub>Every voyage is a private charter of the whole vessel, crew included, out of Hulhumal&eacute; Marina.</p>
    </div>
  </section>

${rows}

  <section class="section">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">Rates</p>
      <h2 class="d2 lines">What it costs to leave</h2>
      <p class="lede measure" data-a="up">Whole-vessel rates in US dollars. Crew, fuel within the itinerary and harbour dues are included.</p>
      ${dl(CV.voyages.map(v => [`<a href="voyages/${v.slug}.html">${v.title}</a>`,
        `${v.duration} &middot; ${v.guests} &middot; ${v.season} &middot; <span class="num">${money(v.from)}</span>`]), " dl--lead")}
    </div>
  </section>

  <section class="section section--mist">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">Add-ons</p>
      <h2 class="d3 lines">Things we can arrange</h2>
      ${dl(CV.addons.map(a => [a.t, `${a.d} <span class="num">${money(a.p)}</span>`]))}
      <p class="note" data-a="up">A fifty percent deposit confirms a date; the balance is due seven days before departure. If the captain calls off a sailing for weather, you move the date or take the money back.</p>
    </div>
  </section>

${cta()}`;

  page({
    file: "voyages.html", pageAttr: "voyages.html", light: true, og: "sandbank",
    title: "Voyages — Coravida",
    desc: "Five private charters aboard Tiffany Blanc 14: a day at sea, sandbank and sunset, the manta passage, two nights north, and twelve nights at anchor.",
    main
  });
}

/* -------------------------------------------------- VOYAGE DETAIL PAGES -- */
function voyagePages() {
  CV.voyages.forEach(v => {
    const r = "../";
    const others = CV.voyages.filter(x => x.slug !== v.slug);
    const shots = v.shots.map((s, i) => `        ${fig(s, `${v.title} — aboard Tiffany Blanc 14`, { ratio: "r43", r, sizes: "(min-width:760px) 31vw, 100vw", i })}`).join("\n");
    const rail = others.map(o => `        <a class="rail__item card" href="${o.slug}.html">
          ${fig(o.img, o.alt, { ratio: "r34", r, sizes: "(min-width:760px) 30vw, 78vw", anim: null })}
          <div class="card__m"><div class="kv"><span>${o.duration}</span><span>${o.guests}</span></div><h3 class="d4">${o.title}</h3></div>
        </a>`).join("\n");

    const main = `  <section class="hero hero--mid">
    <div class="hero__bg" data-par="0.06">${img(v.img, v.alt, { r, sizes: "100vw", eager: true })}</div>
    <div class="hero__in stack" data-stagger>
      <p class="eyebrow" data-a="fade">${v.kind} &middot; ${v.area}</p>
      <h1 class="d1 lines">${v.title}</h1>
      <p data-a="up">${linkL(r + "enquire.html", "Reserve this voyage")}</p>
    </div>
  </section>

  <section class="section center">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">The voyage</p>
      <h2 class="d2 measure--wide lines" style="margin-inline:auto">${v.line}</h2>
      <p class="lede measure" data-scrub>${v.intro}</p>
    </div>
  </section>

  <section class="section--sm" style="padding-top:0">
    <div class="wrap">${stats([
      { v: v.duration.split(" ")[0], u: v.duration.split(" ").slice(1).join(" "), k: "Duration" },
      { v: (String(v.guests).match(/\d+/) || ["12"])[0], u: "", k: "Guests" },
      season(v.season),
      { v: money(v.from).replace("USD ", ""), u: "USD", k: "From" }
    ])}</div>
  </section>

  <section class="section section--mist">
    <div class="wrap">
      <div class="split">
        <div class="split__t sticky stack-l" data-stagger>
          <p class="eyebrow" data-a="up">The day</p>
          <h2 class="d3 lines">How it runs</h2>
          <p class="small" data-a="up">Timings are indicative. The captain sets the final route on the morning, for tide, wind and light.</p>
        </div>
        ${dl(v.plan.map(p => [p.t, `${p.h} &mdash; ${p.d}`]))}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split">
        <div class="split__t sticky stack-l" data-stagger>
          <p class="eyebrow" data-a="up">Rates</p>
          <h2 class="d3 lines">What the rate covers</h2>
          <p class="small" data-a="up">From ${money(v.from)} for the whole vessel, not per guest.</p>
          <p data-a="up">${link(r + "voyages.html", "All rates")}</p>
        </div>
        <div class="g2">
          <div class="stack-s"><p class="eyebrow" data-a="up">Included</p>${list(v.has)}</div>
          <div class="stack-s"><p class="eyebrow" data-a="up">Not included</p>${list([
            "Alcohol, unless the itinerary says otherwise",
            "Diving equipment on non-diving charters",
            "Add-ons listed on the voyages page",
            "Gratuities"])}</div>
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
    <div class="wrap" style="margin-bottom:clamp(2rem,4vw,3rem)">
      <div class="head">
        <div class="stack-s" data-stagger>
          <p class="eyebrow" data-a="up">Also aboard</p>
          <h2 class="d3 lines">Other voyages</h2>
        </div>
        <div class="rail__nav" data-a="up">
          <button type="button" data-prev aria-label="Previous">${CHEVL}</button>
          <button type="button" data-next aria-label="Next">${CHEVR}</button>
        </div>
      </div>
    </div>
    <div class="rail" data-a="up"><div class="rail__track">
${rail}
    </div></div>
  </section>

${cta(r)}`;

    page({
      file: `voyages/${v.slug}.html`, pageAttr: "voyages.html", r,
      og: v.img, title: `${v.title} — Coravida`,
      desc: `${v.line} ${v.duration}, ${v.area}. A private charter of Tiffany Blanc 14 from Hulhumalé Marina.`,
      main
    });
  });
}

/* ------------------------------------------------------------- GALLERY -- */
function gallery() {
  const cats = [["all", "Everything"], ["vessel", "The vessel"], ["aboard", "Aboard"], ["water", "The water"], ["islands", "Islands"]];
  const bar = cats.map(([k, l], i) => `        <button type="button" data-filter="${k}"${i === 0 ? ' class="on"' : ""}>${l}</button>`).join("\n");
  const items = CV.gallery.map((g, i) => `        <figure data-cat="${g.cat}" data-a="up" style="--i:${i % 3}">
          <button type="button" data-lb="assets/img/${g.img}-1600.webp" data-cap="${esc(g.cap)}" data-alt="${esc(g.cap)}" aria-label="Open: ${esc(g.cap)}">
            ${img(g.img, g.cap, { sizes: "(min-width:1100px) 31vw, (min-width:700px) 47vw, 100vw", eager: i < 3 })}
          </button>
        </figure>`).join("\n");

  const main = `  <section class="phero">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">Gallery</p>
      <h1 class="d1 lines">What we came back with</h1>
      <p class="lede" data-a="up">The vessel, the atolls, and what is under them.</p>
    </div>
  </section>

  <section class="section--sm">
    <div class="wrap"><div class="filters" data-filters data-a="up">
${bar}
    </div></div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="wrap"><div class="mosaic">
${items}
    </div></div>
  </section>

${cta("", "Come and take your own")}`;

  page({
    file: "gallery.html", pageAttr: "gallery.html", light: true, og: "sandbank",
    title: "Gallery — Coravida",
    desc: "Photographs of Tiffany Blanc 14, the Maldivian atolls she runs through, and the reefs below them.",
    main
  });
}

/* --------------------------------------------------------------- ABOUT -- */
function about() {
  const main = `  <section class="phero">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">About</p>
      <h1 class="d1 lines">A small operation, run properly</h1>
      <p class="lede" data-a="up">One vessel out of Hulhumal&eacute; Marina, and the same crew aboard every time.</p>
    </div>
  </section>

  <section class="section--sm">
    <div class="wrap">${fig("aerial-marina", "Tiffany Blanc 14 leaving Hulhumalé Marina, seen from the air", { ratio: "r169", sizes: "100vw", eager: true, par: "0.05" })}</div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split">
        <div class="split__t sticky stack-l" data-stagger>
          <p class="eyebrow" data-a="up">The company</p>
          <h2 class="d2 lines">One vessel is the point</h2>
        </div>
        <div class="stack-l" data-stagger>
          <p class="lede measure--wide" data-scrub>We run a single boat rather than a fleet, so the vessel you were shown is the vessel you sail on. Nothing is shared and nothing is subcontracted.</p>
          <p class="lede measure--wide" data-a="up">Three crew take her out, and it is the same three every sailing &mdash; a captain who reads the weather, a chef, and a deckhand who has the ladder down before you ask.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--mist">
    <div class="wrap">${stats([
      { v: "2019", u: "", k: "Founded" }, { v: "1", u: "", k: "Vessel" },
      { v: "3", u: "", k: "Crew" }, { v: "12", u: "", k: "Guests" }
    ])}</div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split">
        <div class="split__t sticky stack-l" data-stagger>
          <p class="eyebrow" data-a="up">The crew</p>
          <h2 class="d3 lines">Three people, every sailing</h2>
        </div>
        ${dl([
          ["Captain", "Reads the weather, sets the route, and decides whether the day happens at all."],
          ["Chef", "Cooks aboard, off the Mal&eacute; market that morning."],
          ["Deckhand", "Lines, tanks, tender and ladder, and the rinse down afterwards."]
        ])}
      </div>
    </div>
  </section>

  <section class="section section--mist">
    <div class="wrap">
      <div class="split split--f">
        <div class="split__t stack-l" data-stagger>
          <p class="eyebrow" data-a="up">Reef and rubbish</p>
          <h2 class="d3 lines">What we do about it</h2>
          ${list(["No single-use plastic aboard.", "Reef-safe sunscreen supplied.", "We anchor on sand, never on coral."])}
        </div>
        ${fig("ray-sand", "A stingray moving across pale sand in shallow water", { ratio: "r43", sizes: "(min-width:960px) 58vw, 100vw" })}
      </div>
    </div>
  </section>

  <section class="band">
    <div class="band__bg" data-par="0.1">${img("sandbank-2", "", { sizes: "100vw" })}</div>
    <div class="band__in wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">Weather</p>
      <h2 class="d2 lines">The sea decides the day. We only decide when to leave.</h2>
    </div>
  </section>

${cta()}`;

  page({
    file: "about.html", pageAttr: "about.html", light: true, og: "aerial-marina",
    title: "About — Coravida",
    desc: "Coravida runs one vessel out of Hulhumalé Marina with the same crew of three on every sailing.",
    main
  });
}

/* ------------------------------------------------------------- CONTACT -- */
function contact() {
  const faq = `<div class="acc" data-stagger>` + CV.faq.map((f, i) => `
        <div class="acc__i" data-a="up" style="--i:${Math.min(i, 5)}"><button class="acc__b" type="button">${f.q}<i aria-hidden="true"></i></button>
          <div class="acc__p"><div><p class="small">${f.a}</p></div></div></div>`).join("") + `
      </div>`;

  const main = `  <section class="phero">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">Contact</p>
      <h1 class="d1 lines">Talk to the crew</h1>
      <p class="lede" data-a="up">A telephone number, a jetty, and someone who answers before the boat leaves.</p>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split">
        <div class="split__t sticky stack-l" data-stagger>
          <p class="eyebrow" data-a="up">Reach us</p>
          ${dl([
            ["Telephone", `<a href="${CV.brand.phoneHref}">${CV.brand.phone}</a>`],
            ["WhatsApp", `<a href="${CV.brand.whatsappHref}" rel="noopener">${CV.brand.phone}</a>`],
            ["Email", `<a href="mailto:${CV.brand.email}">${CV.brand.email}</a>`],
            ["Berth", CV.brand.marina],
            ["Office", CV.brand.address.join(", ")],
            ["Hours", CV.brand.hours]
          ])}
        </div>
        <div data-a="up">
          <form data-ok="okC" class="stack-l" novalidate>
            <div class="fg fg2">
              <div class="field"><label for="n">Name</label><input id="n" name="name" type="text" autocomplete="name" required></div>
              <div class="field"><label for="e">Email</label><input id="e" name="email" type="email" autocomplete="email" required></div>
            </div>
            <div class="fg fg2">
              <div class="field"><label for="t">Telephone</label><input id="t" name="phone" type="tel" autocomplete="tel"></div>
              <div class="field"><label for="s">Subject</label><select id="s" name="subject">
                <option>General enquiry</option><option>Charter dates</option><option>Diving</option><option>A celebration</option><option>Press</option>
              </select></div>
            </div>
            <div class="field"><label for="m">Message</label><textarea id="m" name="message" required></textarea></div>
            <div class="acts"><button class="btn" type="submit">Send</button></div>
            <p class="note">A demonstration form &mdash; nothing is sent.</p>
          </form>
          <div class="ok" id="okC">
            <div class="stack-l">
              <p class="eyebrow">Received</p>
              <h2 class="d2">Thank you</h2>
              <p class="lede measure" style="margin-inline:auto">The crew reply within a day, usually sooner.</p>
              <div class="acts"><a class="btn btn--ghost" href="index.html">Back to the harbour</a></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--mist">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">Questions</p>
      <h2 class="d2 lines">Before you sail</h2>
      ${faq}
    </div>
  </section>

  <section class="section--sm" style="padding-bottom:var(--sec)">
    <div class="wrap">
      <figure style="margin:0">
        ${fig("aerial-marina", "Tiffany Blanc 14 leaving Hulhumalé Marina", { ratio: "r169", sizes: "100vw", par: "0.05" })}
        <figcaption class="cap" data-a="up"><span class="k">Hulhumal&eacute; Marina</span><span class="d4">Ten minutes from Velana International Airport</span></figcaption>
      </figure>
    </div>
  </section>

${cta("", "Or simply tell us your dates")}`;

  page({
    file: "contact.html", pageAttr: "contact.html", light: true, og: "aerial-marina",
    title: "Contact — Coravida",
    desc: "Telephone, WhatsApp and email for Coravida, plus the berth at Hulhumalé Marina and answers to the usual questions.",
    main
  });
}

/* ------------------------------------------------------------- ENQUIRE -- */
function enquire() {
  const chips = CV.voyages.map((v, i) => `              <input type="radio" id="v${i}" name="voyage" value="${v.slug}"${i === 0 ? " checked" : ""}>
              <label for="v${i}">${v.title} &middot; ${v.duration}</label>`).join("\n");
  const extras = CV.addons.map((a, i) => `              <input type="checkbox" id="x${i}" name="extra" value="${a.t.toLowerCase().replace(/[^a-z]+/g, "-")}" data-label="${esc(a.t)}" data-price="${a.p}">
              <label for="x${i}">${a.t} &middot; ${a.p}</label>`).join("\n");

  const main = `  <section class="phero">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">Enquire</p>
      <h1 class="d1 lines">Reserve the vessel</h1>
      <p class="lede" data-a="up">Four short steps. Nothing is charged and no date is held until we have written back.</p>
    </div>
  </section>

  <section class="section" style="padding-top:clamp(2rem,4vw,3rem)">
    <div class="wrap narrow">
      <ul class="steps" data-a="up" style="margin-bottom:clamp(2.5rem,5vw,4rem)">
        <li class="on"><b>01</b> Voyage</li><li><b>02</b> Dates</li><li><b>03</b> Details</li><li><b>04</b> Review</li>
      </ul>

      <form id="enquire" novalidate>
        <div class="step on">
          <div class="stack-l">
            <div class="stack-s"><p class="eyebrow">Step one</p><h2 class="d3">Which voyage?</h2></div>
            <div class="chips">
${chips}
            </div>
            <p class="note">Every voyage is a private charter of the whole vessel. If none of these fit, choose the closest and tell us in step three.</p>
            <div class="acts"><button class="btn" type="button" data-next>Continue</button></div>
          </div>
        </div>

        <div class="step">
          <div class="stack-l">
            <div class="stack-s"><p class="eyebrow">Step two</p><h2 class="d3">When, and how many?</h2></div>
            <div class="fg fg2">
              <div class="field"><label for="d1">Preferred date</label><input type="date" id="d1" name="date" required></div>
              <div class="field"><label for="d2">Alternative date</label><input type="date" id="d2" name="alt"></div>
            </div>
            <div class="fg fg2">
              <div class="field"><label for="g">Guests</label><select id="g" name="guests" required>
                <option value="2">2 guests</option><option value="4" selected>4 guests</option><option value="6">6 guests</option>
                <option value="8">8 guests</option><option value="10">10 guests</option><option value="12">12 guests</option>
              </select></div>
              <div class="field"><label for="p">Departure point</label><select id="p" name="pickup">
                <option>Hulhumal&eacute; Marina</option><option>Velana International Airport jetty</option>
                <option>Mal&eacute;, west harbour</option><option>A resort in North or South Mal&eacute; Atoll</option>
              </select></div>
            </div>
            <div class="acts"><button class="btn btn--ghost" type="button" data-prev>Back</button><button class="btn" type="button" data-next>Continue</button></div>
          </div>
        </div>

        <div class="step">
          <div class="stack-l">
            <div class="stack-s"><p class="eyebrow">Step three</p><h2 class="d3">Anything to add?</h2></div>
            <div class="chips">
${extras}
            </div>
            <div class="fg fg2">
              <div class="field"><label for="nm">Name</label><input type="text" id="nm" name="name" autocomplete="name" required></div>
              <div class="field"><label for="em">Email</label><input type="email" id="em" name="email" autocomplete="email" required></div>
            </div>
            <div class="fg fg2">
              <div class="field"><label for="ph">Telephone or WhatsApp</label><input type="tel" id="ph" name="phone" autocomplete="tel"></div>
              <div class="field"><label for="st">Where are you staying?</label><input type="text" id="st" name="staying" placeholder="Resort, guesthouse or hotel"></div>
            </div>
            <div class="field"><label for="no">Anything we should know</label><textarea id="no" name="notes" placeholder="Diet, diving certification, occasion, children aboard"></textarea></div>
            <div class="acts"><button class="btn btn--ghost" type="button" data-prev>Back</button><button class="btn" type="button" data-next>Review</button></div>
          </div>
        </div>

        <div class="step">
          <div class="stack-l">
            <div class="stack-s"><p class="eyebrow">Step four</p><h2 class="d3">Does this look right?</h2></div>
            <div class="sum">
              <div class="sum__r"><span class="k">Voyage</span><span data-s-v>&mdash;</span></div>
              <div class="sum__r"><span class="k">Where</span><span data-s-a>&mdash;</span></div>
              <div class="sum__r"><span class="k">Date</span><span data-s-d>&mdash;</span></div>
              <div class="sum__r"><span class="k">Guests</span><span data-s-g>&mdash;</span></div>
              <div class="sum__r"><span class="k">Add-ons</span><span data-s-e>&mdash;</span></div>
              <div class="sum__t"><span class="k">Indicative total</span><span class="v" data-s-t>&mdash;</span></div>
            </div>
            <p class="note">An indication only, in US dollars, for the whole vessel. We confirm the final figure in writing before anything is held. This form is a demonstration and sends nothing.</p>
            <div class="acts"><button class="btn btn--ghost" type="button" data-prev>Back</button><button class="btn" type="submit">Send the enquiry</button></div>
          </div>
        </div>
      </form>

      <div class="ok" id="enquireOk">
        <div class="stack-l">
          <p class="eyebrow">Received</p>
          <h2 class="d2">We have it</h2>
          <p class="lede measure" style="margin-inline:auto">The crew reply within a day, usually sooner. If your dates are tight, call the marina office.</p>
          <div class="acts"><a class="btn" href="index.html">Back to the harbour</a><a class="btn btn--ghost" href="${CV.brand.phoneHref}">${CV.brand.phone}</a></div>
        </div>
      </div>
    </div>
  </section>`;

  page({
    file: "enquire.html", pageAttr: "enquire.html", light: true, og: "vessel-guests",
    title: "Enquire — Coravida",
    desc: "Reserve Tiffany Blanc 14 for a day, a sunset or twelve nights at anchor.",
    main
  });
}

/* ----------------------------------------------------------------- 404 -- */
function notfound() {
  const main = `  <section class="phero">
    <div class="wrap narrow stack-l" data-stagger>
      <p class="eyebrow" data-a="up">404</p>
      <h1 class="d2 lines">This one drifted</h1>
      <p class="lede measure" style="margin-inline:auto" data-a="up">The page you asked for is not at this address.</p>
      <div class="acts" data-a="up">
        <a class="btn" href="index.html">Back to the harbour</a>
        <a class="btn btn--ghost" href="voyages.html">See the voyages</a>
      </div>
    </div>
  </section>

  <section class="section--sm" style="padding-bottom:var(--sec)">
    <div class="wrap">${fig("aerial-anchor", "Tiffany Blanc 14 alone at anchor above a reef edge", { ratio: "r169", sizes: "100vw", par: "0.05" })}</div>
  </section>`;

  page({
    file: "404.html", pageAttr: "404.html", light: true, og: "aerial-anchor",
    title: "Not found — Coravida", desc: "That page is not at this address.", main
  });
}

home(); vessel(); voyages(); voyagePages(); gallery(); about(); contact(); enquire(); notfound();
console.log("done");
