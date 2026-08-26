/* ==========================================================================
   CORAVIDA — page generator
   Builds the six voyage detail pages and gallery.html from assets/js/data.js
   so repeated markup stays identical. Run: node tools/gen.js  (from site/)
   ========================================================================== */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
global.window = {};
require(path.join(ROOT, "assets/js/data.js"));
const CV = global.window.CV;

const ARROW = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 9.5 9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.1" stroke-linecap="square"/></svg>';
const money = n => "USD " + Number(n).toLocaleString("en-US");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function head({ title, desc, og, root }) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${root}${og}">
<meta property="og:type" content="website">
<link rel="icon" href="${root}assets/img/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}assets/css/site.css">`;
}

function page({ pageAttr, root, bodyClass, title, desc, og, main }) {
  return `<!doctype html>
<html lang="en" data-root="${root}" data-page="${pageAttr}">
<head>
${head({ title, desc, og, root })}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
<a class="skip" href="#main">Skip to content</a>
<div data-chrome="header"></div>

<main id="main">
${main}
</main>

<div data-chrome="footer"></div>
<script src="${root}assets/js/data.js"></script>
<script src="${root}assets/js/site.js"></script>
</body>
</html>
`;
}

function ctaBand(root, headline) {
  return `  <section class="section section--navy cta">
    <div class="wrap wrap--narrow stack stack--lg">
      <p class="eyebrow" data-rv>Hulhumal&eacute; Marina</p>
      <h2 class="d-l" data-rv data-rv-d="1">${headline}</h2>
      <div class="cta__acts" data-rv data-rv-d="2">
        <a class="pill pill--white" href="${root}enquire.html">Reserve the vessel</a>
        <a class="pill pill--line" href="${root}contact.html">Contact us</a>
      </div>
    </div>
  </section>`;
}

/* ---- Voyage detail pages ---------------------------------------------- */
function voyagePage(v) {
  const root = "../";
  const others = CV.voyages.filter(x => x.slug !== v.slug);

  const steps = v.itinerary.map(s =>
    `        <div><dt>${esc(s.t.split(" · ")[0])}</dt><dd>${esc(s.t.indexOf(" · ") > -1 ? s.t.split(" · ")[1] + " — " : "")}${esc(s.d)}</dd></div>`
  ).join("\n");

  const includes = v.includes.map(i => `          <li class="small">${esc(i)}</li>`).join("\n");

  const gal = v.gallery.map((g, i) =>
    `        <div class="fig fig--hover fig--43"${i ? ` data-rv data-rv-d="${i}"` : " data-rv"}><img src="${root}${g}" alt="${esc(v.title)} — ${["first light", "at anchor", "on the water"][i] || "detail"}" loading="lazy"></div>`
  ).join("\n");

  const rail = others.map(o =>
    `        <a class="rail__item card" href="${o.slug}.html">
          <div class="fig fig--hover"><img src="${root}${o.img}" alt="${esc(o.alt)}" loading="lazy"></div>
          <div class="card__meta"><div class="card__kv"><span>${esc(o.duration)}</span><span>${esc(o.guests)}</span></div><h3>${esc(o.title)}</h3></div>
        </a>`
  ).join("\n");

  const main = `  <section class="hero hero--short">
    <div class="hero__media">
      <div class="hero__slide is-active"><img src="${root}${v.img}" alt="${esc(v.alt)}" fetchpriority="high"></div>
    </div>
    <div class="hero__inner stack">
      <p class="eyebrow">${esc(v.eyebrow)} &middot; ${esc(v.area)}</p>
      <h1 class="d-xl"><span class="rvline is-in"><span>${esc(v.title)}</span></span></h1>
      <p><a class="clink clink--light" href="${root}enquire.html">Reserve this voyage <span class="ico">${ARROW}</span></a></p>
    </div>
  </section>

  <section class="section center">
    <div class="wrap wrap--narrow stack stack--lg">
      <p class="eyebrow" data-rv>The voyage</p>
      <h2 class="d-l measure--wide" style="margin-inline:auto" data-rv data-rv-d="1">${esc(v.blurb)}</h2>
      <p class="lede measure" style="margin-inline:auto" data-rv data-rv-d="2">${esc(v.intro)}</p>
    </div>
  </section>

  <section class="section--tight">
    <div class="wrap">
      <div class="specs" data-rv>
        <div><span class="v">${esc(v.duration.split(" ")[0])}<span class="u">${esc(v.duration.split(" ").slice(1).join(" "))}</span></span><span class="k">Duration</span></div>
        <div><span class="v">${esc(String(v.guests).replace(/[^0-9]/g, "") || "12")}</span><span class="k">Guests</span></div>
        <div><span class="v" style="font-size:clamp(1rem,1.5vw,1.35rem);line-height:1.4">${esc(v.season)}</span><span class="k">Season</span></div>
        <div><span class="v">${money(v.from).replace("USD ", "")}<span class="u">USD</span></span><span class="k">From</span></div>
      </div>
    </div>
  </section>

  <section class="section section--mist">
    <div class="wrap">
      <div class="split">
        <div class="split__text is-sticky stack stack--lg">
          <p class="eyebrow" data-rv>The day</p>
          <h2 class="d-m" data-rv data-rv-d="1">How it runs</h2>
          <p class="small" data-rv data-rv-d="2">Timings are indicative. The captain sets the final route on the morning, for tide, wind and light.</p>
        </div>
        <dl class="deflist" data-rv>
${steps}
        </dl>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split">
        <div class="split__text is-sticky stack stack--lg">
          <p class="eyebrow" data-rv>Rates</p>
          <h2 class="d-m" data-rv data-rv-d="1">What the rate covers</h2>
          <p class="small" data-rv data-rv-d="2">From ${money(v.from)} for the whole vessel, not per guest.</p>
          <p data-rv data-rv-d="3"><a class="clink" href="${root}rates.html">All rates <span class="ico">${ARROW}</span></a></p>
        </div>
        <div class="duo" data-rv>
          <div class="stack stack--sm">
            <p class="eyebrow eyebrow--muted">Included</p>
            <ul class="stack stack--sm">
${includes}
            </ul>
          </div>
          <div class="stack stack--sm">
            <p class="eyebrow eyebrow--muted">Not included</p>
            <ul class="stack stack--sm">
              <li class="small">Alcohol, unless the itinerary says otherwise</li>
              <li class="small">Diving equipment on non-diving charters</li>
              <li class="small">Add-ons listed on the rates page</li>
              <li class="small">Gratuities</li>
              <li class="small">Anything outside the agreed itinerary</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section--tight">
    <div class="wrap">
      <div class="trio">
${gal}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap" style="margin-bottom:clamp(2rem,4vw,3.5rem)">
      <div class="railhead">
        <div class="stack stack--sm">
          <p class="eyebrow" data-rv>Also aboard</p>
          <h2 class="d-m" data-rv data-rv-d="1">Other voyages</h2>
        </div>
        <div class="rail__nav" data-rv data-rv-d="2" style="margin-bottom:.4rem">
          <button type="button" data-rail-prev aria-label="Previous"><svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M7.5 1.5 3 6l4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg></button>
          <button type="button" data-rail-next aria-label="Next"><svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4.5 1.5 9 6l-4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg></button>
        </div>
      </div>
    </div>
    <div class="rail" data-rv>
      <div class="rail__track">
${rail}
      </div>
    </div>
  </section>

${ctaBand(root, "Tell us when, and we will tell you where")}`;

  return page({
    pageAttr: "voyages.html",
    root,
    bodyClass: "",
    title: `${v.title} — Coravida`,
    desc: `${v.blurb} ${v.duration}, ${v.area}. Private charter of Tiffany Blanc 14 from Hulhumalé Marina.`,
    og: v.img,
    main
  });
}

/* ---- Gallery ----------------------------------------------------------- */
function galleryPage() {
  const root = "";
  const cats = [
    { k: "all", l: "Everything" },
    { k: "vessel", l: "The vessel" },
    { k: "islands", l: "Islands" },
    { k: "underwater", l: "Underwater" },
    { k: "light", l: "Light" }
  ];
  const buttons = cats.map((c, i) =>
    `        <button type="button" data-filter="${c.k}"${i === 0 ? ' class="is-active"' : ""}>${c.l}</button>`
  ).join("\n");

  const items = CV.gallery.map((g, i) =>
    `        <figure data-cat="${g.cat}">
          <button type="button" data-lb="${g.img}" data-lb-cap="${esc(g.cap)}" data-lb-alt="${esc(g.cap)}" aria-label="Open image: ${esc(g.cap)}">
            <img src="${g.img}" alt="${esc(g.cap)}" loading="${i < 3 ? "eager" : "lazy"}">
          </button>
        </figure>`
  ).join("\n");

  const main = `  <section class="phero">
    <div class="wrap wrap--narrow phero__in stack stack--lg">
      <p class="eyebrow" data-rv>Gallery</p>
      <h1 class="d-xl" data-rv data-rv-d="1">What we came back with</h1>
      <p class="lede" data-rv data-rv-d="2">The vessel, the atolls, and what is under them.</p>
    </div>
  </section>

  <section class="section--tight">
    <div class="wrap">
      <div class="filters" data-filters data-rv>
${buttons}
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="wrap">
      <div class="mosaic">
${items}
      </div>
    </div>
  </section>

${ctaBand(root, "Come and take your own")}`;

  return page({
    pageAttr: "gallery.html",
    root,
    bodyClass: "page--light",
    title: "Gallery — Coravida",
    desc: "Photographs of Tiffany Blanc 14, the Maldivian atolls she runs through, and the reefs below them.",
    og: "assets/img/atoll-vaavu.jpg",
    main
  });
}

/* ---- Write ------------------------------------------------------------- */
fs.mkdirSync(path.join(ROOT, "voyages"), { recursive: true });
CV.voyages.forEach(v => {
  const f = path.join(ROOT, "voyages", v.slug + ".html");
  fs.writeFileSync(f, voyagePage(v));
  console.log("wrote voyages/" + v.slug + ".html");
});
fs.writeFileSync(path.join(ROOT, "gallery.html"), galleryPage());
console.log("wrote gallery.html");
