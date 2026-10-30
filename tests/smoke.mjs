// Browser smoke tests for the built site and the single-file page. Run after `npm run build`:
//   npm test
// Uses playwright-core with a local Chromium: set CHROMIUM_PATH, or install one with `npx playwright install chromium`.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'dist', 'site');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) failures++; };

// static server for dist/site
const server = http.createServer((req, res) => {
  const p = path.join(SITE, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
  if (!p.startsWith(SITE) || !fs.existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const URL_ = `http://127.0.0.1:${server.address().port}/`;

// Playwright's own default is the chrome-headless-shell build, which `npx playwright install chromium`
// does not always provide; fall back to any full Chromium it did install.
const installed = () => {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH
    || (process.platform === 'darwin' ? path.join(process.env.HOME || '', 'Library', 'Caches', 'ms-playwright')
      : path.join(process.env.HOME || '', '.cache', 'ms-playwright'));
  if (!fs.existsSync(base)) return [];
  const rev = d => +(/^chromium-(\d+)$/.exec(d) || [])[1] || 0;
  return fs.readdirSync(base).filter(d => rev(d)).sort((a, b) => rev(b) - rev(a)).flatMap(d => [
    path.join(base, d, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
    path.join(base, d, 'chrome-mac', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
    path.join(base, d, 'chrome-linux', 'chrome'),
    path.join(base, d, 'chrome-win', 'chrome.exe'),
  ]);
};
const candidates = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium', ...installed()].filter(Boolean);
const executablePath = candidates.find(p => fs.existsSync(p));
const browser = await chromium.launch(executablePath ? { executablePath } : {});

const tap = async (page, selector, touch) => {
  const bb = await page.locator(selector).first().boundingBox();
  const x = bb.x + bb.width / 2, y = bb.y + bb.height / 2;
  if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
};
const watch = page => { const errs = []; page.on('pageerror', e => errs.push(String(e))); return errs; };
// the spoiler notice opens over a fresh visit; accept it so the map underneath can be driven
const enter = async page => { const b = page.locator('#sp-ok'); if (await b.count()) { await b.click(); await page.waitForTimeout(250); } };

try {
  // ── desktop
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errs = watch(page);
    await page.goto(URL_); await page.waitForTimeout(1200);
    check((await page.locator('#spoiler[open]').count()) === 1, 'first visit shows the spoiler notice');
    check(await page.evaluate(() => document.activeElement && document.activeElement.id === 'sp-ok'), 'spoiler notice takes focus');
    // Nocturne S2E5 is not cited by any place, so the notice must not claim every episode
    check(!/every episode|all \d+ episodes/i.test(await page.innerText('#spoiler')), 'the notice makes no every-episode claim');
    await enter(page);
    check((await page.locator('#spoiler').count()) === 0, 'accepting the notice dismisses it');
    await page.reload(); await page.waitForTimeout(1200);
    check((await page.locator('#spoiler').count()) === 0, 'the notice is not shown again');
    // the map opens on both series, Castlevania first, and merely visiting stores no preference
    check((await page.getAttribute('#s-all', 'aria-pressed')) === 'true', 'a fresh visit shows both series');
    check((await page.innerText('.gaz .group-h h3')) === 'Castlevania', 'Castlevania is listed first');
    check(await page.evaluate(() => localStorage.getItem('cva-series') === null), 'visiting stores no series preference');
    // an explicit choice persists, and is reversible
    await page.click('#s-noc'); await page.waitForTimeout(900);
    check(await page.evaluate(() => localStorage.getItem('cva-series') === 'noc'), 'choosing a series is remembered');
    await page.click('#s-all'); await page.waitForTimeout(900);
    check((await page.innerText('.gaz .group-h h3')) === 'Castlevania', 'returning to All restores Castlevania first');
    check((await page.locator('#map .mk').count()) > 20, 'map markers are drawn');
    check((await page.locator('#map .relief').getAttribute('href')) === 'relief.jpg', 'relief image is referenced');
    check((await page.locator('script[data-cf-beacon]').count()) === 1, 'the hosted page carries the analytics beacon');

    await page.click('[data-view="france"]'); await page.waitForTimeout(1300);
    await tap(page, '#map .mk[aria-label^="Paris:"]'); await page.waitForTimeout(800);
    check((await page.innerText('.gaz h2.d-name')) === 'Paris', 'clicking a marker opens its card');

    await page.click('#back');
    await page.selectOption('#who', 'Alucard'); await page.waitForTimeout(1300);
    check((await page.locator('.items .nm').count()) === 7, 'character filter: Alucard appears at 7 places');
    await page.click('#who-clear');

    // search: by name, by prose/character, and clearing
    await page.fill('#find', 'paris'); await page.waitForTimeout(250);
    const byName = await page.locator('.items .nm').allInnerTexts();
    check(byName.includes('Paris'), 'search by name finds Paris');
    check(byName.length < 10, `search narrows the index to ${byName.length} entries`);
    await page.fill('#find', 'olrox'); await page.waitForTimeout(250);
    check((await page.locator('.items .nm').count()) > 0, 'search matches a character, not just names');
    await page.fill('#find', 'zzzznope'); await page.waitForTimeout(250);
    check((await page.locator('.items .nm').count()) === 0, 'search with no matches lists nothing');
    check(/No places match/i.test(await page.innerText('.find-note')), 'search reports an empty result');
    // the map must dim alongside the index
    check(await page.evaluate(() => [...document.querySelectorAll('#map .mk')].some(g => g.classList.contains('dim'))),
      'search dims non-matching map markers');
    await page.click('#find-clear'); await page.waitForTimeout(250);
    check((await page.locator('.items .nm').count()) > 10, 'clearing the search restores the index');
    check(await page.evaluate(() => ![...document.querySelectorAll('#map .mk')].some(g => g.classList.contains('dim'))),
      'clearing the search undims the map');

    // journeys stay off until asked for, then all four appear
    check((await page.getAttribute('#t-routes', 'aria-pressed')) === 'false', 'journeys are off by default');
    check(await page.evaluate(() => [...document.querySelectorAll('#routes [data-route]')].every(g => g.classList.contains('era-hide'))),
      'no journey is drawn before the toggle');
    await page.click('#t-routes'); await page.waitForTimeout(300);
    const drawn = await page.evaluate(() => [...document.querySelectorAll('#routes [data-route]')].filter(g => !g.classList.contains('era-hide')).map(g => g.dataset.route));
    check(drawn.length === 4, `the toggle draws all journeys: ${drawn.join(', ')}`);
    await page.click('#t-routes'); await page.waitForTimeout(200);

    // theme cycles Auto -> Light -> Dark -> Auto, so "follow the system" stays reachable
    const mode = () => page.evaluate(() => document.querySelector('#t-theme').dataset.mode);
    const cycle = [await mode()];
    for (let i = 0; i < 3; i++) { await page.click('#t-theme'); await page.waitForTimeout(150); cycle.push(await mode()); }
    check(cycle.join('>') === 'auto>light>dark>auto', `theme cycles ${cycle.join(' -> ')}`);
    // back at auto: the override must be gone, or the system preference stays silenced forever
    check(await page.evaluate(() => !document.documentElement.getAttribute('data-theme') && !localStorage.getItem('cva-theme')),
      'returning to auto clears the stored override');

    // story mode: every step must land with its place visible on the map (far-away places use the inset)
    await page.click('#story-btn'); await page.waitForTimeout(300);
    const total = +(await page.innerText('#st-n')).split('/')[1];
    const lost = [];
    for (let i = 0; i < total; i++) {
      await page.waitForTimeout(i % 3 ? 60 : 1500); // mix fast and slow stepping
      if (i % 3 === 0) {
        const r = await page.evaluate(() => {
          const box = document.querySelector('#map').getBoundingClientRect();
          const sel = [...document.querySelectorAll('#map .mk.sel')];
          const visible = sel.some(g => { const b = g.getBoundingClientRect(); return b.width > 0 && b.left > box.left && b.right < box.right && b.top > box.top && b.bottom < box.bottom; });
          return { code: document.querySelector('#st-code').textContent, card: document.querySelector('.gaz h2.d-name').textContent, sel: sel.length, visible };
        });
        if (r.sel && !r.visible) lost.push(`${r.code} ${r.card}`);
      }
      await page.keyboard.press('ArrowRight');
    }
    check(total >= 60, `story mode has ${total} scenes`);
    check(lost.length === 0, `every story step lands on screen${lost.length ? `: ${lost.join(', ')}` : ''}`);
    check(errs.length === 0, `no script errors on desktop${errs.length ? `: ${errs[0]}` : ''}`);
    await page.close();
  }

  // ── disclaimer page, reached the way a visitor reaches it
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errs = watch(page);
    await page.goto(URL_); await page.waitForTimeout(1200);
    await enter(page);
    await page.locator('.method .disc-link a').scrollIntoViewIfNeeded();
    await page.click('.method .disc-link a');
    await page.waitForLoadState('load');
    check(new URL(page.url()).pathname.endsWith('/disclaimer.html'), 'gazetteer links to the disclaimer page');
    check((await page.innerText('.doc h1')) === 'Disclaimer & credits', 'disclaimer page has its heading');
    const heads = await page.locator('.doc section h2').allInnerTexts();
    check(heads.length >= 8, `disclaimer page lists ${heads.length} sections`);
    check(heads.some(h => /unofficial/i.test(h)), 'disclaimer states the unofficial status');
    check(heads.some(h => /trademark/i.test(h)), 'disclaimer covers trademarks');
    // the page must be readable with no JS and must not inherit the app's no-scroll shell
    check(await page.evaluate(() => getComputedStyle(document.body).overflow !== 'hidden'), 'disclaimer page scrolls');
    // analytics ships on the hosted pages, and the privacy section must say so
    const privacy = await page.evaluate(() => {
      const h = [...document.querySelectorAll('.doc section')].find(s => /privacy/i.test(s.querySelector('h2').textContent));
      return h ? h.innerText : '';
    });
    check(/analytics/i.test(privacy), 'the disclaimer discloses the analytics');
    check(!/runs no analytics|no third-party requests\./i.test(privacy), 'the disclaimer no longer claims there are none');
    await page.click('.doc .back'); await page.waitForLoadState('load');
    check((await page.locator('#map').count()) === 1, 'disclaimer page links back to the atlas');
    // the notices and both licences must actually be served, not just linked
    for (const f of ['ATTRIBUTION.md', 'LICENSE', 'LICENSE-CONTENT']) {
      const r = await page.request.get(new URL(f, URL_).href);
      check(r.ok(), `${f} is served with the site`);
    }
    check(errs.length === 0, `no script errors on the disclaimer page${errs.length ? `: ${errs[0]}` : ''}`);
    await page.close();
  }

  // ── a fresh visitor with no stored choice follows the system theme, either way
  {
    for (const [scheme, want] of [['light', 'rgb(231, 220, 195)'], ['dark', 'rgb(16, 13, 11)']]) {
      const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, colorScheme: scheme });
      const page = await ctx.newPage();
      await page.goto(URL_); await page.waitForTimeout(1000);
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      check(bg === want, `system ${scheme}: a fresh visit renders the ${scheme} theme`);
      check((await page.evaluate(() => document.querySelector('#t-theme').dataset.mode)) === 'auto', `system ${scheme}: the toggle reports auto`);
      await ctx.close();
    }
    // and it keeps following when the system flips mid-visit
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, colorScheme: 'dark' });
    const page = await ctx.newPage();
    await page.goto(URL_); await page.waitForTimeout(900);
    const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.emulateMedia({ colorScheme: 'light' }); await page.waitForTimeout(400);
    const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    check(dark !== light, 'the theme follows a system change mid-visit');
    await ctx.close();
  }

  // ── Nocturne filter: nothing from Castlevania may stay on the map
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errs = watch(page);
    await page.goto(URL_); await page.waitForTimeout(1000);
    await enter(page);
    await page.click('#s-noc'); await page.waitForTimeout(1300);
    // journeys are off by default; turn them on so the check covers the Castlevania routes too
    if ((await page.getAttribute('#t-routes', 'aria-pressed')) !== 'true') { await page.click('#t-routes'); await page.waitForTimeout(300); }
    const leaks = await page.evaluate(() => {
      const visible = e => { for (let n = e; n && n.nodeType === 1; n = n.parentNode) { const cs = getComputedStyle(n); if (cs.display === 'none' || +cs.opacity === 0) return false; } return true; };
      const out = [];
      document.querySelectorAll('#routes > *').forEach(e => { const r = e.getAttribute('data-route'); if (visible(e) && r !== 'nocturne') out.push(r || e.getAttribute('class')); });
      document.querySelectorAll('#ov-text .tx.story, .realm').forEach(e => { if (visible(e)) out.push(e.textContent || 'realm outline'); });
      document.querySelectorAll('#ov-marks .mk.cv, #ov-vignette .mk').forEach(e => { if (visible(e)) out.push(e.getAttribute('aria-label')); });
      return out;
    });
    check(leaks.length === 0, `Nocturne mode hides every Castlevania overlay${leaks.length ? `: ${leaks.join(', ')}` : ''}`);
    check(await page.locator('.views [data-view="wallachia"]').isHidden() && await page.locator('.views [data-view="france"]').isVisible(), 'Nocturne mode shows only the France jump');
    await page.click('#story-btn'); await page.waitForTimeout(300);
    const nocSteps = +(await page.innerText('#st-n')).split('/')[1];
    check(nocSteps >= 25, `Nocturne story has ${nocSteps} scenes`);
    await page.click('#st-close');
    await page.click('#back');
    await page.click('.items button[data-id="machecoul"]'); await page.waitForTimeout(600);
    check((await page.locator('.sect h4', { hasText: 'Sites in and around the town' }).count()) === 1, 'Machecoul card lists its local sites');
    check(errs.length === 0, `no script errors in Nocturne mode${errs.length ? `: ${errs[0]}` : ''}`);
    await page.close();
  }

  // ── phone
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const errs = watch(page);
    await page.goto(URL_); await page.waitForTimeout(1200);
    await enter(page);
    check(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'phone: no horizontal scroll');
    await page.click('[data-view="wallachia"]'); await page.waitForTimeout(1300);
    await tap(page, '#map .mk[aria-label^="Brăila:"]', true); await page.waitForTimeout(800);
    check((await page.innerText('.gaz h2.d-name')) === 'Brăila', 'phone: tapping a marker opens its card');
    // The key grows upward from its button; on a short plate it must cap and scroll rather than
    // being clipped by the plate's overflow:hidden, which silently ate its first rows.
    await page.tap('#legend-btn'); await page.waitForTimeout(400);
    const key = await page.evaluate(() => {
      const plate = document.querySelector('.plate').getBoundingClientRect();
      const leg = document.querySelector('#legend'), lr = leg.getBoundingClientRect();
      const h3 = leg.querySelector('h3');
      return { cutTop: lr.top < plate.top - 0.5, cutBottom: lr.bottom > plate.bottom + 0.5,
        firstHeading: h3.textContent, firstVisible: h3.getBoundingClientRect().top >= plate.top - 0.5 };
    });
    check(!key.cutTop && !key.cutBottom, 'phone: the key stays inside the map plate');
    check(key.firstHeading === 'Series' && key.firstVisible, 'phone: the key shows its first row');
    await page.tap('#legend-btn'); await page.waitForTimeout(300);

    await tap(page, '#story-btn', true); await page.waitForTimeout(400);
    await tap(page, '#st-next', true); await page.waitForTimeout(400);
    check((await page.innerText('#st-n')).startsWith('2 /'), 'phone: story next button works');

    // The map must open overflowing its plate: if it fits inside, clamp() centres it and a
    // one-finger drag moves nothing, which reads as "panning is broken" on a phone.
    await page.reload(); await page.waitForTimeout(1400); await enter(page);
    const fit = await page.evaluate(() => {
      const r = document.querySelector('#map').getBoundingClientRect();
      const k = +/scale\(([\d.]+)\)/.exec(document.querySelector('#world').getAttribute('transform'))[1];
      const bb = document.querySelector('#landd').getBBox();
      return { x: bb.width * k > r.width, y: bb.height * k > r.height };
    });
    check(fit.x && fit.y, `phone: the opening view overflows the plate (x: ${fit.x}, y: ${fit.y})`);

    // one finger pans, and must not zoom
    const tf = async (dx, dy) => {
      const st = () => page.evaluate(() => { const m = /translate\(([-\d.]+),([-\d.]+)\) scale\(([\d.]+)\)/.exec(document.querySelector('#world').getAttribute('transform')); return { tx: +m[1], ty: +m[2], k: +m[3] }; });
      const box = await page.locator('#map').boundingBox();
      const x = Math.round(box.x + box.width / 2), y = Math.round(box.y + box.height / 2);
      const a = await st();
      await page.touchscreen.tap(x, y); // settle
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 6, y: y + dy * i / 6, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(350);
      const z = await st();
      await cdp.detach();
      return { dx: z.tx - a.tx, dy: z.ty - a.ty, dk: +(z.k - a.k).toFixed(6) };
    };
    const up = await tf(0, -100);
    check(Math.abs(up.dy) > 50, `phone: one finger pans vertically (dy ${up.dy.toFixed(0)})`);
    check(up.dk === 0, 'phone: one finger does not zoom');
    const side = await tf(-100, 0);
    check(Math.abs(side.dx) > 50, `phone: one finger pans horizontally (dx ${side.dx.toFixed(0)})`);

    // two fingers spreading apart zoom in, rather than panning
    {
      const st = () => page.evaluate(() => +/scale\(([\d.]+)\)/.exec(document.querySelector('#world').getAttribute('transform'))[1]);
      const box = await page.locator('#map').boundingBox();
      const x = Math.round(box.x + box.width / 2), y = Math.round(box.y + box.height / 2);
      const k0 = await st();
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x - 20, y, id: 1 }, { x: x + 20, y, id: 2 }] });
      for (let i = 1; i <= 6; i++) {
        const d = 20 + i * 10;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - d, y, id: 1 }, { x: x + d, y, id: 2 }] });
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(350);
      await cdp.detach();
      check((await st()) > k0, `phone: pinching outward zooms in (${k0.toFixed(2)} -> ${(await st()).toFixed(2)})`);
    }
    check(errs.length === 0, `no script errors on phone${errs.length ? `: ${errs[0]}` : ''}`);
    await ctx.close();
  }

  // ── single-file page, inside a minimal stand-in for the artifact host's document shell
  {
    const html = fs.readFileSync(path.join(ROOT, 'dist', 'castlevania-atlas.html'), 'utf8');
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = watch(page);
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`);
    await page.waitForTimeout(1000);
    check((await page.locator('#map .mk').count()) > 20, 'single-file page renders the map');
    check((await page.locator('#map .relief').getAttribute('href')).startsWith('data:image/jpeg'), 'single-file page inlines the relief');
    // no second page to link to here, so the notices must travel inside the page
    check((await page.locator('details.disc').count()) === 1, 'single-file page carries the disclaimer inline');
    // the offline page is opened from file:// and without a network; it must stay self-contained
    check(!html.includes('cloudflareinsights'), 'single-file page carries no analytics beacon');
    check(!(await page.content()).includes('disclaimer.html'), 'single-file page has no link to a missing page');
    check(errs.length === 0, `no script errors in the single-file page${errs.length ? `: ${errs[0]}` : ''}`);
    await page.close();

    // Served bare, with no charset from a host shell or HTTP header: the page must declare its own,
    // or the browser decodes it as Latin-1 and every en dash and diacritic mojibakes.
    const bare = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(html); });
    await new Promise(r => bare.listen(0, r));
    const raw = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await raw.goto(`http://127.0.0.1:${bare.address().port}/`);
    await raw.waitForTimeout(900);
    const tagline = await raw.innerText('.brand p');
    check(tagline.includes('1455–1793'), `single-file page is UTF-8 without a host charset: "${tagline.slice(-12)}"`);
    // Mojibake signatures, not bare accented letters: "Târgoviște" is correct Romanian, while
    // "Ã¢" or "â€“" means UTF-8 bytes were decoded one at a time as Latin-1.
    const gaz = await raw.innerText('.gaz');
    check(!/Ã.|â€|Â./.test(gaz), 'single-file page: no mojibake in the gazetteer');
    check(gaz.includes('Târgoviște'), 'single-file page: Romanian diacritics survive');
    await raw.close();
    bare.close();
  }
} finally {
  await browser.close();
  server.close();
}
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
