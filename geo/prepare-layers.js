// Downloads Natural Earth vector data (public domain) and writes the simplified layers the map uses
// to geo/layers/. Needs network access to raw.githubusercontent.com. Run with: npm run geo:layers
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mapshaper from 'mapshaper';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'geo', 'cache');
const OUT = path.join(ROOT, 'geo', 'layers');
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
const SOURCES = ['ne_10m_land', 'ne_10m_lakes', 'ne_10m_rivers_lake_centerlines', 'ne_10m_rivers_europe', 'ne_10m_admin_1_states_provinces'];

fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

for (const name of SOURCES) {
  const file = path.join(CACHE, `${name}.geojson`);
  if (fs.existsSync(file)) continue;
  process.stdout.write(`downloading ${name} … `);
  const res = await fetch(`${NE}${name}.geojson`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log('done');
}
const read = name => JSON.parse(fs.readFileSync(path.join(CACHE, `${name}.geojson`), 'utf8'));

function bbox(geom) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const walk = c => { if (!c || !c.length) return; if (typeof c[0] === 'number') { x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1]); } else c.forEach(walk); };
  if (geom) walk(geom.coordinates);
  return x0 === Infinity ? null : [x0, y0, x1, y1];
}
const BOX = [-26, 14, 56, 68];
const inBox = b => b && b[2] > BOX[0] && b[0] < BOX[2] && b[3] > BOX[1] && b[1] < BOX[3];

// Rivers: Natural Earth names the same river differently per segment; fold them to one English name.
const CANON = {
  Danube: 'Danube', Donau: 'Danube', Duna: 'Danube', 'Soroksari Duna': 'Danube', 'Mosoni-Duna': 'Danube', Borcea: 'Danube',
  'Bratul Chillia': 'Danube', 'Bratul Sfintu Gheorghe': 'Danube', 'Bratul Sulina': 'Danube',
  Olt: 'Olt', 'Argeș': 'Argeș', Jiu: 'Jiu', Ialomita: 'Ialomița', 'Ialomița': 'Ialomița', Siret: 'Siret', Prut: 'Prut', Mures: 'Mureș', Tisa: 'Tisza', 'Timiş': 'Timiș', 'Buzău': 'Buzău', Vedea: 'Vedea',
  Mur: 'Mur', Drau: 'Drava', Raab: 'Rába', Sava: 'Sava', Morava: 'Morava', Inn: 'Inn', Enns: 'Enns', Salzach: 'Salzach', 'Váh': 'Váh', Hron: 'Hron',
  Po: 'Po', Adige: 'Adige', Ticino: 'Ticino', Tanaro: 'Tanaro', Tevere: 'Tiber', Arno: 'Arno', Piave: 'Piave', Oglio: 'Oglio', Adda: 'Adda',
  Seine: 'Seine', Loire: 'Loire', Marne: 'Marne', Yonne: 'Yonne', Rhine: 'Rhine', Rhein: 'Rhine', Rhin: 'Rhine', Nederrijn: 'Rhine', Waal: 'Rhine', Lek: 'Rhine',
  'Rhône': 'Rhône', Rhne: 'Rhône', 'Saône': 'Saône', Sane: 'Saône', Garonne: 'Garonne', Dordogne: 'Dordogne', Vienne: 'Vienne', Cher: 'Cher', Allier: 'Allier', Vilaine: 'Vilaine',
  Elbe: 'Elbe', Oder: 'Oder', Vistula: 'Vistula', Weser: 'Weser', Main: 'Main', Mosel: 'Moselle', Maas: 'Meuse',
  Dniester: 'Dniester', Dnipro: 'Dnieper', Dnepr: 'Dnieper', Dnepre: 'Dnieper', 'Southern Bug': 'Southern Bug', Don: 'Don',
  Thames: 'Thames', Severn: 'Severn', Trent: 'Trent',
  Nile: 'Nile', 'Rosetta Branch': 'Nile', 'Damietta Branch': 'Nile',
  Ebro: 'Ebro', Tajo: 'Tagus', Tejo: 'Tagus', Duero: 'Douro', Guadalquivir: 'Guadalquivir', Guadiana: 'Guadiana',
  Evros: 'Maritsa', Maritsa: 'Maritsa', 'Strymnas': 'Struma', Strimonas: 'Struma', Haliacmon: 'Haliacmon', Yantra: 'Yantra',
  Drina: 'Drina', Una: 'Una', Kupa: 'Kupa', Bosna: 'Bosna', Neretva: 'Neretva',
};
const MAJOR = new Set(['Danube', 'Nile', 'Rhine', 'Seine', 'Loire', 'Po', 'Dnieper', 'Elbe', 'Vistula', 'Rhône', 'Dniester']);
const rivers = [];
for (const src of ['ne_10m_rivers_lake_centerlines', 'ne_10m_rivers_europe']) {
  for (const f of read(src).features) {
    const n = f.properties.name;
    if (!(n in CANON) || !inBox(bbox(f.geometry))) continue;
    const name = CANON[n];
    rivers.push({ type: 'Feature', properties: { name, major: MAJOR.has(name) ? 1 : 0 }, geometry: f.geometry });
  }
}
fs.writeFileSync(path.join(CACHE, 'rivers_raw.geojson'), JSON.stringify({ type: 'FeatureCollection', features: rivers }));

// Historical regions: Wallachia from the modern counties south of the Carpathians and west of the Danube bend,
// Styria from today's Austrian state. Both are approximations of the 15th-century extent.
const WALLACHIA = new Set(['Mehedinti', 'Gorj', 'Dolj', 'Vâlcea', 'Olt', 'Arges', 'Teleorman', 'Dâmbovita', 'Giurgiu', 'Prahova', 'Ilfov', 'Bucharest', 'Ialomita', 'Calarasi', 'Buzau', 'Braila']);
const regions = [];
for (const f of read('ne_10m_admin_1_states_provinces').features) {
  const p = f.properties;
  if (p.adm0_a3 === 'ROU' && WALLACHIA.has(p.name)) regions.push({ type: 'Feature', properties: { region: 'Wallachia' }, geometry: f.geometry });
  if (p.adm0_a3 === 'AUT' && p.name === 'Steiermark') regions.push({ type: 'Feature', properties: { region: 'Styria' }, geometry: f.geometry });
}
fs.writeFileSync(path.join(CACHE, 'regions_raw.geojson'), JSON.stringify({ type: 'FeatureCollection', features: regions }));

const c = name => path.join(CACHE, name), o = name => path.join(OUT, name);
const run = cmd => mapshaper.runCommands(cmd);
await run(`-i ${c('ne_10m_land.geojson')} -clip bbox=-34,12,62,70 -simplify dp interval=900 keep-shapes -filter-islands min-area=40km2 -o ${o('land.json')} precision=0.0001`);
await run(`-i ${c('ne_10m_lakes.geojson')} -clip bbox=-14,22,42,62 -filter "scalerank<=6" -simplify dp interval=700 -o ${o('lakes.json')} precision=0.0001`);
await run(`-i ${c('rivers_raw.geojson')} -clip bbox=-26,14,56,68 -simplify dp interval=500 -o ${o('rivers.json')} precision=0.0001`);
await run(`-i ${c('regions_raw.geojson')} -dissolve region -simplify dp interval=400 -o ${o('regions.json')} precision=0.0001`);
console.log(`layers written to ${path.relative(ROOT, OUT)}/ (rivers: ${rivers.length} segments, region parts: ${regions.length})`);
