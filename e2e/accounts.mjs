// Accounts end to end (they are OFF in normal builds). Run against a build made with VITE_ACCOUNTS=1 and served by the real server:
//   VITE_ACCOUNTS=1 npm run build && PORT=8799 COOKIE_SECURE=false REGISTRATION=open DB_PATH=/tmp/acct-e2e.sqlite npm start &
//   BASE=http://127.0.0.1:8799 node e2e/accounts.mjs
import { chromium } from 'playwright';
import { createHmac } from 'node:crypto';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8799';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const b32 = (s) => { let bits = 0, v = 0; const out = []; for (const c of s.toUpperCase()) { v = (v << 5) | B32.indexOf(c); bits += 5; if (bits >= 8) { out.push((v >>> (bits - 8)) & 255); bits -= 8; } } return Buffer.from(out); };
const totp = (secret, offset = 0) => { const step = Math.floor(Date.now() / 30000) + offset; const m = Buffer.alloc(8); m.writeBigUInt64BE(BigInt(step)); const h = createHmac('sha1', b32(secret)).update(m).digest(); const o = h[h.length - 1] & 15; return String((((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, '0'); };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1100, height: 1400 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
const p = await ctx.newPage(); p.setDefaultTimeout(15000);
if (process.env.DEBUG_NET) p.on('response', async (r) => { if (r.url().includes('/api/auth')) console.log(r.status(), r.url().replace(/.*\/api/, '/api'), (await r.text()).slice(0, 100)); });
const email = `e2e${Date.now()}@example.com`, PW = 'a long enough passphrase';

await p.goto(`${BASE}/#/account`); await p.waitForSelector('form.auth');
await p.locator('[role=tab]', { hasText: 'Create account' }).click();
await p.locator('input[type=email]').fill(email); await p.locator('input[type=password]').fill(PW);
await p.locator('button', { hasText: /^Create account$/ }).last().click();
await p.waitForSelector('[aria-label="Two-factor sign-in"]');

// turn on two-factor sign-in with a real code
await p.locator('[aria-label="Two-factor sign-in"] input[type=password]').fill(PW);
await p.locator('button', { hasText: /^Set up$/ }).click();
const secret = (await p.locator('[aria-label="Two-factor sign-in"] code').innerText()).trim();
await p.locator('[aria-label="Two-factor sign-in"] input[autocomplete="one-time-code"]').fill(totp(secret));
await p.locator('button', { hasText: /^Turn on$/ }).click();
await p.waitForSelector('text=Save these recovery codes now');
const codes = (await p.locator('[aria-label="Two-factor sign-in"] pre').innerText()).trim().split('\n');
if (codes.length !== 10) fail('ten recovery codes should be shown, got ' + codes.length);
await p.locator('button', { hasText: 'I have saved them' }).click();

// the security log names what happened, without secrets
const log = await p.locator('[aria-label="Security log"]').innerText();
if (!/Two-factor sign-in turned on/.test(log) || log.includes(secret) || codes.some((c) => log.includes(c))) fail('the log should name the event and hold no secrets');

// sign out, then sign in: the form must ask for the code, and a wrong one is refused
await p.locator('button', { hasText: /^Sign out/ }).first().click().catch(() => {});
await p.waitForTimeout(500);
if (await p.locator('form.auth').count() === 0) { p.once('dialog', (d) => d.accept()); await p.locator('button', { hasText: /Sign out/ }).first().click(); await p.waitForSelector('form.auth'); }
await p.locator('[role=tab]', { hasText: 'Sign in' }).first().click();
await p.locator('input[type=email]').fill(email); await p.locator('input[type=password]').fill(PW);
await p.locator('form.auth button.primary').click();
await p.waitForSelector('input[autocomplete="one-time-code"]').catch(async (e) => { console.error((await p.locator('.page').innerText()).slice(0, 600)); throw e; });
await p.locator('input[autocomplete="one-time-code"]').fill('000000'); await p.locator('form.auth button.primary').click();
await p.waitForSelector('[role=alert]');
await p.locator('input[autocomplete="one-time-code"]').fill(codes[0]); await p.locator('form.auth button.primary').click();
await p.waitForSelector('[aria-label="Two-factor sign-in"]');
console.log('accounts ok');
await b.close();
