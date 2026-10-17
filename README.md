# Castlevania Atlas

An interactive map of the places in Netflix's *Castlevania* (2017–2021) and *Castlevania: Nocturne*
(2023–2025), set on real geography. Each place opens a card with what happens there episode by episode,
who is involved, the real history behind it, and how its position was worked out.

*Unofficial fan project, not affiliated with Konami or Netflix. See [ATTRIBUTION.md](ATTRIBUTION.md).*

## What it does

- **27 places**, each with its on-screen events, characters, real-world background and placement evidence.
- **Honest positions.** Every marker states how sure it is:
  - *Real place*: a real town at its real coordinates (Târgoviște, Brăila, Genoa, Machecoul, Paris …).
  - *Placed from clues*: an invented place positioned from what characters say on screen, with a dashed ring for
    the uncertainty (Gresit is "close to Arges"; the Magician's town is "thirty miles up the road" from Genoa).
  - *Region only*: the show names a region, not a place (Isaac's desert, Egypt).
  - *Location unrevealed*: drawn in a labelled box instead of guessed (the castle's final site, the Belmont Hold, Danesti).
- **Story mode**: steps through all 66 scenes in episode order and flies the map to each one.
- **Search**: free text over place names, summaries, characters and on-screen events, so "guillotine" or
  "Olrox" finds a place as readily as "Paris". The map dims what does not match.
- **Follow a character**: fades out every place a character never visits, across both series.
- **Journeys**: Isaac's road to Styria, Carmilla's 800-mile march, the castle's jumps, Machecoul to Paris,
  and the Atlantic crossings on the world inset.
- **Distance checks**: the show's stated distances compared with real ones.
- Light and dark themes, period political labels for 1476 and 1792, miles-and-km scale bar, deep links (`#paris`, `#story`).

## Layout

```
data/                 the content: edit these to change what the map says
  places.js           every place: position, accuracy tier, events, characters, history, placement notes
                      plus labelRank, the label priority when markers compete for space
  routes.js           journeys on the main map and voyages on the world inset
  episodes.js         episode titles
  links.js            outbound links per place (fan wiki, Wikimedia Commons, Wikipedia)
geo/
  prepare-layers.js   downloads Natural Earth and writes simplified layers to geo/layers/
  relief.py           reprojects the shaded-relief texture into the map projection
  layers/             processed layers, committed so the site builds without network access
scripts/
  projection.js       the map projection (Lambert conformal conic, 36°N/54°N, centred on 14°E)
  project.js          projects layers and data into map units → build/geo.json
  bundle.js           builds dist/site/ and dist/castlevania-atlas.html
src/
  head.html, markup.html, styles.css
  disclaimer.js       the disclaimer text, shared by the page and the in-app panel
  js/                 ES modules, bundled by esbuild
    main.js           entry point
    core.js           shared data, state and DOM helpers
    projection.js     forward/inverse projection in the browser
    basemap.js        sea, land, relief, rivers, regions
    overlay.js        markers, rings, labels, journeys, the unrevealed-places box
    view.js           pan, zoom, pinch, camera flights
    gazetteer.js      side panel: index, character filter, place cards
    story.js          story mode
    controls.js       series filter, journeys toggle, key
    theme.js          light/dark toggle
    episodes.js, glyphs.js, scalebar.js
tests/smoke.mjs       browser checks on the built output
.github/workflows/    CI: build and run the smoke tests on every push and pull request
```

## Build

Requirements: Node 20 or later. Python 3 with numpy, scipy and Pillow only if you regenerate the relief.

```sh
npm install
npm run build      # build/geo.json, then dist/site/ and dist/castlevania-atlas.html
npm test           # browser smoke tests (needs a Chromium; set CHROMIUM_PATH or run `npx playwright install chromium`)
```

To regenerate the geography from the original sources (needs network access):

```sh
npm run geo        # Natural Earth layers, projection parameters, relief texture → geo/layers/
```

### Outputs

- `dist/site/`: a static site with no third-party requests (fonts are self-hosted). Upload the folder to any
  static host. Includes `disclaimer.html`, linked from the foot of the gazetteer.
- `dist/castlevania-atlas.html`: the same map as one self-contained file (used for the Claude artifact).

## Editing the content

Places live in `data/places.js`; the field list is at the top of the file. Events are
`[episode code, text, options?]`, where the code is `S2E6`, a range such as `S3E2–E8`, or a season (`S1`).
The optional `{ ord, sort, group }` controls ordering in story mode. After editing, run `npm run build`.

When adding an invented place, put the evidence in `placement` and give it an `r` (uncertainty radius in km)
that matches how precise that evidence is. If the show gives no geography at all, use `tier: 'unplaced'`
rather than guessing.

Add the new id to `labelRank` in the same file, which sets which label wins when markers overlap. `npm run
project` prints a note for any mappable place that is missing from it.

## Hosting

The site is plain static files, so any static host works. Build command `npm run build`, output directory
`dist/site`. GitHub Pages from a private repository needs a paid GitHub plan; Cloudflare Pages and Netlify can
build from a private repository on their free plans.

## Disclaimer

`src/disclaimer.js` holds the notices (unofficial status, trademarks, fair use, accuracy, privacy, a
contact route for rights holders) in one place. The build renders them two ways: as `dist/site/disclaimer.html`
for the hosted site, and inline in a collapsed section on the single-file page, which has no second page to
link to. Edit that one file and both follow; only the text each output uses is bundled.

The contact link points at the repository's issues page. Change `CONTACT` in `src/disclaimer.js` if you would
rather publish an email address.

## Licence

No licence has been chosen yet, so all rights are reserved by default. Third-party data and fonts keep their
own licences; see [ATTRIBUTION.md](ATTRIBUTION.md).
