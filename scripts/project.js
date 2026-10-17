// Projects the geography layers and the location data into map units and writes build/geo.json,
// which the front end imports. Run with: npm run project
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as d3 from 'd3-geo';
import * as topo from 'topojson-client';
import { makeProjection, params } from './projection.js';
import { places, unmapped, labelRank } from '../data/places.js';
import { routes, voyages } from '../data/routes.js';
import { titles } from '../data/episodes.js';
import { links } from '../data/links.js';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { proj, W, H } = makeProjection();
const path_ = d3.geoPath(proj).digits(1);

const P = (lon, lat) => { const p = proj([lon, lat]); return { x: +p[0].toFixed(1), y: +p[1].toFixed(1) }; };
const kmToPx = (lon, lat, km) => { const a = proj([lon, lat]), b = proj([lon, lat + km / 111.2]); return Math.hypot(a[0] - b[0], a[1] - b[1]); };

const rd = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const layer = name => rd(path.join(ROOT, 'geo', 'layers', `${name}.json`));
// d3-geo wants exterior rings clockwise (in lon/lat), holes counter-clockwise
const area = r => { let a = 0; for (let i = 0, n = r.length; i < n; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % n]; a += x1 * y2 - x2 * y1; } return a / 2; };
const fixPoly = poly => poly.map((ring, i) => { const a = area(ring); const wantNeg = i === 0; return (wantNeg ? a > 0 : a < 0) ? ring.slice().reverse() : ring; });
const rewind = fc => { for (const f of fc.features) { const g = f.geometry; if (!g) continue; if (g.type === 'Polygon') g.coordinates = fixPoly(g.coordinates); else if (g.type === 'MultiPolygon') g.coordinates = g.coordinates.map(fixPoly); } return fc; };
const land = rewind(layer('land')), lakes = rewind(layer('lakes')), rivers = layer('rivers'), regions = rewind(layer('regions'));

const out = { W, H, paths: {} };
out.paths.land = path_(land);
out.paths.lakes = path_(lakes);
const major = { type: 'FeatureCollection', features: rivers.features.filter(f => f.properties.major) };
const minor = { type: 'FeatureCollection', features: rivers.features.filter(f => !f.properties.major) };
out.paths.riversMajor = path_(major);
out.paths.riversMinor = path_(minor);
out.paths.graticule = path_(d3.geoGraticule().extent([[-40, 10], [70, 72]]).step([5, 5])());
for (const f of regions.features) out.paths[f.properties.region.toLowerCase()] = path_(f);
out.proj = params({ proj, H });

// ── places
const byId = {};
out.places = places.map(p => {
  const o = { ...p };
  if (p.view === 'main' && p.tier !== 'unplaced') {
    Object.assign(o, P(p.lon, p.lat));
    if (p.r) o.rpx = +kmToPx(p.lon, p.lat, p.r).toFixed(1);
  }
  byId[p.id] = o;
  return o;
});

// castle positions (stops) — S2 start near Argeș (inferred), S2 battle at Brăila
out.stops = {
  castleA: { ...P(25.02, 45.25), label: 'Castle, S2E1–E5', note: 'near Argeș' },
  castleB: { ...P(28.02, 45.30), label: 'Castle, S2E6', note: 'at Brăila' },
};

// vignette for unrevealed Wallachian sites (drawn over the western Black Sea, schematic)
out.vignette = { anchor: P(33.7, 43.3), leaderTo: P(26.4, 44.75) };

// ── routes
const pt = r => {
  if (Array.isArray(r)) return proj(r);
  if (r === 'VIGNETTE') return [out.vignette.anchor.x, out.vignette.anchor.y];
  if (out.stops[r]) return [out.stops[r].x, out.stops[r].y];
  const p = byId[r]; return [p.x, p.y];
};
const smooth = pts => { // Catmull-Rom → cubic Bézier through projected points
  if (pts.length === 2) return `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}L${pts[1][0].toFixed(1)},${pts[1][1].toFixed(1)}`;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
};
const arc = (a, b, bend = 0.28) => {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
  const cx = mx - dy * bend, cy = my + dx * bend;
  return `M${a[0].toFixed(1)},${a[1].toFixed(1)}Q${cx.toFixed(1)},${cy.toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
};
out.routes = routes.map(r => ({
  ...r,
  legs: r.legs.map(l => {
    const pts = l.pts.map(pt);
    return { kind: l.kind, d: l.kind === 'teleport' ? arc(pts[0], pts[1], -0.32) : smooth(pts) };
  }),
}));

// ── labels
const L = (text, lon, lat, cls, era, rot = 0) => ({ text, ...P(lon, lat), cls, era, rot });
out.labels = [
  // seas (always)
  L('Black Sea', 34.4, 41.95, 'sea', 'all'), L('Mediterranean Sea', 18.6, 34.4, 'sea', 'all'),
  L('Adriatic Sea', 15.7, 42.75, 'sea', 'all', 38), L('Tyrrhenian Sea', 11.9, 39.9, 'sea', 'all'),
  L('Ionian Sea', 18.4, 37.6, 'sea', 'all'), L('Aegean Sea', 25.1, 38.9, 'sea', 'all', 70),
  L('Bay of Biscay', -4.9, 45.3, 'sea', 'all'), L('Atlantic Ocean', -13.6, 46.5, 'sea', 'all', 70),
  L('North Sea', 3.2, 56.2, 'sea', 'all'), L('Baltic Sea', 18.6, 56.3, 'sea', 'all', -60),
  // mountains (always)
  L('Carpathians', 24.2, 47.85, 'mtn', 'all', -50), L('Southern Carpathians', 23.7, 45.62, 'mtn', 'all', 0),
  L('Alps', 10.8, 46.75, 'mtn', 'all'), L('Balkan Mountains', 25.1, 42.95, 'mtn', 'all'),
  L('Apennines', 13.4, 42.4, 'mtn', 'all', 45), L('Pyrenees', 0.6, 42.55, 'mtn', 'all', 8),
  L('Dinaric Alps', 17.6, 43.75, 'mtn', 'all', 35), L('Atlas', -2.2, 33.0, 'mtn', 'all', -20),
  // story regions (always)
  L('Wallachia', 25.3, 44.12, 'story', 'all'), L('Styria', 15.0, 47.95, 'story', 'all'),
  // 1476 politics
  L('Transylvania', 24.6, 46.45, 'pol', 'cv'), L('Moldavia', 27.3, 47.15, 'pol', 'cv'),
  L('Kingdom of Hungary', 19.3, 47.55, 'pol', 'cv'), L('Ottoman Empire', 23.4, 41.75, 'pol', 'cv'),
  L('Ottoman Empire', 32.0, 39.4, 'pol', 'cv'), L('Holy Roman Empire', 10.2, 50.4, 'pol', 'cv'),
  L('Kingdom of France', 2.4, 46.5, 'pol', 'cv'), L('Kingdom of Poland', 20.6, 51.6, 'pol', 'cv'),
  L('Kingdom of England', -1.7, 52.6, 'pol', 'cv'), L('Kingdom of Naples', 15.9, 40.7, 'pol', 'cv'),
  L('Crown of Castile', -4.2, 40.2, 'pol', 'cv'), L('Hafsid Sultanate', 8.6, 34.0, 'pol', 'cv'),
  L('Mamluk Sultanate', 29.6, 29.0, 'pol', 'cv'), L('Grand Duchy of Lithuania', 27.6, 53.8, 'pol', 'cv'),
  // 1792–93 politics
  L('French Republic', 2.4, 46.5, 'pol', 'noc'), L('Vendée', -1.05, 46.62, 'polsm', 'noc'),
  L('Habsburg Monarchy', 17.6, 48.85, 'pol', 'noc'), L('Holy Roman Empire', 10.2, 50.4, 'pol', 'noc'),
  L('Great Britain', -1.7, 52.6, 'pol', 'noc'), L('Kingdom of Prussia', 15.2, 53.2, 'pol', 'noc'),
  L('Russian Empire', 31.0, 53.6, 'pol', 'noc'), L('Ottoman Empire', 23.4, 41.75, 'pol', 'noc'),
  L('Ottoman Empire', 32.0, 39.4, 'pol', 'noc'), L('Kingdom of Spain', -4.2, 40.2, 'pol', 'noc'),
  L('Kingdom of Naples', 15.9, 40.7, 'pol', 'noc'), L('Ottoman Egypt', 29.6, 29.0, 'pol', 'noc'),
];

// river name labels, placed on the river itself
const rivLabel = (name, lon, text = name) => {
  let best = null, bd = 1e9, dir = 0;
  for (const f of rivers.features) {
    if (f.properties.name !== name) continue;
    const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const ln of lines) for (let i = 1; i < ln.length - 1; i++) {
      const dd = Math.abs(ln[i][0] - lon);
      if (dd < bd) { bd = dd; best = ln[i]; const a = proj(ln[i - 1]), b = proj(ln[i + 1]); dir = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; }
    }
  }
  if (!best) return null;
  if (dir > 90) dir -= 180; if (dir < -90) dir += 180;
  const p = P(best[0], best[1]);
  return { text, x: p.x, y: p.y, cls: 'river', era: 'all', rot: +dir.toFixed(0) };
};
[['Danube', 23.95], ['Danube', 19.0], ['Nile', 31.05], ['Seine', 1.2], ['Loire', 0.3], ['Olt', 24.35], ['Mur', 15.6], ['Po', 10.6], ['Rhine', 7.55], ['Dniester', 28.3], ['Siret', 27.2], ['Tisza', 20.2]]
  .forEach(([n, lo]) => { const l = rivLabel(n, lo); if (l) out.labels.push(l); });

// faint context cities (orientation only, not story places)
out.cities = [
  ['Constantinople', 28.9784, 41.0082], ['Buda', 19.0402, 47.4979], ['Vienna', 16.3738, 48.2082], ['Venice', 12.3155, 45.4408],
  ['Rome', 12.4964, 41.9028], ['Belgrade', 20.4489, 44.7866], ['Kraków', 19.945, 50.0647], ['Prague', 14.4378, 50.0755],
  ['Athens', 23.7275, 37.9838], ['Cairo', 31.2357, 30.0444], ['Nantes', -1.5536, 47.2184], ['Lyon', 4.8357, 45.764],
  ['Marseille', 5.3698, 43.2965], ['Milan', 9.19, 45.4642], ['Graz', 15.4395, 47.0707], ['Bucharest', 26.1025, 44.4268],
  ['Brașov', 25.5887, 45.6427], ['Sibiu', 24.1256, 45.7983], ['Naples', 14.2681, 40.8518], ['Alexandria', 29.9187, 31.2001],
].map(([name, lon, lat]) => ({ name, ...P(lon, lat) }));

// ── inset: the wider world
const wl = topo.feature(rd(require.resolve('world-atlas/land-110m.json')), 'land');
const IW = 440;
const wp = d3.geoEqualEarth().rotate([-15, 0]);
const wgrid = []; for (let lo = -122; lo <= 150; lo += 2) for (let la = 8; la <= 64; la += 2) wgrid.push([lo, la]);
wp.fitWidth(IW, { type: 'MultiPoint', coordinates: wgrid });
const wb = d3.geoPath(wp).bounds({ type: 'MultiPoint', coordinates: wgrid });
const IH = Math.round(wb[1][1]);
wp.clipExtent([[0, 0], [IW, IH]]);
const wpath = d3.geoPath(wp).digits(1);
const frame = { type: 'Polygon', coordinates: [[]] };
for (let lo = -11; lo <= 39; lo++) frame.coordinates[0].push([lo, 25]);
for (let la = 25; la <= 59.5; la += 0.5) frame.coordinates[0].push([39, la]);
for (let lo = 39; lo >= -11; lo--) frame.coordinates[0].push([lo, 59.5]);
for (let la = 59.5; la >= 25; la -= 0.5) frame.coordinates[0].push([-11, la]);
out.world = {
  W: IW, H: IH, land: wpath(wl), frame: wpath({ type: 'LineString', coordinates: frame.coordinates[0] }),
  graticule: wpath(d3.geoGraticule().step([30, 30])()),
  places: places.filter(p => p.view === 'world').map(p => { const q = wp([p.lon, p.lat]); return { id: p.id, x: +q[0].toFixed(1), y: +q[1].toFixed(1) }; }),
};
out.unmapped = unmapped;
out.titles = titles;
out.labelRank = labelRank;

// Label priority is a hand-kept list; warn rather than silently demote a new place.
{
  const mappable = places.filter(p => p.view === 'main' && p.tier !== 'unplaced').map(p => p.id);
  const missing = mappable.filter(id => !labelRank.includes(id));
  const stale = labelRank.filter(id => !mappable.includes(id));
  if (missing.length) console.warn(`  note: not in labelRank (data/places.js), so their labels yield to the listed places: ${missing.join(', ')}`);
  if (stale.length) console.warn(`  note: labelRank lists places that are not on the main map: ${stale.join(', ')}`);
}
out.links = links;
out.world.voyages = voyages.map(v => {
  // great-circle path, projected
  const gi = d3.geoInterpolate(v.from, v.to), pts = [];
  for (let i = 0; i <= 40; i++) { const q = wp(gi(i / 40)); if (q) pts.push(q); }
  const mid = wp(gi(v.lt || 0.5));
  return { series: v.series, label: v.label, who: v.who, d: 'M' + pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('L'), mx: +mid[0].toFixed(1), my: +(mid[1] + (v.dy || 0)).toFixed(1) };
});

// sanity checks: every route point and place reference must resolve
for (const r of out.routes) for (const l of r.legs) if (/NaN|undefined/.test(l.d)) throw new Error(`route ${r.id} has an unresolved point`);
const missing = places.filter(p => p.view === 'main' && p.tier !== 'unplaced' && !(Number.isFinite(p.lat) && Number.isFinite(p.lon)));
if (missing.length) throw new Error(`places without coordinates: ${missing.map(p => p.id).join(', ')}`);

fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true });
const dest = path.join(ROOT, 'build', 'geo.json');
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`wrote build/geo.json (${(fs.statSync(dest).size / 1024).toFixed(0)} KB): ${out.places.length} places, ${out.routes.length} routes, ${out.labels.length} labels`);
