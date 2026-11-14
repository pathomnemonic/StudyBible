// The crawler's route manifest must cover every route in the app (audit Part II-4): a route added to src/App.tsx without a crawl entry
// (or a written reason for leaving it out) fails here, so "every route was checked" can be said truthfully.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const app = readFileSync('src/App.tsx', 'utf8');
const routes = [...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== '*');
const manifestSrc = readFileSync('e2e/lib/routes.mjs', 'utf8');
const crawl = [...manifestSrc.matchAll(/\{ path: "([^"]+)", kind: "([^"]+)", route: "([^"]+)" \}/g)].map((m) => ({ path: m[1], kind: m[2], route: m[3] }));
const excluded = Object.fromEntries([...manifestSrc.matchAll(/^\s+'(\/[^']*)': '([^']+)',?$/gm)].map((m) => [m[1], m[2]]));

const toRx = (p: string) => new RegExp('^' + p.replace(/\/\*$/, '(?:/.*)?').replace(/\/:[A-Za-z]+\?/g, '(?:/[^/]+)?').replace(/:[A-Za-z]+/g, '[^/]+') + '$');

describe('route manifest', () => {
  it('finds the routes in App.tsx', () => { expect(routes.length).toBeGreaterThan(150); });
  it('every route in the app is crawled, or excluded with a reason', () => {
    const missing = routes.filter((r) => !(r in excluded) && !crawl.some((c) => c.route === r));
    expect(missing).toEqual([]);
  });
  it('every crawl entry is a real route (no stale entries)', () => {
    const stale = crawl.filter((c) => c.kind !== 'smoke' && !routes.includes(c.route));
    expect(stale.map((c) => c.path)).toEqual([]);
  });
  it('every crawled path actually matches the route it claims', () => {
    const bad = crawl.filter((c) => c.kind !== 'smoke' && !toRx(c.route).test(c.path));
    expect(bad.map((c) => `${c.path} !~ ${c.route}`)).toEqual([]);
  });
  it('every exclusion is a real route and has a reason', () => {
    for (const [r, why] of Object.entries(excluded)) { expect(routes).toContain(r); expect(why.length).toBeGreaterThan(10); }
  });
  it('routes with a required parameter have both a real sample or an unknown-id probe', () => {
    const required = routes.filter((r) => /:[A-Za-z]+(?!\?)/.test(r.replace(/:[A-Za-z]+\?/g, '')));
    for (const r of required) expect(crawl.some((c) => c.route === r && (c.kind === 'sample' || c.kind === 'unknown-id'))).toBe(true);
  });
  it('unknown-id probes exist, so deleted or mistyped ids are exercised', () => { expect(crawl.filter((c) => c.kind === 'unknown-id').length).toBeGreaterThanOrEqual(10); });
});
