// A video started on a page keeps playing when you go to another tab: it docks, and comes back over its box.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); } });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/study/videos`); await p.waitForSelector('.vid-acts button:has-text("Play")', { timeout: 20000 });
await p.locator('.vid-acts button:has-text("Play")').first().click(); await p.waitForTimeout(800);
const src1 = await p.evaluate(() => document.querySelector('.media-host iframe')?.getAttribute('src'));
if (!src1) fail('the video should be playing in the host');
const over = await p.evaluate(() => { const s = document.querySelector('.host-slot').getBoundingClientRect(); const h = document.querySelector('.media-host').getBoundingClientRect(); return [Math.abs(s.left - h.left), Math.abs(s.top - h.top), Math.abs(s.width - h.width)]; });
if (over.some((x) => x > 2)) fail('the player should sit exactly over its box on the page: ' + over);
// go to another tab
await p.goto(`${BASE}/#/learn`); await p.waitForTimeout(900);
const docked = await p.evaluate(() => { const h = document.querySelector('.media-host.docked'); return h ? { src: h.querySelector('iframe')?.getAttribute('src'), r: h.getBoundingClientRect().toJSON() } : null; });
if (!docked) fail('after leaving the page the video should dock');
if (docked.src !== src1) fail('the dock must be the same player (same address), not a reload');
if (docked.r.bottom > 800 - 40) fail('the dock should sit above the tab bar: ' + JSON.stringify(docked.r));
for (const route of ['/', '/pray', '/read']) { await p.goto(`${BASE}/#${route}`); await p.waitForTimeout(500); if (!(await p.locator('.media-host.docked iframe').count())) fail('the dock should follow you to ' + route); }
// the iframe element itself must have survived (not been recreated): tag it and navigate again
await p.evaluate(() => { document.querySelector('.media-host iframe').dataset.keep = '1'; });
await p.goto(`${BASE}/#/learn`); await p.waitForTimeout(500);
if (!(await p.evaluate(() => document.querySelector('.media-host iframe')?.dataset.keep === '1'))) fail('the player element was recreated when changing page');
// move it: drag the grip, the player follows and stays on screen, the place is kept across pages; the keyboard works; Home puts it back
const rect = () => p.evaluate(() => document.querySelector('.media-host.docked').getBoundingClientRect().toJSON());
const r0 = await rect(); const g = await p.locator('.mh-grip').boundingBox();
await p.mouse.move(g.x + g.width / 2, g.y + g.height / 2); await p.mouse.down(); await p.mouse.move(g.x + g.width / 2 - 150, g.y + g.height / 2 - 300, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(200);
const r1 = await rect();
if (Math.abs(r1.left - (r0.left - 150)) > 6 || Math.abs(r1.top - (r0.top - 300)) > 6) fail('dragging the grip should move the player: ' + JSON.stringify([r0, r1]));
await p.mouse.move(g.x, g.y); await p.mouse.down(); await p.mouse.move(-500, -500, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(100);
const r2 = await rect(); if (r2.left < 0 || r2.top < 0) fail('the player must stay on screen: ' + JSON.stringify(r2));
await p.goto(`${BASE}/#/pray`); await p.waitForTimeout(500);
const r3 = await rect(); if (Math.abs(r3.left - r2.left) > 2 || Math.abs(r3.top - r2.top) > 2) fail('the place should be kept on another page: ' + JSON.stringify([r2, r3]));
await p.locator('.mh-grip').focus(); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(100);
const r4 = await rect(); if (r4.left <= r3.left) fail('the arrow keys should move the player');
await p.keyboard.press('Home'); await p.waitForTimeout(100);
const r5 = await rect(); if (Math.abs(r5.left - r0.left) > 4 || Math.abs(r5.top - r0.top) > 4) fail('Home should put the player back: ' + JSON.stringify([r0, r5]));
// close
await p.locator('.mh-x').click(); await p.waitForTimeout(300);
if (await p.locator('.media-host').count()) fail('closing should stop the player');
if (errs.length) fail(errs[0]);
await b.close(); console.log('ok mediahost');
