// Lambert conformal conic in map units, with the parameters the base map was drawn with (build/geo.json › proj).
import { G } from './core.js';

const R = Math.PI / 180, PJ = G.proj;
const tanHalf = y => Math.tan((Math.PI / 2 + y) / 2);
const p0 = PJ.p0 * R, p1 = PJ.p1 * R;
const N = Math.log(Math.cos(p0) / Math.cos(p1)) / Math.log(tanHalf(p1) / tanHalf(p0));
const F = Math.cos(p0) * Math.pow(tanHalf(p0), N) / N;

/** [lon, lat] in degrees → [x, y] in map units */
export function fwd(lon, lat) {
  const l = (lon - PJ.lon0) * R, r = F / Math.pow(tanHalf(lat * R), N);
  return [PJ.tx + PJ.k * r * Math.sin(N * l), PJ.ty - PJ.k * (F - r * Math.cos(N * l))];
}

/** [x, y] in map units → [lon, lat] in degrees */
export function inv(X, Y) {
  const x = (X - PJ.tx) / PJ.k, y = -(Y - PJ.ty) / PJ.k, fy = F - y;
  const r = Math.sign(N) * Math.hypot(x, fy);
  const l = Math.atan2(x, Math.abs(fy)) * Math.sign(fy);
  return [l / N / R + PJ.lon0, (2 * Math.atan(Math.pow(F / r, 1 / N)) - Math.PI / 2) / R];
}

/** map units per kilometre at a latitude (north–south, along the central meridian) */
export function unitsPerKm(lat) {
  const a = fwd(PJ.lon0, lat), b = fwd(PJ.lon0, lat + 1 / 111.2);
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
