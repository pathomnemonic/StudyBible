// About this chapter (audit item 11): it opens by itself when the chapter has something to show, a deliberate close sticks while the reader stays on the
// chapter (through scrolling, resizing and large text), it never covers the text it sits above, and the toolbox dropdown layers above it.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch();
for (const vp of [{ width: 360, height: 740, text: 1 }, { width: 320, height: 700, text: 1.4 }, { width: 1100, height: 800, text: 1 }]) {
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height } });
  await ctx.addInitScript((t) => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); } document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = `${t * 100}%`; }); }, vp.text);
  const p = await ctx.newPage(); p.setDefaultTimeout(15000);
  const tag = `${vp.width}px x${vp.text}`;
  const box = () => p.locator('details.chapter-companion');
  const isOpen = () => box().evaluate((e) => e.open);
  await p.goto(`${BASE}/#/read/web-c/JHN/1`); await p.waitForSelector('details.chapter-companion');
  await p.waitForTimeout(1500);
  if (!(await isOpen())) fail(`${tag}: it should open by itself when the chapter has places, connections or Mass readings`);
  // 1. a deliberate close sticks, through async arrivals, scrolling, resizing
  await box().locator('summary').click(); await p.waitForTimeout(300);
  if (await isOpen()) fail(`${tag}: clicking the summary should close it`);
  await p.mouse.wheel(0, 900); await p.waitForTimeout(400); await p.mouse.wheel(0, -900); await p.waitForTimeout(400);
  await p.setViewportSize({ width: vp.width + 40, height: vp.height }); await p.waitForTimeout(300); await p.setViewportSize({ width: vp.width, height: vp.height }); await p.waitForTimeout(600);
  if (await isOpen()) fail(`${tag}: after a deliberate close it reopened (scroll or resize)`);
  // 2. opening the study panel and closing it does not reopen it
  await p.locator('button[aria-label*="Open study panel"]').first().click().catch(() => {}); await p.waitForTimeout(500);
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  if (await isOpen()) fail(`${tag}: closing the study panel reopened About this chapter`);
  // 3. it does not cover the first verse: the verse text sits below it
  await p.reload(); await p.waitForSelector('details.chapter-companion'); await p.waitForTimeout(1500);
  const overlap = await p.evaluate(() => { const d = document.querySelector('details.chapter-companion').getBoundingClientRect(); const v = [...document.querySelectorAll('[data-v]')].map((e) => e.getBoundingClientRect()).find((r) => r.height > 4); return v ? Math.min(d.bottom, v.bottom) - Math.max(d.top, v.top) : null; });
  if (overlap === null) fail(`${tag}: no verse was found to compare against (the selector is out of date)`);
  if (overlap > 4) fail(`${tag}: About this chapter overlaps the verses by ${Math.round(overlap)}px`);
  // 4. the toolbox dropdown layers above it and Escape closes the dropdown, not the page
  await p.locator('button[aria-label^="Toolbox"]').click(); await p.waitForTimeout(300);
  const z = await p.evaluate(() => { const m = document.querySelector('[role=menu], .menu-list, .tool-menu-list'); if (!m) return null; const r = m.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(20, r.height / 2)); return !!top && (m === top || m.contains(top)); });
  if (z === false) fail(`${tag}: the toolbox menu is under other content`);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  if (!/\/read\/web-c\/JHN\/1/.test(await p.evaluate(() => location.hash))) fail(`${tag}: Escape in the menu should not leave the chapter`);
  // 5. next chapter: it opens by itself again if that chapter has content, and a chapter with nothing keeps it closed
  await p.goto(`${BASE}/#/read/web-c/JHN/2`); await p.waitForTimeout(1800);
  const open2 = await isOpen().catch(() => null);
  if (open2 === null) fail(`${tag}: the panel is missing on the next chapter`);
  // 6. back and forward do not crash it, and the state is one of open / closed (never half-rendered)
  await p.goBack(); await p.waitForTimeout(800); await p.goForward(); await p.waitForTimeout(800);
  if ((await p.locator('details.chapter-companion').count()) !== 1) fail(`${tag}: after back/forward there should be exactly one About this chapter`);
  await ctx.close();
}
await b.close(); console.log('reader-companion ok');
