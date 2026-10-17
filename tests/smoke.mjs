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

try {
  // ── desktop
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errs = watch(page);
    await page.goto(URL_); await page.waitForTimeout(1200);
    check((await page.locator('#map .mk').count()) > 20, 'map markers are drawn');
    check((await page.locator('#map .relief').getAttribute('href')) === 'relief.jpg', 'relief image is referenced');

    await page.click('[data-view="france"]'); await page.waitForTimeout(1300);
    await tap(page, '#map .mk[aria-label^="Paris:"]'); await page.waitForTimeout(800);
    check((await page.innerText('.gaz h2.d-name')) === 'Paris', 'clicking a marker opens its card');

    await page.click('#back');
    await page.selectOption('#who', 'Alucard'); await page.waitForTimeout(1300);
    check((await page.locator('.items .nm').count()) === 6, 'character filter: Alucard appears at 6 places');
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

    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await page.click('#t-theme');
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    check(after && after !== before, `theme toggle switches to ${after}`);

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
    await page.click('.doc .back'); await page.waitForLoadState('load');
    check((await page.locator('#map').count()) === 1, 'disclaimer page links back to the atlas');
    check(errs.length === 0, `no script errors on the disclaimer page${errs.length ? `: ${errs[0]}` : ''}`);
    await page.close();
  }

  // ── phone
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const errs = watch(page);
    await page.goto(URL_); await page.waitForTimeout(1200);
    check(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'phone: no horizontal scroll');
    await page.click('[data-view="wallachia"]'); await page.waitForTimeout(1300);
    await tap(page, '#map .mk[aria-label^="Brăila:"]', true); await page.waitForTimeout(800);
    check((await page.innerText('.gaz h2.d-name')) === 'Brăila', 'phone: tapping a marker opens its card');
    await tap(page, '#story-btn', true); await page.waitForTimeout(400);
    await tap(page, '#st-next', true); await page.waitForTimeout(400);
    check((await page.innerText('#st-n')).startsWith('2 /'), 'phone: story next button works');
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
    check(!(await page.content()).includes('disclaimer.html'), 'single-file page has no link to a missing page');
    check(errs.length === 0, `no script errors in the single-file page${errs.length ? `: ${errs[0]}` : ''}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
