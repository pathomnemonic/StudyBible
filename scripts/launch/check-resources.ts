/**
 * Re-verify the external resources of every apologetics track (network; never run in tests).
 *   npx tsx scripts/launch/check-resources.ts            report only
 *   npx tsx scripts/launch/check-resources.ts --write    set `verified` to today for resources that answered OK
 *   npx tsx scripts/launch/check-resources.ts --track atheism
 * Requests each url with HEAD, falls back to GET, follows redirects, 15 s timeout, 4 at a time.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'src', 'data', 'apologetics', 'tracks');
const WRITE = process.argv.includes('--write');
const only = process.argv.includes('--track') ? process.argv[process.argv.indexOf('--track') + 1] : '';
const UA = 'Mozilla/5.0 (compatible; link-checker)';
const today = new Date().toISOString().slice(0, 10);

interface Res { id: string; url: string; verified: string; title: string }
interface Result { track: string; id: string; url: string; ok: boolean; status: number | string; finalUrl?: string; moved: boolean }

async function fetchOnce(url: string, method: 'HEAD' | 'GET'): Promise<{ status: number; finalUrl: string }> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(url, { method, redirect: 'follow', signal: ctl.signal, headers: { 'user-agent': UA, accept: 'text/html,*/*' } });
    try { await r.body?.cancel(); } catch { /* ignore */ }
    return { status: r.status, finalUrl: r.url };
  } finally { clearTimeout(timer); }
}
async function check(url: string): Promise<{ status: number | string; finalUrl: string }> {
  try {
    const h = await fetchOnce(url, 'HEAD');
    if (h.status < 400) return h;
  } catch { /* try GET */ }
  try { return await fetchOnce(url, 'GET'); } catch (e) { return { status: (e as Error).name === 'AbortError' ? 'timeout' : (e as Error).message, finalUrl: url }; }
}
const norm = (u: string) => u.replace(/\/+$/, '').replace(/^http:/, 'https:');

async function main() {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_') && (!only || f === `${only}.json`));
  const jobs: { file: string; track: string; r: Res }[] = [];
  const data = new Map<string, { resources: Res[] } & Record<string, unknown>>();
  for (const f of files) {
    const t = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
    data.set(f, t);
    for (const r of t.resources ?? []) jobs.push({ file: f, track: t.id, r });
  }
  console.log(`Checking ${jobs.length} resources in ${files.length} tracks…`);
  const results: Result[] = [];
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < jobs.length) {
      const j = jobs[next++];
      const c = await check(j.r.url);
      const ok = typeof c.status === 'number' && c.status < 400;
      const res: Result = { track: j.track, id: j.r.id, url: j.r.url, ok, status: c.status, finalUrl: c.finalUrl, moved: ok && norm(c.finalUrl) !== norm(j.r.url) };
      results.push(res);
      if (!ok) console.log(`FAIL  ${j.track}/${j.r.id}  ${c.status}  ${j.r.url}`);
      else if (res.moved) console.log(`MOVED ${j.track}/${j.r.id}  ${j.r.url}  ->  ${c.finalUrl}`);
      if (ok && WRITE) j.r.verified = today;
    }
  }));
  if (WRITE) for (const [f, t] of data) writeFileSync(join(DIR, f), JSON.stringify(t, null, 2) + '\n');
  const bad = results.filter((r) => !r.ok);
  console.log(`\n${results.length - bad.length} ok, ${results.filter((r) => r.moved).length} moved, ${bad.length} failing.${WRITE ? ` Dates set to ${today} for the ones that answered.` : ' Run with --write to update dates.'}`);
  console.log('Note: some sites block automated requests (403/999); check those by hand before removing them.');
  process.exit(bad.length ? 1 : 0);
}
main();
