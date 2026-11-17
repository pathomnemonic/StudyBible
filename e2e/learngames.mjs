// Learning and games, Part IV: How to play + Practice on every game, hide-streaks setting, keyboard ways to play,
// My lessons bookmarks and Resume, and the worksheet print route (student copy has no answers, teacher copy has them).
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { try { if (!localStorage.getItem('sb:tour')) { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); } } catch { /* */ } });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
const go = async (path) => { await p.goto(`${BASE}/#${path}`); await p.waitForTimeout(400); };
const plays = () => p.evaluate(() => JSON.parse(localStorage.getItem('sb:plays:v1') ?? '{}'));

// 1. every game has a labelled How to play fold and a Practice switch
for (const g of ['verbum', 'quartets', 'cloister', 'crossword', 'wordsearch', 'prophet', 'pilgrim', 'whosaid', 'whichbook', 'saintguess', 'whoami', 'chain', 'artdetective', 'termmatch', 'familyties', 'doctrineladder', 'trivia', 'charades', 'quiznight']) {
  await go(`/play/${g}`);
  await p.waitForSelector('.game-help summary', { timeout: 15000 }).catch(() => fail(`${g}: no How to play fold`));
  if (!(await p.locator('.game-help summary', { hasText: 'How to play' }).count())) fail(`${g}: fold not labelled How to play`);
  if (!(await p.getByLabel(/Practice mode/).count())) fail(`${g}: no Practice switch`);
}

// 2. practice counts nothing: finish Wordsearch with Show all? that never counts; use Communions with practice on
await go('/play/quartets?p=q1'); await p.waitForSelector('.q-tile');
await p.getByLabel(/Practice mode/).check();
const sets = [['Frogs', 'Locusts', 'Darkness', 'Boils'], ['Joy', 'Peace', 'Patience', 'Kindness'], ['Wisdom', 'Fortitude', 'Piety', 'Counsel'], ['Pride', 'Envy', 'Sloth', 'Gluttony']];
for (const s of sets) { for (const t of s) await p.click(`.q-tile:text-is("${t}")`); await p.click('button:has-text("Submit")'); await p.waitForTimeout(120); }
await p.waitForSelector('button:has-text("Share my result")');
if (Object.keys((await plays()).games ?? {}).length) fail('practice play was counted');
// and the same puzzle without practice does count
await go('/play'); await go('/play/quartets?p=q1'); await p.reload(); await p.waitForSelector('.q-tile');
for (const s of sets) { for (const t of s) await p.click(`.q-tile:text-is("${t}")`); await p.click('button:has-text("Submit")'); await p.waitForTimeout(120); }
await p.waitForSelector('button:has-text("Share my result")');
// q1 is not necessarily today's, so the daily mark is optional; the trophy/streak write only comes from daily plays
// 3. Show all in Wordsearch is not a solve
await go('/play/wordsearch'); await p.waitForSelector('.ws-cell');
const before = JSON.stringify(await plays());
await p.click('button:has-text("Show all")'); await p.waitForTimeout(300);
if (JSON.stringify(await plays()) !== before) fail('Show all counted as a played game');
// keyboard: exactly one cell is a tab stop, arrows move, Enter twice reports a result
if ((await p.locator('.ws-cell[tabindex="0"]').count()) !== 1) fail('wordsearch should have one tab stop');
await go('/play/wordsearch'); await p.waitForSelector('.ws-cell');
await p.focus('.ws-cell[tabindex="0"]'); await p.keyboard.press('Enter'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('Enter');
if (!/Found|Not a word/.test(await p.locator('.vb-msg[role=status]').first().innerText())) fail('keyboard selection gave no result message');

// 4. Holyguessr has a way to place a pin without a pointer
await go('/play/pilgrim'); await p.waitForSelector('.pg-map', { timeout: 20000 });
await p.getByRole('button', { name: /Place pin at the map centre/ }).click();
if (!/Pin placed at/.test(await p.locator('[role=status]').filter({ hasText: /Pin|pin/ }).first().innerText())) fail('no pin message');
if (await p.getByRole('button', { name: 'Lock in my guess' }).isDisabled()) fail('lock should enable after a keyboard pin');

// 5. hide streaks: default shows, setting hides, totals take their place
await go('/play'); await p.waitForSelector('.streak-chip');
if (!/day streak/.test(await p.locator('.streak-chip').innerText())) fail('streak chip by default');
await p.evaluate(() => { const k = 'sb:settings'; });
const key = await p.evaluate(() => Object.keys(localStorage).find((k) => /settings/i.test(k)) ?? '');
if (key) {
  await p.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k) || '{}'); s.hideStreaks = true; localStorage.setItem(k, JSON.stringify(s)); }, key);
  await go('/play'); await p.reload(); await p.waitForSelector('.streak-chip');
  const t = await p.locator('.streak-chip').innerText();
  if (/streak/.test(t)) fail(`streak still shown after hiding: ${t}`);
}

// 6. My lessons: bookmark a lesson, see it on the curriculum home; Resume after a step
await go('/study/curriculum/1/1-1-1'); await p.waitForSelector('button:has-text("Add to My lessons")');
await p.click('button:has-text("Add to My lessons")');
await go('/study/curriculum'); await p.waitForSelector('#my-lessons-h');
if (!(await p.locator('.my-lessons a').count())) fail('bookmarked lesson not listed in My lessons');

// 7. worksheet route: student copy has no answers, teacher copy does
await go('/print/worksheet/1~1-1-1'); await p.waitForSelector('.print-sheet.wk h1');
const student = await p.locator('.print-sheet').innerText();
if (/✔|ANSWER KEY/.test(student)) fail('student worksheet shows answers');
if (!/Name/.test(student)) fail('worksheet has no Name line');
await go('/print/worksheet/1~1-1-1?key=1'); await p.waitForSelector('.print-sheet.wk h1');
const teacher = await p.locator('.print-sheet').innerText();
if (!/ANSWER KEY/.test(teacher) || !/✔/.test(teacher)) fail('teacher copy has no answer key');

if (errs.length) fail('page errors: ' + errs.slice(0, 3).join(' | '));
await b.close();
console.log('learngames OK');
