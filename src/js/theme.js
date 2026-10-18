// Theme: follows the system by default, and cycles Auto → Light → Dark → Auto.
// Auto has to stay reachable, so "auto" is the absence of a stored choice: picking a theme
// writes data-theme and remembers it, and returning to Auto clears both.
import { $ } from './core.js';

const root = document.documentElement;
const mqLight = matchMedia('(prefers-color-scheme: light)');
const SUN = '<circle class="ic" r="3.4"/><path class="ic" d="M0,-8V-5.9M0,5.9V8M-8,0H-5.9M5.9,0H8M-5.7,-5.7L-4.2,-4.2M4.2,4.2L5.7,5.7M-5.7,5.7L-4.2,4.2M4.2,-4.2L5.7,-5.7"/>';
const MOON = '<path class="ic" d="M2.4,-7.2 A7.4,7.4 0 1 0 7.2,2.4 A5.8,5.8 0 0 1 2.4,-7.2 Z"/>';
// half sun, half moon: the theme is whatever the system says
const AUTO = '<circle class="ic" r="7"/><path class="ic-f" d="M0,-7 A7,7 0 0 1 0,7 Z"/>';

const ICON = { auto: AUTO, light: SUN, dark: MOON };
const NEXT = { auto: 'light', light: 'dark', dark: 'auto' };
const LABEL = {
  auto: 'Theme: following your system. Switch to light',
  light: 'Theme: light. Switch to dark',
  dark: 'Theme: dark. Follow your system',
};

/** the user's choice: 'auto' when they have not made one */
const choice = () => root.getAttribute('data-theme') || 'auto';
/** what is actually on screen */
const effective = () => (choice() === 'auto' ? (mqLight.matches ? 'light' : 'dark') : choice());

function sync() {
  const c = choice();
  $('#theme-ic').innerHTML = ICON[c];
  $('#t-theme').setAttribute('aria-label', LABEL[c]);
  $('#t-theme').title = LABEL[c];
  // tell assistive tech (and tests) both the choice and the resulting theme
  $('#t-theme').dataset.mode = c;
  $('#t-theme').dataset.effective = effective();
}

function apply(mode) {
  if (mode === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
  try {
    if (mode === 'auto') localStorage.removeItem('cva-theme');
    else localStorage.setItem('cva-theme', mode);
  } catch (e) { /* storage unavailable */ }
  sync();
}

export function initTheme() {
  try { const t = localStorage.getItem('cva-theme'); if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); } catch (e) { /* storage unavailable */ }
  $('#t-theme').addEventListener('click', () => apply(NEXT[choice()]));
  try { mqLight.addEventListener('change', sync); } catch (e) { /* old Safari */ }
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  sync();
}
