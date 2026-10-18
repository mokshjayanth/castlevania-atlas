// A one-time spoiler notice. The gazetteer describes what happens at every place, so a first-time
// visitor gets a say before reading it. Dismissal is remembered, and the map is already built and
// deep-linked behind the dialog, so nothing is blocked by it.
import { $ } from './core.js';

const KEY = 'cva-spoiler-ok';

export function initSpoiler() {
  const dlg = $('#spoiler');
  if (!dlg) return;

  let seen = false;
  try { seen = localStorage.getItem(KEY) === '1'; } catch (e) { /* storage unavailable */ }
  // Without showModal (or with the notice already acknowledged) the page is simply shown as normal:
  // a notice that cannot be dismissed would be worse than one that never appears.
  if (seen || typeof dlg.showModal !== 'function') { dlg.remove(); return; }

  dlg.addEventListener('close', () => {
    try { localStorage.setItem(KEY, '1'); } catch (e) { /* storage unavailable */ }
    dlg.remove();
  });
  dlg.showModal();
}
