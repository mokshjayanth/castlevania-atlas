// Story mode: every on-screen event in episode order, one step at a time.
import { G, S, $, esc, byId, shown } from './core.js';
import { parseCode, epTitle } from './episodes.js';
import { render, scr, flyTo, target, fitPlaces, isFlying, kMin, kMax } from './view.js';
import { renderDetail, select } from './gazetteer.js';
import { setSeries, closeLegend } from './controls.js';

// Build the step list once. Events may carry { ord, sort, group }: ord orders events inside an episode,
// sort overrides the code used for ordering, and events sharing a group in one episode become one step
// (the five-city roll call in S1E1).
const ALL_STEPS = (() => {
  const steps = [], groups = {};
  G.places.forEach((p, pi) => p.events.forEach(([code, text, o = {}], ei) => {
    const k = parseCode(o.sort || code);
    if (!k) return;
    const step = { series: p.series, s: k[0], e: k[1], ord: o.ord ?? 5, idx: pi * 100 + ei, ids: [p.id], code, text, evs: { [p.id]: ei } };
    if (o.group) {
      const gk = p.series + o.group + code;
      if (groups[gk]) { groups[gk].ids.push(p.id); groups[gk].evs[p.id] = ei; return; }
      step.group = o.group; step.ord = o.ord ?? 3; groups[gk] = step;
    }
    steps.push(step);
  }));
  const ROLL = ['arges', 'severin', 'gresit', 'chilia', 'enisala'];
  for (const s of steps) if (s.group === 'roll') {
    s.ids.sort((a, b) => ROLL.indexOf(a) - ROLL.indexOf(b));
    s.text = 'Dracula names the cities his army will purge: Argeș, Severin, Gresit, Chilia and “Enisara”.';
  }
  const order = { cv: 0, noc: 1 };
  return steps.sort((a, b) => order[a.series] - order[b.series] || a.s - b.s || a.e - b.e || a.ord - b.ord || a.idx - b.idx);
})();

export const storySteps = () => ALL_STEPS.filter(s => S.series === 'all' || s.series === S.series);

let STEPS = [];
const box = $('#story'), plate = $('#plate'), btn = $('#story-btn');

export function storyOpen(i = 0) {
  STEPS = storySteps();
  if (!STEPS.length) return;
  S.who = ''; S.q = '';
  plate.classList.add('storying');
  box.hidden = false;
  btn.setAttribute('aria-pressed', 'true'); btn.textContent = '■ Story';
  closeLegend();
  storyGo(i);
}

export function storyClose() {
  S.story = -1; S.hl = [];
  box.hidden = true;
  plate.classList.remove('storying');
  btn.setAttribute('aria-pressed', 'false'); btn.textContent = '▶ Story';
  render();
}

// move the camera only when the place is not already comfortably in view above the story bar
function storyFocus(p) {
  if (p.view !== 'main') return;
  let x, y, k;
  if (p.tier === 'unplaced') { x = G.vignette.anchor.x - 30; y = G.vignette.anchor.y; k = 1.35; }
  else { x = p.x; y = p.y; k = p.rpx ? Math.max(0.8, Math.min(2.2, Math.min(S.vw, S.vh) * 0.28 / p.rpx)) : 1.7; }
  const [sx, sy] = scr(x, y);
  const inner = sx > S.vw * 0.2 && sx < S.vw * 0.8 && sy > S.vh * 0.12 && sy < S.vh * 0.62;
  if (!isFlying() && inner && S.k > k * 0.6 && S.k < k * 1.8) return;
  const kk = Math.max(kMin(), Math.min(kMax, k));
  flyTo(target(kk, x, y + (S.vh * 0.12) / kk));
}

export function storyGo(i) {
  if (!STEPS.length) return;
  i = Math.max(0, Math.min(STEPS.length - 1, i));
  S.story = i;
  const st = STEPS[i], p = byId[st.ids[0]];
  box.classList.toggle('noc', st.series === 'noc');
  $('#st-code').textContent = (st.series === 'noc' ? 'Nocturne ' : '') + st.code;
  $('#st-title').textContent = epTitle(st.series, st.code);
  $('#st-n').textContent = `${i + 1} / ${STEPS.length}`;
  $('#st-prog').style.width = ((i + 1) / STEPS.length * 100) + '%';
  const txt = $('#st-txt');
  txt.innerHTML = st.ids.length > 1 ? esc(st.text) : `<button type="button" class="pl" data-id="${p.id}">${esc(p.name)}</button> — ${esc(st.text)}`;
  const pl = txt.querySelector('.pl');
  if (pl) pl.addEventListener('click', () => { const keep = S.story; select(pl.dataset.id, true); S.story = keep; });
  $('#st-prev').disabled = i === 0;
  $('#st-next').disabled = i === STEPS.length - 1;
  S.hl = st.ids.slice(); S.sel = p.id;
  if (!shown(p)) setSeries('all', true);
  renderDetail(p, st.evs[p.id]);
  if (st.ids.length > 1) fitPlaces(st.ids, S.vh * 0.25); else storyFocus(p);
  render();
}

export function initStory() {
  btn.addEventListener('click', () => { if (S.story >= 0) storyClose(); else storyOpen(0); });
  $('#st-prev').addEventListener('click', () => storyGo(S.story - 1));
  $('#st-next').addEventListener('click', () => storyGo(S.story + 1));
  $('#st-close').addEventListener('click', storyClose);
  document.addEventListener('keydown', e => {
    if (S.story < 0 || (e.target.closest && e.target.closest('select, input, textarea'))) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); storyGo(S.story + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); storyGo(S.story - 1); }
    else if (e.key === 'Escape') storyClose();
  });
}
