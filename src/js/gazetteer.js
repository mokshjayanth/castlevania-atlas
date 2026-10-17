// The side panel: the place index, the character filter and each place's card.
import { G, S, $, esc, byId, ERA, TIER, shown, matchWho, seasonsText } from './core.js';
import { epTitle } from './episodes.js';
import { itemGlyph } from './glyphs.js';
import { render, scr, focusPlace, fitPlaces } from './view.js';
import { storyOpen, storyClose, storySteps } from './story.js';
import { setSeries } from './controls.js';

const gaz = $('#gaz');

// characters who appear at two or more places, most-travelled first
const WHO = (() => {
  const m = new Map();
  for (const p of G.places) for (const c of p.characters) {
    if (/\(mentioned\)/.test(c)) continue;
    const e = m.get(c) || { n: 0, cv: 0, noc: 0 };
    e.n++; e[p.series]++;
    m.set(c, e);
  }
  return [...m].filter(([, e]) => e.n >= 2).sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]));
})();

const onActivate = (node, fn) => {
  node.addEventListener('click', fn);
  node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
};

// small world map for the places beyond the main map's edge, with the Atlantic crossings
function worldCard(selId) {
  const W = G.world;
  const voyages = (W.voyages || []).filter(v => (S.series === 'all' || v.series === S.series) && !S.who)
    .map(v => `<path class="wv ${v.series}" d="${v.d}"><title>${esc(v.who)}</title></path><text class="wvl" x="${v.mx}" y="${v.my}" text-anchor="middle">${esc(v.label)}</text>`).join('');
  const LABEL = { aztec: [0, 16, 'middle'], saintdomingue: [7, 4, 'start'], boston: [6, -6, 'start'], japan: [-6, -6, 'end'] };
  const marks = W.places.map(q => {
    const p = byId[q.id], [lx, ly, an] = LABEL[q.id] || [6, -6, 'start'];
    const cls = `wm ${p.series}${selId === p.id ? ' sel' : ''}${shown(p) ? '' : ' era-hide'}${matchWho(p) ? '' : ' dim'}`;
    return `<g class="${cls}" data-id="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}" transform="translate(${q.x},${q.y})"><circle class="r" r="7"/><circle class="d" r="3.6"/><text x="${lx}" y="${ly}" text-anchor="${an}">${esc(p.name)}</text></g>`;
  }).join('');
  return `<figure class="world-card"><svg viewBox="0 0 ${W.W} ${W.H}" role="img" aria-label="World map of places beyond the main map, with the Atlantic crossings"><path class="wg" d="${W.graticule}"/><path class="wl" d="${W.land}"/><path class="wf" d="${W.frame}"/>${voyages}${marks}</svg><figcaption>Dashed frame: the main map. Dotted lines: Richter's crossing in 1783 and Annette's voyages. Tap a point to read about it.</figcaption></figure>`;
}
const wireWorld = () => gaz.querySelectorAll('.wm').forEach(g => onActivate(g, () => select(g.dataset.id, false)));

function whoOptions() {
  const grp = { both: [], cv: [], noc: [] };
  for (const [n, e] of WHO) grp[e.cv && e.noc ? 'both' : e.cv ? 'cv' : 'noc'].push([n, e.n]);
  const og = (label, arr) => arr.length ? `<optgroup label="${label}">${arr.map(([n, c]) => `<option value="${esc(n)}"${S.who === n ? ' selected' : ''}>${esc(n)} (${c})</option>`).join('')}</optgroup>` : '';
  return `<option value="">Everyone</option>${og('Both series', grp.both)}${og('Castlevania', grp.cv)}${og('Nocturne', grp.noc)}`;
}

const listItem = (p, meta) => `<li><button type="button" data-id="${p.id}">${itemGlyph(p)}<span class="nm${p.tier === 'exact' ? '' : ' fict'}">${esc(p.name)}</span><span class="meta">${meta}</span></button></li>`;

export function renderIndex() {
  const groups = [['cv', 'Castlevania', 'Wallachia & beyond, 1455–1476'], ['noc', 'Nocturne', 'France & beyond, 1783–1793']];
  let h = `<h2>Gazetteer</h2><p class="lede">${G.places.length} places from four seasons of <i>Castlevania</i> and two of <i>Nocturne</i>. Choose one to read what happens there and how its position was worked out.</p>
    <button type="button" class="story-cta" id="story-cta"><b>▶ Follow the story</b><span>${storySteps().length} scenes in episode order</span></button>
    <div class="who-row"><label for="who">Follow a character</label><select id="who">${whoOptions()}</select></div>`;
  if (S.who) {
    const n = G.places.filter(p => matchWho(p) && shown(p)).length;
    h += `<p class="who-note">${esc(S.who)} appears at ${n} ${n === 1 ? 'place' : 'places'}${S.series !== 'all' ? ' in this series' : ''}. <button type="button" id="who-clear">Show everyone</button></p>`;
  }
  for (const [s, name, sub] of groups) {
    if (S.series !== 'all' && S.series !== s) continue;
    const ps = G.places.filter(p => p.series === s && p.view === 'main' && matchWho(p));
    if (!ps.length) continue;
    h += `<section class="group"><div class="group-h"><h3 class="${s}">${name}</h3><span>${sub}</span></div><ul class="items">${ps.map(p => listItem(p, seasonsText(p))).join('')}</ul></section>`;
  }
  const far = G.places.filter(p => p.view === 'world' && shown(p) && matchWho(p));
  if (far.length || !S.who) {
    h += `<section class="group"><div class="group-h"><h3>Beyond the map edge</h3><span>backstories</span></div>${worldCard(null)}<ul class="items">${far.map(p => listItem(p, `${p.series === 'cv' ? 'CV' : 'Noc'} ${seasonsText(p)}`)).join('')}</ul></section>`;
  }
  const um = S.who ? [] : G.unmapped.filter(u => shown(u));
  if (um.length) h += `<section class="group"><div class="group-h"><h3>Named, never placed</h3><span>no geography given</span></div><ul class="unm">${um.map(u => `<li><b>${esc(u.name)}</b> — ${esc(u.text)}</li>`).join('')}</ul></section>`;
  h += `<div class="method"><p><b>How positions were set.</b> Real towns sit at their real coordinates. Invented places are placed only from what characters say on screen (distances, neighbours, travel times), and the dashed ring shows how far that evidence reaches. Where the show gives nothing, the place is boxed rather than guessed.</p>
    <p><b>Pictures.</b> Stills from the series belong to Netflix and are not copied here; each place links to its stills on the fan wiki, and real places link to period art and photographs on Wikimedia Commons.</p>
    <p>Base map: Natural Earth coastlines and rivers (public domain) with shaded relief from the basemap-data package (MIT), drawn in a conic projection centred on the Danube. Wallachia is outlined from the modern counties that formed it; Styria from today's state.</p>
    <p>Sources: episode dialogue and summaries cross-checked against <a href="https://en.wikipedia.org/wiki/Castlevania_(TV_series)" target="_blank" rel="noopener">Wikipedia</a>, the <a href="https://castlevania.fandom.com/" target="_blank" rel="noopener">Castlevania Wiki</a> and <a href="https://www.netflix.com/tudum/articles/castlevania-nocturne-season-2-release-date" target="_blank" rel="noopener">Netflix Tudum</a>.</p>
    <p><b>Unofficial.</b> A fan-made reference, not affiliated with or endorsed by Konami, Netflix or the series' producers. Castlevania is a trademark of Konami.</p></div>`;
  gaz.innerHTML = h;
  gaz.querySelectorAll('.items button').forEach(b => b.addEventListener('click', () => select(b.dataset.id, true)));
  $('#story-cta').addEventListener('click', () => storyOpen(0));
  $('#who').addEventListener('change', e => setWho(e.target.value));
  const wc = $('#who-clear');
  if (wc) wc.addEventListener('click', () => setWho(''));
  wireWorld();
}

const fmtLL = (lat, lon) => `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`;
const ext = (href, label, note) => `<li><a href="${href}" target="_blank" rel="noopener">${esc(label)} ↗</a>${note ? `<span>${esc(note)}</span>` : ''}</li>`;

/** the card for one place; evi highlights one of its events (story mode) */
export function renderDetail(p, evi) {
  const ev = p.events.map(([e, t], i) => {
    const title = epTitle(p.series, e);
    return `<li${i === evi ? ' class="now"' : ''}><span class="ep">${esc(e)}${title ? `<i>${esc(title)}</i>` : ''}</span><span>${esc(t)}</span></li>`;
  }).join('');
  const sites = p.sites ? `<div class="sect"><h4>Sites in the city</h4><ul class="sites">${p.sites.map(([n, c]) => `<li>${esc(n)}<span>${esc(c)}</span></li>`).join('')}</ul></div>` : '';
  const coord = p.tier !== 'unplaced' && p.lat !== undefined
    ? `<div class="coords">${p.tier === 'exact' ? '' : 'Marker at '}${fmtLL(p.lat, p.lon)}${p.r ? ` · ring ≈ ${p.r} km (${Math.round(p.r / 1.609)} mi)` : ''}</div>` : '';
  const L = (G.links || {})[p.id] || {}, fq = L.fandom || p.name;
  let links = ext(`https://castlevania.fandom.com/wiki/Special:Search?query=${encodeURIComponent(fq)}`, `Castlevania Wiki: “${fq}”`, 'Stills and episode details from the show');
  if (L.cm) links += ext(`https://commons.wikimedia.org/w/index.php?title=Special:MediaSearch&type=image&search=${encodeURIComponent(L.cm)}`, `Wikimedia Commons: “${L.cm}”`, 'Period art and photographs of the real place');
  if (L.wp) links += ext(`https://en.wikipedia.org/w/index.php?title=Special:Search&go=Go&search=${encodeURIComponent(L.wp)}`, `Wikipedia: ${L.wp}`, '');
  gaz.innerHTML = `<button type="button" class="back" id="back">← All places</button>
    <p class="eyebrow ${p.series}">${ERA[p.series]}</p>
    <h2 class="d-name${p.tier === 'exact' ? '' : ' fict'}">${esc(p.name)}</h2>
    ${p.alt ? `<p class="d-alt">${esc(p.alt)}</p>` : ''}
    <div class="chips"><span class="tag tier">${itemGlyph(p)}${TIER[p.tier]}</span>${p.seasons.map(s => `<span class="tag">${s}</span>`).join('')}</div>
    <p class="d-sum">${esc(p.summary)}</p>
    <div class="sect"><h4>On screen</h4><ul class="ev ${p.series}">${ev}</ul></div>
    ${sites}
    <div class="sect"><h4>Characters</h4><p>${p.characters.map(esc).join(', ')}</p></div>
    <div class="sect"><h4>In the real world</h4><p>${esc(p.real)}</p></div>
    <div class="sect"><h4>How it is placed</h4><p class="place">${esc(p.placement)}</p>${p.check ? `<p class="check"><b>Distance check.</b> ${esc(p.check)}</p>` : ''}${coord}</div>
    ${p.view === 'world' ? worldCard(p.id) : ''}
    <div class="sect"><h4>Pictures and further reading</h4><ul class="links">${links}</ul></div>`;
  $('#back').addEventListener('click', () => { S.sel = null; S.hl = []; renderIndex(); render(); gaz.scrollTop = 0; });
  if (p.view === 'world') wireWorld();
  const now = gaz.querySelector('.ev li.now');
  gaz.scrollTop = now ? Math.max(0, now.offsetTop - gaz.clientHeight * 0.25) : 0;
}

/** open a place's card; fly=true always moves the camera, otherwise only when the place is off screen */
export function select(id, fly) {
  const p = byId[id];
  if (!p) return;
  if (!shown(p)) setSeries('all', true);
  if (!matchWho(p)) S.who = '';
  S.sel = id; S.hl = [];
  renderDetail(p); render();
  if (fly || p.view === 'main') {
    const onScreen = p.x !== undefined && (() => { const [x, y] = scr(p.x, p.y); return x > 40 && y > 40 && x < S.vw - 40 && y < S.vh - 40; })();
    if (fly || !onScreen) focusPlace(p);
  }
  try { history.replaceState(null, '', '#' + id); } catch (e) { /* sandboxed frame */ }
}

/** filter the map and the index to one character ('' for everyone) */
export function setWho(v) {
  S.who = v;
  if (S.story >= 0) storyClose();
  if (S.sel && !matchWho(byId[S.sel])) S.sel = null;
  if (S.sel) renderDetail(byId[S.sel]); else renderIndex();
  render();
  if (v) fitPlaces(G.places.filter(p => matchWho(p) && shown(p) && p.view === 'main' && p.tier !== 'unplaced').map(p => p.id));
}
