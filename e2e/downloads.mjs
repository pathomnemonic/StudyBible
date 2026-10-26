// Downloads page: study data downloads and verifies, audio episodes save and play back from the device, removal works.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1000, height: 900 } });
await ctx.addInitScript(() => localStorage.setItem('sb:tour', '1'));
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
// audio from any publisher: a small fake file with permissive CORS
await ctx.route(/podtrac|fireside|\.mp3/, (r) => r.fulfill({ status: 200, headers: { 'content-type': 'audio/mpeg', 'access-control-allow-origin': '*' }, body: Buffer.alloc(120000, 1) }));
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/downloads`);
await p.waitForSelector('text=Study data');
await p.waitForSelector('.dl-list li');
// one pack end to end
const firstPack = p.locator('section:has(h2:text("Study data")) .dl-list li').first();
await firstPack.locator('button:has-text("Download")').click();
await firstPack.locator('.chip.good').waitFor({ timeout: 120000 });
await firstPack.locator('button:has-text("Remove")').click();
await firstPack.locator('button:has-text("Download")').waitFor();
// audio
await p.click('button:has-text("Save the next 3 days")');
await p.waitForSelector('text=Saved episodes (3)', { timeout: 30000 });
const row = await p.locator('section:has(h2:text("Audio")) .dl-list li').count();
if (row !== 3) fail('three saved episodes, got ' + row);
const playable = await p.evaluate(async () => { const c = await caches.open('studybible-audio-v1'); return (await c.keys()).length; });
if (playable !== 3) fail('audio cache entries ' + playable);
await p.locator('section:has(h2:text("Audio")) .dl-list li button:has-text("Remove")').first().click();
await p.waitForSelector('text=Saved episodes (2)');
p.once('dialog', (d) => d.accept());
await p.click('button:has-text("Remove all audio")');
await p.waitForSelector('text=Saved episodes (0)');
if (errs.length) fail(errs.join('; '));
await b.close();
console.log('downloads e2e ok');
