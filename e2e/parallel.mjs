// The side-by-side view (?p=) shows both translations and a verse can still be selected.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
const p = await ctx.newPage(); p.setDefaultTimeout(10000);
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/read/webc/JHN/3?p=dra`); await p.waitForTimeout(2500);
const t = await p.locator('main, .page').first().innerText();
if (!/God so loved/i.test(t)) { console.error('FAIL the first translation is missing'); process.exit(1); }
if (!/loved the world|so loved/i.test(t.replace(/God so loved/i, ''))) { console.error('FAIL the second translation is missing'); process.exit(1); }
if (errs.length) { console.error('FAIL', errs[0]); process.exit(1); }
await b.close(); console.log('parallel ok');
