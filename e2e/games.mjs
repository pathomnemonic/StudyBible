// The games: Quartets can be solved, Cloister finds words, The Prophet scores a guess, and all of them open from the Games page.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/play`); await p.waitForSelector('.play-card');
if ((await p.locator('.play-card').count()) !== 4) fail('four games expected');
// Quartets: solve puzzle q1 by clicking the right tiles
await p.goto(`${BASE}/#/play/quartets?p=q1`); await p.waitForSelector('.q-tile');
if ((await p.locator('.q-tile').count()) !== 16) fail('sixteen tiles');
const sets = [['Frogs', 'Locusts', 'Darkness', 'Boils'], ['Joy', 'Peace', 'Patience', 'Kindness'], ['Wisdom', 'Fortitude', 'Piety', 'Counsel'], ['Pride', 'Envy', 'Sloth', 'Gluttony']];
// a wrong try first: three right and one wrong says "one away"
for (const t of ['Frogs', 'Locusts', 'Darkness', 'Joy']) await p.click(`.q-tile:text-is("${t}")`);
await p.click('button:has-text("Submit")');
if (!/One away/.test(await p.locator('.q-msg').innerText())) fail('three of four should say one away');
for (const s of sets) { for (const t of s) await p.click(`.q-tile:text-is("${t}")`); await p.click('button:has-text("Submit")'); await p.waitForTimeout(150); }
await p.waitForSelector('button:has-text("Copy my result")');
if ((await p.locator('.q-row').count()) !== 4) fail('four solved rows');
// Cloister: the board loads and the solver finds words
await p.goto(`${BASE}/#/play/cloister`); await p.waitForSelector('button:has-text("Today’s board"):not([disabled])', { timeout: 15000 });
await p.click('button:has-text("Today’s board")'); await p.waitForSelector('.cl-cell');
if ((await p.locator('.cl-cell').count()) !== 25) fail('25 letters');
const info = await p.locator('.cl-found').first().locator('xpath=preceding-sibling::p[1]').innerText();
const m = /about (\d+) words/.exec(info); if (!m || +m[1] < 10) fail(`a board should hold plenty of words, got: ${info}`);
// The Prophet: a guess scores
await p.goto(`${BASE}/#/play/prophet`); await p.click('button:has-text("Begin")'); await p.waitForSelector('#pg', { timeout: 20000 });
await p.fill('#pg', '100'); await p.click('button:has-text("Guess")');
await p.waitForSelector('.prophet-answer');
if (!/\+\d+/.test(await p.locator('.prophet-answer').innerText())) fail('points should show');
if (errs.length) fail(errs[0]);
await b.close();
console.log('games e2e ok');
