// A daily Basilion dive cannot be reset or replayed: leaving the page, reloading, or switching to practice keeps the dive where it was, the clock keeps running
// while away, and once the dive is finished the daily one cannot be played again (only a practice dive).
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
const BASE = process.env.BASE || 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ANSWER = JSON.parse(execSync('npx tsx scripts/deepwaters/answers-for-e2e.ts', { encoding: 'utf8', timeout: 60000 }));
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { if (!localStorage.getItem('sb:setup')) { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); } });
const p = await ctx.newPage();
p.setDefaultTimeout(15000);
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
const open = async () => { await p.goto(`${BASE}/#/play/deepwaters`); await p.waitForSelector('.dw-card, .dw-begin, .dw-results'); if (await p.locator('.dw-begin').count()) { await p.click('.dw-begin'); await p.waitForSelector('.dw-card'); } await p.waitForTimeout(300); };
const dive = async () => (await p.locator('.dw-status').innerText()).replace(/\s+/g, ' ');
const secs = async () => parseInt((await p.locator('.dw-clock span').first().innerText()).trim(), 10);
const score = async () => parseInt((await p.locator('.dw-score b').innerText()).trim(), 10);

await open();
const q1 = await p.locator('.dw-card h2').innerText();
await p.fill('#dw-answer', ANSWER[q1]);
await p.keyboard.press('Enter');
await p.waitForSelector('.dw-reveal.scored');
const afterOne = await score();
if (!(afterOne > 0)) fail('round one should have scored');
await p.keyboard.press('Enter'); // next round
await p.waitForSelector('#dw-answer:not([disabled])');
const q2 = await p.locator('.dw-card h2').innerText();

// leave for another page and come back: still round 2, same question, same score, not reset
await p.goto(`${BASE}/#/play`); await p.waitForSelector('.pf-tile');
await open();
if (!/0?2\b/.test(await dive())) fail('after leaving and returning the dive should still be on round 2: ' + await dive());
if ((await p.locator('.dw-card h2').innerText()) !== q2) fail('the question changed after leaving');
if ((await score()) !== afterOne) fail('the score changed after leaving');

// reload: same
await p.reload(); await p.waitForSelector('.dw-card');
if (!/0?2\b/.test(await dive())) fail('after a reload the dive should still be on round 2');

// the clock keeps running while the page is away
const before = await secs();
await p.goto(`${BASE}/#/play`); await p.waitForSelector('.pf-tile');
await p.waitForTimeout(4000);
await open();
const after = await secs();
if (!(after <= before - 3)) fail(`the clock should have kept running while away (${before} then ${after})`);

// switching to practice and back does not reset the daily dive
await p.locator('.game-help input[type=checkbox]').check();
await p.waitForSelector('.dw-begin'); // a practice dive starts on its own title screen
if (await p.locator('.dw-card').count()) fail('the practice title screen must not show a question');
await p.locator('.game-help input[type=checkbox]').uncheck();
await p.waitForFunction(() => /TODAY/i.test(document.querySelector('.dw-card-top')?.textContent ?? ''));
if (!/0?2\b/.test(await dive())) fail('switching to practice and back must not reset the daily dive: ' + await dive());
if ((await score()) !== afterOne) fail('score lost after the practice switch');

// finish the dive
for (let r = 2; r <= 7; r++) {
  await p.waitForSelector('#dw-answer:not([disabled])');
  const q = await p.locator('.dw-card h2').innerText();
  await p.fill('#dw-answer', ANSWER[q]);
  await p.keyboard.press('Enter');
  await p.waitForSelector('.dw-reveal.scored');
  await p.keyboard.press('Enter');
}
await p.waitForSelector('.dw-results');
await p.waitForTimeout(1400); // the score counts up on arrival
const total = (await p.locator('.dw-results h2').innerText()).trim();
// the finished daily dive cannot be replayed: no "Climb again", and a return shows the same result
if (await p.locator('button:has-text("Climb again")').count()) fail('a finished daily dive must not offer Climb again');
await open();
await p.waitForSelector('.dw-results');
await p.waitForTimeout(1400);
if ((await p.locator('.dw-results h2').innerText()).trim() !== total) fail('the finished daily result changed');
// only a practice dive is offered, and it starts a fresh one
await p.locator('button:has-text("Practice climb")').click();
await p.waitForSelector('.dw-begin');
await p.click('.dw-begin');
await p.waitForSelector('#dw-answer:not([disabled])');
if (!/PRACTICE/i.test(await p.locator('.dw-card-top').innerText())) fail('should be a practice dive');
if (errors.length) fail(errors.join('; '));
await b.close();
console.log('deep waters lock e2e ok');
