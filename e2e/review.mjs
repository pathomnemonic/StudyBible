// Collection templates, the question inbox (look it up, mark answered), the weekly review, Sunday buttons on the readings page and the offline readiness card.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 1300 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); sessionStorage.setItem('seeded', '1'); } });
const p = await ctx.newPage(); p.setDefaultTimeout(12000);
const fail = (m) => { console.error('FAIL', m); process.exit(1); };

// a question note, written directly in the database the way the editor does
await p.goto(`${BASE}/#/library`); await p.waitForTimeout(900);
await p.evaluate(() => new Promise((res, rej) => { const r = indexedDB.open('studybible'); r.onsuccess = () => { const tx = r.result.transaction('notes', 'readwrite'); tx.objectStore('notes').add({ body: 'Why do Catholics confess to a priest?', kind: 'question', targets: [], tags: [], chapterKeys: [], createdAt: Date.now(), updatedAt: Date.now() }); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }; r.onerror = () => rej(r.error); }));
await p.reload(); await p.waitForTimeout(900);

// 1. template
await p.locator('[role=tab]', { hasText: /^Collections$/ }).first().click(); await p.waitForTimeout(400);
await p.locator('select[aria-label="Start from a template"]').selectOption({ label: 'Marian passages' }); await p.waitForTimeout(700);
await p.locator('a', { hasText: 'Marian passages' }).first().click(); await p.waitForSelector('.cp-list');
const items = await p.locator('.cp-item').count();
if (items !== 4) fail('the Marian template should hold 4 passages, got ' + items);
// tick one done
await p.locator('.cp-item input[type=checkbox]').first().click(); await p.waitForTimeout(900);
if (!/1 done/i.test(await p.locator('.collection-page').innerText())) fail('the done count should read "1 done"');

// 2. question inbox and weekly review
await p.goto(`${BASE}/#/library`); await p.waitForTimeout(700);
await p.locator('[role=tab]', { hasText: /^Review$/ }).first().click(); await p.waitForTimeout(500);
const rv = await p.locator('.page').innerText();
if (!/still open \(1\)/i.test(rv) || !/confess to a priest/.test(rv)) fail('the question should be listed as open: ' + rv.slice(0, 900));
if (!/1\s+question asked|\b1\b\s+question/.test(rv)) fail('the weekly review should count one question asked');
const href = await p.locator('a', { hasText: 'Look it up' }).first().getAttribute('href');
if (!/study\/ask\?q=Why/.test(href ?? '')) fail('Look it up should pre-fill the Catechism search: ' + href);
await p.locator('button', { hasText: 'Mark answered' }).first().click(); await p.waitForTimeout(500);
if (!/answered \(1\)/i.test(await p.locator('.page').innerText())) fail('the question should move to Answered');

// 3. Sunday buttons: from a Wednesday, Next Sunday lands on a Sunday after it
await p.goto(`${BASE}/#/pray/readings/2026-11-11`); await p.waitForTimeout(900);
await p.locator('button', { hasText: 'Next Sunday' }).click(); await p.waitForTimeout(500);
if (!/2026-11-15/.test(await p.evaluate(() => location.hash))) fail('Next Sunday from 2026-11-11 should be 2026-11-15, got ' + await p.evaluate(() => location.hash));
await p.locator('button', { hasText: 'Previous Sunday' }).click(); await p.waitForTimeout(500);
if (!/2026-11-08/.test(await p.evaluate(() => location.hash))) fail('Previous Sunday from a Sunday should be the week before');

// 4. offline readiness card exists and answers yes or not yet
await p.goto(`${BASE}/#/downloads`); await p.waitForTimeout(1200);
if (!/ready for a flight\? (yes|not yet)/i.test(await p.locator('.page').innerText())) fail('the offline readiness card should be on the Downloads page');
// 5. family sheet table cards
await p.goto(`${BASE}/#/family-sheet?d=2026-11-15`); await p.waitForTimeout(1500);
await p.locator('button', { hasText: 'Table cards' }).click(); await p.waitForTimeout(400);
if (!/Card 1 of \d+/.test(await p.locator('.fs-cards').innerText())) fail('the table cards should start at card 1');
await p.locator('button', { hasText: 'Next question' }).click(); await p.waitForTimeout(300);
if (!/Card 2 of/.test(await p.locator('.fs-cards').innerText())) fail('Next question should move to card 2');
await b.close(); console.log('review ok');
