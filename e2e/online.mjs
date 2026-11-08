// Online quiz night end to end, no account and no Study Bible server: the host opens a room from /play/online,
// three players join by six-digit code on their own devices, they answer every question, and everyone sees the result.
// Covers Quiz night (with a player closing and reopening their page mid-question), Crown Quest race, Who Am I?, the QR code, and a host going away and coming back.
// Usage: npm run build && node e2e/online.mjs   (starts its own preview server and a local relay standing in for the public ones)
//        BASE=http://127.0.0.1:5208 node e2e/online.mjs   (use a running dev server instead)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { startBroker } from '../scripts/dev/mini-broker.mjs';

const PORT = 8798;
const broker = await startBroker(0);
const BASE = process.env.BASE || `http://127.0.0.1:${PORT}`;
const server = process.env.BASE ? null : spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 500)); }
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const problems = [];
const ctx = async (w = 420) => {
  const c = await browser.newContext({ viewport: { width: w, height: 900 } });
  await c.addInitScript((B) => { try { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:live:brokers', B); } catch { /* storage */ } }, `ws://127.0.0.1:${broker.port}/mqtt`);
  const p = await c.newPage(); p.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`)); return p;
};
const shot = async (p, name) => { if (process.env.SHOTS) await p.screenshot({ path: `${process.env.SHOTS}/${name}.png` }); };
const openRoom = async (game, w = 1100) => {
  const host = await ctx(w);
  await host.goto(`${BASE}/#/play/online`);
  if (game) await host.getByRole('radio', { name: game }).click();
  await host.getByRole('button', { name: 'Open the room' }).click();
  await host.waitForSelector('.live-code', { timeout: 15000 });
  const code = (await host.locator('.live-code').innerText()).trim();
  if (!/^\d{6}$/.test(code)) problems.push(`bad code ${code}`);
  if (!(await host.locator('svg.lv-qr').count())) problems.push('no QR code in the lobby');
  await host.getByRole('button', { name: 'Copy link' }).waitFor();
  return { host, code };
};
const joinAs = async (code, n, w = 420) => {
  const p = await ctx(w);
  await p.goto(`${BASE}/#/play/online`);
  await p.getByLabel('Game code').fill(code);
  await p.getByRole('button', { name: 'Join', exact: true }).click();
  await p.getByPlaceholder('A name everyone will know').fill(n);
  await p.getByRole('button', { name: 'Join', exact: true }).click();
  await p.waitForSelector('text=You’re in!', { timeout: 15000 });
  return p;
};
const N = 4;
try {
  // ---- Quiz night, with a phone that closes and reopens mid-question
  {
    const { host, code } = await openRoom(null);
    await shot(host, 'lobby-1100');
    const players = [];
    for (const n of ['Ann', 'Ben', 'Cy']) players.push(await joinAs(code, n));
    await host.waitForSelector('.live-players li:has-text("Cy")', { timeout: 10000 });
    await host.getByRole('button', { name: /^Start/ }).first().click();
    for (let q = 0; q < N; q++) {
      if (q === 1) {
        // Ann's phone loses the page while a question is open; she reopens it and is back with the same name and score
        const old = players[0], c = old.context();
        await old.waitForSelector('.live-opts button.live-opt');
        await old.close();
        const back = await c.newPage(); back.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
        await back.goto(`${BASE}/#/play/${code}`);
        await back.waitForSelector('.live-opts button.live-opt:not([disabled])', { timeout: 15000 });
        if (!(await back.locator('.live-who').innerText()).includes('Ann')) problems.push('rejoined under another name');
        players[0] = back;
      }
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
    if (!(await players[0].locator('.live-top').innerText()).includes('Ann')) problems.push('quiz: rejoined player lost the name');
  }

  // ---- Crown Quest race
  {
    const { host, code } = await openRoom('Crown Quest race');
    const a = await joinAs(code, 'Ann'), b = await joinAs(code, 'Ben');
    await host.waitForSelector('.live-players li:has-text("Ben")', { timeout: 10000 });
    await host.getByRole('button', { name: 'Start the Crown Quest race' }).click();
    await host.waitForSelector('.lv-crownboard li', { timeout: 10000 });
    const turn = async (p) => {
      await p.getByRole('button', { name: /Spin the wheel/ }).click({ timeout: 15000 });
      const pick = p.locator('.chips button.chip').first();
      const opt = p.locator('.live-opts button.live-opt').first();
      await Promise.race([pick.waitFor({ timeout: 8000 }).catch(() => undefined), opt.waitFor({ timeout: 8000 }).catch(() => undefined)]);
      if (await pick.count()) await pick.click();
      await p.locator('.live-opts button.live-opt:not([disabled])').first().click({ timeout: 8000 });
      await p.waitForSelector('.run-fb', { timeout: 8000 });
    };
    for (let i = 0; i < 3; i++) { await turn(a); await turn(b); }
    await shot(a, 'crowns-player-420');
    await shot(host, 'crowns-host-1100');
    const rows = await host.locator('.lv-crownboard li').count();
    if (rows !== 2) problems.push(`crown board shows ${rows} rows`);
    host.on('dialog', (d) => d.accept());
    await host.getByRole('button', { name: 'End now' }).click();
    await host.waitForSelector('text=Final results', { timeout: 10000 });
    await a.waitForSelector('text=crowns', { timeout: 10000 });
  }

  // ---- Who Am I?, then the host goes away and comes back
  {
    const { host, code } = await openRoom('Who Am I?');
    const a = await joinAs(code, 'Ann'), b = await joinAs(code, 'Ben');
    await host.waitForSelector('.live-players li:has-text("Ben")', { timeout: 10000 });
    await host.getByRole('button', { name: 'Start Who Am I?' }).click();
    await a.waitForSelector('.lv-clues li', { timeout: 10000 });
    if ((await a.locator('.lv-clues li').count()) !== 1) problems.push('who am i: more than one clue at the start');
    await shot(a, 'whoami-player-420');
    await a.waitForFunction(() => document.querySelectorAll('.lv-clues li').length >= 2, null, { timeout: 25000 });
    await a.getByLabel('Your answer').fill('zzzz');
    await a.getByRole('button', { name: 'Lock in' }).click();
    await a.waitForSelector('text=Not that one', { timeout: 10000 });
    await shot(host, 'whoami-host-1100');
    host.on('dialog', (d) => d.accept());
    await host.getByRole('button', { name: 'Show the answer now' }).click();
    await a.waitForSelector('text=Right answer', { timeout: 10000 });

    // the host's device goes to sleep (page closed); players say the host is away; reopening the room brings everyone back
    const hostCtx = host.context();
    await host.close();
    await a.waitForSelector('text=Host is away, waiting', { timeout: 60000 });
    const back = await hostCtx.newPage(); back.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    await back.goto(`${BASE}/#/host/${code}`);
    await back.waitForSelector('.live-top', { timeout: 15000 });
    await a.waitForSelector('.live-chip.lv-ok', { timeout: 20000 });
    if (!(await a.locator('.live-top').innerText()).includes('Ann')) problems.push('who am i: player lost the name after the host returned');
  }
} catch (e) { problems.push(`flow: ${e.message.split('\n')[0]}`); if (process.env.DEBUG_LIVE) for (const p of browser.contexts().flatMap((c) => c.pages())) console.error('---', (await p.innerText('body').catch(() => '')).slice(0, 500).replace(/\n+/g, ' | ')); }
await browser.close();
try { if (server) process.kill(-server.pid); } catch { /* gone */ } broker.close();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('online e2e ok');
