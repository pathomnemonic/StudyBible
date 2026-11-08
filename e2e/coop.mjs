// Co-op Verbum and the weekly leaderboard, end to end with no account and no server of ours: two browser contexts talk through a local relay.
// Usage: COOP_BASE=http://127.0.0.1:5209 node e2e/coop.mjs   (or without COOP_BASE, after `npm run build`: starts its own preview server)
// Set COOP_SHOTS=dir to save screenshots at 390 and 1280 wide.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { startBroker } from '../scripts/dev/mini-broker.mjs';

const broker = await startBroker(0);
let BASE = process.env.COOP_BASE, server;
if (!BASE) {
  const PORT = 8799; BASE = `http://127.0.0.1:${PORT}`;
  server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
}
for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 500)); }
const words = readFileSync(new URL('../src/data/verbum.ts', import.meta.url), 'utf8').match(/`([^`]+)`/)[1].split(' ');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const problems = [];
const ctx = async (w = 390) => {
  const c = await browser.newContext({ viewport: { width: w, height: 900 } });
  await c.addInitScript((B) => { try { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:live:brokers', B); } catch { /* storage */ } }, `ws://127.0.0.1:${broker.port}/mqtt`);
  const p = await c.newPage(); p.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`)); return p;
};
const guess = async (p, w) => { await p.keyboard.type(w); await p.keyboard.press('Enter'); };
try {
  const a = await ctx(390), b = await ctx(1280);
  await a.goto(`${BASE}/#/play/coop`);
  const day = await a.evaluate(() => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5));
  const answer = words[(day * 7919) % words.length];
  const wrong = words.find((w) => w !== answer && w.length === 5);
  await a.getByPlaceholder('For example, Mum').fill('Ann');
  await a.getByRole('button', { name: 'Start a room' }).click();
  await a.waitForSelector('.cp-code', { timeout: 15000 });
  const code = (await a.locator('.cp-code').innerText()).trim();
  if (!/^\d{6}$/.test(code)) problems.push(`bad code ${code}`);
  await b.goto(`${BASE}/#/play/coop`);
  await b.getByPlaceholder('For example, Mum').fill('Ben');
  await b.getByLabel('Room code').fill(code);
  await b.getByRole('button', { name: 'Join', exact: true }).click();
  await a.waitForSelector('.cp-who li:has-text("Ben")', { timeout: 15000 });
  await b.waitForSelector('.cp-who li:has-text("Ann")', { timeout: 15000 });
  await guess(a, wrong);
  await b.waitForFunction((w) => [...document.querySelectorAll('.cp-row')][0]?.innerText.toLowerCase().replace(/\s/g, '').startsWith(w), wrong, { timeout: 15000 });
  await guess(b, answer);
  for (const p of [a, b]) await p.waitForSelector('text=Solved together in 2 guesses', { timeout: 15000 });
  if (process.env.COOP_SHOTS) { await a.screenshot({ path: `${process.env.COOP_SHOTS}/coop-390.png` }); await b.setViewportSize({ width: 1280, height: 900 }); await b.screenshot({ path: `${process.env.COOP_SHOTS}/coop-1280.png` }); }
  // the leaderboard: both join the same group and post
  for (const [p, n] of [[a, 'Ann'], [b, 'Ben']]) {
    await p.goto(`${BASE}/#/play/leaderboard`);
    await p.getByPlaceholder('For example, STMARYS').fill('E2EGRP');
    await p.getByPlaceholder('Up to 20 characters').fill(n);
    await p.getByRole('button', { name: 'Open the board' }).click();
    await p.getByLabel('Post my daily results to this group').check();
  }
  for (const p of [a, b]) {
    await p.waitForSelector('.cp-table tbody tr:has-text("Ann")', { timeout: 20000 });
    await p.waitForSelector('.cp-table tbody tr:has-text("Ben")', { timeout: 20000 });
  }
  // a latecomer sees the week's posts from the relay's retained messages
  const c = await ctx(390);
  await c.goto(`${BASE}/#/play/leaderboard`);
  await c.getByPlaceholder('For example, STMARYS').fill('E2EGRP');
  await c.getByPlaceholder('Up to 20 characters').fill('Cy');
  await c.getByRole('button', { name: 'Open the board' }).click();
  await c.waitForSelector('.cp-table tbody tr:has-text("Ann")', { timeout: 15000 });
  if (process.env.COOP_SHOTS) { await c.screenshot({ path: `${process.env.COOP_SHOTS}/lb-390.png`, fullPage: true }); await b.screenshot({ path: `${process.env.COOP_SHOTS}/lb-1280.png`, fullPage: true }); }
  // leaving clears the nickname's retained post
  a.on('dialog', (d) => d.accept());
  await a.getByRole('button', { name: 'Leave group' }).click();
  await c.waitForFunction(() => !document.querySelector('.cp-table tbody')?.innerText.includes('Ann'), null, { timeout: 15000 });
  for (const p of [a, b, c]) { const w = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (w > 0) problems.push(`sideways scroll ${w}px`); }
} catch (e) { problems.push(`flow: ${e.message.split('\n')[0]}`); for (const p of browser.contexts().flatMap((x) => x.pages())) console.error('---', (await p.innerText('body').catch(() => '')).slice(0, 400).replace(/\n+/g, ' | ')); }
await browser.close();
if (server) try { process.kill(-server.pid); } catch { /* gone */ }
broker.close();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('coop e2e ok');
