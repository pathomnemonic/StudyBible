// Online quiz night end to end, no account and no Study Bible server: the host opens a room from /play/online,
// three players join by six-digit code on their own devices, they answer every question, and everyone sees the result.
// Usage: npm run build && node e2e/online.mjs   (starts its own preview server and a local relay standing in for the public ones)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { startBroker } from '../scripts/dev/mini-broker.mjs';

const PORT = 8798;
const broker = await startBroker(0);
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
const BASE = `http://127.0.0.1:${PORT}`;
for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 500)); }
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const problems = [];
const ctx = async (w = 420) => {
  const c = await browser.newContext({ viewport: { width: w, height: 900 } });
  await c.addInitScript((B) => { try { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:live:brokers', B); } catch { /* storage */ } }, `ws://127.0.0.1:${broker.port}/mqtt`);
  const p = await c.newPage(); p.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`)); return p;
};
const N = 4;
try {
  const host = await ctx(1100);
  await host.goto(`${BASE}/#/play/online`);
  await host.getByLabel('Questions').selectOption(String(8)).catch(() => undefined);
  await host.getByRole('button', { name: 'Open the room' }).click();
  await host.waitForSelector('.live-code', { timeout: 15000 });
  const code = (await host.locator('.live-code').innerText()).trim();
  if (!/^\d{6}$/.test(code)) problems.push(`bad code ${code}`);
  const players = [];
  for (const n of ['Ann', 'Ben', 'Cy']) {
    const p = await ctx();
    await p.goto(`${BASE}/#/play/online`);
    await p.getByLabel('Game code').fill(code);
    await p.getByRole('button', { name: 'Join', exact: true }).click();
    await p.getByPlaceholder('A name everyone will know').fill(n);
    await p.getByRole('button', { name: 'Join', exact: true }).click();
    await p.waitForSelector('text=You’re in!', { timeout: 15000 });
    players.push(p);
  }
  await host.waitForSelector('.live-players li:has-text("Cy")', { timeout: 10000 });
  await host.getByRole('button', { name: /^Start/ }).first().click();
  for (let q = 0; q < N; q++) {
    for (const p of players) {
      await p.waitForSelector('.live-opts button.live-opt:not([disabled])', { timeout: 15000 });
      await p.locator('.live-opts button.live-opt').nth(q % 4).click();
      if (await p.getByRole('button', { name: 'Lock in' }).count()) await p.getByRole('button', { name: 'Lock in' }).click().catch(() => undefined);
    }
    await host.getByRole('button', { name: /leaderboard/i }).click({ timeout: 15000 });
    await host.waitForSelector('.live-board');
    if (q < N - 1) await host.getByRole('button', { name: /Next question/ }).click();
  }
  host.on('dialog', (d) => d.accept());
  await host.getByRole('button', { name: /^End$/ }).click();
  await host.waitForSelector('text=Final results', { timeout: 10000 });
  await players[0].waitForSelector('text=You finished', { timeout: 10000 });
} catch (e) { problems.push(`flow: ${e.message.split('\n')[0]}`); if (process.env.DEBUG_LIVE) for (const p of browser.contexts().flatMap((c) => c.pages())) console.error('---', (await p.innerText('body').catch(() => '')).slice(0, 500).replace(/\n+/g, ' | ')); }
await browser.close();
try { process.kill(-server.pid); } catch { /* gone */ } broker.close();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('online e2e ok');
