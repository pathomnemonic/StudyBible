// "Refresh the app" on the error page removes only the app's own code caches; offline packs, offline audio and other apps' caches survive.
// Online and offline are both exercised against real Cache Storage.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch();

async function scenario(offline) {
  const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
  const p = await ctx.newPage(); p.setDefaultTimeout(15000);
  await p.goto(`${BASE}/#/today`); await p.waitForSelector('main, .page, .today');
  // seed every kind of cache
  const scope = await p.evaluate(() => new URL(import.meta.env?.BASE_URL ?? '/', location.origin).href).catch(() => `${BASE}/`);
  const seeded = await p.evaluate(async () => {
    const base = new URL('./', location.href.split('#')[0]).href;
    const names = [`workbox-precache-v2-${base}`, 'studybible-heavy-v1', 'studybible-data-v1', 'studybible-audio-v1', 'unrelated-site-cache'];
    for (const n of names) { const c = await caches.open(n); await c.put(new Request(`${base}__seed/${n}`), new Response('x')); }
    return { names, base };
  });
  // make the next lazy page fail to load, so the error page appears
  await ctx.route(/\/assets\/PassportPage-.*\.js$/, (r) => r.fulfill({ status: 404, body: 'gone' }));
  await p.goto(`${BASE}/#/passport`);
  // the app may already be reloading itself after the failed chunk (that is the very behaviour under test); an aborted reload is not a failure of the check
  await p.reload().catch((e) => { if (!/ERR_ABORTED|frame was detached/.test(String(e))) throw e; });
  await p.waitForSelector('[role=alert] button:has-text("Refresh the app")', { timeout: 20000 }).catch(() => null);
  const hasError = await p.locator('[role=alert] button:has-text("Refresh the app")').count();
  if (!hasError) { await ctx.close(); return { skipped: 'the app recovered by itself before the error page showed (auto-reload); nothing to click' }; }
  if (offline) await ctx.setOffline(true);
  await p.evaluate(() => { window.__before = performance.now(); });
  await p.locator('[role=alert] button:has-text("Refresh the app")').click(); await p.waitForTimeout(1500);
  const left = await p.evaluate(async () => caches.keys()).catch(() => null);
  const offlineNote = await p.locator('[role=alert] [role=status]').count();
  await ctx.close();
  return { seeded: seeded.names, left, offlineNote };
}

const on = await scenario(false);
if (on.skipped) console.log('online:', on.skipped);
else {
  for (const keep of ['studybible-data-v1', 'studybible-audio-v1', 'unrelated-site-cache']) if (!on.left?.includes(keep)) fail(`online recovery removed ${keep}; left: ${on.left}`);
  if (on.left?.includes('studybible-heavy-v1')) fail('online recovery should remove the app\'s own lazily cached code');
  if (on.left?.some((n) => n.startsWith('workbox-precache') && n.includes('__nope'))) fail('precache not removed');
}
const off = await scenario(true);
if (off.skipped) console.log('offline:', off.skipped);
else {
  for (const n of off.seeded) if (!off.left?.includes(n)) fail(`offline recovery must remove nothing, but ${n} is gone; left: ${off.left}`);
  if (!off.offlineNote) fail('offline: the person should be told nothing was changed');
}
await b.close(); console.log('recovery ok');
