// The disclaimer text, in one place: the bundler renders it into dist/site/disclaimer.html, and
// src/js/gazetteer.js shows the same sections in the side panel (the single-file page has no
// second page to link to). Each section is [heading, ...paragraphs]; `html` allows inline links.

export const CONTACT = 'https://github.com/mokshjayanth/castlevania-atlas/issues';

export const SECTIONS = [
  ['Unofficial fan project', [
    'The Castlevania Atlas is an unofficial, non-commercial reference made by a fan of the series. It is not affiliated with, authorised, sponsored or endorsed by Konami, Netflix, Frederator Studios, Powerhouse Animation, or anyone involved in making <i>Castlevania</i> or <i>Castlevania: Nocturne</i>.',
    'Nothing here should be read as an official statement about the series or its setting.',
  ]],
  ['Trademarks and copyright', [
    '<i>Castlevania</i> is a trademark of Konami Digital Entertainment. <i>Castlevania: Nocturne</i> and the Netflix series are the property of their respective rights holders. All trademarks and copyrights remain with their owners, and are referred to here only to identify the works this atlas describes.',
    'No artwork, screenshots, stills, logos, music or audio from the games or the series are reproduced on this site. What you see is this project\'s own maps and writing.',
  ]],
  ['Quotation and fair use', [
    'Place names, plot events and a few short quotations of dialogue are cited for the purpose of commentary, criticism and reference. The descriptions are written for this project and are not copied from any source. Where a stated distance or a line of dialogue matters to how a place is positioned, it is quoted briefly and attributed to its episode.',
  ]],
  ['Accuracy and interpretation', [
    'This atlas is interpretation, not canon. The series rarely gives exact coordinates, so every marker states how sure its position is: a real place at its real coordinates, a position reasoned from on-screen clues (with a ring showing the uncertainty), a region only, or a location the show never reveals. The reasoning for each is written out on the place\'s card so you can disagree with it.',
    'Real-world historical and geographic notes are included as background and are simplified for a map. They may contain errors and should not be relied on as a historical source.',
  ]],
  ['Map data and fonts', [
    'The base map uses Natural Earth data (public domain) and a shaded-relief texture from the basemap-data package (MIT). The world inset uses world-atlas (ISC). The typefaces are licensed under the SIL Open Font License. Full notices, licence texts and research sources are listed in the project\'s attribution file.',
  ]],
  ['Privacy', [
    'This site sets no cookies and does not identify or track you. It serves its own fonts and makes no third-party requests beyond the one described next.',
    'The hosted site counts visits using <a href="https://www.cloudflare.com/web-analytics/" target="_blank" rel="noopener">Cloudflare Web Analytics</a>, which is cookieless and uses no fingerprinting or cross-site identifiers. It records that a page was viewed, along with the referring site, country, browser and device type. It does not record who you are, and nothing it collects can be traced back to you or followed across other sites. Nothing you do on the map &mdash; the places you open, what you search for, how you move around &mdash; is sent anywhere.',
    'Your chosen theme and series filter, and the fact that you have dismissed the spoiler notice, are remembered in your own browser\'s local storage. They are never transmitted anywhere, and clearing your site data removes them.',
    'The single-file offline version of this atlas contains no analytics at all.',
  ]],
  ['Rights holders', [
    `If you represent a rights holder and believe something here oversteps, please <a href="${CONTACT}" target="_blank" rel="noopener">open an issue on the project repository</a> and it will be addressed promptly.`,
  ]],
  ['No warranty', [
    'This project is provided as is, without warranty of any kind, and is offered for reference and enjoyment only.',
  ]],
];

/** the disclaimer as HTML sections, for either output */
export const sectionsHtml = (h = 'h2') => SECTIONS
  .map(([head, ...paras]) => `<section><${h}>${head}</${h}>${paras.flat().map(p => `<p>${p}</p>`).join('')}</section>`)
  .join('\n');
