"""Shaded-relief texture for the map, reprojected into the map's conic projection.

Source: shadedrelief.jpg from the basemap-data 2.0.0 package (MIT licence, see ATTRIBUTION.md),
fetched from PyPI. The image is high-pass filtered so only terrain texture remains, the sea is
neutralised, and the result is resampled onto the projection described in geo/layers/projection.json.

Run with: npm run geo:relief   (needs numpy, scipy and Pillow)
"""
import json
import subprocess
import sys
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'geo' / 'cache'
LAYERS = ROOT / 'geo' / 'layers'
WHEEL = 'basemap_data-2.0.0-py3-none-any.whl'
MEMBER = 'mpl_toolkits/basemap_data/shadedrelief.jpg'
SCALE = 1.25  # output pixels per map unit

Image.MAX_IMAGE_PIXELS = None


def source_image() -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    out = CACHE / 'shadedrelief.jpg'
    if out.exists():
        return out
    wheel = CACHE / WHEEL
    if not wheel.exists():
        subprocess.run([sys.executable, '-m', 'pip', 'download', 'basemap-data==2.0.0', '--no-deps', '-d', str(CACHE)], check=True)
    with zipfile.ZipFile(wheel) as z:
        out.write_bytes(z.read(MEMBER))
    return out


def main() -> None:
    pp = json.loads((LAYERS / 'projection.json').read_text())
    k, tx, ty, width, height = pp['k'], pp['tx'], pp['ty'], pp['W'], pp['H']

    src = np.asarray(Image.open(source_image()).convert('RGB')).astype(np.float32)
    sh, sw = src.shape[:2]
    # crop to lon -40..70, lat 8..74 (equirectangular source)
    lon0, lon1, lat0, lat1 = -40, 70, 8, 74
    cx0, cx1 = int((lon0 + 180) / 360 * sw), int((lon1 + 180) / 360 * sw)
    cy0, cy1 = int((90 - lat1) / 180 * sh), int((90 - lat0) / 180 * sh)
    s = src[cy0:cy1, cx0:cx1]

    gray = 0.30 * s[..., 0] + 0.59 * s[..., 1] + 0.11 * s[..., 2]
    # neutralise the sea (blue pixels) so coasts do not get a halo from the filter
    sea = (s[..., 2] > s[..., 0] + 25) & (s[..., 2] >= s[..., 1] - 5)
    land = ndimage.binary_erosion(~sea, iterations=1).astype(np.float32)
    low = ndimage.gaussian_filter(gray * land, 18) / (ndimage.gaussian_filter(land, 18) + 1e-3)
    gray = np.where(land > 0, gray, low)
    hp = ndimage.gaussian_filter(gray - low, 0.6)
    hp = np.clip(hp / (3.2 * np.std(hp)), -1, 1)

    # inverse Lambert conformal conic for every output pixel
    p0, p1 = np.radians(pp['p0']), np.radians(pp['p1'])
    tany = lambda y: np.tan((np.pi / 2 + y) / 2)
    n = np.log(np.cos(p0) / np.cos(p1)) / np.log(tany(p1) / tany(p0))
    f = np.cos(p0) * np.power(tany(p0), n) / n
    ow, oh = int(width * SCALE), int(round(height * SCALE))
    X, Y = np.meshgrid((np.arange(ow) + 0.5) / SCALE, (np.arange(oh) + 0.5) / SCALE)
    x, y = (X - tx) / k, -(Y - ty) / k
    fy = f - y
    r = np.sign(n) * np.sqrt(x * x + fy * fy)
    lam = np.arctan2(x, np.abs(fy)) * np.sign(fy) / n
    phi = 2 * np.arctan(np.power(f / r, 1 / n)) - np.pi / 2
    lon, lat = np.degrees(lam) + pp['lon0'], np.degrees(phi)
    px, py = (lon + 180) / 360 * sw - cx0, (90 - lat) / 180 * sh - cy0
    out = ndimage.map_coordinates(hp, [py, px], order=1, mode='nearest')

    img = np.clip(128 + out * 118, 0, 255).astype(np.uint8)  # 128 = flat ground
    dest = LAYERS / 'relief.jpg'
    Image.fromarray(img, 'L').save(dest, quality=70, optimize=True, progressive=True)
    print(f'wrote {dest.relative_to(ROOT)} ({ow}x{oh}, {dest.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
