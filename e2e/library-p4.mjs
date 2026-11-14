// Part IV library: plan builder preview then save, pin a collection and see it listed, a deleted note in a collection offers Restore,
// and the data check repairs a lower-case passage address only when the button is pressed (with Undo).
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 1300 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); sessionStorage.setItem('seeded', '1'); } });
const p = await ctx.newPage(); p.setDefaultTimeout(12000);
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const idb = (fn, arg) => p.evaluate(([src, a]) => new Promise((res, rej) => { const r = indexedDB.open('studybible'); r.onerror = () => rej(r.error); r.onsuccess = () => { const db = r.result; Promise.resolve(eval(src)(db, a)).then(res, rej); }; }), [fn.toString(), arg]);

// 1. plan builder: preview shows the days before anything is saved
await p.goto(`${BASE}/#/pray/plans`); await p.waitForTimeout(800);
await p.locator('button.chip', { hasText: '+ Build by pace' }).click();
await p.locator('select').first().selectOption('JHN');
await p.locator('input[aria-label="How many each day"]').fill('3');
await p.waitForTimeout(300);
const days = await p.locator('[data-preview-day]').count();
if (days !== 7) fail('expected 7 preview days for John at 3 a day, got ' + days);
const first = await p.locator('[data-preview-day]').first().innerText();
if (!/John 1.3/.test(first)) fail('day 1 should read John 1-3: ' + first);
const before = await idb((db) => new Promise((r) => { const q = db.transaction('userPlans').objectStore('userPlans').count(); q.onsuccess = () => r(q.result); }));
if (before !== 0) fail('nothing should be saved before pressing Save');
await p.locator('button:has-text("Save this plan")').click(); await p.waitForTimeout(900);
if (!/#\/pray\/plans\/user/.test(p.url())) fail('should open the saved plan: ' + p.url());
if ((await p.locator('li[id^="d"]').count()) !== 7) fail('saved plan should list 7 days');

// 2. a collection whose note was deleted (it is in Recently deleted): pin it, see it under Pinned, then Restore from the collection page
await p.goto(`${BASE}/#/library`); await p.waitForTimeout(800);
await idb((db) => new Promise((res) => { const t = db.transaction(['trash', 'collections'], 'readwrite'); t.objectStore('trash').add({ tbl: 'notes', deletedAt: Date.now(), data: { kind: 'note', title: 'Gone soon', body: 'x', targets: [], tags: [], chapterKeys: [], createdAt: 1, updatedAt: 1, uid: 'e2e-n' } }); t.objectStore('collections').add({ name: 'E2E coll', items: [{ type: 'note', uid: 'e2e-n' }, { type: 'passage', ref: 'jhn.3.16' }], createdAt: 1, updatedAt: 1, uid: 'e2e-c' }); t.oncomplete = res; }));
await p.reload(); await p.waitForTimeout(900);
await p.locator('[role=tab]', { hasText: /^Collections$/ }).click(); await p.waitForTimeout(400);
await p.locator('.card', { hasText: 'E2E coll' }).locator('button[aria-pressed]').first().click(); await p.waitForTimeout(300);
if (!(await p.locator('[data-pinned] a', { hasText: 'E2E coll' }).count())) fail('pinned collection should be listed under Pinned');
await p.locator('.card h3 a', { hasText: 'E2E coll' }).click(); await p.waitForSelector('.cp-list');
await p.waitForTimeout(700);
if (!(await p.locator('[data-missing]', { hasText: 'No longer here' }).count())) fail('a deleted note should say No longer here');
await p.locator('button:has-text("Restore from Recently deleted")').click(); await p.waitForTimeout(900);
if (await p.locator('[data-missing]', { hasText: 'still in Recently deleted' }).count()) fail('restored note should no longer be missing');
if (!(await p.locator('.cp-item strong', { hasText: 'Gone soon' }).count())) fail('restored note should show its title');

// 3. the data check: a lower-case passage address is repaired only when the button is pressed, and Undo puts it back
await p.goto(`${BASE}/#/library?tab=export`); await p.waitForTimeout(900);
await p.locator('button:has-text("Run the check")').click(); await p.waitForTimeout(500);
const dataFix = p.locator('[aria-label="Fixes ready"] button:has-text("Fix this")');
if (!(await dataFix.count())) fail('a repair should be offered for jhn.3.16');
const still = await idb((db) => new Promise((r) => { const q = db.transaction('collections').objectStore('collections').getAll(); q.onsuccess = () => r(JSON.stringify(q.result.map((c) => c.items))); }));
if (!/jhn\.3\.16/.test(still)) fail('nothing may change before the button is pressed');
await dataFix.first().click(); await p.waitForTimeout(700);
const fixed = await idb((db) => new Promise((r) => { const q = db.transaction('collections').objectStore('collections').getAll(); q.onsuccess = () => r(JSON.stringify(q.result.map((c) => c.items))); }));
if (!/JHN\.3\.16/.test(fixed) || /jhn\.3\.16/.test(fixed)) fail('the address should be repaired: ' + fixed);
await p.locator('button:has-text("Undo")').click(); await p.waitForTimeout(600);
const undone = await idb((db) => new Promise((r) => { const q = db.transaction('collections').objectStore('collections').getAll(); q.onsuccess = () => r(JSON.stringify(q.result.map((c) => c.items))); }));
if (!/jhn\.3\.16/.test(undone)) fail('Undo should put the old address back');
console.log('library-p4 OK');
await b.close();
