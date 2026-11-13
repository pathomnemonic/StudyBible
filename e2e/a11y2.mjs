// Wider accessibility checks than e2e/a11y.mjs: every axe impact level (moderate and minor too), seven widths in portrait and landscape,
// 200% and 400% text/zoom, reduced motion, and keyboard/focus behaviour of the reader and its dialogs.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const ROUTES = ['/', '/read/webc/JHN/3', '/read/webc/PSA/51', '/learn', '/pray/prayers', '/study/glossary', '/study/curriculum/YA/YA-9-2', '/settings', '/library', '/listen', '/play', '/help', '/study/videos'];
const WIDTHS = [320, 360, 390, 420, 768, 1024, 1280];
// target-size: axe reports tiny inline targets (footnote markers and verse numbers inside a sentence). WCAG 2.2 exempts inline targets, so it is listed, not failed.
const SOFT = new Set((process.env.A11Y_SOFT ?? 'target-size').split(',').filter(Boolean));
const problems = [], notes = new Map();
const browser = await chromium.launch();
const mk = async (o) => { const c = await browser.newContext(o); await c.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); }); return c; };
const axe = async (page, label) => {
  await page.evaluate(axeSource);
  const res = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] })).violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, ex: v.nodes[0].target.join(' ').slice(0, 90) })));
  for (const v of res) { const k = `${v.impact} ${v.id}`; (notes.get(k) ?? notes.set(k, { help: v.help, where: [] }).get(k)).where.push(`${label} (${v.n}) ${v.ex}`); }
};
// 1. all impact levels, every width, portrait
for (const w of WIDTHS) {
  const ctx = await mk({ viewport: { width: w, height: w < 700 ? 800 : 900 } });
  const page = await ctx.newPage(); page.setDefaultTimeout(12000);
  for (const r of ROUTES) {
    await page.goto(`${BASE}/#${r}`); await page.waitForSelector('.page, .today, main').catch(() => {}); await page.waitForTimeout(1500);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (over > 1) problems.push(`${w}px ${r}: sideways scroll ${over}px`);
    if (w === 320 || w === 768 || w === 1280) await axe(page, `${w}px ${r}`);
  }
  await ctx.close();
}
// 2. landscape phone and tablet
for (const vp of [{ width: 844, height: 390 }, { width: 667, height: 375 }, { width: 1024, height: 768 }]) {
  const ctx = await mk({ viewport: vp }); const page = await ctx.newPage(); page.setDefaultTimeout(12000);
  for (const r of ['/read/webc/JHN/3', '/', '/learn']) {
    await page.goto(`${BASE}/#${r}`); await page.waitForSelector('.page, .today, main').catch(() => {}); await page.waitForTimeout(1200);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (over > 1) problems.push(`landscape ${vp.width}x${vp.height} ${r}: sideways scroll ${over}px`);
    // the reader's bar and the bottom tabs must still be reachable without covering all the text
    const covered = await page.evaluate(() => { const t = document.querySelector('nav.tabs'); return t ? t.getBoundingClientRect().height / innerHeight : 0; });
    if (vp.width < 900 && covered > 0.3) problems.push(`landscape ${vp.width}x${vp.height} ${r}: the tab bar takes ${(covered * 100) | 0}% of the height`);
  }
  await ctx.close();
}
// 3. text scale: 200% and 400% (what browser zoom or a large system font does)
for (const z of [2, 4]) {
  const ctx = await mk({ viewport: { width: Math.round(1280 / z), height: Math.round(800 / z) }, deviceScaleFactor: z });
  const page = await ctx.newPage(); page.setDefaultTimeout(12000);
  for (const r of ['/read/webc/JHN/3', '/', '/learn', '/settings']) {
    await page.goto(`${BASE}/#${r}`); await page.waitForSelector('.page, .today, main').catch(() => {}); await page.waitForTimeout(1200);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (over > 1) problems.push(`${z * 100}% zoom ${r}: sideways scroll ${over}px`);
  }
  await ctx.close();
}
// 4. reduced motion: nothing keeps animating
{
  const ctx = await mk({ viewport: { width: 390, height: 800 }, reducedMotion: 'reduce' }); const page = await ctx.newPage();
  for (const r of ['/', '/read/webc/JHN/3', '/learn']) {
    await page.goto(`${BASE}/#${r}`); await page.waitForTimeout(1500);
    const moving = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).map((a) => (a.effect?.target?.className || a.effect?.target?.tagName || '').toString().slice(0, 40)));
    if (moving.length) problems.push(`reduced motion ${r}: still looping: ${[...new Set(moving)].slice(0, 4).join(', ')}`);
  }
  await ctx.close();
}
// 5. keyboard and focus in the reader
{
  const ctx = await mk({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage(); page.setDefaultTimeout(8000);
  await page.goto(`${BASE}/#/read/webc/JHN/3`); await page.waitForSelector('.v'); await page.waitForTimeout(1200);
  const seen = new Set();
  for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); const d = await page.evaluate(() => { const a = document.activeElement; const cs = a ? getComputedStyle(a) : null; return a ? `${a.tagName}|${a.getAttribute('aria-label') || a.textContent?.trim().slice(0, 20)}|${cs.outlineStyle !== 'none' || cs.boxShadow !== 'none'}` : ''; }); seen.add(d); if (d.endsWith('|false')) problems.push(`reader: focus is not visible on ${d.split('|').slice(0, 2).join(' ')}`); }
  if (seen.size < 8) problems.push(`reader: Tab reached only ${seen.size} distinct controls in 14 presses (a trap?)`);
  // a verse opens its study panel from the keyboard, and Escape closes it and hands focus back
  // the panel is docked beside the text on a wide screen, so closing it is checked at phone width, where it overlays
  await page.setViewportSize({ width: 390, height: 800 }); await page.waitForTimeout(500);
  await page.locator('.v[data-v="16"]').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(700);
  if ((await page.locator('.v[aria-pressed="true"]').count()) < 1) problems.push('reader: Enter on a verse should select it (aria-pressed)');
  await page.keyboard.press('s'); await page.waitForTimeout(600); // the shortcut for the study panel
  if (!(await page.locator('aside.panel').count())) problems.push('reader: the s shortcut should open the study panel for the selected verse');
  await page.keyboard.press('Escape'); await page.waitForTimeout(400); // the first Escape clears the selection, the second closes the panel
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  if (await page.locator('aside.panel').count()) problems.push('reader: Escape (twice) should close the study panel');
  const back = await page.evaluate(() => document.activeElement?.className?.toString() ?? '');
  if (!/\bv\b|vfirst/.test(back) && back !== '') problems.push(`reader: after Escape focus is on "${back.slice(0, 30)}", not the verse`);
  await ctx.close();
}
await browser.close();
const hard = [...notes].filter(([k]) => !SOFT.has(k.split(' ')[1]));
for (const [k, v] of hard) problems.push(`axe ${k}: ${v.help} — ${[...new Set(v.where)].slice(0, 3).join(' | ')}`);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('a11y2 ok');
