// The whole study workflow through the interface: follow a cross-reference from the study panel, switch translation, select a verse,
// write a note, go back to where you started, and find the note again from the other translation.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
const p = await ctx.newPage(); p.setDefaultTimeout(10000);
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const hash = () => p.evaluate(() => location.hash);
const tab = async (name) => { await p.locator('aside.panel [role=tab]', { hasText: new RegExp('^' + name) }).click(); await p.waitForTimeout(500); };

// 1. from John 3:16, follow the cross-reference to Numbers 21:4-9
await p.goto(`${BASE}/#/read/webc/JHN/3`); await p.waitForSelector('.v');
await p.locator('.v[data-v="16"] .vn').first().click(); await p.waitForTimeout(700);
await tab('Connections');
await p.locator('aside.panel button', { hasText: /^Numbers 21:4/ }).first().click(); await p.waitForTimeout(1200);
if (!/#\/read\/webc\/NUM\/21/.test(await hash())) fail('the cross-reference should open Numbers 21, got ' + (await hash()));
if ((await p.locator('.v[aria-pressed="true"]').count()) < 5) fail('the referenced verses should be selected');

// 2. switch translation with the passage still in view
await p.locator('button[aria-label^="Books and translation"]').click(); await p.waitForTimeout(500);
await p.locator('.drawer button, [role=dialog] button', { hasText: /^CPDV$/ }).first().click(); await p.waitForTimeout(1500);
if (!/#\/read\/cpdv\/NUM\/21/.test(await hash())) fail('switching translation should stay on Numbers 21, got ' + (await hash()));
if (!(await p.locator('.v[data-v="8"]').count())) fail('Numbers 21:8 should exist in the other translation');

// 3. select verse 8 and write a note
await p.keyboard.press('Escape');
await p.locator('.v[data-v="8"] .vn').first().click(); await p.waitForTimeout(700);
await p.locator('button[aria-label="Write a note on this passage"]').click();
await p.locator('textarea').first().fill('Workflow note on the bronze serpent');
await p.locator('button:has-text("Save")').last().click(); await p.waitForTimeout(700);

// 4. go back to where the journey began
await p.locator('button:has-text("Back to John 3")').first().click(); await p.waitForTimeout(1200);
if (!/#\/read\/[a-z0-9-]+\/JHN\/3/.test(await hash())) fail('Back should return to John 3, got ' + (await hash()));

// 5. the note is on the same verse in the first translation
await p.goto(`${BASE}/#/read/webc/NUM/21`); await p.waitForSelector('.v');
await p.locator('.v[data-v="8"] .vn').first().click(); await p.waitForTimeout(700);
await tab('Mine');
if (!/Workflow note on the bronze serpent/.test(await p.locator('aside.panel').innerText())) fail('the note should appear on Numbers 21:8 in WEB-C too');
await b.close(); console.log('xref ok');
