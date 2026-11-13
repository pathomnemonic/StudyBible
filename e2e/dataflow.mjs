// Your writing through the real interface: write, edit and delete a note; close and reopen; export; refuse a damaged file; restore from a backup.
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1000, height: 1200 }, acceptDownloads: true });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); sessionStorage.setItem('seeded', '1'); } });
let p = await ctx.newPage(); p.setDefaultTimeout(10000);
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const notesPage = async (pg) => { await pg.goto(`${BASE}/#/library`); await pg.waitForTimeout(900); await pg.locator('button, [role=tab]', { hasText: /^Notes$/ }).first().click(); await pg.waitForTimeout(500); return pg.locator('main, .page').first().innerText(); };
const exportPage = async (pg) => { await pg.goto(`${BASE}/#/library?tab=export`); await pg.reload(); await pg.waitForSelector('input[type=file]'); };

// 1. write a note on Psalm 23:1 in the reader
await p.goto(`${BASE}/#/read/webc/PSA/23`); await p.waitForSelector('.v');
await p.locator('.v[data-v="1"] .vn').first().click(); await p.waitForTimeout(600);
await p.locator('button[aria-label="Write a note on this passage"]').click();
await p.locator('textarea').first().fill('The first draft'); await p.locator('button:has-text("Save")').last().click(); await p.waitForTimeout(700);
if (!/The first draft/.test(await notesPage(p))) fail('the new note should be listed');

// 2. edit it
await p.locator('button:has-text("Edit")').first().click();
await p.locator('textarea').first().fill('The edited draft'); await p.locator('button:has-text("Save")').last().click(); await p.waitForTimeout(700);
let t = await notesPage(p);
if (!/The edited draft/.test(t) || /The first draft/.test(t)) fail('the edit should replace the text');

// 3. close the browser and open it again (a new page in the same profile)
await p.close(); p = await ctx.newPage(); p.setDefaultTimeout(10000);
if (!/The edited draft/.test(await notesPage(p))) fail('the note should survive closing and reopening');

// 4. export everything, and refuse a damaged file
await exportPage(p);
const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('button:has-text("Export everything")').click()]);
const good = join(tmpdir(), 'sb-e2e-backup.json'); await dl.saveAs(good);
if (!/The edited draft/.test(readFileSync(good, 'utf8'))) fail('the export should contain the note');
const bad = join(tmpdir(), 'sb-e2e-bad.json'); writeFileSync(bad, '{"format":"studybible-export","notes":[{"id":');
await p.setInputFiles('input[type=file]', bad); await p.waitForTimeout(900);
const body = await p.locator('body').innerText();
if (!/cut short|not a backup|damaged|could not|nothing was imported/i.test(body)) fail('a damaged file should be refused with a message, got: ' + body.slice(body.indexOf('IMPORT'), body.indexOf('IMPORT') + 200));
{ const t2 = await notesPage(p); if (!/The edited draft/.test(t2)) fail('a refused file must not change anything; page: ' + t2.slice(0, 300) + ' BODYBEFORE: ' + body.slice(body.indexOf('IMPORT'), body.indexOf('IMPORT') + 300)); }

// 5. delete the note, then restore it from the backup
await p.locator('button:has-text("Edit")').first().click();
p.once('dialog', (d) => d.accept());
await p.locator('button:has-text("Delete")').last().click(); await p.waitForTimeout(800);
if (/The edited draft/.test(await notesPage(p))) fail('the note should be deleted');
await exportPage(p);
await p.setInputFiles('input[type=file]', good); await p.waitForTimeout(900);
const merge = p.locator('button', { hasText: /^Merge|Add to (what|this)/i }).first();
if (!(await merge.count())) fail('importing a good file should offer to merge, buttons: ' + (await p.locator('button').allInnerTexts()).join('|').slice(0, 300));
await merge.click(); await p.waitForTimeout(1200);
if (!/The edited draft/.test(await notesPage(p))) fail('the note should come back after restoring');
await b.close(); console.log('dataflow ok');
