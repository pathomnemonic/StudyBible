// Media controls (Part IV): pause vs close, resume after reload, keyboard keys, queue reorder, sleep "end of episode",
// plain error and offline notices with a retry, and the player never hiding the last row or the tab bar (320 and 1280).
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const wav = (() => { const rate = 8000, n = rate * 100, b = Buffer.alloc(44 + n, 128); b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate, 28); b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40); return b; })();
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); }
  const A = window.Audio; window.Audio = function (...a) { const x = new A(...a); window.__a = x; return x; }; window.Audio.prototype = A.prototype;
});
const p = await ctx.newPage(); p.setDefaultTimeout(20000);
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
let mode = 'ok';
await p.route((u) => /\.(mp3|m4a|wav|ogg)$/.test(u.pathname), async (r) => {
  if (mode === 'fail') return r.abort('failed');
  const range = r.request().headers()['range'];
  if (range) { const m = /bytes=(\d+)-(\d*)/.exec(range); const s = +m[1], e = m[2] ? +m[2] : wav.length - 1; return r.fulfill({ status: 206, body: wav.subarray(s, e + 1), headers: { 'content-type': 'audio/wav', 'content-range': `bytes ${s}-${e}/${wav.length}`, 'accept-ranges': 'bytes', 'access-control-allow-origin': '*' } }); }
  return r.fulfill({ status: 200, body: wav, headers: { 'content-type': 'audio/wav', 'accept-ranges': 'bytes', 'access-control-allow-origin': '*' } });
});
const startMeditate = async () => { await p.goto(`${BASE}/#/listen?tab=meditate`); await p.waitForSelector('.med-list li'); await p.locator('button:has-text("Play all")').first().click(); await p.waitForSelector('.player'); };

// 1. pause keeps the player and the place; the pause button is named for what it does
await startMeditate();
await p.locator('.player button[aria-label="Pause"]').waitFor();
const rng = p.locator('.player input[aria-label="Seek"]');
await p.waitForFunction(() => window.__a && window.__a.duration > 50);
await p.evaluate(() => { window.__a.currentTime = 40; });
await p.locator('.player button[aria-label="Pause"]').click();
await p.locator('.player button[aria-label="Play"]').waitFor();
if ((await p.locator('.player').count()) !== 1) fail('pausing must keep the player open');
if (!(await p.evaluate(() => window.__a.paused))) fail('pause should pause');
// 2. the pause button and close button say what they do
const closeName = await p.locator('.player button[aria-label^="Stop and close"]').count();
if (!closeName) fail('the close button should be named "Stop and close the player"');
// 3. resume after a reload: same episode, paused, at the place it stopped
await p.waitForTimeout(500);
await p.reload(); await p.waitForSelector('.player');
await p.waitForFunction(() => window.__a && Math.abs(window.__a.currentTime - 40) < 3, null, { timeout: 15000 }).catch(() => fail('after a reload the episode should come back at about 0:40'));
if (!(await p.evaluate(() => window.__a.paused))) fail('after a reload nothing should play by itself');
if (!(await p.locator('.player button[aria-label="Play"]').count())) fail('after a reload the button should offer Play');
// 4. keyboard keys: K play or pause, L forward; the help text is on the player
if (!/K play or pause/.test((await p.locator('.player').getAttribute('title')) ?? '')) fail('the player should document its keys in its title');
await p.locator('.player button[aria-label^="Back"]').focus();
await p.keyboard.press('k'); await p.waitForFunction(() => !window.__a.paused);
const t0 = await p.evaluate(() => window.__a.currentTime);
await p.keyboard.press('l'); await p.waitForTimeout(300);
if ((await p.evaluate(() => window.__a.currentTime)) < t0 + 20) fail('L should skip forward');
await p.keyboard.press('k'); await p.waitForFunction(() => window.__a.paused);
await p.waitForTimeout(300);
if (!/Paused/.test((await p.locator('[role=status]').allTextContents()).join(' '))) fail('state changes should be announced (Paused)');
// 5. 44px targets
const small = await p.evaluate(() => [...document.querySelectorAll('.player button, .player select, .player input')].map((e) => { const r = e.getBoundingClientRect(); return [e.getAttribute('aria-label'), Math.round(r.width), Math.round(r.height)]; }).filter(([, w, h]) => h < 44 || w < 44));
if (small.length) fail('player controls under 44px: ' + JSON.stringify(small));
// 6. full player: queue reorder, key help, sleep "end of episode"
await p.locator('.player button[aria-label="Open the full player"]').click();
await p.waitForSelector('text=Up next');
const titles = () => p.locator('details:has(summary:has-text("Up next")) ol li > span:first-child').allInnerTexts();
await p.waitForFunction(() => document.querySelectorAll('details ol.list li').length >= 2, null, { timeout: 15000 });
await p.waitForTimeout(500);
const before = await titles(); if (before.length < 2) fail('need two queued episodes for the reorder test');
if (!(await p.getByText(/Keyboard: K play or pause/).count())) fail('the full player should show the keyboard help');
await p.locator('button[aria-label^="Move"][aria-label$="down"]').first().click(); await p.waitForTimeout(500);
const after = await titles();
if (after[0] !== before[1] || after[1] !== before[0]) fail(`move down should swap the first two: ${JSON.stringify(before.slice(0, 2))} -> ${JSON.stringify(after.slice(0, 2))}`);
await p.locator('button[aria-label^="Move"][aria-label$="up"]').nth(1).click(); await p.waitForTimeout(500);
if ((await titles())[0] !== before[0]) fail('move up should put it back');
if (!(await p.locator('[role=status]:has-text("Moved")').count())) fail('a move should be announced');
await p.locator('label:has-text("Sleep") select').selectOption('end');
if (!(await p.locator('[role=status]:has-text("end of this episode")').count())) fail('sleep end should be announced');
await p.keyboard.press('Escape');
const nowTitle = await p.evaluate(() => document.querySelector('.player a')?.textContent);
await p.evaluate(() => { const a = window.__a; a.currentTime = a.duration - 1; a.play(); });
await p.waitForFunction(() => window.__a.ended || window.__a.paused, null, { timeout: 15000 });
await p.waitForTimeout(1200);
if ((await p.evaluate(() => document.querySelector('.player a')?.textContent)) !== nowTitle) fail('sleep at the end of the episode must stop, not play the next one');
if (!(await p.evaluate(() => window.__a.paused))) fail('sleep at the end should leave it paused');
// 7. close stops, clears the dock, and nothing starts again by itself
await p.locator('.player button[aria-label^="Stop and close"]').click();
await p.waitForFunction(() => !document.querySelector('.player'));
if (!(await p.evaluate(() => window.__a.paused))) fail('close must stop the sound');
await p.goto(`${BASE}/#/today`); await p.waitForTimeout(600);
if (await p.locator('.player').count()) fail('a closed player must not come back');
if (!(await p.locator('[role=status]:has-text("Player closed")').count())) fail('closing should be announced');
await p.reload(); await p.waitForTimeout(1200);
if (await p.locator('.player').count()) fail('after close and reload no player should appear');

// 8. a failing stream: plain message with Try again; recovers when the stream does
mode = 'fail';
await startMeditate();
await p.waitForSelector('.player-msg[role=alert]', { timeout: 15000 }).catch(() => fail('a failing stream must show a plain message'));
if (!/could not be played/.test(await p.locator('.player-msg').innerText())) fail('message wording');
mode = 'ok';
await p.locator('.player-msg button:has-text("Try again")').click();
await p.waitForFunction(() => !document.querySelector('.player-msg') && !window.__a.paused, null, { timeout: 15000 }).catch(() => fail('Try again should recover once the stream is back'));
// 9. switching from a local meditation file to a remote Bible-in-a-Year episode flushes the old episode's final position first
await mode === 'ok';
await p.locator('.player button[aria-label^="Stop and close"]').click().catch(() => {});
await startMeditate();
await p.waitForFunction(() => window.__a && window.__a.src.includes('/audio/'));
const local = await p.evaluate(() => ({ id: window.__a._ep?.id, src: window.__a.src }));
if (!local.id?.startsWith('med:')) fail('the first source should be a local meditation track: ' + JSON.stringify(local));
await p.evaluate(() => { const a = window.__a; a.currentTime = 40; a.dispatchEvent(new Event('timeupdate')); });
await p.goto(`${BASE}/#/listen?tab=now`);
await p.waitForSelector('.ep-acts button[aria-label^="Play "]');
await p.locator('.ep-acts button[aria-label^="Play "]').first().click();
await p.waitForFunction((old) => window.__a?._ep?.id && window.__a._ep.id !== old, local.id);
const remote = await p.evaluate(() => ({ id: window.__a._ep?.id, src: window.__a.src }));
if (!remote.id || remote.id.startsWith('med:') || remote.src === local.src) fail('the new source should be a different BIAY episode: ' + JSON.stringify({ local, remote }));
const savedPosition = await p.evaluate(async (id) => {
  const request = indexedDB.open('studybible');
  const db = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const tx = db.transaction('episodeProgress', 'readonly');
  const req = tx.objectStore('episodeProgress').get(id);
  const row = await new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
  db.close(); return row?.position;
}, local.id);
if (Math.abs((savedPosition ?? 0) - 40) > 2) fail('the local episode position should be saved before switching: ' + savedPosition);
// 10. offline: an offline notice rather than a dead player
mode = 'fail'; await p.locator('.player button[aria-label^="Stop and close"]').click();
await ctx.setOffline(true);
await p.locator('.med-list .icon-btn').first().click().catch(async () => { await p.goto(`${BASE}/#/listen?tab=meditate`).catch(() => {}); });
await p.waitForSelector('.player-msg', { timeout: 15000 }).catch(() => fail('offline must show a notice'));
if (!/offline/i.test(await p.locator('.player-msg').innerText())) fail('the notice should say you are offline');
await ctx.setOffline(false); mode = 'ok';
await p.locator('.player button[aria-label^="Stop and close"]').click().catch(() => {});

// 10. video host: pause is not close; close stops and the next visit does not autoplay; error and offline notices
await p.goto(`${BASE}/#/study/videos`); await p.waitForSelector('.vid-acts button:has-text("Play")');
await p.locator('.vid-acts button:has-text("Play")').first().click(); await p.waitForTimeout(700);
await p.goto(`${BASE}/#/about`); await p.waitForSelector('.media-host.docked');
const xl = await p.locator('.mh-x').getAttribute('aria-label'); if (!/Stop and close/.test(xl)) fail('host close label');
// 11. the docked host never hides the last row or the tab bar, at 320 and 1280
const cover = () => p.evaluate(async () => {
  if (!document.getElementById('lastrow')) { const f = document.createElement('div'); f.style.height = '2500px'; const l = document.createElement('p'); l.id = 'lastrow'; l.textContent = 'Last row of a long page'; document.querySelector('main').append(f, l); }
  window.scrollTo(0, 1e7); document.querySelector('main')?.scrollTo?.(0, 1e7); await new Promise((r) => setTimeout(r, 300));
  const host = document.querySelector('.media-host.docked')?.getBoundingClientRect();
  const tabs = document.querySelector('nav.tabs')?.getBoundingClientRect();
  const els = [...document.querySelectorAll('main p, main li, main a, main button, main h2, main h3, main h1')].filter((e) => e.offsetParent && !e.closest('.media-host, .player') && e.getBoundingClientRect().height > 0);
  const last = els.reduce((m, e) => (e.getBoundingClientRect().bottom > m.getBoundingClientRect().bottom ? e : m), els[0]);
  const lr = last.getBoundingClientRect();
  const hostOver = host && lr.bottom > host.top + 1 && lr.top < host.bottom && lr.right > host.left && lr.left < host.right;
  const tabsOver = tabs && getComputedStyle(document.querySelector('nav.tabs')).position === 'fixed' && lr.bottom > tabs.top + 1 && tabs.height > 0 && tabs.width > tabs.height * 2 && tabs.top > innerHeight / 2;
  const overlap = host && tabs && tabs.top > innerHeight / 2 && host.bottom > tabs.top + 1;
  return { hostOver, tabsOver, overlap, last: (last.textContent || '').slice(0, 30), lr: [Math.round(lr.top), Math.round(lr.bottom)], host: host && [Math.round(host.top), Math.round(host.bottom)], tabs: tabs && Math.round(tabs.top) };
});
for (const w of [320, 1280]) {
  await p.setViewportSize({ width: w, height: 700 }); await p.waitForTimeout(500);
  const c = await cover();
  if (c.hostOver || c.tabsOver || c.overlap) fail(`at ${w}px the docked player hides content or the tab bar: ${JSON.stringify(c)}`);
}
await p.setViewportSize({ width: 390, height: 800 });
// close, then coming back to the page does not start anything
await p.locator('.mh-x').click(); await p.waitForFunction(() => !document.querySelector('.media-host'));
await p.goto(`${BASE}/#/study/videos`); await p.waitForTimeout(1000);
if (await p.locator('.media-host').count()) fail('after closing, opening the page again must not autoplay');
// error and offline on a recording in the host
mode = 'fail';
await p.evaluate(() => window.__sbHost.claim('x1', { kind: 'audio', provider: 'x', src: 'https://example.test/gone.mp3' }, 'Talk', document.body));
await p.evaluate(() => { location.hash = '#/today'; }); await p.waitForTimeout(300);
await p.evaluate(() => window.__sbHost.release('x1', document.body)); // docks it
await p.waitForSelector('.media-host.docked');
await p.waitForSelector('.mh-msg', { timeout: 15000 }).catch(() => fail('a recording that fails shows a message in the host'));
if (!(await p.locator('.mh-msg button:has-text("Try again")').count())) fail('host retry button');
await ctx.setOffline(true); await p.waitForTimeout(300);
if (!/offline/i.test(await p.locator('.mh-msg').innerText())) fail('host offline wording');
await ctx.setOffline(false);
if (errs.length) fail(errs[0]);
await b.close();
console.log('mediacontrols e2e ok');
