// Header controls: series filter, journeys toggle and the map key.
import { S, $, byId, shown } from './core.js';
import { render, fitLL, VIEWS } from './view.js';
import { renderDetail, renderIndex } from './gazetteer.js';
import { storyClose } from './story.js';

const legendBtn = $('#legend-btn'), legend = $('#legend');

/** show one series ('cv', 'noc') or both ('all'); quiet skips re-rendering the side panel
 *  and marks this as a restore rather than a choice, so the startup call stores nothing */
export function setSeries(s, quiet) {
  S.series = s;
  document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.series === s ? 'true' : 'false'));
  if (!quiet) { try { localStorage.setItem('cva-series', s); } catch (e) { /* storage unavailable */ } }
  if (S.sel && !shown(byId[S.sel])) S.sel = null;
  if (!quiet) { if (S.sel) renderDetail(byId[S.sel]); else renderIndex(); }
  render();
}

export function closeLegend() { legend.hidden = true; legendBtn.setAttribute('aria-expanded', 'false'); }

export function initControls() {
  document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
    if (S.story >= 0) storyClose();
    setSeries(b.dataset.series);
    if (b.dataset.series === 'noc') fitLL(-4.5, 44.0, 6.0, 51.0);
    else if (b.dataset.series === 'cv') fitLL(...VIEWS.wallachia);
  }));
  const routesBtn = $('#t-routes');
  routesBtn.setAttribute('aria-pressed', S.routes);  // keep the button honest about the default
  routesBtn.addEventListener('click', e => { S.routes = !S.routes; e.currentTarget.setAttribute('aria-pressed', S.routes); render(); });
  legendBtn.addEventListener('click', () => { legend.hidden = !legend.hidden; legendBtn.setAttribute('aria-expanded', !legend.hidden); });
}
