import { readFileSync } from 'node:fs';

/**
 * Checks that the outside links in our curated data still answer. Run:  npx tsx scripts/verify/links.ts [--sample 200]
 * It sends one polite HEAD request per host at a time-ish (small concurrency), follows redirects, and reports pages that are gone (404/410)
 * or unreachable. A 200 does not prove a page is still relevant, and sites that refuse automated requests (403/429) are reported separately,
 * not as broken. Output goes to the console; nothing in the repository is changed.
 */
const FILES = ['public/data/apologetics.json', 'public/data/media/video_library.json'];
const urls = new Set<string>();
const walk = (v: any) => {
  if (typeof v === 'string') { if (/^https?:\/\//.test(v)) urls.add(v.split('#')[0]); }
  else if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
};
for (const f of FILES) walk(JSON.parse(readFileSync(f, 'utf8')));
let list = [...urls].filter((u) => !/youtube\.com|youtu\.be/.test(u)); // video availability is checked through oEmbed at build time
const si = process.argv.indexOf('--sample');
if (si > 0) { const n = +process.argv[si + 1]; list = list.sort(() => Math.random() - 0.5).slice(0, n); }
const gone: string[] = [], refused: string[] = [], failed: string[] = [];
let i = 0;
async function worker() {
  while (i < list.length) {
    const u = list[i++];
    try {
      const r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'StudyBible-link-check (+https://github.com/pathomnemonic/StudyBible)' } });
      if (r.status === 404 || r.status === 410) gone.push(`${r.status} ${u}`);
      else if (r.status === 403 || r.status === 429 || r.status === 405) refused.push(`${r.status} ${u}`);
      else if (r.status >= 500) failed.push(`${r.status} ${u}`);
    } catch (e: any) { failed.push(`${e?.name ?? 'error'} ${u}`); }
    await new Promise((r) => setTimeout(r, 150));
  }
}
await Promise.all([worker(), worker(), worker()]);
console.log(`${list.length} links checked: ${gone.length} gone, ${failed.length} unreachable, ${refused.length} refused automated checks`);
for (const g of gone) console.log(g);
for (const f of failed.slice(0, 50)) console.log(f);
process.exit(gone.length ? 1 : 0);
