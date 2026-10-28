// A shared queue link lists its episodes and adds them to the queue on another device.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { if (sessionStorage.getItem('i')) return; sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/today`); await p.waitForTimeout(800);
const q = await p.evaluate(async () => {
  const j = await (await fetch('data/media/biay.json')).json();
  const ids = j.episodes.filter((e) => e.kind === 'day').slice(0, 3).map((e) => e.id);
  const sh = await (await fetch('data/media/podcast/rosary-in-a-year.json')).json();
  ids.push(sh.episodes[0].id);
  return btoa(unescape(encodeURIComponent(JSON.stringify(ids)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
});
await p.goto(`${BASE}/#/s/queue?q=${q}`); await p.waitForSelector('.queue-import .list li', { timeout: 20000 }).catch(() => fail('shared playlist should list episodes'));
if ((await p.locator('.queue-import .list li').count()) !== 4) fail('four episodes expected (three Bible in a Year days and a Rosary episode)');
await p.click('button:has-text("Add to my queue")'); await p.waitForSelector('button:has-text("Added to your queue")');
await p.goto(`${BASE}/#/listen`); await p.waitForSelector('.seg [role=tab]:has-text("Queue 4")', { timeout: 10000 }).catch(() => fail('the queue should hold four episodes'));
if (errs.length) fail(errs[0]);
await b.close();
console.log('playlist e2e ok');
