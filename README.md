# Coravida — website

A static site for **Coravida** and its vessel **Tiffany Blanc 14**. No build step for the
browser, no dependencies, no server: open `index.html`, or drop the folder on any host.

Live at **https://muaaadh.github.io/coravida/**

---

## What this build is

Twelve pages of the client's own photography and film — the August 2026 drone, GoPro and
Sony shoot, plus 4K stock for the hero film. Three ideas run through it:

- **Roomier.** One idea per screen, one vertical scale (`--s1…--s6`, `--sec`), and far
  less copy. The home page is five sections; the gallery is one.
- **Quieter.** White ground, occasional full-bleed film, one navy close. Marine blue is
  reserved for state — a running track, an open accordion, a live timeline row — so it
  still means something when it appears.
- **Faster.** 1.2 MB on a phone, 48–76 ms to first paint. Details below.

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

## Motion

Everything moves as it arrives, and nothing moves for its own sake. `assets/js/site.js`
carries the whole layer — no library:

| Behaviour | Hook |
|---|---|
| **The sea.** Three translucent swells drifting at their own speeds and directions; light refracting down through the surface; the crest splitting into red, green and blue a hair apart; caustics working across the water below on two layers at different scales. It rises 34px as it enters view. | built by `site.js` into the closing navy section, or the footer where there isn't one |
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
| Colour | Navy `#03224D`, marine `#0C6FDB`, ocean `#0046B1`, mist `#F5F8FB`. **One** body grey (`--body`, 5.7:1 on white) and **one** hairline. |
| Type | Montserrat 300 for display, Inter 400/500 for everything else. Four display sizes (`.d1–.d4`) and **one** micro-caps label rule, shared by 17 selectors. |
| Space | `--s1…--s6` for vertical rhythm, `--sec` for section padding, `--gut` for the page gutter. No spacing lives in the HTML — the only inline styles in the whole build are stagger indices. |
| Reveals | Three: `up`, `fade`, `clip`. |

## Speed

| | |
|---|---|
| Fonts | Self-hosted woff2 (Montserrat 300, Inter 400/500), preloaded, `font-display:swap`. No Google Fonts round-trip. |
| Images | WebP only, four widths each (900 / 1200 / 1600 / 2200) through `srcset` + `sizes`, each carrying its own `width`/`height` read from the WebP header at build time, so nothing shifts as they land. 32 photographs, 21 MB on disk. |
| Video | H.264 in four tiers — 1440 / 1080 / 720 / 540 — chosen at runtime from viewport × DPR and capped per clip at what its source can honestly give. |
| Video loading | A WebP poster paints first; the clip is fetched after `load`. Skipped entirely under `prefers-reduced-motion` or Save-Data. |
| Audio | Nothing until the player is pressed. |
| CSS / JS | 34 KB and 35 KB uncompressed — **8.6 KB and 10.1 KB gzipped**. One file each, no libraries. |

Measured cold with no cache on the home page:

| | Desktop 1440 @2× | Phone 390 @3× |
|---|---|---|
| First view | 3.96 MB | **1.20 MB** |
| First contentful paint | 48 ms | 72 ms |
| Requests | 17 | 16 |

Of the desktop figure, 3.1 MB is the 1440p hero film itself; the page is complete and
readable at 760 KB before it arrives.

## Pages

| File | What it is |
|---|---|
| `index.html` | Home — film hero, the offer and three excursions, film interlude, the vessel |
| `vessel.html` | Tiffany Blanc 14 — four decks, specification, what is aboard |
| `excursions.html` | The four excursions as a numbered index, then what a charter covers and add-ons |
| `excursions/<slug>.html` | One page per excursion (4), each with its hour-by-hour timeline |
| `gallery.html` | Mosaic with a lightbox |
| `about.html` | The company, the crew, the reef |
| `contact.html` | Details, message form, FAQ |
| `enquire.html` | Four-step charter enquiry with a live indicative total |
| `404.html` | Not found |

## Changing the content

Everything is in **`assets/js/data.js`** — brand facts, the hero clips and their interval,
the music tracks, navigation, the four excursions (hour-by-hour itineraries, inclusions),
add-ons, the vessel, gallery captions, FAQ.

Every HTML page is generated from it:

```sh
node tools/build.js      # rewrites all 12 pages
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

Stock, licensed for commercial use: the three hero clips (4K) and the four music tracks
(Creative Commons BY / BY-SA — the attribution is in the player, and must stay there).

```sh
bash tools/images.sh     # every photograph, from the shoot
bash tools/hero.sh       # the hero clips, all four tiers, plus posters
```

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

**No rates were supplied**, so `from` is `null` on all four and every price reads
"On request"; the enquiry form shows the same, and add-ons total as "USD n + charter". Set
`from` in `data.js` and the figures appear everywhere at once.

## Still to confirm with the client

The vessel specification in `CV.vessel`, the excursion rates and the six add-on prices, the
contact details in `CV.brand`, and the 2019 founding year. Both forms are demonstrations —
they show a confirmation and write to `localStorage` (`cv.enquiries`), and send nothing.

One gap in the shoot: **there is no sunset photograph** — everything was shot between
08:45 and 10:00, or underwater. Three of the four excursions end on a sunset cruise, so
that hour is worth shooting.

## Structure

```
index.html  vessel.html  excursions.html  gallery.html
about.html  contact.html  enquire.html  404.html
excursions/*.html         4 excursion pages — generated
assets/
  css/site.css            the design system
  js/data.js              all content — edit this
  js/site.js              chrome, sea, hero cycle, player, reveals, rail, lightbox, forms
  img/                    WebP, four widths each, plus the logo lockups
  video/                  five clips, up to four tiers each
  audio/                  four CC tracks
  fonts/                  Montserrat 300, Inter 400/500
tools/build.js            regenerates every page
tools/images.sh           rebuilds every photograph from the shoot
tools/hero.sh             rebuilds the hero clips and their posters
```

Checked at 390, 768, 1024 and 1440px across all 12 pages: no horizontal overflow, no
broken images, no missing alt text, no console errors, and the sea renders on every one.
