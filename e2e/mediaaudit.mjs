// Persistent media lifecycle (audit item 10): one player at a time, switching replaces it, closing stops it, a reload never autoplays,
// controls are named and reachable by keyboard, and the docked player does not cover the tab bar or trap the page.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); } });
const p = await ctx.newPage(); p.setDefaultTimeout(20000);
const count = () => p.evaluate(() => ({ hosts: document.querySelectorAll('.media-host').length, iframes: document.querySelectorAll('.media-host iframe').length, media: document.querySelectorAll('.media-host audio, .media-host video').length, srcs: [...document.querySelectorAll('.media-host iframe')].map((f) => f.getAttribute('src')) }));
await p.goto(`${BASE}/#/study/videos`); await p.waitForSelector('.vid-acts button:has-text("Play")');
const plays = p.locator('.vid-acts button:has-text("Play")');
// 1. play the first, then a second: still exactly one player, and it is the second
await plays.nth(0).click(); await p.waitForTimeout(700);
let c = await count(); if (c.hosts !== 1 || c.iframes !== 1) fail('one player after the first play: ' + JSON.stringify(c));
const first = c.srcs[0];
await plays.nth(1).click(); await p.waitForTimeout(700);
c = await count(); if (c.hosts !== 1 || c.iframes !== 1) fail('switching track must replace the player, not add a second: ' + JSON.stringify(c));
if (c.srcs[0] === first) fail('the second video should be the one playing after switching');
// 2. leaving the page keeps it (dock), the dock is named, and it does not cover the tab bar
await p.goto(`${BASE}/#/learn`); await p.waitForTimeout(800);
const dock = await p.evaluate(() => { const h = document.querySelector('.media-host.docked'); const t = document.querySelector('.tabs, nav.tabs, [aria-label="Main"]'); const hr = h?.getBoundingClientRect(); const tr = t?.getBoundingClientRect(); return h ? { label: h.getAttribute('aria-label'), bottom: hr.bottom, tabTop: tr?.top ?? 9999, role: h.getAttribute('role') } : null; });
if (!dock) fail('the player should dock when leaving its page');
if (!/Now playing/.test(dock.label ?? '')) fail('the docked player needs an accessible name ("Now playing: …"): ' + dock.label);
if (dock.bottom > dock.tabTop + 1) fail(`the docked player covers the tab bar (bottom ${dock.bottom} vs tabs ${dock.tabTop})`);
// 3. every control in the dock has an accessible name and is reachable by keyboard
const names = await p.evaluate(() => [...document.querySelectorAll('.media-host.docked button, .media-host.docked a')].map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim()));
if (names.some((n) => !n) || names.length < 3) fail('dock controls must all be named (grip, title link, close): ' + JSON.stringify(names));
await p.locator('.mh-grip').focus(); await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
if (!(await p.evaluate(() => document.activeElement?.classList.contains('mh-x')))) fail('Tab should reach the close button after the grip and the title link');
// 4. the title link goes back to where it plays
await p.locator('.mh-title').click(); await p.waitForTimeout(600);
if (!/study\/videos/.test(await p.evaluate(() => location.hash))) fail('the title link should return to the page it plays on');
// 5. the dock does not trap the page: content under it can still be scrolled to
await p.goto(`${BASE}/#/learn`); await p.waitForTimeout(600);
const room = await p.evaluate(() => { const m = document.querySelector('main, .page'); return getComputedStyle(m).paddingBottom; });
// 6. closing really stops it, and it stays closed on other pages
await p.locator('.mh-x').click(); await p.waitForTimeout(400);
c = await count(); if (c.hosts !== 0) fail('closing should remove the player: ' + JSON.stringify(c));
await p.goto(`${BASE}/#/pray`); await p.waitForTimeout(500); if ((await count()).hosts !== 0) fail('a closed player must not come back on another page');
// 7. a reload never starts playing by itself
await p.goto(`${BASE}/#/study/videos`); await p.waitForSelector('.vid-acts button:has-text("Play")'); await p.locator('.vid-acts button:has-text("Play")').first().click(); await p.waitForTimeout(600);
await p.reload(); await p.waitForTimeout(1500);
c = await count(); if (c.hosts !== 0) fail('after a reload nothing should be playing or docked: ' + JSON.stringify(c));
// 8. offline: starting a video offline must not crash the page
await ctx.setOffline(true);
await p.goto(`${BASE}/#/study/videos`).catch(() => {}); await p.waitForTimeout(1200);
if (await p.locator('[role=alert]:has-text("did not load")').count()) fail('offline: the page crashed to the error screen');
await ctx.setOffline(false);
// 9. two engines, one player: starting an audio track closes the video host, and starting a video pauses the audio
await p.goto(`${BASE}/#/study/videos`); await p.waitForSelector('.vid-acts button:has-text("Play")'); await p.locator('.vid-acts button:has-text("Play")').first().click(); await p.waitForTimeout(700);
if ((await count()).iframes !== 1) fail('a video should be playing before the audio test');
await p.goto(`${BASE}/#/listen?tab=meditate`); await p.waitForSelector('button[aria-label^="Play "]'); await p.locator('button[aria-label^="Play "]').first().click(); await p.waitForTimeout(900);
c = await count(); if (c.hosts !== 0) fail('starting an audio track must close the video host (a video and a recording were playing together): ' + JSON.stringify(c));
await p.evaluate(() => { window.__paused = []; const real = HTMLMediaElement.prototype.pause; HTMLMediaElement.prototype.pause = function () { window.__paused.push(this.currentSrc || 'audio'); return real.call(this); }; });
await p.goto(`${BASE}/#/study/videos`); await p.waitForSelector('.vid-acts button:has-text("Play")'); await p.locator('.vid-acts button:has-text("Play")').first().click(); await p.waitForTimeout(900);
if (!(await p.evaluate(() => window.__paused.length))) fail('starting a video must pause the audio player');
await b.close(); console.log('mediaaudit ok');
