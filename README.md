# Coravida — website mockup

A static site for **Coravida** and its vessel **Tiffany Blanc 14**, rebuilt from the
ground up in the shape of [patinahotel.com](https://patinahotel.com): a photography-led,
whitespace-first layout with a hamburger-only navigation, a full-screen hero that
switches between atolls, and very little text on the page at any one time.

No build step, no dependencies, no server. Open `index.html` in a browser, or drop the
whole `site/` folder on any host.

---

## Design language

Everything comes from the Coravida brand guidelines, not from Patina's palette.

| Token | Value | Used for |
|---|---|---|
| Deep Navy | `#03224D` | Headings, body ink, dark sections, footer |
| Marine Blue | `#0C6FDB` | Eyebrows, rules, hover states — accents only |
| Ocean | `#0046B1` | Button hovers |
| Sail White | `#FFFFFF` | The ground |
| Mist | `#F1F5F9` | Alternating section ground |

**Montserrat Light** carries every heading (it shares the geometry of the wordmark);
**Inter** carries everything long. Nothing else. The brand book's rule — *never
substitute a serif* — is why the Patina serif was not copied; the reference's feel comes
from its restraint and rhythm, and those carry over intact.

Type is set on five display steps (`.d-xl` → `.d-xs`), one body step, and one 11px
letterspaced uppercase label (`.eyebrow`). Sections breathe on `--sec`
(`clamp(5.5rem, 11vw, 10.5rem)`), which is the single knob that sets the whole page's
vertical rhythm.

## Motion

| Behaviour | Hook | What it does |
|---|---|---|
| Hero rotation | `[data-hero]` + `.hero__tabs` | Four atolls cross-fade behind a headline that changes with them; slow ken-burns on the active frame; auto-advances every 7s and on tab click |
| Full-screen menu | `#burger` / `.menu` | White overlay, links rise from a clipped baseline on a stagger, focus trapped, Esc closes |
| Scroll reveals | `data-rv`, `data-rv-d="1..5"` | Fade-and-rise on entry, staggered by the delay attribute |
| Line reveals | `.rvline > span` | Headline lines slide up out of an overflow mask |
| Rails | `.rail` | Snap-scrolling card tracks with arrow buttons that disable at the ends |
| Lightbox | `[data-lb]` | Gallery viewer with keyboard arrows, captions, and awareness of the active filter |
| Reserve dock | `.dock` | Floating enquiry card that slides in past 620px of scroll |

All of it degrades under `prefers-reduced-motion` — entrances resolve to their end state,
the hero stops rotating, and smooth scrolling is turned off.

## Pages

| File | What it is |
|---|---|
| `index.html` | Home — hero, positioning, triptych, the vessel, voyage rail, statement, experiences |
| `vessel.html` | Tiffany Blanc 14 — four decks, full specification, what is aboard |
| `voyages.html` | Six voyages as alternating editorial rows |
| `voyages/<slug>.html` | One page per voyage (6), generated from `data.js` |
| `experiences.html` | Diving, snorkelling, sandbanks, sunset, fishing, celebrations, add-ons |
| `rates.html` | Voyage rates, what is and is not included, add-ons, seasons, terms |
| `gallery.html` | Filterable mosaic with a lightbox, generated from `data.js` |
| `about.html` | The company, the crew, what we do about the reef |
| `contact.html` | Details, message form, FAQ, the berth |
| `enquire.html` | Four-step charter enquiry with a live indicative total |
| `404.html` | Not found |

## Changing the content

Almost everything lives in **`assets/js/data.js`** — brand facts, navigation, the four
hero atolls, the six voyages (including itineraries, inclusions and prices), experiences,
the vessel specification, gallery captions and the FAQ.

After editing voyages or gallery entries, regenerate the pages built from them:

```sh
cd site
node tools/gen.js      # rewrites voyages/*.html and gallery.html
```

The header, full-screen menu, footer and reserve dock are rendered by `assets/js/site.js`
into the `data-chrome` placeholders, so they are identical everywhere and change in one
place. Pages in `voyages/` set `data-root="../"` on `<html>`; every injected URL is
prefixed with it.

Pages that open on a light background carry `class="page--light"` on `<body>` so the
header renders navy-on-white instead of white-on-photograph.

---

## Before this goes live

**Photography.** Only three images are Coravida's own: `vessel-anchor.jpg` (the vessel at
anchor off Malé), `vessel-salon.jpg` (the salon), and the two crops taken from the first
of those, `deck-flybridge.jpg` and `deck-cockpit.jpg`. Everything else is Unsplash stock,
used here to show the layout at its intended density. **The aerial and on-board shoot in
the proposal replaces all of it** — the file names are already descriptive, so swapping is
a like-for-like drop-in.

**Facts to confirm with the client.** These are plausible placeholders, not supplied data:

- The vessel specification in `data.js` → `CV.vessel` (length, beam, draft, speeds, build
  and refit years, cabin count).
- Every price: the six voyage `from` rates, the six add-ons, and the terms on
  `rates.html`. Add-on prices are duplicated on `experiences.html`, `rates.html` and
  `enquire.html` — keep the three in step.
- Contact details in `CV.brand`. `+960 777 1234`, `hello@coravida.com` and `M. Veraa,
  Malé` are taken from the business-card mockup in the brand guidelines and should be
  verified.
- The founding year `2019` on `about.html`.

**Forms send nothing.** `contact.html` and `enquire.html` show their confirmation state
and write the enquiry to `localStorage` under `cv.enquiries`. Wiring them to Resend and
the admin backend is Phase 2 of the proposal.

## Structure

```
site/
  index.html  vessel.html  voyages.html  experiences.html  rates.html
  gallery.html  about.html  contact.html  enquire.html  404.html
  voyages/*.html              6 voyage pages — generated
  assets/
    css/site.css              the whole design system
    js/data.js                all content — edit this
    js/site.js                chrome, hero, reveals, rail, lightbox, forms
    img/                      34 photographs + the logo lockups
  tools/gen.js                regenerates voyages/*.html and gallery.html
```

## Notes

- The only external request is the Google Fonts stylesheet for Montserrat and Inter.
- The logo lockups were extracted from the brand-guidelines artwork:
  `logo-full.png` / `logo-full-white.png` (mark + wordmark) and
  `logo-mark.png` / `logo-mark-white.png` (mark alone, used in the header).
- Checked at 390, 768, 1024 and 1440px across all 16 pages: no horizontal overflow, no
  broken images, no missing alt text, no console errors.
- The previous contents of this folder — a copy of the JH Yachts build that had been left
  here — were moved to `../_archive-jh-yachts-build/` rather than deleted.
