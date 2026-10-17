// Bundles src/ and build/geo.json into:
//   dist/site/                    a static site (index.html, app.js, styles.css, fonts/, relief.jpg) with no third-party requests
//   dist/castlevania-atlas.html   one self-contained page (fonts from Google Fonts, relief inlined), used for the Claude artifact
// Run with: npm run bundle   (after npm run project)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = p => path.join(ROOT, p);
const read = p => fs.readFileSync(r(p), 'utf8');

if (!fs.existsSync(r('build/geo.json'))) throw new Error('build/geo.json is missing: run `npm run project` first');

const DESCRIPTION = "Unofficial interactive atlas of every location in Netflix's Castlevania and Castlevania: Nocturne, placed on real geography with episode-by-episode notes.";
const GOOGLE_FONTS = 'https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,500;0,700;1,400&family=Alegreya+SC:wght@500;700&family=Cinzel:wght@500;600;700&family=IM+Fell+English:ital@0;1&display=swap';
// faces the stylesheet uses; only the latin and latin-ext subsets are shipped
const FACES = [
  ['cinzel', ['500', '600', '700']],
  ['im-fell-english', ['400', '400-italic']],
  ['alegreya', ['400', '500', '700', '400-italic']],
  ['alegreya-sc', ['500', '700']],
];
const SUBSETS = /-(latin|latin-ext)-\d+-(normal|italic) \*\//;

const js = (await build({
  entryPoints: [r('src/js/main.js')], bundle: true, format: 'iife', minify: true, write: false,
  target: ['es2020'], legalComments: 'none', charset: 'utf8',
})).outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
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

// ── single self-contained page (the Claude artifact host supplies the document shell)
const single = `${head}
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${GOOGLE_FONTS}">
<style>
${css}</style>
${markup.replace('__RELIEF__', `data:image/jpeg;base64,${relief.toString('base64')}`)}
<script>
${js}</script>
`;
fs.writeFileSync(r('dist/castlevania-atlas.html'), single);

const kb = p => (fs.statSync(p).size / 1024).toFixed(0) + ' KB';
const fontFiles = fs.readdirSync(path.join(site, 'fonts')).filter(f => f.endsWith('.woff2'));
console.log(`dist/site/: index.html, app.js ${kb(path.join(site, 'app.js'))}, styles.css, ${fontFiles.length} font files, relief.jpg ${kb(path.join(site, 'relief.jpg'))}`);
console.log(`dist/castlevania-atlas.html: ${kb(r('dist/castlevania-atlas.html'))}`);
