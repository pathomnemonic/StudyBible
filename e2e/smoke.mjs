// End-to-end smoke test. Usage: npm run build && npx vite preview --port 4173 &  then  npm run e2e
// Set BASE to test another address. Chromium comes from `npx playwright install chromium` (or PLAYWRIGHT_CHROMIUM_PATH).
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:4173';
const ROUTES = ['/', '/read', '/study', '/room', '/pray', '/pray/office', '/pray/devotions', '/pray/devotions/rosary', '/pray/prayers', '/pray/examination', '/pray/novenas', '/pray/sunday', '/pray/build', '/pray/mass', '/study/course', '/study/dossier', '/listen', '/settings', '/library', '/study/apologetics', '/study/videos', '/account', '/study/passage/JHN.6.51', '/study/story', '/study/story/peter', '/pray/year', '/pray/examen', '/pray/morning', '/pray/divine-liturgy', '/study/young-adults', '/room'];

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('sb:tour', '1'); } catch { /* ignore */ } });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) problems.push(`console: ${m.text()}`); });

for (const r of ROUTES) {
  await page.goto(`${BASE}/#${r}`);
  await page.waitForSelector('.page, .today, main', { timeout: 15000 }).catch(() => problems.push(`no content on ${r}`));
  await page.waitForTimeout(400);
  if (await page.locator('text=Something went wrong').count()) problems.push(`error boundary on ${r}`);
}

// reflow: at 320 px wide (what 400% zoom gives on a phone) nothing may force sideways scrolling of the page
await page.setViewportSize({ width: 320, height: 640 });
for (const r of ROUTES) {
  await page.goto(`${BASE}/#${r}`);
  await page.waitForSelector('.page, .today, main', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1800);
  const over = await page.evaluate(() => { const e = document.scrollingElement; return e ? e.scrollWidth - e.clientWidth : 0; });
  if (over > 2) problems.push(`sideways scroll of ${over}px at 320px wide on ${r}`);
}
await page.setViewportSize({ width: 420, height: 900 });

// offline: after the service worker has installed, a reload must still render the app
await page.goto(`${BASE}/#/pray/office`);
await page.evaluate(async () => { await navigator.serviceWorker.ready; });
await page.waitForTimeout(1500);
await page.reload();
await page.waitForSelector('.office-sec');
await ctx.setOffline(true);
await page.reload();
const ok = await page.waitForSelector('.office-sec', { timeout: 15000 }).then(() => true).catch(() => false);
if (!ok) problems.push('the Office did not load offline');
await ctx.setOffline(false);

await browser.close();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`e2e ok: ${ROUTES.length} routes and an offline reload`);
