// What the app says is saved offline is what is really saved: the translation line reads the cache, and a downloaded pack really works with no connection.
import { chromium } from 'playwright';
import { startServer } from './_server.mjs';
const srv = await startServer();
const BASE = srv.base;
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1000, height: 1400 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
const p = await ctx.newPage(); p.setDefaultTimeout(15000);
const fail = (m) => { console.error('FAIL', m); srv.stop(); process.exit(1); };
// 1. before anything is opened the translation says it is not saved; after reading a chapter it says how many books are
await p.goto(`${BASE}/#/read/webc/JHN/3`); await p.waitForSelector('.v');
await p.evaluate(async () => { await navigator.serviceWorker.ready; }); await p.waitForTimeout(2000);
await p.reload(); await p.waitForSelector('.v'); await p.waitForTimeout(1500); // the service worker controls the page from the second load
await p.locator('button[aria-label^="Books and translation"]').click(); await p.waitForTimeout(800);
const line = await p.locator('.offline-line').innerText();
if (!/of 73 books|all 73 books|not saved/.test(line)) fail('the picker should say what is saved offline, got: ' + line);
if (/all 73 books/.test(line)) fail('opening one chapter must not claim the whole translation is saved: ' + line);
await p.keyboard.press('Escape');
// 2. download the small Church documents pack, and see it listed as saved
await p.goto(`${BASE}/#/downloads`); await p.waitForTimeout(2000);
const row = p.locator('li', { hasText: 'Church documents on Scripture' }).first();
await row.locator('button', { hasText: /^Download$/ }).click();
await row.locator('button', { hasText: /Remove/ }).waitFor({ timeout: 60000 });
// 3. with no connection, a file from the pack is served from the device
srv.stop(); await ctx.setOffline(true); await new Promise((r) => setTimeout(r, 800)); // nothing answers any more
const ok = await p.evaluate(async () => { try { const r = await fetch(new URL('data/magisterium/1CO.json', document.baseURI).href); return r.ok; } catch { return false; } });
if (!ok) fail('a downloaded pack file should load offline');
const missing = await p.evaluate(async () => { try { const r = await fetch(new URL('data/commentary/NOPE-NOT-DOWNLOADED.json', document.baseURI).href); return r.ok; } catch { return false; } });
if (missing) fail('a file that was never saved must not appear to load offline');
await ctx.setOffline(false);
await b.close(); srv.stop(); console.log('offlinepack ok');
