// Shared data, state and small DOM helpers used by every module.
import G from '../../build/geo.json';

export { G };
export const NS = 'http://www.w3.org/2000/svg';
export const $ = s => document.querySelector(s);
export const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const byId = Object.fromEntries(G.places.map(p => [p.id, p]));

// View and selection state. k/tx/ty: zoom and pan; sel: open place; hl: places lit by story mode;
// who: character filter; q: gazetteer search text; routes: journeys drawn (off until asked for);
// story: index of the current story step, or -1 when off.
export const S = { k: 0.5, tx: 0, ty: 0, series: 'all', routes: false, sel: null, vw: 800, vh: 600, who: '', q: '', hl: [], story: -1 };
try { const s = localStorage.getItem('cva-series'); if (s && ['all', 'cv', 'noc'].includes(s)) S.series = s; } catch (e) { /* storage unavailable */ }

// label priority when markers compete for space (kept with the data, in data/places.js)
export const RANK = G.labelRank;
export const ERA = { cv: 'Castlevania · 1455–1476', noc: 'Nocturne · 1783–1793' };
export const TIER = { exact: 'Real place', inferred: 'Placed from clues', region: 'Region only', unplaced: 'Location unrevealed' };

export const shown = p => S.series === 'all' || p.series === S.series;
export const matchWho = p => !S.who || (p.characters || []).includes(S.who);

// Free-text search over a place's names, prose, characters and events. Lives here so the map
// and the gazetteer dim the same places; the index is built once per place.
const searchCache = {};
export const searchText = p => searchCache[p.id] ??= [
  p.name, p.alt || '', p.summary, p.real, p.placement,
  (p.characters || []).join(' '), (p.seasons || []).join(' '),
  (p.events || []).map(([code, text]) => `${code} ${text}`).join(' '),
].join(' ').toLowerCase();
export const matchQ = p => { const q = S.q.trim().toLowerCase(); return !q || searchText(p).includes(q); };

/** a place is lit when it passes both the character filter and the search box */
export const matchFilters = p => matchWho(p) && matchQ(p);
export const seasonsText = p => p.seasons.join(' · ');
