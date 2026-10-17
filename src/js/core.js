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
// story: index of the current story step, or -1 when story mode is off.
export const S = { k: 0.5, tx: 0, ty: 0, series: 'all', routes: true, sel: null, vw: 800, vh: 600, who: '', hl: [], story: -1 };
try { const s = localStorage.getItem('cva-series'); if (s && ['all', 'cv', 'noc'].includes(s)) S.series = s; } catch (e) { /* storage unavailable */ }

// label priority when markers compete for space
export const RANK = ['targoviste', 'gresit', 'braila', 'styria', 'lindenfeld', 'machecoul', 'paris', 'tunis', 'genoa', 'magician', 'desert', 'egypt', 'arges', 'severin', 'chilia', 'enisala', 'rhodes', 'whitby', 'london', 'cachtice'];
export const ERA = { cv: 'Castlevania · 1455–1476', noc: 'Nocturne · 1783–1793' };
export const TIER = { exact: 'Real place', inferred: 'Placed from clues', region: 'Region only', unplaced: 'Location unrevealed' };

export const shown = p => S.series === 'all' || p.series === S.series;
export const matchWho = p => !S.who || (p.characters || []).includes(S.who);
export const seasonsText = p => p.seasons.join(' · ');
