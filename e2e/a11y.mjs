// Automated accessibility check with axe-core on the main screens, in the default theme at phone width.
// Usage: npx vite preview --port 4173 &  then  npm run e2e:a11y     (fails on serious or critical findings)
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const BASE = process.env.BASE ?? 'http://localhost:4173';
const ROUTES = ['/', '/read', '/read/webc/JHN/3', '/study', '/room', '/pray', '/pray/office', '/pray/devotions', '/pray/prayers', '/pray/examination', '/pray/examen', '/pray/year', '/pray/morning', '/study/young-adults', '/study/curriculum', '/study/curriculum/teachers', '/study/curriculum/K/K-2-3', '/study/curriculum/9/9-5-2', '/pray/divine-liturgy', '/study/story/mary', '/pray/novenas/holy-spirit', '/study/course/exodus', '/library', '/settings', '/listen', '/account'];
const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('sb:tour', '1'); } catch { /* ignore */ } });
const page = await ctx.newPage();
const bad = [];
const THEME_ROUTES = ['/', '/read/webc/JHN/3', '/pray/prayers', '/settings'];
const THEMES = (process.env.A11Y_THEMES ?? 'twilight,ocean,dark,midnight,amoled,forest,mocha,nord,dawn,mist,light,paper,rose,zen').split(',');
for (const r of ROUTES) {
  await page.goto(`${BASE}/#${r}`);
  await page.waitForSelector('.page, .today, main', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2200); // page transitions settle
  await page.evaluate(axeSource);
  const res = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] });
    return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) , count: v.nodes.length }));
  });
  for (const v of res) bad.push(`${r}: ${v.impact} ${v.id} (${v.count}) ${v.help} e.g. ${v.nodes.join(' | ')}`);
}
// every theme on a few screens: this is what catches low-contrast colours
for (const theme of THEMES) {
  for (const r of THEME_ROUTES) {
    await page.goto(`${BASE}/#${r}`);
    await page.evaluate((t) => { const k = 'studybible.settings.v1'; const s = JSON.parse(localStorage.getItem(k) ?? '{}'); s.theme = t; localStorage.setItem(k, JSON.stringify(s)); }, theme);
    await page.reload();
    await page.waitForSelector('.page, .today, main', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2200);
    await page.evaluate(axeSource);
    const res = await page.evaluate(async () => {
      // eslint-disable-next-line no-undef
      const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2aa'] }, resultTypes: ['violations'] });
      return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => ({ id: v.id, help: v.help, count: v.nodes.length, nodes: v.nodes.slice(0, 2).map((n) => n.target.join(' ')) }));
    });
    for (const v of res) bad.push(`theme ${theme} ${r}: ${v.id} (${v.count}) ${v.help} e.g. ${v.nodes.join(' | ')}`);
  }
}
await browser.close();
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log(`a11y ok on ${ROUTES.length} screens`);
