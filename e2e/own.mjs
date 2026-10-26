// Things the reader brings: their own book (EPUB), their own audio, and a podcast added by feed link. Static copy, no server.
// Usage: npm run build && node e2e/own.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { zipSync, strToU8 } from 'fflate';

const PORT = 8793;
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
const BASE = `http://127.0.0.1:${PORT}`;
for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 500)); }
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const problems = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };
const ch = (n, t, body) => `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${t}</title></head><body><h1>${t}</h1>${body}</body></html>`;
const long = (s) => Array.from({ length: 6 }, (_, i) => `<p>${s} paragraph ${i + 1}. The quick brown fox jumps over the lazy dog while the pilgrim walks the long road to Compostela.</p>`).join('');
const epub = zipSync({
  mimetype: strToU8('application/epub+zip'),
  'META-INF/container.xml': strToU8('<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'),
  'OEBPS/content.opf': strToU8('<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>The Pilgrim Test</dc:title><dc:creator>A. Writer</dc:creator></metadata><manifest><item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/><item id="c2" href="c2.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/><itemref idref="c2"/></spine></package>'),
  'OEBPS/c1.xhtml': strToU8(ch(1, 'Chapter One', long('First'))),
  'OEBPS/c2.xhtml': strToU8(ch(2, 'Chapter Two', long('Second'))),
});
// a one-second silent WAV
const wav = (() => { const n = 8000, b = Buffer.alloc(44 + n); b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24); b.writeUInt32LE(8000, 28); b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40); b.fill(128, 44); return b; })();
const feed = `<?xml version="1.0"?><rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"><channel><title>Test Pilgrim Podcast</title><link>https://example.test/</link><description>A test show.</description><itunes:author>Fr. Test</itunes:author><item><title>Episode two</title><pubDate>Tue, 02 Sep 2025 10:00:00 GMT</pubDate><enclosure url="https://example.test/2.mp3" type="audio/mpeg"/><itunes:duration>12:30</itunes:duration></item><item><title>Episode one</title><pubDate>Mon, 01 Sep 2025 10:00:00 GMT</pubDate><enclosure url="https://example.test/1.mp3" type="audio/mpeg"/></item></channel></rss>`;
try {
  const c = await browser.newContext({ viewport: { width: 420, height: 900 } });
  await c.addInitScript(() => { try { localStorage.setItem('sb:tour', '1'); } catch { /* ignore */ } });
  const p = await c.newPage();
  p.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  p.on('dialog', (d) => d.accept());
  await p.route('https://example.test/feed.xml', (r) => r.fulfill({ body: feed, contentType: 'application/rss+xml', headers: { 'access-control-allow-origin': '*' } }));

  // a book of their own
  await p.goto(`${BASE}/#/room`);
  await p.getByText('Your own books').click();
  await p.locator('input[type=file][accept*=epub]').setInputFiles({ name: 'pilgrim.epub', mimeType: 'application/epub+zip', buffer: Buffer.from(epub) });
  await p.waitForSelector('text=Added The Pilgrim Test');
  await p.getByRole('link', { name: 'The Pilgrim Test' }).click();
  await p.waitForSelector('article.scripture');
  check((await p.locator('article.scripture p').count()) >= 5, 'the book text is shown');
  check(/Chapter One/.test(await p.locator('h1.chapter-title').innerText()), 'the first chapter opens');
  await p.getByRole('button', { name: 'Next section' }).click();
  await p.waitForFunction(() => /Chapter Two/.test(document.querySelector('h1.chapter-title')?.textContent ?? ''));

  // their own audio
  await p.goto(`${BASE}/#/listen?tab=audiobooks`);
  await p.getByText(/Your own audio/).click();
  await p.locator('input[type=file][accept*=audio]').setInputFiles([{ name: '01 Intro.wav', mimeType: 'audio/wav', buffer: wav }, { name: '02 Part.wav', mimeType: 'audio/wav', buffer: wav }]);
  await p.waitForSelector('text=Added 2 files');
  check((await p.locator('text=01 Intro').count()) > 0, 'audio file listed');
  await p.getByRole('button', { name: '▶ Play' }).first().click();
  await p.waitForSelector('.player');

  // a podcast by feed link
  await p.goto(`${BASE}/#/listen?tab=podcasts`);
  await p.getByText('Add a podcast of your own').click();
  await p.getByLabel('Search for a podcast or paste a feed link').fill('https://example.test/feed.xml');
  await p.getByRole('button', { name: 'Add this feed' }).click();
  await p.waitForSelector('text=Added Test Pilgrim Podcast');
  await p.getByRole('button', { name: 'Test Pilgrim Podcast' }).first().click();
  await p.waitForSelector('text=Episode two');
  check((await p.locator('text=Episode one').count()) > 0, 'both episodes listed');
} catch (e) { problems.push(`flow: ${e.message.split('\n')[0]}`); }
await browser.close();
try { process.kill(-server.pid); } catch { /* gone */ }
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('own content e2e ok');
