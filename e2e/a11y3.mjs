// What a screen reader is given (the accessibility tree), search results, the audio player, and a large system text size.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const problems = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
const p = await ctx.newPage(); p.setDefaultTimeout(12000);
const axe = async (label) => {
  await p.evaluate(axeSource);
  const v = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] })).violations.filter((x) => x.id !== 'target-size').map((x) => `${x.impact} ${x.id} (${x.nodes.length}) ${x.nodes[0].target.join(' ').slice(0, 80)}`));
  for (const x of v) problems.push(`${label}: ${x}`);
};

// 1. the reader as a screen reader meets it
await p.goto(`${BASE}/#/read/webc/JHN/3`); await p.waitForSelector('.v'); await p.waitForTimeout(1200);
const snap = await p.locator('main').ariaSnapshot();
if (!/heading "John 3" \[level=1\]/.test(snap)) problems.push('reader: the chapter needs a level-1 heading "John 3"');
if (!/article "John chapter 3"/.test(snap)) problems.push('reader: the text should be a labelled article');
if (!/button "1 Now there was a man/.test(snap)) problems.push('reader: each verse should be a button named with its number then its text');
if (!/button "Previous chapter"/.test(snap) || !/button "Next chapter"/.test(snap)) problems.push('reader: previous and next chapter need names');
if (!/navigation "For this chapter"/.test(snap)) problems.push('reader: the chapter links should be a named navigation');
await p.locator('.v[data-v="16"]').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
const sel = await p.locator('.v[data-v="16"]').first().getAttribute('aria-pressed');
if (sel !== 'true') problems.push('reader: a selected verse must say so (aria-pressed)');
const live = await p.locator('[aria-live], [role=status]').count();
if (live < 1) problems.push('reader: no live region for announcements (selection, saved, offline)');
await axe('reader with a selected verse');

// 1b. dialogs and panels: the study panel, the books drawer and the toolbox, each open
await p.locator('.v[data-v="16"] .vn').first().click(); await p.waitForTimeout(800);
await axe('study panel open');
await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
await p.locator('button[aria-label^="Books and translation"]').click(); await p.waitForTimeout(700);
await axe('books and translation drawer');
const focusIn = await p.evaluate(() => !!document.activeElement && !!document.activeElement.closest('.drawer, [role=dialog]'));
if (!focusIn) problems.push('the books drawer should take focus when it opens');
await p.keyboard.press('Escape'); await p.waitForTimeout(400);
if (await p.locator('.drawer:visible, [role=dialog]:visible').count()) problems.push('Escape should close the books drawer');
await p.locator('button[aria-label^="Toolbox"]').click(); await p.waitForTimeout(700);
await axe('toolbox drawer');
await p.keyboard.press('Escape'); await p.waitForTimeout(400);

// 2. search results
await p.goto(`${BASE}/#/study/search`); await p.waitForSelector('input[type=search], input[type=text]');
await p.locator('input[type=search], input[type=text]').first().fill('grace'); await p.keyboard.press('Enter'); await p.waitForTimeout(2500);
if (!(await p.locator('main a, main li').count())) problems.push('search: no results to inspect');
await axe('search results');

// 3. the audio player
await p.goto(`${BASE}/#/listen`); await p.waitForTimeout(1500);
const play = p.locator('button', { hasText: /^▶|Listen|Play/ }).first();
if (await play.count()) { await play.click().catch(() => {}); await p.waitForTimeout(1500); }
const player = await p.locator('.mini-player, [aria-label*="player" i], audio').count();
await axe('media page' + (player ? ' with the player' : ''));
const unnamed = await p.evaluate(() => [...document.querySelectorAll('.mini-player button, [class*=player] button')].filter((b) => !(b.getAttribute('aria-label') || b.textContent.trim())).length);
if (unnamed) problems.push(`player: ${unnamed} button(s) without a name`);

// 4. large system text (200%): the reader bar and tabs stay usable, nothing scrolls sideways
await p.goto(`${BASE}/#/read/webc/JHN/3`); await p.waitForSelector('.v');
await p.addStyleTag({ content: 'html{font-size:200% !important}' }); await p.waitForTimeout(800);
const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
if (over > 1) problems.push(`200% text: sideways scroll ${over}px in the reader`);
for (const name of ['Previous chapter', 'Next chapter']) {
  const box = await p.getByRole('button', { name }).first().boundingBox();
  if (!box || box.x < -1 || box.x + box.width > 392) problems.push(`200% text: "${name}" is off screen`);
}
await p.goto(`${BASE}/#/`); await p.waitForTimeout(1200);
const over2 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
if (over2 > 1) problems.push(`200% text: sideways scroll ${over2}px on Today`);
await browser.close();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('a11y3 ok');
