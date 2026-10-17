// Static base layers inside the zoomable group: sea, graticule, land with relief, lakes, rivers, coast, realms.
import { G, $, el } from './core.js';

export function buildBasemap() {
  const svg = $('#map'), defs = $('#defs'), world = $('#world'), P = G.paths;
  el('path', { id: 'landd', d: P.land, 'vector-effect': 'non-scaling-stroke' }, defs);
  el('use', { href: '#landd' }, el('clipPath', { id: 'landclip' }, defs));

  el('rect', { class: 'sea-bg', x: -4000, y: -4000, width: 10400, height: 9900 }, world);
  el('path', { class: 'grat', d: P.graticule }, world);
  el('use', { class: 'waterline w1', href: '#landd' }, world);
  el('use', { class: 'waterline w2', href: '#landd' }, world);
  el('use', { class: 'land', href: '#landd' }, world);
  el('image', { class: 'relief', href: svg.dataset.relief, x: 0, y: 0, width: G.W, height: G.H, 'clip-path': 'url(#landclip)', preserveAspectRatio: 'none' }, world);
  el('path', { class: 'lakes', d: P.lakes }, world);
  el('path', { class: 'rv minor', d: P.riversMinor }, world);
  el('path', { class: 'rv major', d: P.riversMajor }, world);
  el('use', { class: 'coast', href: '#landd' }, world);
  el('path', { class: 'realm', d: P.wallachia }, world);
  el('path', { class: 'realm', d: P.styria }, world);
  el('g', { id: 'routes' }, world);
}
