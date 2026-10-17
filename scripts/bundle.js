// Bundles src/ and build/geo.json into:
//   dist/site/                    a static site (index.html, disclaimer.html, app.js, styles.css, fonts/, relief.jpg) with no third-party requests
//   dist/castlevania-atlas.html   one self-contained page (fonts from Google Fonts, relief inlined), used for the Claude artifact
// Run with: npm run bundle   (after npm run project)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { sectionsHtml } from '../src/disclaimer.js';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = p => path.join(ROOT, p);
const read = p => fs.readFileSync(r(p), 'utf8');

if (!fs.existsSync(r('build/geo.json'))) throw new Error('build/geo.json is missing: run `npm run project` first');

const DESCRIPTION = "Unofficial interactive atlas of the locations in Netflix's Castlevania and Castlevania: Nocturne, placed on real geography with episode-by-episode notes and the evidence for each position.";
const SITE_NAME = 'The Castlevania Atlas';
const GOOGLE_FONTS = 'https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,500;0,700;1,400&family=Alegreya+SC:wght@500;700&family=Cinzel:wght@500;600;700&family=IM+Fell+English:ital@0;1&display=swap';
// faces the stylesheet uses; only the latin and latin-ext subsets are shipped
const FACES = [
  ['cinzel', ['500', '600', '700']],
  ['im-fell-english', ['400', '400-italic']],
  ['alegreya', ['400', '500', '700', '400-italic']],
  ['alegreya-sc', ['500', '700']],
];
const SUBSETS = /-(latin|latin-ext)-\d+-(normal|italic) \*\//;

// HOSTED is true for dist/site/, which has a disclaimer.html to link to; the single-file page
// has no second page, so it shows the disclaimer text inline instead.
const bundle = async hosted => (await build({
  entryPoints: [r('src/js/main.js')], bundle: true, format: 'iife', minify: true, write: false,
  target: ['es2020'], legalComments: 'none', charset: 'utf8',
  // the hosted build links to disclaimer.html, so it needs none of the prose inlined
  define: { HOSTED: String(hosted), DISCLAIMER_HTML: JSON.stringify(hosted ? '' : sectionsHtml('h5')) },
})).outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const js = await bundle(true);
const jsSingle = await bundle(false);
const css = read('src/styles.css');
const head = read('src/head.html').trim();
const markup = read('src/markup.html').trim();
const relief = fs.readFileSync(r('geo/layers/relief.jpg'));
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 16 16"><rect x="-8" y="-8" width="16" height="16" rx="2" fill="#100d0b"/><path d="M-5.5,5.5 L-5.5,-2.5 L-3.6,-2.5 L-3.6,-5.5 L-1.4,-5.5 L-1.4,-3.2 L1.4,-3.2 L1.4,-5.5 L3.6,-5.5 L3.6,-2.5 L5.5,-2.5 L5.5,5.5 Z" fill="#d4473f"/><path d="M-1.4,5.5 L-1.4,2 A1.4,1.4 0 0 1 1.4,2 L1.4,5.5" fill="#100d0b"/></svg>`;

// ── static site
const site = r('dist/site');
fs.rmSync(site, { recursive: true, force: true });
fs.mkdirSync(path.join(site, 'fonts'), { recursive: true });
let fontCss = '';
for (const [pkg, files] of FACES) {
  const dir = path.dirname(require.resolve(`@fontsource/${pkg}/package.json`));
  for (const f of files) {
    const blocks = fs.readFileSync(path.join(dir, `${f}.css`), 'utf8').split(/(?=\/\* )/);
    for (const b of blocks) {
      if (!SUBSETS.test(b)) continue;
      const woff2 = /url\(\.\/files\/([^)]+\.woff2)\)/.exec(b)[1];
      fs.copyFileSync(path.join(dir, 'files', woff2), path.join(site, 'fonts', woff2));
      fontCss += b.replace(/src: [^;]+;/, `src: url(fonts/${woff2}) format('woff2');`).trim() + '\n';
    }
  }
}
fs.writeFileSync(path.join(site, 'fonts.css'), fontCss);
// the OFL asks for the licence to travel with the fonts; the MIT/ISC notices travel with the map data
for (const [pkg] of FACES) fs.copyFileSync(path.join(path.dirname(require.resolve(`@fontsource/${pkg}/package.json`)), 'LICENSE'), path.join(site, 'fonts', `LICENSE-${pkg}.txt`));
fs.copyFileSync(r('ATTRIBUTION.md'), path.join(site, 'ATTRIBUTION.md'));
fs.writeFileSync(path.join(site, 'styles.css'), css);
fs.writeFileSync(path.join(site, 'app.js'), js);
fs.writeFileSync(path.join(site, 'relief.jpg'), relief);
fs.writeFileSync(path.join(site, 'favicon.svg'), favicon);
fs.writeFileSync(path.join(site, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
<meta name="description" content="${DESCRIPTION}">
<meta name="color-scheme" content="dark light">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="fonts.css">
<link rel="stylesheet" href="styles.css">
</head>
<body>
${markup.replace('__RELIEF__', 'relief.jpg')}
<script src="app.js"></script>
</body>
</html>
`);

// ── disclaimer page: a plain document, sharing the site's tokens and fonts but none of its JS
fs.writeFileSync(path.join(site, 'disclaimer.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Disclaimer &amp; credits — ${SITE_NAME}</title>
<meta name="description" content="Legal notices, attribution and accuracy caveats for the unofficial Castlevania Atlas.">
<meta name="color-scheme" content="dark light">
<meta name="robots" content="index, follow">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="fonts.css">
<link rel="stylesheet" href="styles.css">
<style>
  /* This page is a document, not the app: undo the app's full-height, no-scroll shell. */
  html, body { height: auto; }
  body { overflow: auto; }
  .doc { max-width: 42rem; margin: 0 auto; padding: 40px 20px 72px; }
  .doc .back { display: inline-block; font-family: var(--font-sc); font-size: 0.82rem; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--ink-2); text-decoration: none; margin-bottom: 26px; }
  .doc .back:hover, .doc .back:focus-visible { color: var(--ink); text-decoration: underline; }
  .doc h1 { font-family: var(--font-display); font-weight: 600; font-size: 1.5rem; line-height: 1.2;
    letter-spacing: 0.04em; margin: 0 0 6px; text-wrap: balance; }
  .doc .sub { color: var(--ink-2); font-size: 0.95rem; margin: 0 0 30px; padding-bottom: 20px; border-bottom: 1px solid var(--rule); }
  .doc section { margin-bottom: 26px; }
  .doc h2 { font-family: var(--font-sc); font-weight: 700; font-size: 0.9rem; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--ink); margin: 0 0 8px; }
  .doc p { margin: 0 0 10px; line-height: 1.55; color: var(--ink-2); }
  .doc a { color: var(--ink); text-decoration-color: var(--rule); text-underline-offset: 2px; }
  .doc footer { margin-top: 34px; padding-top: 18px; border-top: 1px solid var(--rule);
    font-size: 0.88rem; color: var(--ink-3); }
  @media (max-width: 560px) { .doc { padding: 26px 18px 56px; } .doc h1 { font-size: 1.3rem; } }
</style>
</head>
<body>
<main class="doc">
<a class="back" href="./">← Back to the atlas</a>
<h1>Disclaimer &amp; credits</h1>
<p class="sub">${SITE_NAME} is an unofficial fan reference. It is not affiliated with Konami or Netflix.</p>
${sectionsHtml('h2')}
<footer>Full licence texts, third-party notices and the list of research sources are in
<a href="ATTRIBUTION.md">ATTRIBUTION.md</a>.</footer>
</main>
</body>
</html>
`);

// ── single self-contained page (the Claude artifact host supplies the document shell)
// The charset must come first and stay within the first 1024 bytes: the artifact host supplies a
// document shell, but opened on its own (file://, or a host that sends no charset) the page would
// otherwise be decoded as Latin-1 and every en dash and diacritic would mojibake.
const single = `<meta charset="utf-8">
${head}
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${GOOGLE_FONTS}">
<style>
${css}</style>
${markup.replace('__RELIEF__', `data:image/jpeg;base64,${relief.toString('base64')}`)}
<script>
${jsSingle}</script>
`;
fs.writeFileSync(r('dist/castlevania-atlas.html'), single);

const kb = p => (fs.statSync(p).size / 1024).toFixed(0) + ' KB';
const fontFiles = fs.readdirSync(path.join(site, 'fonts')).filter(f => f.endsWith('.woff2'));
console.log(`dist/site/: index.html, app.js ${kb(path.join(site, 'app.js'))}, styles.css, ${fontFiles.length} font files, relief.jpg ${kb(path.join(site, 'relief.jpg'))}`);
console.log(`dist/castlevania-atlas.html: ${kb(r('dist/castlevania-atlas.html'))}`);
