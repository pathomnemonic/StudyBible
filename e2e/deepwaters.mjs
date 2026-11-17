// Deep Waters in a real browser: the game is on the Games home, a true answer the first version rejected now scores, an answer that is not on the list is
// called "not on our list" (never wrong), a whole seven-round run reaches the results, and keyboard focus follows the game (answer box, then Next).
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
p.setDefaultTimeout(15000);
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));

await p.goto(`${BASE}/#/play`);
await p.waitForSelector('.pf-tile');
if (!(await p.locator('.pf-tile:has-text("Deep Waters")').count())) fail('Deep Waters missing from Games home');

// a true answer for each question the game can ask (all of them were refused by the first version, or are checked here as accepted)
const TRUE = [
  [/Protestant/, 'Susanna'], [/religious order/, 'Ursulines'], [/title, apparition/, 'Our Lady of Perpetual Help'], [/Church Father/, 'Polycarp'], [/21 ecumenical/, 'Lateran V'],
  [/prayer, devotion/, 'Scapular'], [/24 Churches/, 'Slovak Greek Catholic Church'], [/pope who/, 'Linus'], [/woman in the Bible/, 'Mary Magdalene'], [/city, town or place/, 'Damascus'],
  [/Twelve Apostles/, 'Matthias'], [/Doctor of the Church/, 'Bede'], [/book of the New Testament/, 'Philemon'], [/Catholic Old Testament\./, 'Habakkuk'], [/twenty mysteries/, 'Pentecost'],
];

await p.goto(`${BASE}/#/play/deepwaters`);
await p.waitForSelector('.dw-card');
if ((await p.locator('.dw-progress span').count()) !== 7) fail('seven round markers expected');
if (!/not on our list|never wrong/i.test(await p.locator('.gamehelp, .dw-card, body').first().innerText().catch(() => '') + await p.locator('body').innerText())) { /* help text is inside a fold on some widths; checked below by the miss message */ }

let seenMiss = false;
for (let round = 1; round <= 7; round++) {
  await p.waitForSelector('#dw-answer:not([disabled])');
  const question = await p.locator('.dw-card h2').innerText();
  const status = await p.locator('.dw-status').innerText();
  if (!status.includes(`ROUND ${round}`)) fail(`expected round ${round}, got ${status}`);
  // the answer box has the cursor at the start of every round
  if (!(await p.evaluate(() => document.activeElement?.id === 'dw-answer'))) fail(`round ${round}: the answer box should have focus`);
  if (!seenMiss) {
    await p.fill('#dw-answer', 'Zzyzx Brotherhood');
    await p.keyboard.press('Enter');
    const msg = await p.locator('.dw-feedback').innerText();
    if (!/not on our list|not one of the/i.test(msg) || /wrong|incorrect|not recognized/i.test(msg)) fail(`an unknown answer should be "not on our list", never wrong: "${msg}"`);
    if ((await p.locator('.dw-reveal').count()) !== 0) fail('a guess that is not on the list must not lock the round');
    seenMiss = true;
  }
  const hit = TRUE.find(([re]) => re.test(question));
  if (!hit) fail(`no test answer for the question: ${question}`);
  await p.fill('#dw-answer', hit[1]);
  await p.keyboard.press('Enter');
  await p.waitForSelector('.dw-reveal.scored');
  const reveal = await p.locator('.dw-reveal').innerText();
  if (!/\+\d+ points/.test(reveal)) fail(`"${hit[1]}" should score for "${question}": ${reveal}`);
  if (!(await p.evaluate(() => document.activeElement?.classList.contains('dw-next')))) fail(`round ${round}: focus should move to the Next button`);
  await p.keyboard.press('Enter');
}
await p.waitForSelector('.dw-results');
const results = await p.locator('.dw-results').innerText();
if (!/points/.test(results) || (await p.locator('.dw-results li').count()) !== 7) fail('the results should list seven rounds: ' + results.slice(0, 200));
if (errors.length) fail(errors.join('; '));
await b.close();
console.log('deep waters e2e ok');
