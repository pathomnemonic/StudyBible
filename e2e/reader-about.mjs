// "About this chapter": default still opens by itself; the setting 'closed' keeps it closed; opening it does not move the summary line on screen.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch();
const open = async (pref) => {
  const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
  await ctx.addInitScript((pref) => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); if (pref) localStorage.setItem('studybible.settings.v1', JSON.stringify({ aboutChapter: pref })); }, pref);
  const p = await ctx.newPage(); p.setDefaultTimeout(20000);
  await p.goto(`${BASE}/#/read/webc/MAT/3`); await p.waitForTimeout(3500);
  return { p, ctx };
};
let { p, ctx } = await open(null);
if (!(await p.locator('details.chapter-companion').evaluate((d) => d.open))) fail('default: opens by itself when there is content');
// toggling must not move the summary on screen
await p.evaluate(() => window.scrollTo(0, 0));
const top1 = await p.locator('details.chapter-companion summary').evaluate((e) => e.getBoundingClientRect().top);
await p.locator('details.chapter-companion summary').click(); await p.waitForTimeout(300);
await p.locator('details.chapter-companion summary').click(); await p.waitForTimeout(300);
const top2 = await p.locator('details.chapter-companion summary').evaluate((e) => e.getBoundingClientRect().top);
if (Math.abs(top1 - top2) > 2) fail(`summary moved ${top1} -> ${top2}`);
await ctx.close();
({ p, ctx } = await open('closed'));
if (await p.locator('details.chapter-companion').evaluate((d) => d.open)) fail("'Stays closed' must not auto-open");
if (!(await p.locator('details.chapter-companion summary').isVisible())) fail('the closed box still shows its labelled summary');
await ctx.close();
await b.close(); console.log('reader-about ok');
