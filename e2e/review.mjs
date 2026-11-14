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
// 6. book fingerprint
await p.goto(`${BASE}/#/study/fingerprint/ROM`); await p.waitForSelector('.fp-list li', { timeout: 30000 });
const fpText = (await p.locator('.page').innerText()).toLowerCase();
if (!/faith/.test(fpText) || !/what sets romans apart/.test(fpText)) fail('the Romans fingerprint should name faith and show the distinctive section');
// 7. ask the sources: Catechism and Scripture shown apart, each with its label
await p.goto(`${BASE}/#/study/ask-all?q=${encodeURIComponent('Why do Catholics baptize infants?')}`);
await p.waitForSelector('[aria-label="The Church’s teaching"]', { timeout: 30000 });
await p.waitForSelector('[aria-label="Scripture"] blockquote, [aria-label="Scripture"] .muted', { timeout: 60000 });
const ask = await p.locator('.ask-all').innerText();
if (!/Catechism of the Catholic Church/.test(ask)) fail('the Church’s teaching card should name the Catechism');
if (!/Bible text/.test(ask) || !/Writings in the library/.test(ask)) fail('every kind of source should be labelled');
await p.locator('label', { hasText: 'Bible text' }).locator('input').uncheck(); await p.locator('label', { hasText: 'Fathers and saints' }).locator('input').uncheck(); await p.waitForTimeout(500);
if (await p.locator('[aria-label="Scripture"]').count() || await p.locator('[aria-label="The Fathers and saints"]').count()) fail('turned-off sources should not be shown');
if (!/src=ccc/.test(await p.evaluate(() => location.hash))) fail('the source choice should be in the address');
await p.locator('button', { hasText: 'Save this question' }).click(); await p.waitForTimeout(500);
if (!/Saved to your questions/.test(await p.locator('.ask-all').innerText())) fail('the question should be saved');
// 8. map of connections
await p.goto(`${BASE}/#/study/map?n=${encodeURIComponent('topic:eucharist')}&to=${encodeURIComponent('argument:real-presence')}`);
await p.waitForSelector('.concept-map .cm-group', { timeout: 30000 });
const map = await p.locator('.concept-map').innerText();
if (!/Bible chapters/.test(map)) fail('the Eucharist topic should list Bible chapters among its connections');
if (!/The Real Presence/.test(map)) fail('the chain from the Eucharist to the Real Presence argument should be shown');
await p.locator('.cm-group[open] button.linklike').first().click({ force: true }); await p.waitForTimeout(500);
if (!/n=/.test(await p.evaluate(() => location.hash))) fail('following a link should move the map to that thing');
// 9. pace a grade over the year
await p.goto(`${BASE}/#/study/curriculum/5/pacing`);
await p.waitForSelector('.cur-pacing [role=status]', { timeout: 30000 });
const pace = await p.locator('.cur-pacing').innerText();
if (!/\d+\s+lessons from/i.test(pace)) fail('the pacing page should say how many lessons it spreads and when they end: ' + pace.slice(0, 200));
if (!/Letter to families/.test(pace)) fail('each unit should offer a letter to families');
const rows0 = await p.locator('.cur-table tbody tr').count();
await p.locator('label.chip', { hasText: 'Thu' }).locator('input').check();
await p.waitForTimeout(300);
const rows1 = await p.locator('.cur-table tbody tr').count();
if (rows1 !== rows0) fail('the number of lessons should not change when a teaching day is added');
// 10. my notes on a lesson
await p.goto(`${BASE}/#/study/curriculum/5`); await p.waitForTimeout(1200);
const lessonHref = await p.locator('a[href*="/study/curriculum/5/"]:not([href$="/packet"]):not([href$="/pacing"])').first().getAttribute('href');
await p.goto(`${BASE}/${lessonHref}`); await p.waitForTimeout(1500);
const box = p.locator('textarea[aria-label="My notes on this lesson"]');
if (await box.count() === 0) { const t = p.locator('button, summary', { hasText: /teacher/i }).first(); if (await t.count()) await t.click().catch(() => {}); }
await box.waitFor({ timeout: 15000 });
await box.fill('Use the story of the lost sheep first.'); await p.locator('button', { hasText: 'Save my notes' }).click(); await p.waitForTimeout(500);
await p.goto(`${BASE}/#/library`); await p.waitForTimeout(900);
if (!/Use the story of the lost sheep first/.test(await p.locator('.page').innerText())) fail('my lesson notes should appear among my notes');
// 11. think it through (scripted tutor)
await p.goto(`${BASE}/#/study/tutor/real-presence`); await p.waitForSelector('.tutor textarea', { timeout: 20000 });
await p.locator('.tutor textarea').fill('I think it is a symbol.');
await p.locator('button', { hasText: 'Show me the first source' }).click(); await p.waitForTimeout(300);
if (!/Step 1 of/.test(await p.locator('.tutor').innerText())) fail('the tutor should move to step 1');
await p.locator('button', { hasText: 'Show the words themselves' }).click();
if (!(await p.locator('.tutor blockquote').count())) fail('the source words should be revealed on request');
for (let i = 0; i < 40; i++) { const next = p.locator('button', { hasText: /^(Next|Finish)$/ }); if (!(await next.count())) break; await next.first().click(); await p.waitForTimeout(80); }
if (!/the answer in brief/i.test(await p.locator('.tutor').innerText())) fail('the tutor should end with the answer in brief: ' + (await p.locator('.tutor').innerText()).slice(0, 300));
await p.locator('button', { hasText: 'Keep my answer as a note' }).click(); await p.waitForTimeout(400);
// the saved answer appears on the map once "include my notes" is on
await p.goto(`${BASE}/#/study/map?n=${encodeURIComponent('argument:real-presence')}`); await p.waitForSelector('.concept-map .cm-group', { timeout: 30000 });
await p.locator('label', { hasText: 'Include my notes' }).locator('input').check(); await p.waitForTimeout(600);
if (!/My notes/.test(await p.locator('.concept-map').innerText())) fail('a note saved from Think it through should join its argument on the map');
// 12. original language, word by word (Greek and Hebrew)
await p.goto(`${BASE}/#/study/interlinear/JHN/1`); await p.waitForSelector('.il-w', { timeout: 30000 });
if (!/Ἐν|ἐν/.test(await p.locator('.il-verse').first().innerText())) fail('John 1:1 should show the Greek words');
await p.locator('.il-w').first().click(); await p.waitForTimeout(300);
if (!/Grammar:/.test(await p.locator('.il-detail').innerText())) fail('tapping a word should show its grammar');
await p.goto(`${BASE}/#/study/interlinear/GEN/1`); await p.waitForSelector('.il-w', { timeout: 30000 });
if (await p.locator('.il-words[dir=rtl]').count() === 0) fail('Hebrew should be set right to left');
// 13. where the ancient texts differ
await p.goto(`${BASE}/#/study/variants`); await p.waitForSelector('.variants .card', { timeout: 30000 });
await p.locator('button', { hasText: 'the verse in three translations' }).first().click();
await p.waitForSelector('.var-compare dt', { timeout: 30000 });
if (await p.locator('.var-compare dt').count() < 2) fail('the verse should be shown in at least two translations');
// 14. the [[ picker suggests your notes by title and completes the link
await p.evaluate(() => new Promise((res, rej) => { const r = indexedDB.open('studybible'); r.onsuccess = () => { const tx = r.result.transaction('notes', 'readwrite'); tx.objectStore('notes').add({ title: 'Bread of life', body: 'John 6', kind: 'note', targets: [], tags: [], chapterKeys: [], createdAt: Date.now(), updatedAt: Date.now() }); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }; r.onerror = () => rej(r.error); }));
await p.goto(`${BASE}/#/library`); await p.reload(); await p.waitForTimeout(1200);
await p.locator('button', { hasText: /^New note$/ }).first().click();
const ta = p.locator('textarea[aria-label="Note text"]'); await ta.waitFor({ timeout: 10000 });
await ta.click(); await ta.pressSequentially('See [[bre', { delay: 20 });
await p.locator('.note-link-picks button', { hasText: 'Bread of life' }).waitFor({ timeout: 10000 });
await p.locator('.note-link-picks button', { hasText: 'Bread of life' }).click();
if ((await ta.inputValue()) !== 'See [[Bread of life]]') fail('choosing a suggestion should complete the link, got: ' + await ta.inputValue());
await p.locator('button', { hasText: /^Cancel$/ }).first().click(); await p.waitForTimeout(300);
// 15. collections list: summary, search and a personal copy
await p.goto(`${BASE}/#/library`); await p.waitForTimeout(700);
await p.locator('[role=tab]', { hasText: /^Collections$/ }).first().click(); await p.waitForTimeout(500);
if (!/4 items, 1 done/i.test(await p.locator('.page').innerText())) fail('the Marian collection should read "4 items, 1 done": ' + (await p.locator('.page').innerText()).slice(0, 500));
await p.locator('button', { hasText: 'Duplicate' }).first().click(); await p.waitForTimeout(600);
if (!/Marian passages \(copy\)/i.test(await p.locator('.page').innerText())) fail('Duplicate should add a copy');
await b.close(); console.log('review ok');
