// The persistent media host's YouTube binding, with a CONTROLLED source: YouTube's player script and embed pages are replaced, so the check
// sees exactly when the app creates and destroys a player and what it saves. No network, no real video.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const A = 'aaaaaaaaaaa', B = 'bbbbbbbbbbb';
const embed = (id, extra = '') => ({ kind: 'iframe', provider: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${id}${extra}` });

// stands in for window.YT: records every player, lets the check set the playback position
const FAKE_YT = `(() => {
  const log = (window.__yt = { made: [], destroyed: [], t: 100, d: 1000 });
  window.YT = { Player: class { constructor(el, o) { this.el = el; this.id = /embed\\/([\\w-]{11})/.exec(el.src)?.[1]; this.o = o; this.alive = true; log.made.push(this); }
    getCurrentTime() { if (!this.alive) throw new Error('player destroyed'); return log.t; } getDuration() { return log.d; } destroy() { this.alive = false; log.destroyed.push(this); } } };
})();`;

const b = await chromium.launch();
async function open({ withYT = true } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
  if (withYT) await ctx.addInitScript(FAKE_YT);
  await ctx.route(/youtube(-nocookie)?\.com\/(embed|iframe_api)/, (r) => r.request().url().includes('iframe_api') ? r.abort() : r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stub</title>' }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/more`); await p.waitForFunction(() => window.__sbHost, null, { timeout: 20000 });
  await p.evaluate(() => { const d = document.createElement('div'); d.id = 'slot'; d.style.cssText = 'position:fixed;left:0;top:60px;width:300px;height:170px'; document.body.appendChild(d); });
  return { ctx, p, errs };
}
const play = (p, key, e, title = 'Video') => p.evaluate(([key, e, title]) => window.__sbHost.claim(key, e, title, document.getElementById('slot')), [key, e, title]);
const info = (p) => p.evaluate(() => ({ made: window.__yt.made.map((x) => x.id), destroyed: window.__yt.destroyed.map((x) => x.id), alive: window.__yt.made.filter((x) => x.alive).map((x) => x.id), vpos: JSON.parse(localStorage.getItem('sb:vpos') || '{}') }));
const settle = (p) => p.waitForTimeout(250);
let n = 0; const ok = () => { n++; };

// 1. first play: exactly one player, bound to the iframe that is on screen
let { ctx, p, errs } = await open();
await play(p, embed(A).src, embed(A), 'Video A'); await settle(p);
let s = await info(p);
if (s.made.join() !== A || s.alive.join() !== A) fail('1: playing a video must create exactly one player for it: ' + JSON.stringify(s)); ok();
const sameFrame = await p.evaluate(() => window.__yt.made[0].el === document.querySelector('.media-host iframe')); if (!sameFrame) fail('1: the player must be bound to the iframe on screen'); ok();
// 2. the same media shown again (another page claims it): same player, no second one, no destroy
await play(p, embed(A).src, embed(A), 'Video A (renamed)'); await settle(p);
s = await info(p); if (s.made.length !== 1 || s.destroyed.length) fail('2: re-claiming the same media must keep the same player: ' + JSON.stringify(s)); ok();
// 3. the same video under another address (another page opens it with a start time): the iframe is replaced, so the player must be replaced too
await play(p, embed(A, '?start=30').src, embed(A, '?start=30'), 'Video A again'); await settle(p);
s = await info(p);
if (s.made.length !== 2 || s.destroyed.length !== 1 || s.alive.length !== 1) fail('3: the same video under a new address gets a NEW iframe, so it needs a new player and the old one destroyed: ' + JSON.stringify(s));
if (!(await p.evaluate(() => window.__yt.made[1].el === document.querySelector('.media-host iframe')))) fail('3: the new player must be bound to the iframe now on screen'); ok(); ok();
// 4. a different video: the old player is destroyed and the new one created
await play(p, embed(B).src, embed(B), 'Video B'); await settle(p);
s = await info(p); if (s.alive.join() !== B || s.destroyed.length !== 2) fail('4: switching video must destroy the old player and create one for the new: ' + JSON.stringify(s)); ok();
// 5. position is saved for the video being left (and under the right title), never for the one arriving
if (!s.vpos[A] || s.vpos[A].t !== 100) fail('5: leaving a video must save where it was: ' + JSON.stringify(s.vpos)); ok();
// 6. audio replaces the video: no player left, nothing saved after destroy, no page error from a destroyed player
await p.evaluate(() => { window.__yt.t = 555; });
await play(p, 'https://example.com/a.mp3', { kind: 'audio', provider: 'x', src: 'https://example.com/a.mp3' }, 'Talk'); await settle(p);
s = await info(p); if (s.alive.length) fail('6: switching to audio must leave no live player: ' + JSON.stringify(s)); ok();
// 7. closing: player destroyed, and the periodic save timer is not left running against a destroyed player
await play(p, embed(A).src, embed(A), 'Video A'); await settle(p);
await p.evaluate(() => window.__yt.made.at(-1).o.events.onStateChange({ data: 1 })); // playing: starts the 5 s save timer
await p.evaluate(() => window.__sbHost.closeHost()); await settle(p);
s = await info(p); if (s.alive.length) fail('7: closing must destroy the player: ' + JSON.stringify(s)); ok();
await p.waitForTimeout(5600); if (errs.length) fail('7: a save after closing threw: ' + errs[0]); ok();
// 8. rapid switching A, B, A before anything settles: the players alive at the end are exactly those for the iframes on screen
await play(p, embed(A).src, embed(A), 'A'); await play(p, embed(B).src, embed(B), 'B'); await play(p, embed(A, '?start=9').src, embed(A, '?start=9'), 'A2'); await settle(p);
s = await info(p); if (s.alive.length !== 1 || s.alive[0] !== A) fail('8: after rapid switching exactly one live player (for the video on screen) must remain: ' + JSON.stringify(s));
if (!(await p.evaluate(() => window.__yt.made.filter((x) => x.alive).every((x) => x.el === document.querySelector('.media-host iframe'))))) fail('8: the live player must belong to the iframe on screen'); ok();
// 9. a state change to paused saves the position with the current title
await p.evaluate(() => { window.__yt.t = 321; window.__yt.made.filter((x) => x.alive)[0].o.events.onStateChange({ data: 2 }); });
s = await info(p); if (s.vpos[A]?.t !== 321 || s.vpos[A]?.title !== 'A2') fail('9: pausing must save the position under the current title: ' + JSON.stringify(s.vpos[A])); ok();
// 10. a title change on the same media must not rebuild the player
const before = (await info(p)).made.length; await play(p, embed(A, '?start=9').src, embed(A, '?start=9'), 'A2 renamed'); await settle(p);
if ((await info(p)).made.length !== before) fail('10: renaming the media must not rebuild the player'); ok();
if (errs.length) fail('page errors: ' + errs.join(' | '));
await ctx.close();
// 11. the player script cannot be loaded (blocked, offline): the video still shows and nothing throws
({ ctx, p, errs } = await open({ withYT: false }));
await play(p, embed(A).src, embed(A), 'Video A'); await p.waitForTimeout(500);
if (!(await p.locator('.media-host iframe').count())) fail('11: with no player script the iframe must still show');
await p.evaluate(() => window.__sbHost.closeHost()); await p.waitForTimeout(200);
if (errs.length) fail('11: ' + errs[0]); ok();
// 12. a video that is never played again leaves the iframe count at one (no stray frames from switching)
await play(p, embed(A).src, embed(A), 'A'); await play(p, embed(B).src, embed(B), 'B'); await p.waitForTimeout(300);
if ((await p.locator('.media-host iframe').count()) !== 1) fail('12: exactly one iframe may exist after switching'); ok();
await ctx.close(); await b.close();
console.log(`mediahost-lifecycle ok (${n} assertions in 12 scenarios, controlled YouTube source)`);
