import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const generatedFiles = [
  ...Array.from({ length: 5 }, (_, i) => `../src/data/deepWatersCurriculum${i + 1}.generated.json`),
  ...Array.from({ length: 4 }, (_, i) => `../src/data/deepWatersScripture${i + 1}b.generated.json`),
];
const answersById = new Map();
for (const path of generatedFiles) {
  const rows = JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
  for (const row of rows) answersById.set(row.id, row.answers[0]?.answer);
}
const normalize = (value) => value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
const manualAnswer = (question) => {
  if (question.includes('religious order')) return 'Benedictines';
  if (question.includes('title or invocation')) return 'Our Lady of Guadalupe';
  if (question.includes('Church Father')) return 'Augustine of Hippo';
  if (question.includes('ecumenical council')) return 'Nicaea I';
  if (question.includes('Catholic Old Testament')) return 'Tobit';
  if (question.includes('prayer or devotion')) return 'Rosary';
  if (question.includes('liturgical rite')) return 'Latin Church';
  if (question.includes('saint who was a pope')) return 'Peter';
  if (question.includes('woman in the Bible')) return 'Eve';
  if (question.includes('New Testament')) return 'Jerusalem';
  return null;
};
const answerFor = (session, round, question) => {
  const answer = answersById.get(session.promptIds[round]) || manualAnswer(question);
  if (!answer) throw new Error(`no answer fixture for prompt ${session.promptIds[round]}: ${question}`);
  return answer;
};
const lockAnswer = async (page, answer, testSuggestion = false) => {
  const clean = answer.replace(/[^\\p{L}\\p{N}]+$/u, '');
  const typo = testSuggestion && clean.length >= 5 ? clean.slice(0, -1) : null;
  if (typo) {
    await page.fill('#dw-answer', typo);
    await page.locator('.dw-suggestions button').first().waitFor({ state: 'visible', timeout: 5000 });
    const suggestion = page.locator('.dw-suggestions button').filter({ hasText: clean });
    if (!(await suggestion.count())) throw new Error('spelling suggestion did not include the accepted answer');
    await suggestion.first().click();
    if (normalize(await page.locator('#dw-answer').inputValue()) !== normalize(answer)) throw new Error('spelling suggestion did not populate input');
  } else {
    await page.fill('#dw-answer', answer);
  }
  await page.getByRole('button', { name: /Lock it in/ }).click();
  await page.waitForSelector('.dw-reveal', { timeout: 7000 });
  if (normalize(await page.locator('.dw-correct-answer').innerText()) !== normalize(answer)) {
    throw new Error(`answer not recognized; expected "${answer}", feedback: "${await page.locator('.dw-feedback').innerText()}"`);
  }
};

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
try {
  await p.goto(`${BASE}/#/play`);
  await p.waitForSelector('.pf-tile');
  if (!(await p.locator('.pf-tile:has-text("Deep Waters")').count())) throw new Error('Deep Waters missing from Games home');
  await p.goto(`${BASE}/#/play/deepwaters`);
  await p.waitForSelector('.dw-card');
  if (await p.locator('.dw-progress span').count() !== 7) throw new Error('seven round markers expected');
  await p.waitForSelector('#dw-answer', { state: 'visible', timeout: 7000 });
  await p.waitForFunction(() => {
    const raw = localStorage.getItem('sb:deepwaters:session:v1');
    try { return JSON.parse(raw || 'null')?.promptIds?.length === 7; } catch { return false; }
  });
  const session = await p.evaluate(() => JSON.parse(localStorage.getItem('sb:deepwaters:session:v1')));
  const firstQuestion = await p.locator('.dw-card h2').innerText();
  await lockAnswer(p, answerFor(session, 0, firstQuestion));
  await p.waitForFunction(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sb:deepwaters:session:v1') || 'null');
      return stored?.phase === 'locked' && stored.history?.length === stored.round + 1 && stored.deadlineAt === null;
    } catch { return false; }
  });
  const persisted = await p.evaluate(() => JSON.parse(localStorage.getItem('sb:deepwaters:session:v1')));
  await p.reload();
  try {
    await p.waitForSelector('.dw-reveal', { timeout: 7000 });
  } catch {
    throw new Error(`locked session did not restore; persisted=${JSON.stringify(persisted)}`);
  }
  if (!(await p.locator('.dw-round-count').innerText()).includes('01')) throw new Error('locked round did not restore after reload');

  await p.getByRole('button', { name: 'Next round' }).click();
  await p.waitForSelector('#dw-answer', { state: 'visible', timeout: 7000 });
  if (!(await p.locator('.dw-round-count').innerText()).includes('02')) throw new Error('did not advance to round two');
  const secondQuestion = await p.locator('.dw-card h2').innerText();
  await lockAnswer(p, answerFor(session, 1, secondQuestion), true);

  await p.getByRole('button', { name: 'Next round' }).click();
  await p.waitForSelector('#dw-answer', { state: 'visible', timeout: 7000 });
  if (!(await p.locator('.dw-round-count').innerText()).includes('03')) throw new Error('did not advance to round three');
  await p.fill('#dw-answer', 'Dama');
  const clock = p.locator('.dw-clock span');
  await p.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const pausedSeconds = Number(await clock.innerText());
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await p.waitForTimeout(250);
  const resumedSeconds = Number(await clock.innerText());
  if (resumedSeconds < pausedSeconds - 1) throw new Error('round timer continued while tab was hidden');
  await p.reload();
  await p.waitForSelector('#dw-answer', { state: 'visible', timeout: 7000 });
  if (await p.locator('#dw-answer').inputValue() !== 'Dama') throw new Error('in-progress answer did not restore after reload');
  if (errors.length) throw new Error(errors.join('; '));
  console.log('deep waters e2e ok: generated answer acceptance, spelling suggestion, locked and in-progress reload restore, next rounds, hidden-tab timer pause');
} finally {
  await b.close();
}
