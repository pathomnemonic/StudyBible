// Live class end to end: a teacher starts a session, two students join by code, they go through the slides and the quiz.
// Usage: npm run build && node e2e/live.mjs   (starts its own server on a spare port)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 8799;
const dir = mkdtempSync(join(tmpdir(), 'sb-live-'));
const server = spawn('npx', ['tsx', 'server/index.ts'], { env: { ...process.env, PORT: String(PORT), DB_PATH: join(dir, 'db.sqlite'), STATIC_DIR: 'dist', REGISTRATION: 'open' }, stdio: 'ignore' });
const BASE = `http://127.0.0.1:${PORT}`;
for (let i = 0; i < 60; i++) { try { if ((await fetch(`${BASE}/api/health`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 500)); }

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const problems = [];
const ctx = async (w = 420) => { const c = await browser.newContext({ viewport: { width: w, height: 900 } }); await c.addInitScript(() => { try { localStorage.setItem('sb:tour', '1'); } catch { /* ignore */ } }); const p = await c.newPage(); p.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`)); return p; };
try {
  const t = await ctx(1100);
  await t.goto(`${BASE}/#/study/curriculum/9/9-1-2`);
  await t.getByRole('button', { name: /Host live/ }).click();
  await t.getByRole('button', { name: 'Open the room' }).click();
  await t.waitForSelector('.live-code');
  const code = (await t.locator('.live-code').innerText()).trim();
  if (!/^\d{6}$/.test(code)) problems.push(`bad code ${code}`);

  const names = ['Ann', 'Ben'];
  const students = [];
  for (const n of names) {
    const s = await ctx();
    await s.goto(`${BASE}/#/join`);
    await s.getByLabel('Class code').fill(code);
    await s.getByPlaceholder('A name your class will know').fill(n);
    await s.getByRole('button', { name: 'Join', exact: true }).click();
    await s.waitForSelector('text=You’re in!');
    students.push(s);
  }
  await t.waitForSelector('.live-players li:has-text("Ben")');
  await t.getByRole('button', { name: 'Start the lesson' }).click();
  await students[0].waitForSelector('.live-slide');
  await t.getByRole('button', { name: /Next →/ }).first().click();
  await students[1].waitForFunction(() => /Slide 2 of/.test(document.body.innerText));
  await t.getByRole('button', { name: /Skip to quiz/ }).click();
  for (let q = 0; q < 3; q++) {
    await students[0].waitForSelector('.live-opts button, .live-form input, .live-order button', { timeout: 10000 });
    for (const s of students) {
      if (await s.locator('.live-opts button.live-opt').count()) await s.locator('.live-opts button.live-opt').first().click();
      else if (await s.locator('.live-form input').count()) { await s.locator('.live-form input').fill('dignity'); await s.getByRole('button', { name: 'Lock in' }).click(); }
      else if (await s.locator('.live-order button').count()) { const n = await s.locator('.live-order button').count(); for (let i = 0; i < n; i++) await s.locator('.live-order button').nth(i).click(); await s.getByRole('button', { name: 'Lock in' }).click(); }
      if (await s.getByRole('button', { name: 'Lock in' }).count() && await s.locator('.live-opts button.on').count()) await s.getByRole('button', { name: 'Lock in' }).click();
    }
    await t.getByRole('button', { name: /leaderboard/i }).click({ timeout: 10000 });
    await t.waitForSelector('.live-board');
    await t.getByRole('button', { name: /Next question/ }).click();
  }
  // end the session early
  t.on('dialog', (d) => d.accept());
  await t.getByRole('button', { name: /^End$/ }).click();
  await t.waitForSelector('text=Final results', { timeout: 10000 });
  await students[0].waitForSelector('text=You finished');

  // other games: Pilgrim's Road and Build the Cathedral
  for (const [kind, label, seen] of [['race', 'Start the race', '.road'], ['build', 'Start building', '.cathedral']]) {
    await t.goto(`${BASE}/#/study/curriculum/9/9-1-2`);
    await t.getByRole('button', { name: /Host live/ }).click();
    await t.getByLabel('What kind of session').selectOption(kind);
    await t.getByRole('button', { name: 'Open the room' }).click();
    await t.waitForSelector('.live-code');
    const c2 = (await t.locator('.live-code').innerText()).trim();
    const s = await ctx(); await s.goto(`${BASE}/#/join/${c2}`); await s.getByPlaceholder('A name your class will know').fill('Racer'); await s.getByRole('button', { name: 'Join', exact: true }).click(); await s.waitForSelector('text=You’re in!');
    await t.getByRole('button', { name: label }).click();
    await s.waitForSelector('.live-opts button, .live-form input, .live-order button');
    for (let i = 0; i < 3; i++) {
      await s.waitForSelector('.live-opts button.live-opt:not([disabled]), .live-form input', { timeout: 10000 });
      if (await s.locator('.live-opts button.live-opt').count()) { await s.locator('.live-opts button.live-opt').first().click(); if (await s.getByRole('button', { name: 'Lock in' }).count()) await s.getByRole('button', { name: 'Lock in' }).click(); }
      else { await s.locator('.live-form input').fill('x'); await s.getByRole('button', { name: 'Lock in' }).click(); }
      await s.waitForSelector('.run-fb', { timeout: 10000 }).catch(() => undefined);
    }
    await t.waitForSelector(seen);
    await t.getByRole('button', { name: /End now/ }).click();
    await s.waitForSelector('text=right answers', { timeout: 10000 });
  }
} catch (e) { problems.push(`flow: ${e.message.split('\n')[0]}`); if (process.env.DEBUG_LIVE) for (const p of browser.contexts().flatMap((c) => c.pages())) console.error('---', (await p.innerText('body').catch(() => '')).slice(0, 300).replace(/\n+/g, ' | ')); }
await browser.close();
server.kill();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('live e2e ok');
