// Switching translation from a SELECTED verse (audit item 10): the destination is checked against numbering facts that are known independently of
// the app's own tables, never a nearby verse, and a translation that lacks the book or chapter says so instead of substituting.
// Cases (Clementine/Vulgate numbering for DRB; English/Hebrew for WEB-C and NABRE; the Greek psalter numbering for LXX):
//   Ps 23:1 (English)  = Ps 22:1 (Vulgate/LXX)       Ps 51:1 = Ps 50:3  (the title takes verses 1-2 in the Vulgate)
//   Ps 51:3            = Ps 50:5                      Ps 3:1  = Ps 3:2   (title again)
//   Joel 2:28 and Malachi 4:1 are the SAME in the Clementine as in English (4 chapters of Malachi, Joel 2 has 32 verses): nothing may move
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('studybible.settings.v1', JSON.stringify({ enabledEditions: ['dra', 'vulgate', 'cpdv', 'brenton', 'rsv2ce', 'nabre'] })); } });
const p = await ctx.newPage(); p.setDefaultTimeout(20000);
const SHORT = { dra: 'DRB', webc: 'WEB-C', nabre: 'NABRE', brenton: 'LXX', rsv2ce: 'RSV-2CE', cpdv: 'CPDV' };
let n = 0;
async function from(ed, book, ch, v) {
  await p.goto(`${BASE}/#/read/${ed}/${book}/${ch}`); await p.waitForSelector(`[data-v="${v}"]`, { timeout: 20000 }).catch(() => fail(`${ed} ${book} ${ch}:${v} did not load`));
  await p.locator(`[data-v="${v}"]`).first().click({ force: true }); await p.waitForTimeout(400);
  const sel = await p.evaluate(() => [...new Set([...document.querySelectorAll('[data-v][aria-pressed=true]')].map((e) => e.dataset.v))]);
  if (sel.join() !== String(v)) fail(`${ed} ${book} ${ch}:${v}: the verse must be selected before switching (selected: ${sel})`);
}
async function switchTo(to) {
  await p.locator('button[aria-label^="Books and translation"]').click(); await p.waitForTimeout(300);
  await p.locator('button[aria-pressed]').filter({ hasText: new RegExp(`^${SHORT[to].replace('-', '\\-')}$`) }).first().click(); await p.waitForTimeout(2200);
}
const where = () => { const h = p.url().split('#')[1]; const m = /^\/read\/([^/]+)\/([^/]+)\/([^/?]+)(?:\?(.*))?$/.exec(h) ?? []; const q = new URLSearchParams(m[4] ?? ''); return { ed: m[1], book: m[2], ch: m[3], v: q.get('v'), url: h }; };
const selected = () => p.evaluate(() => [...new Set([...document.querySelectorAll('[data-v][aria-pressed=true]')].map((e) => e.dataset.v))].join());
async function expectMap(ed, book, ch, v, to, wantCh, wantV) {
  await from(ed, book, ch, v); await switchTo(to);
  const w = where();
  if (w.ed !== to || w.book !== book || w.ch !== String(wantCh) || w.v !== String(wantV)) fail(`${ed} ${book} ${ch}:${v} -> ${to}: expected ${wantCh}:${wantV}, the address is ${w.url}`);
  if ((await selected()) !== String(wantV)) fail(`${ed} ${book} ${ch}:${v} -> ${to}: the verse ${wantV} must be the one selected on the page, not ${await selected()}`);
  n++;
}
// verse numbering that moves
await expectMap('webc', 'PSA', 23, 1, 'dra', 22, 1);
await expectMap('webc', 'PSA', 51, 1, 'dra', 50, 3);
await expectMap('webc', 'PSA', 51, 3, 'dra', 50, 5);
await expectMap('webc', 'PSA', 3, 1, 'dra', 3, 2);
await expectMap('dra', 'PSA', 22, 1, 'webc', 23, 1);
await expectMap('dra', 'PSA', 50, 5, 'webc', 51, 3);
await expectMap('webc', 'PSA', 23, 1, 'brenton', 22, 1);
// numbering that must NOT move
await expectMap('webc', 'JOL', 2, 28, 'dra', 2, 28);
await expectMap('webc', 'MAL', 4, 1, 'dra', 4, 1);
await expectMap('webc', 'JHN', 3, 16, 'nabre', 3, 16);
await expectMap('webc', 'PSA', 23, 1, 'nabre', 23, 1);
// round trip: out and back lands on the verse it started from
await from('webc', 'PSA', 51, 3); await switchTo('dra'); await switchTo('webc');
if (where().ch !== '51' || where().v !== '3') fail('WEB-C Ps 51:3 -> DRB -> WEB-C must come back to 51:3, got ' + where().url); n++;
// a translation that lacks the book: explicit state, no substitute chapter, no leaked parse error, and a way to read it elsewhere
await from('webc', 'JHN', 3, 16); await switchTo('brenton');
const miss = await p.evaluate(() => ({ state: document.querySelector('[data-state="not-found"]')?.innerText ?? '', text: document.body.innerText, verses: document.querySelectorAll('[data-v]').length }));
if (!/does not include John/i.test(miss.state) || miss.verses) fail('a translation without John must say so and show no verses: ' + JSON.stringify({ s: miss.state.slice(0, 120), v: miss.verses }));
if (/Unexpected token|is not valid JSON|Could not load/i.test(miss.text)) fail('a missing book must not leak a parse error: ' + miss.text.slice(0, 200));
if (!(await p.locator('[data-state="not-found"] a:has-text("Read John in")').count())) fail('the missing-book state must offer a translation that has the book'); n++;
await p.goto(`${BASE}/#/read/brenton/JHN/3?v=16`); await p.waitForTimeout(1800);
if (!/does not include John/i.test(await p.locator('h1').first().innerText())) fail('the same state must show when the address is opened directly'); n++;
// a chapter the other translation lacks is never replaced by its last chapter
await p.goto(`${BASE}/#/read/webc/PSA/151`); await p.waitForTimeout(1500);
const h = await p.locator('h1').first().innerText();
if (!/has 150 chapters|Psalm 151/i.test(h)) fail('Psalm 151 in a translation without it must say so: ' + h); n++;
await b.close(); console.log(`edition-verse ok (${n} cases)`);
