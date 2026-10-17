// Marker glyphs: SVG for the map, inline-SVG strings for the gazetteer lists.
import { el } from './core.js';

const TOWER = 'M-5.5,5.5 L-5.5,-2.5 L-3.6,-2.5 L-3.6,-5.5 L-1.4,-5.5 L-1.4,-3.2 L1.4,-3.2 L1.4,-5.5 L3.6,-5.5 L3.6,-2.5 L5.5,-2.5 L5.5,5.5 Z';

/** draws the glyph for a place into group g: tower (castle), diamond (region), hollow dot (inferred), dot (exact) */
export function glyph(g, p, ghost) {
  const gg = el('g', { class: 'glyph' }, g);
  if (p.kind === 'castle') {
    el('path', { d: TOWER, class: (p.tier === 'exact' && !ghost) ? 'f' : 'h' }, gg);
    el('path', { d: 'M-1.4,5.5 L-1.4,2 A1.4,1.4 0 0 1 1.4,2 L1.4,5.5', fill: 'var(--halo)', stroke: 'none' }, gg);
  } else if (p.tier === 'region') {
    el('path', { d: 'M0,-5.5 L5.5,0 L0,5.5 L-5.5,0 Z', class: 'h' }, gg);
  } else if (p.tier === 'inferred') {
    el('circle', { r: 4.6, class: 'h' }, gg);
  } else {
    if (p.kind === 'city') el('circle', { r: 7.4, class: 'ring' }, gg);
    el('circle', { r: p.kind === 'village' ? 3.8 : 4.4, class: 'f' }, gg);
  }
}

/** small glyph for lists and chips, coloured by series */
export function itemGlyph(p) {
  const c = `var(--${p.series})`;
  if (p.tier === 'unplaced') return `<svg width="16" height="14" viewBox="0 0 16 14"><rect x="1" y="1" width="14" height="12" fill="none" stroke="${c}" stroke-dasharray="3 2"/></svg>`;
  if (p.tier === 'region') return `<svg width="16" height="16" viewBox="-8 -8 16 16"><path d="M0,-5 L5,0 L0,5 L-5,0 Z" fill="var(--panel)" stroke="${c}" stroke-width="1.6"/></svg>`;
  if (p.tier === 'inferred') return `<svg width="16" height="16" viewBox="-8 -8 16 16"><circle r="4.4" fill="var(--panel)" stroke="${c}" stroke-width="1.7"/></svg>`;
  return `<svg width="16" height="16" viewBox="-8 -8 16 16"><circle r="4.5" fill="${c}"/></svg>`;
}
