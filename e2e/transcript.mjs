// A feed that offers a Podcasting 2.0 transcript: the player shows it as a fold, fetches it only when opened, and tapping a line seeks.
// The feed, the audio and the transcript are served by the test (no network).
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const FEED = `<?xml version="1.0"?><rss xmlns:podcast="https://podcastindex.org/namespace/1.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"><channel><title>Test Show</title><link>https://show.test</link><description>d</description>
<item><title>Episode with words</title><guid>g-1</guid><pubDate>Sat, 14 Nov 2026 08:00:00 GMT</pubDate><itunes:duration>600</itunes:duration><enclosure url="https://show.test/e1.mp3" type="audio/mpeg"/>
<podcast:transcript url="https://show.test/e1.vtt" type="text/vtt"/></item></channel></rss>`;
const VTT = 'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nWelcome to the test show.\n\n00:00:30.000 --> 00:00:35.000\nThe thirty second mark.\n\n00:01:05.000 --> 00:01:09.000\nOne minute five.\n';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
// 100 seconds of silence as a WAV, so the browser can really seek
const wav = (() => { const rate = 8000, n = rate * 100; const b = Buffer.alloc(44 + n, 128); b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate, 28); b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40); return b; })();
let vttFetches = 0;
await ctx.route('https://show.test/**', (r) => { const u = r.request().url(); if (u.endsWith('.vtt')) { vttFetches++; return r.fulfill({ contentType: 'text/vtt', body: VTT, headers: { 'access-control-allow-origin': '*' } }); } if (u.endsWith('.mp3')) {
    // the browser seeks with byte ranges, so serve them
    const m = /bytes=(\d+)-(\d*)/.exec(r.request().headers().range ?? '');
    const h = { 'access-control-allow-origin': '*', 'accept-ranges': 'bytes' };
    if (!m) return r.fulfill({ status: 200, contentType: 'audio/wav', body: wav, headers: { ...h, 'content-length': String(wav.length) } });
    const a = +m[1], z = m[2] ? Math.min(+m[2], wav.length - 1) : wav.length - 1;
    return r.fulfill({ status: 206, contentType: 'audio/wav', body: wav.subarray(a, z + 1), headers: { ...h, 'content-range': `bytes ${a}-${z}/${wav.length}`, 'content-length': String(z - a + 1) } });
  } return r.fulfill({ contentType: 'application/rss+xml', body: FEED, headers: { 'access-control-allow-origin': '*' } }); });
const p = await ctx.newPage(); p.setDefaultTimeout(20000); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/listen?tab=podcasts`); await p.waitForTimeout(1500);
await p.locator('summary:has-text("Add a podcast of your own")').click();
await p.fill('input[aria-label="Search for a podcast or paste a feed link"]', 'https://show.test/feed.xml');
await p.click('button:has-text("Add this feed")'); await p.waitForSelector('text=Added Test Show');
await p.waitForTimeout(800);
await p.locator('.shelf > *:has-text("Test Show")').first().locator('button:has-text("+ Follow")').click(); await p.waitForTimeout(800);
await p.goto(`${BASE}/#/listen?tab=podcasts`); await p.waitForTimeout(1500);
const row = p.locator('.ep:has-text("Episode with words")').first(); await row.waitFor({ timeout: 20000 });
await row.locator('button[aria-label^="Play"], button:has-text("▶")').first().click(); await p.waitForTimeout(800);
await p.locator('button[aria-label="Open the full player"]').click();
await p.waitForSelector('text=Transcript (from the publisher)', { timeout: 15000 }).catch(() => fail('the player must offer the transcript the feed lists'));
if (vttFetches) fail('the transcript must not be fetched before the fold is opened');
await p.locator('summary:has-text("Transcript (from the publisher)")').click();
await p.waitForSelector('.transcript button:has-text("The thirty second mark.")', { timeout: 15000 }).catch(() => fail('opening the fold must show the timed lines'));
if (vttFetches !== 1) fail('the transcript should be fetched once, got ' + vttFetches);
await p.locator('.transcript button:has-text("One minute five.")').click(); await p.waitForTimeout(1500);
if (process.env.DBG) console.log(await p.evaluate(() => { const a = document.querySelector('audio'); const r = document.querySelector('.now input[type=range]'); return JSON.stringify({ audio: a && { src: a.src, rs: a.readyState, d: a.duration, t: a.currentTime, err: a.error?.code }, range: r && { v: r.value, max: r.max } }); }));
const after = await p.evaluate(() => document.querySelector('.now input[type=range]')?.value);
if (!(Number(after) >= 64 && Number(after) <= 70)) fail('tapping a line should seek to its time (65 s), position is ' + after);
if (errs.length) fail(errs[0]);
await b.close(); console.log('transcript ok (offered, lazy, timed lines, seeks)');
