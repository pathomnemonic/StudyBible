// Focused guard for the Media area (the general crawl of every route is sweep.mjs). (1) After clicking each tab and sub-tab in the Media
// area, no two controls may overlap and no control's text may spill out of its box. (2) The Year tab must show the right list after
// every switch between Up next / All days / Queue, even when the queue holds episodes from other shows.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const src = readFileSync(new URL('./smoke.mjs', import.meta.url), 'utf8');
const ROUTES = [...new Set([...src.matchAll(/'(\/[^']*)'/g)].map((m) => m[1]).filter((r) => !r.includes('?')))].slice(0, 400);
const b = await chromium.launch();
const problems = [];

const audit = () => {
  const out = [];
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 4 && r.height > 4 && cs.visibility !== 'hidden' && cs.display !== 'none' && e.offsetParent !== null; };
  const els = [...document.querySelectorAll('main a, main button, main [role=tab], main input, main select, .page a, .page button')].filter(vis);
  const seen = new Set();
  for (const e of els) {
    const cs = getComputedStyle(e);
    if (e.scrollWidth > e.clientWidth + 3 && cs.overflowX === 'visible' && e.textContent.trim() && cs.display !== 'inline') out.push(`text spills out of "${e.textContent.trim().slice(0, 30)}" (${e.scrollWidth} > ${e.clientWidth})`);
  }
  const rects = els.map((e) => [e, e.getBoundingClientRect()]);
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const [a, ra] = rects[i], [c, rc] = rects[j];
    if (a.contains(c) || c.contains(a)) continue;
    const ox = Math.min(ra.right, rc.right) - Math.max(ra.left, rc.left), oy = Math.min(ra.bottom, rc.bottom) - Math.max(ra.top, rc.top);
    if (ox > 6 && oy > 6 && a.textContent.trim() && c.textContent.trim()) {
      const k = a.textContent.trim().slice(0, 20) + '|' + c.textContent.trim().slice(0, 20);
      if (!seen.has(k)) { seen.add(k); out.push(`"${a.textContent.trim().slice(0, 25)}" overlaps "${c.textContent.trim().slice(0, 25)}"`); }
    }
  }
  return out;
};

for (const width of [360]) {
  const ctx = await b.newContext({ viewport: { width, height: 800 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); } catch { /* */ } });
  const p = await ctx.newPage();
  // every tab of the Media area, and the sub-tabs inside each
  await p.goto(`${BASE}/#/listen`); await p.waitForSelector('.seg [role=tab]', { timeout: 20000 });
  const top = await p.locator('[role=tablist][aria-label], .tabbar [role=tab], .seg [role=tab]').count();
  for (const name of ['Year', 'For you', 'Podcasts', 'Books', 'Videos', 'Meditate']) {
    await p.locator('[role=tab]', { hasText: new RegExp(`^${name}`) }).first().click().catch(() => {}); await p.waitForTimeout(700);
    for (const x of await p.evaluate(audit)) problems.push(`[${width}px Media/${name}] ${x}`);
    const n = await p.locator('main .tabbar [role=tab], main .seg [role=tab]').count();
    for (let i = 0; i < n; i++) {
      const t = p.locator('main .tabbar [role=tab], main .seg [role=tab]').nth(i);
      const label = (await t.innerText().catch(() => '')).slice(0, 20);
      await t.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(450);
      for (const x of await p.evaluate(audit)) problems.push(`[${width}px Media/${name}/${label}] ${x}`);
    }
  }
  await ctx.close();
}

// Year tab state: the queue holds episodes that are not Bible in a Year
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
  await ctx.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/#/listen`); await p.waitForSelector('.seg [role=tab]:has-text("Up next")');
  await p.evaluate(() => new Promise((res, rej) => { const r = indexedDB.open('studybible'); r.onsuccess = () => { const tx = r.result.transaction(['cache', 'queue'], 'readwrite'); for (let i = 0; i < 36; i++) { const e = { id: 'chant:' + i, title: 'Introit ' + i, short: 'Introit ' + i, description: '', date: '2020-01-01', passages: [], kind: 'bonus', duration: 300, audioUrl: 'x' }; tx.objectStore('cache').put({ key: 'ep:chant:' + i, value: e, ts: Date.now() }); tx.objectStore('queue').add({ episodeId: 'chant:' + i, order: i }); } tx.oncomplete = res; tx.onerror = () => rej(tx.error); }; r.onerror = () => rej(r.error); }));
  await p.reload(); await p.waitForSelector('.seg [role=tab]:has-text("Queue")');
  const first = async () => (await p.locator('ul.list li').first().innerText().catch(() => '')).replace(/\s+/g, ' ');
  for (const step of ['Queue', 'Up next', 'All days', 'Queue', 'Up next']) {
    await p.click(`.seg [role=tab]:has-text("${step}")`); await p.waitForTimeout(700);
    const f = await first();
    const sel = (await p.locator('.seg [aria-selected=true]').allInnerTexts()).join(',');
    if (step === 'Queue' && !/Introit/.test(f)) problems.push(`Year: Queue should list the queued items, got "${f.slice(0, 40)}"`);
    if (step !== 'Queue' && /Introit/.test(f)) problems.push(`Year: ${step} shows queued items from other shows: "${f.slice(0, 40)}"`);
    if (step !== 'Queue' && !/Day \d+/.test(f)) problems.push(`Year: ${step} should list Bible in a Year days, got "${f.slice(0, 40)}"`);
    if (!sel.includes(step.split(' ')[0])) problems.push(`Year: tab ${step} not marked selected (${sel})`);
  }
  await ctx.close();
}
await b.close();
const uniq = [...new Set(problems)];
if (uniq.length) { console.error(`FAIL ${uniq.length} layout/state problems:\n` + uniq.slice(0, 60).join('\n')); process.exit(1); }
console.log('overlap: ok');
