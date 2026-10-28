#!/usr/bin/env python3
"""Make the offline base map for Pin the Place: land, lakes and four rivers of the Bible lands, clipped from Natural Earth
(public domain, naturalearthdata.com) and written to public/data/play/basemap.json. Download these into /tmp first:
  ne_50m_land.geojson, ne_50m_lakes.geojson, ne_50m_rivers_lake_centerlines.geojson  (github.com/nvkelso/natural-earth-vector, geojson/)."""
import json, os
W, E, S, N = -12, 70, 8, 52
root = os.path.join(os.path.dirname(__file__), '..', '..')
def clip(ring):
    def cl(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            ia, ib = inside(a), inside(b)
            if ib:
                if not ia: out.append(inter(a, b))
                out.append(b)
            elif ia: out.append(inter(a, b))
        return out
    ix = lambda x: (lambda a, b: (x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])))
    iy = lambda y: (lambda a, b: (a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y))
    pts = [tuple(p) for p in ring]
    for ins, it in ((lambda p: p[0] >= W, ix(W)), (lambda p: p[0] <= E, ix(E)), (lambda p: p[1] >= S, iy(S)), (lambda p: p[1] <= N, iy(N))):
        if not pts: break
        pts = cl(pts, ins, it)
    return pts
def simp(pts, tol=0.02):
    out = [pts[0]]
    for p in pts[1:]:
        if abs(p[0] - out[-1][0]) + abs(p[1] - out[-1][1]) >= tol: out.append(p)
    return out
def polys(path, tol):
    res = []
    for f in json.load(open(path))['features']:
        g = f['geometry']; ps = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        for poly in ps:
            ext = clip(poly[0])
            if len(ext) >= 3:
                ext = simp(ext, tol)
                if len(ext) >= 3: res.append([[round(x, 2), round(y, 2)] for x, y in ext])
    return res
rivers = []
for f in json.load(open('/tmp/riv50.geojson'))['features']:
    if (f['properties'].get('name') or '') in ('Nile', 'Euphrates', 'Tigris', 'Jordan', 'Orontes'):
        g = f['geometry']; lines = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
        for ln in lines:
            ln = [p for p in ln if W <= p[0] <= E and S <= p[1] <= N]
            if len(ln) > 1: rivers.append([[round(x, 2), round(y, 2)] for x, y in simp(ln, 0.03)])
out = {'land': polys('/tmp/land50.geojson', 0.02), 'lakes': polys('/tmp/lakes50.geojson', 0.01), 'rivers': rivers}
os.makedirs(os.path.join(root, 'public/data/play'), exist_ok=True)
json.dump(out, open(os.path.join(root, 'public/data/play/basemap.json'), 'w'), separators=(',', ':'))
