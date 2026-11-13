// A collection built through the interface: add a passage from the reader, a Catechism paragraph, one of my own notes and a question;
// open it, reorder, export to Markdown, and see the collection named as a backlink under the note.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 1300 }, acceptDownloads: true });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); sessionStorage.setItem('seeded', '1'); } });
const p = await ctx.newPage(); p.setDefaultTimeout(12000);
const fail = (m) => { console.error('FAIL', m); process.exit(1); };

// 1. a note on John 6:51, so there is something of my own to collect
await p.goto(`${BASE}/#/read/webc/JHN/6`); await p.waitForSelector('.v');
await p.locator('.v[data-v="51"] .vn').first().click(); await p.waitForTimeout(700);
await p.locator('button[aria-label="Write a note on this passage"]').click();
await p.locator('textarea').first().fill('The bread is his flesh'); await p.locator('button:has-text("Save")').last().click(); await p.waitForTimeout(700);

// 2. add the selected passage to a new collection from the reader toolbar
await p.goto(`${BASE}/#/read/webc/JHN/6`); await p.waitForSelector('.v');
await p.locator('.v[data-v="51"] .vn').first().click(); await p.waitForTimeout(700);
await p.locator('button:has-text("＋ Collection")').first().click();
await p.locator('[role=dialog] input').first().fill('Bread of life');
await p.locator('[role=dialog] button:has-text("Create and add")').click(); await p.waitForTimeout(700);

// 3. a Catechism paragraph into the same collection
await p.goto(`${BASE}/#/study/catechism/1324`); await p.waitForSelector('.ccc-para');
await p.locator('.ccc-para.on button:has-text("＋ Collection"), .ccc-para button:has-text("＋ Collection")').first().click();
await p.locator('[role=dialog] button', { hasText: /^Bread of life/ }).click(); await p.waitForTimeout(600);

// 4. open the collection, add my note and a question, and reorder
await p.goto(`${BASE}/#/library`); await p.waitForTimeout(900);
await p.locator('button, [role=tab]', { hasText: /^Collections$/ }).first().click(); await p.waitForTimeout(500);
await p.locator('a', { hasText: 'Bread of life' }).first().click(); await p.waitForSelector('.cp-list');
await p.locator('select', { hasText: 'Choose a note' }).selectOption({ index: 1 }); await p.waitForTimeout(500);
await p.locator('textarea[placeholder^="Write it here"]').fill('Does "flesh" mean the Eucharist here?');
await p.locator('label:has-text("A new question or reflection") button:has-text("Add")').click(); await p.waitForTimeout(700);
let n = await p.locator('.cp-item').count();
if (n !== 4) fail('expected 4 items (passage, Catechism, note, question), got ' + n);
const first = await p.locator('.cp-item').first().innerText();
await p.locator('.cp-item').nth(1).locator('button[aria-label^="Move"][aria-label$="up"]').click(); await p.waitForTimeout(500);
if ((await p.locator('.cp-item').first().innerText()) === first) fail('moving an item up should change the order');
if (!/The bread is his flesh/.test(await p.locator('.cp-list').innerText())) fail('my note should be read back from the original');
if (!(await p.locator('.cp-item a:has-text("Open the original")').count())) fail('each item links to its original');

// 5. nothing was copied: still one note of that text, plus the question
await p.goto(`${BASE}/#/library`); await p.waitForTimeout(900);
await p.locator('button, [role=tab]', { hasText: /^Notes$/ }).first().click(); await p.waitForTimeout(600);
const notesText = await p.locator('main, .page').first().innerText();
if ((notesText.match(/The bread is his flesh/g) ?? []).length !== 1) fail('the note must not be duplicated by collecting it');
if (!/In collection: Bread of life/.test(notesText)) fail('the note should show the collection as a backlink');

// 6. export to Markdown
await p.goto(`${BASE}/#/library`); await p.waitForTimeout(700);
await p.locator('button, [role=tab]', { hasText: /^Collections$/ }).first().click(); await p.waitForTimeout(400);
await p.locator('a', { hasText: 'Bread of life' }).first().click(); await p.waitForSelector('.cp-list'); await p.waitForTimeout(800);
const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('button:has-text("Export as Markdown")').click()]);
const f = join(tmpdir(), 'sb-collection.md'); await dl.saveAs(f);
const md = readFileSync(f, 'utf8');
if (!/^# Bread of life/.test(md) || !/Open the original/.test(md) || !/bread is his flesh/i.test(md)) fail('the Markdown should hold the title, the text and links back: ' + md.slice(0, 300));
await b.close(); console.log('collections ok');
