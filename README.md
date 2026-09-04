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

## Speed

| | |
|---|---|
| Fonts | Self-hosted woff2 (Montserrat 300, Inter 400/500), preloaded, `font-display:swap`. No Google Fonts round-trip. |
| Images | WebP only, three widths each (900 / 1600 / 2200) served through `srcset` + `sizes`. 34 photographs total **4.2 MB**, against 15 MB of JPEG before. |
| Video | H.264, denoised and bitrate-capped, in three tiers — 1080p / 720p / 540p — chosen at runtime from viewport width and DPR. |
| Video loading | A WebP poster paints first. The hero clip is fetched **after `load`**; the mid-page clip only when it comes within 300px of the viewport. Skipped entirely under `prefers-reduced-motion` or Save-Data. |
| CSS / JS | 23 KB and 17 KB uncompressed, one file each, no libraries. |

Measured cold, no cache, on the home page: first contentful paint under 90 ms, **640 KB**
before the hero film begins loading. A phone pulls 1.3 MB in total for the first screen.

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
