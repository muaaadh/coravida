# Coravida — website

A static site for **Coravida** and its vessel **Tiffany Blanc 14**. No build step for the
browser, no dependencies, no server: open `index.html`, or drop the folder on any host.

Live at **https://muaaadh.github.io/coravida/**

---

## What changed in this build

Everything on the site is now **Coravida's own photography and film** — the August 2026
drone, GoPro and Sony shoot. No stock. The site was also rebuilt around three ideas:

- **Roomier.** One idea per screen, a much larger vertical rhythm (`--sec` runs to 12rem),
  and far less copy. Sixteen pages became thirteen; Experiences and Rates folded into
  Voyages, where they are actually read.
- **Quieter.** White ground, occasional full-bleed film, one navy close. The alternating
  grey banding, the floating dock and the hero tab switcher are gone.
- **Faster.** Details below.

## Motion

Everything moves as it arrives, and nothing moves for its own sake. `assets/js/site.js`
carries the whole layer — no library:

| Behaviour | Hook |
|---|---|
| Inertia scrolling — the wheel is lerped rather than jumped | desktop pointers only; keyboard, scrollbar and anchors hand control straight back |
| A shoreline washes the navy block onto the page: four wave layers drifting at different speeds, a foam line among them, the whole thing rising 30px as it enters view | injected by `site.js` into the closing navy section, or the footer where there isn't one |
| Headlines rise line by line out of a mask | `class="lines"` — JS measures the real line breaks and re-splits on resize |
| Sections fade and lift, staggered | `data-a="up\|fade\|scale"` inside a `data-stagger` parent, which numbers the children |
| Photographs reveal under a curtain wipe while the image settles from 1.12× | `data-a="clip"` |
| Hero film and full-bleed stills drift against the scroll | `data-par="0.06"`, rAF, only while on screen |
| One paragraph per page lights word by word as it passes | `data-scrub` |
| The marquee skews with scroll velocity and eases back | `.mq__s`, capped at 2.2° |
| Statistics count up as they enter | any `.stats .v` whose value is numeric |
| Scroll-progress line, page-to-page fade, hero zoom-out on load, cards that lift, buttons that fill from below, links that sweep an underline, a draggable rail | built in |
| Headlines never orphan a word | `text-wrap: balance`, measured before the line split |

All of it is disabled under `prefers-reduced-motion`, where every element resolves to its
end state and the waves stand still.

Three traps worth recording:

> An element hidden with `clip-path: inset(0 0 100% 0)` is also invisible to
> `IntersectionObserver`, so it can never reveal itself. The wipe uses a curtain
> pseudo-element instead.
>
> Scroll events lag behind the `scrollTo` calls that cause them, so an inertia loop cannot
> tell its own scrolls from anyone else's by comparing positions. It ignores scroll events
> while it is driving, and `keydown` / `pointerdown` / `hashchange` hand control back.
>
> Splitting a headline into words for measurement changes where it wraps unless the spaces
> stay outside the word boxes as real text nodes.

## Speed

| | |
|---|---|
| Fonts | Self-hosted woff2 (Montserrat 300, Inter 400/500), preloaded, `font-display:swap`. No Google Fonts round-trip. |
| Images | WebP only, three widths each (900 / 1600 / 2200) served through `srcset` + `sizes`. 34 photographs total **4.2 MB**, against 15 MB of JPEG before. |
| Video | H.264 in three tiers — 1080p / 720p / 540p — chosen at runtime from viewport width and DPR. Encoded at ~4.2 Mbps with light denoise and an unsharp pass; the drone source is a 7.8 Mbps 1080p proxy, so that is close to its ceiling. |
| Video loading | A WebP poster paints first. The hero clip is fetched **after `load`**; the mid-page clip only when it comes within 300px of the viewport. Skipped entirely under `prefers-reduced-motion` or Save-Data. |
| CSS / JS | 23 KB and 17 KB uncompressed, one file each, no libraries. |

Measured cold, no cache, on the home page: first contentful paint around 70 ms and **760 KB**
before the hero film begins loading. The 8-second hero loop is 4.5 MB at 1080p, 2.1 MB at
720p and 1.1 MB at 540p, and none of it is fetched until the page has finished loading.

## Pages

| File | What it is |
|---|---|
| `index.html` | Home — film hero, positioning, three voyages, film interlude, the vessel, details |
| `vessel.html` | Tiffany Blanc 14 — four decks, specification, what is aboard |
| `voyages.html` | Five voyages as editorial rows, then rates and add-ons |
| `voyages/<slug>.html` | One page per voyage (5) |
| `gallery.html` | Filterable mosaic with a lightbox |
| `about.html` | The company, the crew, the reef |
| `contact.html` | Details, message form, FAQ |
| `enquire.html` | Four-step charter enquiry with a live indicative total |
| `404.html` | Not found |

## Changing the content

Everything is in **`assets/js/data.js`** — brand facts, navigation, the five voyages
(itineraries, inclusions, prices), add-ons, the vessel, gallery captions, FAQ.

Every HTML page is generated from it:

```sh
node tools/build.js      # rewrites all 13 pages
```

Edit `data.js`, run the build, commit. Header, menu and footer are injected by
`assets/js/site.js`, so they change in one place. Pages that open on white carry
`class="light-page"` on `<body>` so the header renders navy instead of white.

## Media

Sources, all shot for Coravida in August 2026:

- **DJI drone** — `Images/Safari - 001/*.mp4`. The hero film, the anchored film, and five
  aerial stills are cut from these.
- **GoPro** — stills in `gopro pics - 001`, underwater film in `gopro videos - 001`. The
  ray interlude is cut from `GX013576`.
- **Sony (ARW)** — the champagne, platter, pineapple and float stills. The embedded
  full-size previews were extracted; if you need more resolution, develop the RAWs.

To re-cut a clip or re-export a still, `ffmpeg` and `cwebp` are all that is needed — the
exact commands used are in the git history for this commit.

## Still placeholder

Confirm with the client before launch: the vessel specification in `CV.vessel`, every
price (voyages and add-ons), the contact details in `CV.brand`, and the 2019 founding year.
Both forms are demonstrations — they show a confirmation and write to `localStorage`
(`cv.enquiries`), and send nothing.

## Structure

```
index.html  vessel.html  voyages.html  gallery.html
about.html  contact.html  enquire.html  404.html
voyages/*.html            5 voyage pages — generated
assets/
  css/site.css            the design system
  js/data.js              all content — edit this
  js/site.js              chrome, video, reveals, rail, lightbox, forms
  img/                    WebP, three widths each, plus the logo lockups
  video/                  three clips, three tiers each
  fonts/                  Montserrat 300, Inter 400/500
tools/build.js            regenerates every page
```

Checked at 390, 768, 1024 and 1440px across all 13 pages: no horizontal overflow, no
broken images, no missing alt text, no console errors.
