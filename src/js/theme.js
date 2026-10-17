// Light/dark toggle. Dark is the default; an explicit choice is remembered in this browser.
import { $ } from './core.js';

const root = document.documentElement;
const mqLight = matchMedia('(prefers-color-scheme: light)');
const SUN = '<circle class="ic" r="3.4"/><path class="ic" d="M0,-8V-5.9M0,5.9V8M-8,0H-5.9M5.9,0H8M-5.7,-5.7L-4.2,-4.2M4.2,4.2L5.7,5.7M-5.7,5.7L-4.2,4.2M4.2,-4.2L5.7,-5.7"/>';
const MOON = '<path class="ic" d="M2.4,-7.2 A7.4,7.4 0 1 0 7.2,2.4 A5.8,5.8 0 0 1 2.4,-7.2 Z"/>';

const current = () => root.getAttribute('data-theme') || (mqLight.matches ? 'light' : 'dark');

function sync() {
  const dark = current() === 'dark';
  $('#theme-ic').innerHTML = dark ? SUN : MOON;
  const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
  $('#t-theme').setAttribute('aria-label', label);
  $('#t-theme').title = label;
}

export function initTheme() {
  try { const t = localStorage.getItem('cva-theme'); if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); } catch (e) { /* storage unavailable */ }
  $('#t-theme').addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('cva-theme', next); } catch (e) { /* storage unavailable */ }
    sync();
  });
  try { mqLight.addEventListener('change', sync); } catch (e) { /* old Safari */ }
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  sync();
}
