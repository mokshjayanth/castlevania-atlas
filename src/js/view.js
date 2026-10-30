// Pan, zoom and camera moves. Map units come from build/geo.json; S.k/tx/ty map them to screen pixels.
import { G, S, $, byId } from './core.js';
import { fwd, inv } from './projection.js';
import { drawOverlay } from './overlay.js';
import { drawScale } from './scalebar.js';

const svg = $('#map'), world = $('#world');
export const kMax = 9;
// Smallest zoom: the whole map fits. At this zoom the map can be smaller than the viewport, so
// clamp() centres it and there is nothing to pan — which is correct for "show me everything", but
// makes a poor opening view on a phone (see startView).
export const kMin = () => Math.min(S.vw / G.W, S.vh / G.H) * 0.98;
export const scr = (x, y) => [x * S.k + S.tx, y * S.k + S.ty];

export const VIEWS = {
  wallachia: [21.6, 43.4, 30.6, 46.4], france: [-3.6, 45.6, 4.0, 50.0],
  all: [-11, 25, 39, 59.5], start: [-4.5, 34.8, 37.2, 54.5],
  // phones: open on the Mediterranean core so the map overflows the screen and can be panned
  startNarrow: [4.0, 36.5, 30.0, 50.5],
};

export function size() { const r = svg.getBoundingClientRect(); S.vw = r.width; S.vh = r.height; }

export function clamp() {
  S.k = Math.max(kMin(), Math.min(kMax, S.k));
  const mw = G.W * S.k, mh = G.H * S.k, slack = 40;
  S.tx = mw <= S.vw ? (S.vw - mw) / 2 : Math.min(slack, Math.max(S.vw - mw - slack, S.tx));
  S.ty = mh <= S.vh ? (S.vh - mh) / 2 : Math.min(slack, Math.max(S.vh - mh - slack, S.ty));
}

let raf = 0;
export function render() { if (!raf) raf = requestAnimationFrame(draw); }
export function draw() {
  raf = 0;
  world.setAttribute('transform', `translate(${S.tx.toFixed(2)},${S.ty.toFixed(2)}) scale(${S.k.toFixed(5)})`);
  svg.setAttribute('data-zl', S.k < 0.75 ? 0 : S.k < 1.6 ? 1 : S.k < 3.2 ? 2 : 3);
  svg.setAttribute('data-series', S.series);
  drawOverlay();
  drawScale();
}

export function zoomAt(f, cx, cy) {
  const k0 = S.k;
  S.k = Math.max(kMin(), Math.min(kMax, S.k * f));
  const r = S.k / k0;
  S.tx = cx - (cx - S.tx) * r; S.ty = cy - (cy - S.ty) * r;
  clamp(); render();
}

// ── camera moves
let fly = null;
export const isFlying = () => fly !== null;
export function stopFly() { if (fly) { cancelAnimationFrame(fly); fly = null; } }
/** view that puts map point (cx, cy) at the centre at zoom k */
export function target(k, cx, cy) { k = Math.max(kMin(), Math.min(kMax, k)); return { k, tx: S.vw / 2 - cx * k, ty: S.vh / 2 - cy * k }; }

/** animate to view t; long jumps pull back so both ends are briefly in view */
export function flyTo(t, ms) {
  stopFly();
  const a = { k: S.k, tx: S.tx, ty: S.ty };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || ms === 0) { Object.assign(S, t); clamp(); render(); return; }
  const t0 = performance.now();
  const ca = [(S.vw / 2 - a.tx) / a.k, (S.vh / 2 - a.ty) / a.k], cb = [(S.vw / 2 - t.tx) / t.k, (S.vh / 2 - t.ty) / t.k];
  const dist = Math.hypot(cb[0] - ca[0], cb[1] - ca[1]);
  const la = Math.log(a.k), lb = Math.log(t.k);
  const lm = Math.log(Math.max(kMin(), Math.min(a.k, t.k, Math.min(S.vw, S.vh) * 0.8 / Math.max(dist, 1))));
  const bump = Math.max(0, (la + lb) / 2 - lm);
  if (ms === undefined) ms = 650 + Math.min(700, bump * 450);
  const step = now => {
    let u = Math.min(1, (now - t0) / ms);
    u = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    const k = Math.exp(la + (lb - la) * u - bump * Math.sin(Math.PI * u));
    const cx = ca[0] + (cb[0] - ca[0]) * u, cy = ca[1] + (cb[1] - ca[1]) * u;
    S.k = k; S.tx = S.vw / 2 - cx * k; S.ty = S.vh / 2 - cy * k;
    clamp(); render();
    fly = u < 1 ? requestAnimationFrame(step) : null;
  };
  fly = requestAnimationFrame(step);
}

/** fit a lon/lat box */
export function fitLL(lon0, lat0, lon1, lat1, ms) {
  const pts = [];
  for (let i = 0; i <= 8; i++) for (const la of [lat0, lat1, (lat0 + lat1) / 2]) pts.push(fwd(lon0 + (lon1 - lon0) * i / 8, la));
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  flyTo(target(Math.min(S.vw / (x1 - x0), S.vh / (y1 - y0)) * 0.96, (x0 + x1) / 2, (y0 + y1) / 2), ms);
}

/** fit a set of places, leaving bottomPad pixels free (for the story bar) */
export function fitPlaces(ids, bottomPad = 0) {
  const pts = ids.map(id => byId[id]).filter(p => p && p.x !== undefined);
  if (!pts.length) return;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y), pad = 70;
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
  const k = Math.min(2.6, (S.vw - pad * 2) / Math.max(w, 1), (S.vh - pad * 2 - bottomPad) / Math.max(h, 1));
  flyTo(target(k, (Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2 + bottomPad / 2 / k));
}

/** bring a place into view at a zoom that suits its uncertainty ring */
export function focusPlace(p) {
  if (p.view !== 'main') return;
  if (p.offmap) { fitPlaces([p.id, p.offmap.from]); return; }
  if (p.tier === 'unplaced') { const a = G.vignette.anchor, k = Math.max(S.k, 1.6); flyTo(target(k, a.x - 60 / k, a.y)); return; }
  const z = p.rpx ? Math.max(0.9, (Math.min(S.vw, S.vh) * 0.3) / p.rpx) : Math.max(S.k, 2.4);
  flyTo(target(Math.min(z, 3.0), p.x, p.y));
}

/** initial view: Iberia to the Black Sea, or a tighter box on a narrow screen.
 *  Fitting the full width into a phone leaves the map shorter than the viewport, and clamp() then
 *  pins it vertically centred — so a one-finger drag has nowhere to go and the map feels dead. */
export function startView() {
  size();
  const v = S.vw < 560 ? VIEWS.startNarrow : VIEWS.start;
  const pts = [fwd(v[0], v[1]), fwd(v[2], v[3]), fwd(v[0], v[3]), fwd(v[2], v[1]), fwd((v[0] + v[2]) / 2, v[1])];
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const k = Math.min(S.vw / (Math.max(...xs) - Math.min(...xs)), S.vh / (Math.max(...ys) - Math.min(...ys)));
  Object.assign(S, target(k, (Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2));
  clamp();
}

/** keep the centre fixed when the map is resized */
export function watchResize() {
  let t = 0;
  new ResizeObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => {
      const cx = (S.vw / 2 - S.tx) / S.k, cy = (S.vh / 2 - S.ty) / S.k;
      size(); S.tx = S.vw / 2 - cx * S.k; S.ty = S.vh / 2 - cy * S.k;
      clamp(); render();
    }, 60);
  }).observe(svg);
}

// ── input: wheel, drag, pinch, double-click, keys, zoom buttons, view chips
export function initView() {
  svg.addEventListener('wheel', e => {
    e.preventDefault(); stopFly();
    const rc = svg.getBoundingClientRect();
    const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(Math.exp(-d * 0.0018), e.clientX - rc.left, e.clientY - rc.top);
  }, { passive: false });

  const ptrs = new Map();
  let pinch = null, dragMoved = 0, last = null;
  svg.addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button !== 0) return;
    stopFly();
    // capture only once a real drag starts (see pointermove), so taps reach the markers
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
    dragMoved = 0; last = { x: e.clientX, y: e.clientY };
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: S.k }; }
    svg.classList.add('dragging');
  });
  svg.addEventListener('pointermove', e => {
    const rc = svg.getBoundingClientRect();
    const ll = inv((e.clientX - rc.left - S.tx) / S.k, (e.clientY - rc.top - S.ty) / S.k);
    $('#coord').textContent = `${Math.abs(ll[1]).toFixed(2)}° ${ll[1] >= 0 ? 'N' : 'S'}  ${Math.abs(ll[0]).toFixed(2)}° ${ll[0] >= 0 ? 'E' : 'W'}`;
    if (!ptrs.has(e.pointerId)) return;
    const pr = ptrs.get(e.pointerId);
    ptrs.set(e.pointerId, { ...pr, x: e.clientX, y: e.clientY });
    if (!pr.cap && Math.hypot(e.clientX - pr.x0, e.clientY - pr.y0) > 4) {
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
      ptrs.get(e.pointerId).cap = true;
    }
    if (ptrs.size === 2 && pinch) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt((pinch.k * d / pinch.d) / S.k, (a.x + b.x) / 2 - rc.left, (a.y + b.y) / 2 - rc.top);
      dragMoved += 10;
      return;
    }
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    last = { x: e.clientX, y: e.clientY };
    dragMoved += Math.abs(dx) + Math.abs(dy);
    S.tx += dx; S.ty += dy; clamp(); render();
  });
  const end = e => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (!ptrs.size) svg.classList.remove('dragging');
    if (ptrs.size === 1) last = { ...[...ptrs.values()][0] };
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('dblclick', e => { const rc = svg.getBoundingClientRect(); zoomAt(2, e.clientX - rc.left, e.clientY - rc.top); });
  // a drag that ends over a marker must not count as a click on it
  svg.addEventListener('click', e => { if (dragMoved > 6) e.stopPropagation(); }, true);

  $('#zin').onclick = () => zoomAt(1.6, S.vw / 2, S.vh / 2);
  $('#zout').onclick = () => zoomAt(1 / 1.6, S.vw / 2, S.vh / 2);
  svg.setAttribute('tabindex', '0');
  svg.addEventListener('keydown', e => {
    if (e.target !== svg || S.story >= 0) return;
    const m = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] }[e.key];
    if (m) { S.tx += m[0]; S.ty += m[1]; clamp(); render(); e.preventDefault(); }
    if (e.key === '+' || e.key === '=') zoomAt(1.4, S.vw / 2, S.vh / 2);
    if (e.key === '-') zoomAt(1 / 1.4, S.vw / 2, S.vh / 2);
  });
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => fitLL(...VIEWS[b.dataset.view])));
}
