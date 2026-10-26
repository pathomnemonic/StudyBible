// Teacher tools end to end: a class, attendance from a live session, an exam, and the gradebook.
// Usage: npm run build && node e2e/teach.mjs   (starts its own server on a spare port)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 8797;
const dir = mkdtempSync(join(tmpdir(), 'sb-teach-'));
const server = spawn('npx', ['tsx', 'server/index.ts'], { env: { ...process.env, PORT: String(PORT), DB_PATH: join(dir, 'db.sqlite'), STATIC_DIR: 'dist' }, stdio: 'ignore' });
const BASE = `http://127.0.0.1:${PORT}`;
for (let i = 0; i < 60; i++) { try { if ((await fetch(`${BASE}/api/health`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 500)); }
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const problems = [];
const ctx = async (w = 420) => { const c = await browser.newContext({ viewport: { width: w, height: 900 } }); await c.addInitScript(() => { try { localStorage.setItem('sb:tour', '1'); } catch { /* ignore */ } }); const p = await c.newPage(); p.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`)); p.on('dialog', (d) => d.accept()); return p; };
const check = (ok, msg) => { if (!ok) problems.push(msg); };
try {
  const t = await ctx(1200);
  await t.goto(`${BASE}/#/teach`);
  await t.getByLabel('Class name').fill('Grade 9 Religion');
  await t.getByRole('button', { name: 'Create the class' }).click();
  await t.getByLabel('Student names').fill('Maria Lopez\nJames Carter\nAnh Nguyen');
  await t.getByRole('button', { name: 'Add students' }).click();
  await t.waitForSelector('input[aria-label="Name"]');
  check((await t.locator('input[aria-label="Name"]').count()) === 3, 'three students on the list');

  // 1. a quiz game; Maria and James come, Anh does not
  await t.goto(`${BASE}/#/study/curriculum/9/9-1-2`);
  await t.getByRole('button', { name: /Host live/ }).click();
  await t.getByLabel('Class (to keep attendance and scores)').selectOption({ index: 1 });
  await t.getByLabel('How many').selectOption('5');
  await t.getByRole('button', { name: 'Open the room' }).click();
  await t.waitForSelector('.live-code');
  const code = (await t.locator('.live-code').innerText()).trim();
  const join = async (code, name) => { const s = await ctx(); await s.goto(`${BASE}/#/join/${code}`); await s.getByRole('button', { name }).click(); await s.getByRole('button', { name: 'Join', exact: true }).click(); await s.waitForSelector('text=You’re in!'); return s; };
  const maria = await join(code, 'Maria Lopez'), james = await join(code, 'James Carter');
  // a student not on the list cannot join
  const rogue = await ctx(); await rogue.goto(`${BASE}/#/join/${code}`); await rogue.waitForSelector('.live-roster'); check(await rogue.getByRole('button', { name: 'Join', exact: true }).isDisabled(), 'join disabled until a name is picked');
  await t.getByRole('button', { name: 'Skip to the quiz' }).click();
  for (let q = 0; q < 5; q++) {
    for (const s of [maria, james]) {
      await s.waitForSelector('.live-opts button, .live-form input, .live-order button', { timeout: 10000 });
      if (await s.locator('.live-opts button.live-opt').count()) { await s.locator('.live-opts button.live-opt').first().click(); if (await s.getByRole('button', { name: 'Lock in' }).count()) await s.getByRole('button', { name: 'Lock in' }).click(); }
      else if (await s.locator('.live-form input').count()) { await s.locator('.live-form input').fill('x'); await s.getByRole('button', { name: 'Lock in' }).click(); }
    }
    await t.getByRole('button', { name: /leaderboard/i }).click({ timeout: 10000 });
    await t.getByRole('button', { name: /Next question|Finish/ }).click();
  }
  await t.waitForSelector('text=Saved to your class record', { timeout: 10000 });

  // 2. the class record
  await t.getByRole('link', { name: 'Open the class' }).click();
  await t.getByRole('tab', { name: 'Attendance' }).click();
  await t.waitForSelector('input[aria-label="Anh Nguyen: Absent"]');
  check(await t.locator('input[aria-label="Maria Lopez: Present"]').isChecked(), 'Maria marked present');
  check(await t.locator('input[aria-label="Anh Nguyen: Absent"]').isChecked(), 'Anh marked absent');
  await t.locator('input[aria-label="Anh Nguyen: Excused"]').click();
  await t.waitForFunction(() => document.querySelector('input[aria-label="Anh Nguyen: Excused"]').checked);
  await t.getByRole('tab', { name: 'Gradebook' }).click();
  await t.waitForSelector('input[aria-label^="Maria Lopez, "]');
  check((await t.locator('input[aria-label^="Maria Lopez, "]').count()) >= 2, 'quiz and participation columns for Maria');
  await t.getByRole('tab', { name: 'Sessions' }).click();
  await t.getByRole('button', { name: /joined/ }).first().click();
  await t.waitForSelector('text=Which questions were hard?');

  // 3. an exam
  await t.goto(`${BASE}/#/study/curriculum/9/9-1-2`);
  await t.getByRole('button', { name: /Host live/ }).click();
  await t.getByLabel('What kind of session').selectOption('exam');
  await t.getByLabel('Class (to keep attendance and scores)').selectOption({ index: 1 });
  await t.getByLabel('How many').selectOption('5');
  await t.getByRole('button', { name: 'Open the room' }).click();
  await t.waitForSelector('.live-code');
  const code2 = (await t.locator('.live-code').innerText()).trim();
  const m2 = await join(code2, 'Maria Lopez');
  await t.getByRole('button', { name: /Start the exam/ }).click();
  await m2.waitForSelector('.exam-nav');
  for (let q = 0; q < 5; q++) {
    if (await m2.locator('.live-opts button.live-opt').count()) await m2.locator('.live-opts button.live-opt').first().click();
    else if (await m2.locator('input[aria-label="Your answer"]').count()) await m2.locator('input[aria-label="Your answer"]').fill('x');
    if (q < 4) await m2.getByRole('button', { name: 'Next →' }).click();
  }
  await m2.getByRole('button', { name: 'Hand in' }).click();
  await m2.waitForSelector('text=Handed in');
  await t.waitForSelector('text=1 of 1 have handed in');
  await t.getByRole('button', { name: /End the exam now/ }).click();
  await t.waitForSelector('text=Exam results');
  await t.waitForSelector('text=Saved to your class record');
  await t.getByRole('link', { name: 'Open the class' }).click();
  await t.getByRole('tab', { name: 'Gradebook' }).click();
  await t.waitForSelector('th:has-text("Class average")');
  check((await t.locator('th.asm-title, .asm-title').count()) >= 3, 'exam column added');
  await t.getByRole('tab', { name: 'Reports' }).click();
  await t.waitForSelector('.report-card');
} catch (e) { problems.push(`flow: ${e.message.split('\n')[0]}`); }
await browser.close();
server.kill();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('teach e2e ok');
