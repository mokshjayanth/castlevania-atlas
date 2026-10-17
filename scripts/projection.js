// The map's projection: Lambert conformal conic, standard parallels 36°N and 54°N, centred on 14°E,
// fitted so the frame from 11°W–39°E and 25°N–59.5°N is 2400 units wide.
// Run directly to write geo/layers/projection.json, which geo/relief.py reads.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as d3 from 'd3-geo';

export const W = 2400;
export const PARALLELS = [36, 54];
export const LON0 = 14;

export function makeProjection() {
  const proj = d3.geoConicConformal().parallels(PARALLELS).rotate([-LON0, 0]);
  const grid = [];
  for (let lo = -11; lo <= 39; lo += 1) for (let la = 25; la <= 59.5; la += 0.5) grid.push([lo, la]);
  const extent = { type: 'MultiPoint', coordinates: grid };
  proj.fitWidth(W, extent);
  const H = Math.round(d3.geoPath(proj).bounds(extent)[1][1]);
  proj.clipExtent([[-4, -4], [W + 4, H + 4]]);
  return { proj, W, H };
}

export const params = ({ proj, H }) => ({ k: proj.scale(), tx: proj.translate()[0], ty: proj.translate()[1], p0: PARALLELS[0], p1: PARALLELS[1], lon0: LON0, W, H });

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const out = path.join(root, 'geo', 'layers', 'projection.json');
  fs.writeFileSync(out, JSON.stringify(params(makeProjection()), null, 2) + '\n');
  console.log(`wrote ${path.relative(root, out)}`);
}
