// Study and source tools: the passage dossier saves to a collection and then lists that collection under "Connected";
// Ask the Fathers shows an exact locator, surrounding paragraphs on demand, a work filter and saves the result set;
// the book fingerprint takes a chapter range, searches within its words and defines each measure.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 1300 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); sessionStorage.setItem('seeded', '1'); } });
const p = await ctx.newPage(); p.setDefaultTimeout(30000);
const fail = (m) => { console.error('FAIL', m); process.exit(1); };

// 1. dossier
await p.goto(`${BASE}/#/study/passage/JHN.6.51-58`);
await p.waitForSelector('[data-testid=passage-connections]');
await p.locator('button:has-text("Save dossier to a collection")').click();
await p.locator('[role=dialog] input').first().fill('Bread dossier');
await p.locator('[role=dialog] button:has-text("Create and add")').click(); await p.waitForTimeout(800);
await p.reload(); await p.waitForSelector('[data-testid=passage-connections]');
await p.waitForSelector('[data-testid=passage-connections] a:has-text("Bread dossier")').catch(() => fail('collection not listed under Connected'));
if (!(await p.locator('[data-testid=passage-connections] a:has-text("Compare translations")').count())) fail('no study tool links');
if (!(await p.locator('a:has-text("Parallel view")').count())) fail('no parallel view link');

// 2. ask the fathers
await p.goto(`${BASE}/#/study/ask-fathers?q=baptism`);
await p.waitForSelector('.af-hit', { timeout: 90000 });
const loc = await p.locator('.af-loc').first().innerText();
if (!/section \d+.*paragraph \d+/.test(loc)) fail(`locator missing: ${loc}`);
await p.locator('.af-hit button:has-text("Show surrounding paragraphs")').first().click();
await p.waitForSelector('.af-ctx');
if (!(await p.locator('.af-hit').first().locator('.af-ctx').count())) fail('no context');
await p.locator('summary:has-text("Filters")').click();
if (!(await p.locator('select[aria-label=Work]').count())) fail('no work filter');
await p.locator('button:has-text("Save all")').first().click();
await p.locator('[role=dialog] input').first().fill('Baptism sources');
await p.locator('[role=dialog] button:has-text("Create and add")').click(); await p.waitForTimeout(800);
await p.locator('button:has-text("Save as a note")').click(); await p.waitForSelector('button:has-text("Saved as a note")');

// 3. fingerprint
await p.goto(`${BASE}/#/study/fingerprint/ROM`);
await p.waitForSelector('.fp-list');
const before = await p.locator('.fp-list li').count();
await p.locator('select[aria-label="From chapter"]').selectOption('1');
await p.locator('select[aria-label="To chapter"]').selectOption('3');
await p.waitForFunction(() => /1–3/.test(document.querySelector('.card-title')?.textContent ?? ''));
await p.locator('input[aria-label="Search within the fingerprint"]').fill('faith');
await p.waitForTimeout(300);
const words = await p.locator('.fp-list li a').allInnerTexts();
if (!words.length || !words.every((w) => w.includes('faith'))) fail(`search did not filter: ${words}`);
if (!(await p.locator('dt:has-text("Times more")').count())) fail('no definitions');
void before;
const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
if (overflow) fail('sideways scroll');
await b.close();
console.log('study-tools OK');
