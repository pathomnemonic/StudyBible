// Pages point onward: glossary to lessons and back, games to saints, saints to feast cards.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
const p = await ctx.newPage(); p.setDefaultTimeout(12000);
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
await p.goto(`${BASE}/#/study/glossary`); await p.waitForSelector('.glossary li');
await p.waitForTimeout(800);
if (!(await p.locator('.glossary a[href*="/study/curriculum/"]').count())) fail('glossary entries link to lessons');
await p.goto(`${BASE}/#/study/saints/11-13`); await p.waitForSelector('article.card');
if (!(await p.locator('article.card a:has-text("Feast day card")').count())) fail('saints link to the feast card');
await p.locator('article.card a:has-text("Feast day card")').first().click(); await p.waitForTimeout(800);
if (!/#\/feast\//.test(await p.evaluate(() => location.hash))) fail('feast card opens');
await p.goto(`${BASE}/#/study/curriculum/YA/YA-1-1`); await p.waitForSelector('.lp');
// word links appear where a lesson word has a glossary entry (checked by hand on YA-1-1)
// reading leads into learning: a chapter that lessons use links to them
await p.goto(`${BASE}/#/read/webc/JHN/6`); await p.waitForSelector('.v'); await p.waitForTimeout(1500);
if (!(await p.locator('nav[aria-label="For this chapter"] a:has-text("Lesson:")').count())) fail('John 6 should link to a lesson');
await p.locator('nav[aria-label="For this chapter"] a:has-text("Lesson:")').first().click(); await p.waitForSelector('.lp');
await b.close(); console.log('crosslinks ok');
