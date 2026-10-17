// Scale bar for the latitude at the centre of the view. Miles first: the characters measure in miles.
import { S, $, el } from './core.js';
import { inv, unitsPerKm } from './projection.js';

const NICE = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
const MI = 1.609344;

export function drawScale() {
  const sb = $('#scalebar');
  const lat = inv((S.vw / 2 - S.tx) / S.k, (S.vh / 2 - S.ty) / S.k)[1];
  const pxKm = unitsPerKm(Math.max(-60, Math.min(70, lat))) * S.k;
  const pick = perUnit => { let best = NICE[0]; for (const n of NICE) if (n * perUnit <= 120) best = n; return best; };
  const mi = pick(pxKm * MI), km = pick(pxKm);
  sb.innerHTML = '';
  const bar = (y, w, n, unit) => {
    el('rect', { class: 'a', x: 0, y, width: w / 2, height: 4 }, sb);
    el('rect', { class: 'b', x: w / 2, y, width: w / 2, height: 4 }, sb);
    el('text', { x: w + 6, y: y + 5 }, sb).textContent = `${n} ${unit}`;
  };
  bar(3, mi * MI * pxKm, mi, mi === 1 ? 'mile' : 'miles');
  bar(19, km * pxKm, km, 'km');
}
