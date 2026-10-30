// Everything drawn above the base map: place markers, uncertainty rings, labels, journeys,
// context cities and the "location unrevealed" vignette. Positions are recomputed on every draw
// so markers and text stay the same size at any zoom.
import { G, S, $, el, byId, TIER, RANK, shown, matchFilters } from './core.js';
import { glyph } from './glyphs.js';
import { scr } from './view.js';
import { select } from './gazetteer.js';

const R = Math.PI / 180;
const VW = 196, VH = 104; // vignette box, screen pixels
const marks = [], routeEls = [];
let texts = [], cities = [], vigG, VG, VGc, vgMarks = [], leader;

export const vgCompact = () => S.k < 0.6;

const onActivate = (g, fn) => {
  g.addEventListener('click', e => { e.stopPropagation(); fn(); });
  g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
};

export function buildOverlay() {
  const zonesG = $('#ov-zones'), textG = $('#ov-text'), citiesG = $('#ov-cities'), marksG = $('#ov-marks'),
    labelsG = $('#ov-labels'), rlblG = $('#ov-routelbl'), routesG = $('#routes');
  vigG = $('#ov-vignette');

  // place markers
  for (const p of G.places) {
    if (p.view !== 'main' || p.tier === 'unplaced') continue;
    const zone = p.rpx ? el('circle', { class: `zone ${p.series} ${p.tier}` }, zonesG) : null;
    const label = p.offmap ? `${p.name}: off the map to the ${p.offmap.compass}, ${p.offmap.km.toLocaleString('en')} km from ${p.offmap.fromName}` : `${p.name}: ${TIER[p.tier]}`;
    const g = el('g', { class: `mk ${p.series}${p.offmap ? ' off' : ''}`, tabindex: 0, role: 'button', 'aria-label': label }, marksG);
    el('circle', { r: 13, class: 'hit' }, g);
    el('circle', { r: 6, class: 'pulse' }, g);
    glyph(g, p);
    const lbl = el('text', { class: 'lbl' + (p.tier !== 'exact' ? ' fict' : '') }, labelsG);
    lbl.textContent = p.name;
    let ox = 0, oy = 0;
    if (p.markAt === 'edge' && p.rpx) { const a = p.labelAngle * R; ox = Math.cos(a); oy = Math.sin(a); }
    marks.push({ p, g, zone, lbl, ox, oy, edge: p.markAt === 'edge' });
    onActivate(g, () => select(p.id, false));
  }
  // real places sit on top where markers overlap at low zoom
  for (const m of marks) if (m.p.tier === 'exact') marksG.appendChild(m.g);

  // the castle's known stops in Season 2 (ghost towers)
  for (const [id, dx, dy] of [['castleA', 0, 0], ['castleB', 16, -16]]) {
    const st = G.stops[id];
    const g = el('g', { class: 'mk cv ghost', tabindex: 0, role: 'button', 'aria-label': `Dracula's Castle, ${st.label}, ${st.note}` }, marksG);
    el('circle', { r: 12, class: 'hit' }, g);
    el('circle', { r: 6, class: 'pulse' }, g);
    glyph(g, { kind: 'castle', tier: 'inferred' }, true);
    const lbl = el('text', { class: 'lbl sub' }, labelsG);
    lbl.textContent = st.label;
    marks.push({ p: byId.castle, g, lbl, stop: st, dx, dy, ox: 0, oy: 0, sub: true });
    onActivate(g, () => select('castle', false));
  }

  // seas, ranges, rivers and period politics
  texts = G.labels.map(l => {
    const t = el('text', { class: `tx ${l.cls}`, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'data-era': l.era }, textG);
    t.textContent = l.text;
    return { l, t };
  });
  cities = G.cities.map(c => {
    const g = el('g', { class: 'city' }, citiesG);
    el('circle', { r: 1.8 }, g);
    el('text', { x: 5, y: 3.5 }, g).textContent = c.name;
    return { c, g };
  });

  // journeys, drawn in map units inside the zoomed group
  for (const r of G.routes) {
    const grp = el('g', { 'data-series': r.series, 'data-route': r.id }, routesG);
    let longest = null, ll = -1;
    for (const leg of r.legs) {
      el('path', { d: leg.d, class: 'route-halo' }, grp);
      const pth = el('path', { d: leg.d, class: `route ${r.series} ${leg.kind}` }, grp);
      const len = pth.getTotalLength ? pth.getTotalLength() : 0;
      if (len > ll) { ll = len; longest = pth; }
    }
    let at = null;
    try { const q = longest.getPointAtLength(ll * 0.5); at = { x: q.x, y: q.y }; } catch (e) { /* not rendered yet */ }
    const t = el('text', { class: `tx route-lbl ${r.series}`, 'text-anchor': 'middle' }, rlblG);
    t.textContent = r.name + (r.note ? ` · ${r.note}` : '');
    routeEls.push({ r, grp, t, at });
  }
  // leader from the vignette to Wallachia (Castlevania only)
  { const a = G.vignette.anchor, b = G.vignette.leaderTo; leader = el('path', { class: 'leader', d: `M${a.x},${a.y} Q${(a.x + b.x) / 2},${Math.min(a.y, b.y) - 60} ${b.x},${b.y}` }, routesG); }

  buildVignette();
}

// Places the show never locates (castle, Belmont Hold, Danesti) are shown schematically in a box.
function buildVignette() {
  VG = el('g', {}, vigG);
  el('rect', { class: 'vg-box', x: -VW / 2, y: -VH / 2, width: VW, height: VH }, VG);
  el('text', { class: 'vg-t1', x: -VW / 2 + 10, y: -VH / 2 + 16 }, VG).textContent = 'Location unrevealed';
  el('text', { class: 'vg-t2', x: -VW / 2 + 10, y: -VH / 2 + 31 }, VG).textContent = 'somewhere in Wallachia · not to scale';
  const vgC = { x: -VW / 2 + 30, y: 14 }, vgD = { x: VW / 2 - 36, y: 22 };
  el('path', { class: 'vg-line', d: `M${vgC.x + 9},${vgC.y + 2} L${vgD.x - 7},${vgD.y}` }, VG);
  el('text', { class: 'vg-dist', x: (vgC.x + vgD.x) / 2 + 2, y: (vgC.y + vgD.y) / 2 - 5, 'text-anchor': 'middle' }, VG).textContent = '≈ 20 miles';

  const vgMark = (id, at, labelText) => {
    const p = byId[id];
    const g = el('g', { class: `mk ${p.series}`, tabindex: 0, role: 'button', transform: `translate(${at.x},${at.y})`, 'aria-label': `${p.name}: location unrevealed` }, VG);
    el('circle', { r: 12, class: 'hit' }, g);
    el('circle', { r: 6, class: 'pulse' }, g);
    glyph(g, p.kind === 'castle' ? { kind: 'castle', tier: 'exact' } : { kind: 'village', tier: 'exact' });
    el('text', { class: 'vg-lbl', x: 0, y: 20, 'text-anchor': 'middle' }, g).textContent = labelText;
    onActivate(g, () => select(id, false));
    return { p, g };
  };
  vgMarks = [vgMark('castle', vgC, "Dracula's Castle"), vgMark('belmont', vgC, ''), vgMark('danesti', vgD, 'Danesti')];
  // the Hold lies under the castle: it gets its own clickable caption instead of a glyph
  const hold = vgMarks[1].g;
  hold.setAttribute('transform', `translate(${vgC.x},${vgC.y + 34})`);
  hold.querySelector('.glyph').remove();
  hold.querySelector('.hit').setAttribute('r', 9);
  hold.querySelector('.pulse').setAttribute('cy', -4);
  el('text', { class: 'vg-dist', x: 0, y: 0, 'text-anchor': 'middle' }, hold).textContent = 'over the Belmont Hold';

  // compact badge for low zoom, where the full box would cover Wallachia itself
  VGc = el('g', { class: 'mk cv', tabindex: 0, role: 'button', 'aria-label': "Places whose location is never revealed: open Dracula's Castle and zoom in" }, vigG);
  el('rect', { class: 'vg-box', x: -13, y: -13, width: 26, height: 26 }, VGc);
  el('circle', { r: 16, class: 'hit' }, VGc);
  glyph(VGc, { kind: 'castle', tier: 'exact' });
  el('text', { class: 'vg-dist', x: 0, y: 26, 'text-anchor': 'middle' }, VGc).textContent = 'unrevealed';
  onActivate(VGc, () => select('castle', true));
}

export function drawOverlay() {
  const vis = (x, y, m = 60) => x > -m && y > -m && x < S.vw + m && y < S.vh + m;
  for (const m of marks) {
    const on = shown(m.p);
    let x, y;
    if (m.stop) { [x, y] = scr(m.stop.x, m.stop.y); x += m.dx; y += m.dy; }
    else {
      [x, y] = scr(m.p.x, m.p.y);
      if (m.zone) {
        m.zone.setAttribute('cx', x.toFixed(1)); m.zone.setAttribute('cy', y.toFixed(1)); m.zone.setAttribute('r', (m.p.rpx * S.k).toFixed(1));
        m.zone.classList.toggle('era-hide', !on);
      }
      if (m.edge) { const rr = Math.max(m.p.rpx * S.k, 14); x += m.ox * rr; y += m.oy * rr; }
    }
    const w = matchFilters(m.p);
    m.x = x; m.y = y; m.on = on && w && vis(x, y);
    m.g.classList.toggle('dim', on && !w);
    if (m.zone) m.zone.classList.toggle('dim', on && !w);
    m.g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
    m.g.classList.toggle('era-hide', !on);
    m.g.classList.toggle('sel', !m.stop && (S.sel === m.p.id || S.hl.includes(m.p.id)));
  }
  for (const { l, t } of texts) {
    const [x, y] = scr(l.x, l.y);
    t.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})${l.rot ? ` rotate(${l.rot})` : ''}`);
    t.classList.toggle('era-hide', !(l.era === 'all' || l.era === S.series));
  }
  for (const c of cities) { const [x, y] = scr(c.c.x, c.c.y); c.x = x; c.y = y; c.g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`); }
  for (const re of routeEls) {
    // a selected place's own crossing is drawn even with journeys switched off
    const on = (S.routes || S.hlRoutes.includes(re.r.id)) && (S.series === 'all' || S.series === re.r.series) && (!S.who || (re.r.who || []).includes(S.who));
    re.grp.classList.toggle('era-hide', !on);
    if (re.at && on && S.k >= 0.9) {
      const [x, y] = scr(re.at.x, re.at.y);
      re.t.setAttribute('x', x.toFixed(1)); re.t.setAttribute('y', (y - 8).toFixed(1)); re.t.classList.remove('era-hide');
    } else re.t.classList.add('era-hide');
  }
  { const [x, y] = scr(G.vignette.anchor.x, G.vignette.anchor.y), tr = `translate(${x.toFixed(1)},${y.toFixed(1)})`;
    VG.setAttribute('transform', tr); VGc.setAttribute('transform', tr);
    VG.classList.toggle('era-hide', vgCompact()); VGc.classList.toggle('era-hide', !vgCompact());
    vigG.classList.toggle('era-hide', S.series === 'noc'); }
  for (const v of vgMarks) { v.g.classList.toggle('sel', S.sel === v.p.id || S.hl.includes(v.p.id)); v.g.classList.toggle('dim', !matchFilters(v.p)); }
  const vgMatch = vgMarks.some(v => matchFilters(v.p));
  VGc.classList.toggle('dim', !vgMatch);
  leader.classList.toggle('era-hide', S.series === 'noc');
  leader.classList.toggle('dim', !vgMatch);
  placeLabels();
}

// ── label placement: greedy, in priority order, skipping any label that would collide
const measureCtx = document.createElement('canvas').getContext('2d');
const wCache = {};
const textWidth = (text, font) => {
  const key = font + text;
  if (!(key in wCache)) { measureCtx.font = font; wCache[key] = measureCtx.measureText(text).width; }
  return wCache[key];
};
/** call once web fonts have loaded so labels are measured with the real faces */
export function resetTextMetrics() { for (const k in wCache) delete wCache[k]; }

function placeLabels() {
  const boxes = [];
  const hit = b => boxes.some(o => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
  if (S.series !== 'noc') {
    const [x, y] = scr(G.vignette.anchor.x, G.vignette.anchor.y);
    const hw = vgCompact() ? 16 : VW / 2, hh = vgCompact() ? 16 : VH / 2;
    boxes.push({ x0: x - hw, y0: y - hh, x1: x + hw, y1: y + hh + (vgCompact() ? 14 : 0) });
  }
  for (const m of marks) if (m.on) boxes.push({ x0: m.x - 6, y0: m.y - 6, x1: m.x + 6, y1: m.y + 6 });
  // The open place always wins; castle stops come last. A place missing from RANK sorts after the
  // ranked ones instead of ahead of them (indexOf would return -1 and beat every listed place).
  const rank = m => {
    if (m.p.id === S.sel && !m.stop) return -1;
    if (m.stop) return 50;
    const i = RANK.indexOf(m.p.id);
    return i === -1 ? 49 : i;
  };
  const order = marks.slice().sort((a, b) => rank(a) - rank(b));
  const CANDIDATES = [[11, 4.5, 'start'], [-11, 4.5, 'end'], [0, -12, 'middle'], [0, 20, 'middle'], [9, -8, 'start'], [-9, -8, 'end'], [9, 15, 'start'], [-9, 15, 'end']];
  for (const m of order) {
    const t = m.lbl;
    if (!m.on || (m.stop && S.k < 1.1)) { t.classList.add('era-hide'); continue; }
    const sel = S.sel === m.p.id && !m.stop;
    t.classList.toggle('sel', sel);
    const font = m.sub ? '500 11px "Alegreya SC", serif' : `${m.p.tier !== 'exact' ? 'italic ' : ''}${sel ? 15.5 : 14}px "IM Fell English", serif`;
    const w = textWidth(t.textContent, font), h = sel ? 15 : 13;
    let placed = false;
    for (const [dx, dy, an] of CANDIDATES) {
      const x = m.x + dx, y = m.y + dy;
      const x0 = an === 'start' ? x : an === 'end' ? x - w : x - w / 2;
      const b = { x0: x0 - 2, x1: x0 + w + 2, y0: y - h + 2, y1: y + 3 };
      // labels must stay inside the map; the open place may overlap others but not leave the view
      const fits = b.x0 > 2 && b.x1 < S.vw - 2 && b.y0 > 2 && b.y1 < S.vh - 2;
      if (fits && (sel || !hit(b))) {
        boxes.push(b);
        t.setAttribute('x', x.toFixed(1)); t.setAttribute('y', y.toFixed(1)); t.setAttribute('text-anchor', an);
        t.classList.remove('era-hide');
        placed = true;
        break;
      }
    }
    if (!placed) t.classList.add('era-hide');
  }
  // context cities only where there is room
  for (const c of cities) {
    const w = textWidth(c.c.name, '11px Alegreya, serif');
    const b = { x0: c.x - 3, x1: c.x + 7 + w, y0: c.y - 9, y1: c.y + 6 };
    const ok = c.x > -40 && c.y > -40 && c.x < S.vw + 40 && c.y < S.vh + 40 && !hit(b);
    c.g.classList.toggle('era-hide', !ok);
    if (ok) boxes.push(b);
  }
}
