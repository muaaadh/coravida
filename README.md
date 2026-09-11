# Coravida — website

A static site for **Coravida** and its vessel **Tiffany Blanc 14**. No build step for the
browser, no dependencies, no server: open `index.html`, or drop the folder on any host.

Live at **https://muaaadh.github.io/coravida/**

---

## What this build is

Twelve pages in four languages — forty-eight files — built from the client's own
photography and film (the August 2026 drone, GoPro and Sony shoot) plus 4K stock for the
hero. Coravida presents **a small fleet**; Tiffany Blanc 14 is the flagship and the only
vessel with data behind it, so it is the one the vessel page details. Three ideas run
through it:

- **Roomier.** One idea per screen, one vertical scale (`--s1…--s6`, `--sec`), and far
  less copy. The home page is five sections; the gallery is one.
- **Quieter.** White ground, occasional full-bleed film, one navy close. Marine blue is
  reserved for state — a running track, an open accordion, a live timeline row — so it
  still means something when it appears.
- **Faster.** 1.2 MB on a phone, 48–76 ms to first paint. Details below.

## Four languages

English, **Русский**, **中文** and **Deutsch** — 48 pages, not 12. Each language is a real
directory of real files (`/`, `/ru/`, `/zh/`, `/de/`), so every page has its own URL, its
own `<title>`, its own `lang` attribute and a full set of `hreflang` alternates. Nothing
is translated in the browser, and there is no flash of English.

English is the source. Each language adds one file under `tools/i18n/`:

```js
module.exports = {
  ui:      { "The sea, at your own pace": "Das Meer, in Ihrem Tempo", … },  // keyed by the English
  chrome:  { menu: "Menü", enquire: "Anfragen", … },                        // what site.js says
  content: { voyages: [{ title: "Insel & Schnorcheln", … }], … }            // a deep override
};
```

`tools/build.js` merges each override onto the English data model, writes the merged result
to `assets/js/data.<code>.js`, and generates that language's pages. Anything a locale does
not translate **falls back to English rather than to a hole**, and the build prints what is
missing:

```
ru: 4 untranslated
   ¬ Chef
   ¬ Berth
```

Two roots keep the links honest: `data-root` points at the site root (for assets, which are
shared by all four languages) and `data-base` at the language root (for page links). The
switcher in the header carries `data-path`, the same file inside every language, so
switching language holds your place instead of dropping you on the home page.

Chinese gets its own type: Montserrat and Inter carry Latin and Cyrillic but no CJK, so
`:root[lang^="zh"]` swaps in the system Han faces and drops the tightened tracking, the
uppercasing and the word-space line splitting — all Latin conventions. German gets
`hyphens: auto`, because its compounds are long enough to break a narrow column on their own.

## Rates

The client quotes a **package price for a party of seven**, and prices any other number
aboard on enquiry. Nothing on the site presents it as a "from":

| | |
|---|---|
| Half day — Reef & Sandbank, Sunset Adventure | **USD 950** |
| Full day — Island & Snorkelling, Shark Point & Gulhi | **USD 1,350** |

`CV.rates = { pax: 7, currency: "USD" }` holds the basis and `price` sits on each
excursion, so the figure, the qualifier and the enquiry maths always agree. The enquiry
form defaults to seven guests and marks that option *priced*; choose any other number and
the charter itself drops back to "On request", with add-ons still totalled beside it. Money
formats to the reader's own convention — `USD 1,350`, `USD 1 350`, `USD 1.350` — while the
currency stays USD.

## The price

The client's most-asked question, at the size of an answer. `priceCard()` in
`tools/build.js` builds one card — the figure at display scale in the brand blue, the
seven-guest qualifier under it, the day's facts on hairlines, and **Enquire inside the same
box**. It appears twice: two cards side by side on the excursions index (half day / full
day), and one in the sticky column of each excursion page carrying that excursion's
duration, departure and guest count. On a phone they stack full width.

Change `price` on an excursion, or `rates.pax`, and the card, the index rows and the
enquiry total all move together.

## The hero film

Three clips cycle behind the headline — a reef, an island, the vessel underway — each
cross-fading into the next. **The interval is content, not code:** `CV.hero.interval` in
`assets/js/data.js`, in milliseconds, which is what an admin backend would edit.

```js
var hero = {
  interval: 6000,                                     // 5–7s reads well
  clips: [ { src: "reef", poster: "poster-reef", max: 1440, alt: "…" }, … ]
};
```

Each clip is encoded at four widths and the tier is chosen at runtime from viewport × DPR,
capped at `max` — `vessel` came from a 1080p source, so it never claims more. Nothing is
fetched until the page has loaded; the next clip and **its poster** are fetched 1.4 s into
the current one, and only while the hero is still on screen. Scroll past it, or switch
tabs, and both the cycling and the fetching stop.

## The music player

A floating glass card, bottom right, above a 52px button that is the only thing visible
until you open it. It plays four Creative Commons tracks chosen for the room they leave —
"Feel the essence of the Maldives" sits at the top of the panel.

| | |
|---|---|
| Tracks | `CV.music.tracks` — file, title, artist, licence, source URL. The licence links out. |
| Format | MP3, 96 kbps, trimmed to 2:30 with a 1.2 s fade in and a 3.5 s fade out, so the hand-off between tracks is clean. 1.8 MB each, fetched **only when you press play**. |
| Across pages | Track, position, playing state and whether the panel was open all persist in `sessionStorage` and resume on the next page. |
| While playing | The button pulses a slow marine ring and the equaliser bars move. |

Nothing autoplays. `preload="none"` means an untouched player costs zero bytes.

**One invitation, then silence.** A second and a half after the page settles, a small glass
pill appears beside the button — *Turn the sound on* — holds for seven seconds, and removes
itself; a failsafe clears it at ten regardless. It is skipped entirely if the player is
already open or already playing, any interaction kills it early, and it is marked as seen
the moment it *appears* — not when it leaves — so a visitor who moves to the next page
inside the window never sees it twice.

## How media is presented

Six photography-led sites were read at source — **patinahotels.com** (Patina Maldives —
note that `patinahotel.com`, singular, is a parked domain and not the reference), Aman,
Cheval Blanc, Belmond, Six Senses Laamu and Four Seasons Yachts. Where they agreed, this
site follows them:

| | |
|---|---|
| **Corners grow with the thing they belong to.** The reference set is square-cornered almost throughout, but the client asked for Apple's curve instead, so the site carries a radius *scale* rather than one value: `--r-s` 14px for rail cards and small tiles, `--r` 16–24px for a photograph, `--r-l` 20–34px for plates and anything hero-scale, `--r-ui` 14–20px for panels. Full-bleed heroes and film bands stay square, because they touch the viewport edge. | A 300px tile and an 1100px plate should not share a corner. |
| **Tinted sections are panels, not bands.** `.section--mist` is inset by the page gutter and carries `--r-l`, so the grey sits on the white as a curved tile. The navy close keeps its full width — the sea divider has to run all the way across. | |
| **A photograph fades up; it is not unveiled.** The curtain panel that used to slide off every image is gone. Belmond has no mask on media anywhere in 266KB of CSS; Cheval Blanc reserves its mask-reveal for *type*, which is what this site already does with headlines. Images enter on 0.75s opacity and a 14px rise, settling from 1.035× rather than 1.12×. | One mask device, spent on the headlines. |
| **The plate is 2× the prose.** 1100px against a 544px measure, matching Aman (2.12×), Belmond (2.4×) and Four Seasons (2.1×). It stops at the gutter and never reaches the viewport edge. | |
| **Only a photograph you can press answers to a cursor.** Hover-scale is scoped to links, cards and rail items. Aman removes it entirely. | |
| **Four ratios, role-mapped** — 16:9 film, 4:3 split, 4:5 portrait, 1:1 tile. Belmond enforces exactly four in code and warns on anything else. | Was seven. |
| **Light scrims.** Patina runs 0.1 over its heroes. Ours came down about 40% — but a phone puts the headline over the brightest water, so `max-width:700px` gets its own slightly stronger wash. Verified: every hero headline clears 3:1, most clear 4.5:1. | |
| **The poster is the clip's own first frame.** Cut from frame 0 of the encoded file, so the crossfade has nothing to jump between — and once the clip is running the still is taken out of the compositor. | |

Two things the references do that this site deliberately does **not**: bleed a photograph
off the viewport edge (Belmond and Six Senses both do; it was tried here and rejected), and
drop the lightbox (Aman and Cheval Blanc have none — but a charter sells a specific boat,
and a buyer needs to inspect it).

## Plates, and one rhythm

Two rules do the work that a pile of one-off spacing used to.

**A photograph with no text beside it is a plate, not a banner.** `plate()` in
`tools/build.js` renders it narrower than the column it sits in (880px), rounded, with a
hairline and a caption beneath: a micro-caps label and one line saying what you are looking
at. That is what gives a standalone image a reason to be on the page. Seven of them, one per
page. Photographs that already have text beside them stay in their split and take no
caption — they are not standalone.

**Every block owns the gap below it.** No gap is ever paid for twice:

```css
main>*{margin:0}
.section,.section--sm{padding-block:0 var(--sec)}      /* pay below, never above */
.section--mist,.section--navy{padding-block:calc(var(--sec)/2) var(--sec)}
.hero+*,.band+*{padding-top:var(--sec)}                /* film has none to give */
.section--mist+*,.section--navy+*{padding-top:calc(var(--sec)/2)}
```

A hero or a film band has no text at its bottom edge and nothing to give, so the block after
one owns that gap instead. A change of background colour is itself a break, so it takes half
a gap either side rather than a full one twice. Above the navy the block also gets `--seah`
back, because the sea divider rises out of it.

Before this, gaps between sections measured anywhere from **−66px to 370px** on the same
page. They are now one number.

## Motion

Everything moves as it arrives, and nothing moves for its own sake. `assets/js/site.js`
carries the whole layer — no library:

| Behaviour | Hook |
|---|---|
| **A stop for anything that plays itself.** One 40px disc, bottom left of any hero, band or film figure, quiet until you hover and always visible on touch. WCAG 2.2.2 asks for it and none of the six references provide one. | `.filmc` |
| **The deep.** Below the sea divider the page is under water, so the footer runs dark film behind the navy — sunlight coming down through the surface, held at 34% under a radial navy wash so the type still wins. | `.ftr .deep__bg` |
| **The sea.** Three translucent swells drifting at their own speeds and directions; light refracting down through the surface; the crest splitting into red, green and blue a hair apart; caustics working across the water below on two layers at different scales. It rises 34px as it enters view. | built by `site.js` onto the footer — every page closes on white, and the water begins where the footer does |
| **The excursion index.** Four numbered rows; the photograph for whichever you are pointing at follows the cursor on an eased lag. Rows carry their own thumbnail on touch. | `.vx`, `data-thumb` |
| Headlines rise line by line out of a mask | `class="lines"` — JS measures the real line breaks and re-splits on resize |
| Sections fade and lift, staggered | `data-a="up\|fade"` inside `data-stagger`, which numbers any child the build did not |
| Photographs reveal under a curtain wipe while the image settles from 1.12× | `data-a="clip"` |
| Hero film and full-bleed stills drift against the scroll | `data-par` |
| Statistics count up as they enter | any `.stats .v` whose value is numeric |
| Cards lift, buttons fill from below, links sweep an underline, the rail drags | built in |
| Headlines never orphan a word | `text-wrap: balance`, measured before the line split |

**One scroll driver.** The header state, the reveals and the parallax are all callbacks on
a single rAF-throttled scroll frame (`onFrame`). The reveals are a *sweep*, not an
`IntersectionObserver` threshold — a fast flick can outrun a threshold, and anything it
skipped would never appear at all.

All of it is disabled under `prefers-reduced-motion`, where every element resolves to its
end state and the sea stands still.

### On a phone

Touch gets the same motion, not a stripped-back version — and the things a cursor does for
free are built back:

| | |
|---|---|
| **Press, not hover.** Every control answers to a press instead: cards settle by 1.5%, buttons by 3%, chips and language pills tint. The desktop hover states are switched off so none of them can stick after a tap. |
| **Swipe.** The lightbox takes a swipe — left and right to move, down to close — and its images slide in the direction of travel. |
| **The excursion index**, which follows the cursor on a desktop, becomes a stack of cards: each photograph gets the same curtain wipe the desktop cards get, plus a chevron so the row reads as a link. |
| **The rail** fades its right edge while there is more to scroll to, and stops fading at the end. |
| **Parallax at 55%** below 700px — at full strength it reads as jitter rather than depth. |
| **16px form fields**, because anything smaller makes iOS Safari zoom the page on focus. |
| **44px tap targets** minimum; the lightbox controls are 52. |
| **The language switcher** moves out of the header, where there is no room for it, into the menu as a row of pills. |

The caustics are a 512px seamless tile generated with ImageMagick (tiled noise → blur →
`EdgeIn` morphology → levels), 2 KB as WebP, drifting on two layers so the repeat never
reads.

Traps worth recording:

> An element hidden with `clip-path: inset(0 0 100% 0)` is also invisible to
> `IntersectionObserver`, so it can never reveal itself. The wipe uses a curtain
> pseudo-element instead.
>
> Splitting a headline into words for measurement changes where it wraps unless the spaces
> stay outside the word boxes as real text nodes.
>
> `img, svg { max-width: 100% }` in the reset silently clamps an SVG you have sized at
> `200%` for a seamless loop — it needs `max-width: none`. And a `fill` rule matching
> `.parent path` beats a class on the path itself, which will quietly replace a gradient
> with a flat colour.
>
> `overflow: hidden` on the footer clips the sea, which is drawn *above* its own host —
> the footer is `position: relative` with no clip, and `:has(+ .section--navy)` gives the
> section above it back the 115px the sea takes.

## The header

A floating glass capsule, inset from all three edges and fully rounded. It carries a real
`backdrop-filter` blur with a saturation lift, an inner top highlight and a soft drop
shadow, so it reads as a piece of glass sitting over the page rather than a bar stuck to
it. Three states, all on the same element:

| | |
|---|---|
| Over a film hero | 10% white, white contents, drop-shadowed for legibility |
| Scrolled | 74% white, navy contents, the page visibly blurred behind it |
| On a light page before scroll | 60% white with a hairline, so it reads on white |

Corners are soft everywhere else too — a single `--r` token (12–20px, fluid) rounds every
photograph, the gallery tiles, the lightbox and the summary panel. Scrolling is the
browser's own; nothing hijacks the wheel.

## The design system

Deliberately small, because a large one is how a site stops being clean:

| | |
|---|---|
| Colour | Navy `#03224D`, marine `#0C6FDB`, ocean `#0046B1`, mist `#F5F8FB`. **One** body grey (`--body`, 5.7:1 on white) and **one** hairline. The primary button is the one place the brand blue fills a shape — a marine-to-ocean gradient, white on it at 4.9:1 — and on navy it inverts to a white pill with ocean text at 8.4:1. Selected chips and the current language pill take the same fill. |
| Type | Montserrat 300 for display, Inter 400/500 for everything else. The root is `clamp(16px, 15.2px + .2vw, 17.5px)` — 16px on a phone, 17.5px on a desktop — so every rem grows with the screen. Body 17.5px, labels 12px, captions 15px, lede 19px at 1440. Four display sizes (`.d1–.d4`) and **one** micro-caps label rule. |
| Space | `--s1…--s6` for vertical rhythm, `--sec` for section padding, `--gut` for the page gutter. No spacing lives in the HTML — the only inline styles in the whole build are stagger indices. |
| Reveals | Three: `up`, `fade`, `clip`. |

## Speed

| | |
|---|---|
| Fonts | Self-hosted woff2 (Montserrat 300, Inter 400/500), preloaded, `font-display:swap`. No Google Fonts round-trip. |
| Images | WebP only, four widths each (900 / 1200 / 1600 / 2200) through `srcset` + `sizes`, each carrying its own `width`/`height` read from the WebP header at build time, so nothing shifts as they land. 32 photographs, 21 MB on disk. |
| Video | H.264 in four tiers — 1440 / 1080 / 720 / 540 — chosen at runtime from viewport × DPR and capped per clip at what its source can honestly give. |
| Video loading | A WebP poster paints first; the clip is fetched after `load`. Every clip is watched: one that leaves the viewport stops decoding and picks up when it returns. Skipped entirely under `prefers-reduced-motion` or Save-Data. |
| Audio | Nothing until the player is pressed. |
| CSS / JS | 42 KB and 41 KB uncompressed — **10.6 KB and 11.5 KB gzipped**. One file each, no libraries. |
| Languages | A localised page costs about **10 KB** more than the English one, and that is all of it — same CSS, same JS, same photographs. |

Measured cold with no cache on the home page:

| | Desktop 1440 @2× | Phone 390 @3× |
|---|---|---|
| First view | 3.60 MB | **0.87 MB** |
| First contentful paint | 48 ms | 72 ms |
| Requests | 14 | 14 |

Of the desktop figure, 3.1 MB is the 1440p hero film itself; the page is complete and
readable at 760 KB before it arrives.

## Pages

| File | What it is |
|---|---|
| `index.html` | Home — film hero, the offer and three excursions, film interlude, the flagship |
| `vessel.html` | Tiffany Blanc 14 — four decks, specification, what is aboard |
| `excursions.html` | The four excursions as a numbered index, then what a charter covers and add-ons |
| `excursions/<slug>.html` | One page per excursion (4), each with its hour-by-hour timeline |
| `gallery.html` | Four subject groups — Our vessels, Aboard, Below, Islands — each a captioned mosaic under a numbered heading, one lightbox across all of them |
| `about.html` | The company, the crew, the reef |
| `contact.html` | Details, message form, FAQ |
| `enquire.html` | Four-step charter enquiry with a live indicative total |
| `404.html` | Not found |

The same twelve exist again under `/ru/`, `/zh/` and `/de/`. `sitemap.xml` lists all
44 indexable URLs with their language alternates, and is regenerated by the build.

## Changing the content

Everything is in **`assets/js/data.js`** — brand facts, the hero clips and their interval,
the music tracks, navigation, the four excursions (hour-by-hour itineraries, inclusions),
add-ons, the vessel, gallery captions, FAQ.

Every HTML page is generated from it:

```sh
node tools/build.js      # rewrites all 48 pages, in all four languages
```

Edit `data.js`, run the build, commit. Header, menu, footer, sea and player are injected by
`assets/js/site.js`, so they change in one place. Pages that open on white carry
`class="light-page"` on `<body>` so the header renders navy instead of white.

## Media

Client footage, all shot for Coravida in August 2026:

- **DJI drone** — `Images/Safari - 001/*.mp4`. The anchored film and five aerial stills.
  These files are the app's 1080p proxies, so 1920px is their honest ceiling.
- **GoPro** — stills in `gopro pics - 001`, underwater film in `gopro videos - 001`. The
  ray interlude is cut from `GX013576`.
- **Sony (ARW)** — the champagne, platter, pineapple and float stills, from the embedded
  full-size previews. Develop the RAWs if you need more.

Stock, licensed for commercial use: the four music tracks (Creative Commons BY / BY-SA —
the attribution is in the player, and must stay there) and, from September 2026, eight
clips and two stills in `Web/Stock/`:

| | |
|---|---|
| `snorkel-pair` | aerial, two snorkellers over a reef edge — the home hero and Island & Snorkelling |
| `shark` / `shallows` | aerial, reef sharks over white sand — Shark Point, and the excursions index |
| `spit` | a sandbank running out into pale water — Reef & Sandbank |
| `wake` | a boat's wake across flat turquoise — Sunset Adventure |
| `turtle` | a green turtle over coral — the reef section on About |
| `mask` | a snorkeller at the surface — the enquiry hero |
| `sunbeams` | light coming down through the surface — behind the closing section |
| `palm-beach`, `fins` | two stills, in the gallery |

Client footage keeps the places where it is strongest — the eagle ray band, the island and
the vessel in the hero rotation, the whole vessel page — and the stock fills what the shoot
did not cover. All thirteen clips on the site are in use.

```sh
bash tools/images.sh     # every photograph, from the shoot
bash tools/hero.sh       # the client's hero clips
bash tools/stock.sh      # the September stock, all tiers plus posters
bash tools/mirror.sh     # copy the built site into the client's OneDrive folder
```

`tools/mirror.sh` only ever removes the paths this repo generates, so anything the client
has dropped into that folder survives a sync — a plain `rm -rf` of the destination would
not, and nearly did not.

## The four excursions

These are the client's real products, with their own timings and stops:

| | | |
|---|---|---|
| **Island & Snorkelling** | Full day, 9.5 h | Fish Tank → Himmafushi sandbank → lunch → Himmafushi island → sunset cruise |
| **Reef & Sandbank** | Half day, 4 h | Fish Tank → sandbank → dolphin cruise home |
| **Shark Point & Gulhi** | Full day, 9 h | Shark Point (Embudu) → coral garden → sandbank → Gulhi → lunch → coral snorkel → sunset cruise |
| **Sunset Adventure** | Half day, 4.5 h | Shark Point → sandbank → evening snack → sunset cruise |

Each page runs the itinerary as a timeline — the time in the margin, a rule with a dot per
stop, the stop and one line about it.

Rates as supplied: **USD 950** a half day, **USD 1,350** a full day, both for a party of
seven and for the whole vessel. Any other number aboard is priced on enquiry, and the site
says so wherever a figure appears. Change `price` on an excursion, or `rates.pax`, and every
page and the enquiry total move together.

## Still to confirm with the client

The vessel specification in `CV.vessel`, the six add-on prices, the contact details in
`CV.brand`, and the 2019 founding year. (The excursion rates are now confirmed.) Both forms are demonstrations —
they show a confirmation and write to `localStorage` (`cv.enquiries`), and send nothing.

One gap in the shoot: **there is no sunset photograph** — everything was shot between
08:45 and 10:00, or underwater. Three of the four excursions end on a sunset cruise, so
that hour is worth shooting.

## Structure

```
index.html  vessel.html  excursions.html  gallery.html
about.html  contact.html  enquire.html  404.html
excursions/*.html         4 excursion pages — generated
ru/  zh/  de/             the same twelve pages again — generated
assets/
  css/site.css            the design system
  js/data.js              all content, in English — edit this
  js/data.{ru,zh,de}.js   merged per language — generated, do not edit
  js/site.js              chrome, language, sea, hero cycle, player, reveals, lightbox, forms
  img/                    WebP, four widths each, plus the logo lockups
  video/                  five clips, up to four tiers each
  audio/                  four CC tracks
  fonts/                  Montserrat 300, Inter 400/500
sitemap.xml               44 URLs with alternates — generated
tools/i18n/{ru,zh,de}.js  the translations — edit these
tools/stock.sh            encodes the September stock
tools/mirror.sh           safe copy into the client's OneDrive folder
tools/build.js            regenerates every page in every language
tools/images.sh           rebuilds every photograph from the shoot
tools/hero.sh             rebuilds the hero clips and their posters
```

Checked at 390 and 1440px across all 48 pages — 72 renders: no horizontal overflow, no
console errors, no 404s, no broken images, no missing alt text, `hreflang` on every page,
the sea on every page, and no English left where there should not be any.
