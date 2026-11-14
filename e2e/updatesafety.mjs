// An app update must not reload the page over unsaved typing, and must not wait for ever because saved text sits in a box.
// "Unsaved" means: typed, and not yet confirmed written to storage (src/lib/dirty.ts). Checked in a real browser.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); } });
const p = await ctx.newPage(); p.setDefaultTimeout(15000);
const dirty = () => p.evaluate(() => window.__sbDirty.isDirty());
await p.goto(`${BASE}/#/pray/journal`); await p.waitForSelector('button:has-text("New")'); await p.waitForFunction(() => !!window.__sbDirty);

// 1. nothing typed: not dirty
if (await dirty()) fail('a fresh page is not dirty');
// 2. type in the entry box: dirty
await p.click('button:has-text("New")');
await p.locator('textarea').first().fill('A line I have not saved yet');
if (!(await dirty())) fail('typed text that is not saved must count as unsaved');
// 3. save: clean
await p.click('button.btn.primary:has-text("Save")'); await p.waitForTimeout(600);
if (await dirty()) fail('after a confirmed save nothing is unsaved');
// 4. a SAVED, non-empty entry loaded into a box is not an edit (this used to block updates for ever)
await p.locator('button:has-text("Edit")').first().click().catch(() => {});
await p.waitForTimeout(300);
const hasBox = await p.locator('textarea').count();
if (hasBox && (await p.locator('textarea').first().inputValue()).trim() === '') fail('expected the saved text in the box');
if (await dirty()) fail('saved text sitting in a text box must not count as unsaved');
// 5. a metadata-only edit (the title field) counts
await p.locator('input[placeholder^="Title"]').first().fill('Changed only the title');
if (!(await dirty())) fail('editing only the title must count as unsaved');
// 6. a failed save keeps it unsaved
await p.evaluate(() => { const real = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function () { throw new DOMException('quota', 'QuotaExceededError'); }; window.__restore = () => { IDBObjectStore.prototype.put = real; }; });
await p.click('button.btn.primary:has-text("Save")').catch(() => {}); await p.waitForTimeout(500);
if (!(await dirty())) fail('a save that failed must leave the text counted as unsaved');
await p.evaluate(() => window.__restore());
// 7. then a save that works clears it
await p.click('button.btn.primary:has-text("Save")').catch(() => {}); await p.waitForTimeout(600);
if (await dirty()) fail('a later successful save clears it');
// 8. two editors on different tables: saving one must not mark the other saved
await p.evaluate(() => {
  const mk = (t) => { const a = document.createElement('textarea'); a.dataset.saves = t; a.id = 'x-' + t; document.body.appendChild(a); a.value = 'typed ' + t; a.dispatchEvent(new Event('input', { bubbles: true })); };
  mk('notes'); mk('journal');
});
await p.evaluate(() => window.__sbDirty.noteSaved('journal'));
if (!(await dirty())) fail('a journal save must not clear unsaved text bound for notes');
await p.evaluate(() => window.__sbDirty.noteSaved('notes'));
if (await dirty()) fail('both saved: clean');
// 9. text that is then removed from the page (navigation) is not counted
await p.evaluate(() => { const a = document.createElement('textarea'); a.id = 'gone'; document.body.appendChild(a); a.value = 'x'; a.dispatchEvent(new Event('input', { bubbles: true })); });
if (!(await dirty())) fail('typed text should count while it is on the page');
await p.evaluate(() => document.getElementById('gone').remove());
if (await dirty()) fail('a field that left the page must not hold an update back');
// 10. a form that clears itself after submitting is not unsaved
await p.goto(`${BASE}/#/pray/intentions`); await p.waitForSelector('textarea');
await p.locator('textarea').first().fill('Healing for a friend');
if (!(await dirty())) fail('typing in the prayer list counts');
await p.locator('form button[type=submit], form .btn.primary').first().click().catch(() => {}); await p.waitForTimeout(400);
if (await dirty()) fail('after the form is submitted and cleared, nothing is unsaved');
// 11. a search box is not unsaved work
await p.goto(`${BASE}/#/pray/journal`); await p.waitForSelector('input[type=search]');
await p.locator('input[type=search]').fill('abc');
if (await dirty()) fail('typing in a search box is not unsaved work');
await b.close(); console.log('updatesafety ok');
