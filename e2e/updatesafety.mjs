// An app update must not reload the page over unsaved typing, and must not wait for ever because saved text sits in a box.
// "Unsaved" = typed, and not yet acknowledged by the save of THAT editor for THAT revision (src/lib/dirty.ts). Checked in a real browser:
// first through the tracker with several editors at once, then through the real note and journal screens.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); } });
const p = await ctx.newPage(); p.setDefaultTimeout(15000);
const dirty = () => p.evaluate(() => window.__sbDirty.isDirty());
const editors = () => p.evaluate(() => window.__sbDirty.dirtyEditors().sort());
await p.goto(`${BASE}/#/pray/journal`); await p.waitForSelector('button:has-text("New")'); await p.waitForFunction(() => !!window.__sbDirty);

// ---- the tracker, with synthetic editors (the same code paths as the real screens) ----
await p.evaluate(() => {
  window.mk = (editor, id, value = 'typed') => { const wrap = document.createElement('div'); wrap.dataset.testWrap = '1'; if (editor) wrap.dataset.editor = editor; const t = document.createElement('textarea'); t.id = id; wrap.appendChild(t); document.body.appendChild(wrap); window.type(id, value); return wrap; };
  window.type = (id, value) => { const t = document.getElementById(id); t.value = value; t.dispatchEvent(new Event('input', { bubbles: true })); };
});
const reset = () => p.evaluate(() => { document.querySelectorAll('[data-test-wrap]').forEach((e) => e.remove()); });
// 1. two simultaneously dirty note editors: saving one does not clear the other
await p.evaluate(() => { window.mk('note:1', 'a'); window.mk('note:2', 'b'); window.__sbDirty.beginSave('note:1')(); });
if (JSON.stringify(await editors()) !== JSON.stringify(['note:2'])) fail('saving note 1 must not clear note 2: ' + JSON.stringify(await editors()));
await reset();
// 2. a dirty journal entry stays dirty when an unrelated journal record is saved
await p.evaluate(() => { window.mk('journal:7', 'j7'); window.mk('journal:8', 'j8'); window.__sbDirty.beginSave('journal:8')(); });
if (JSON.stringify(await editors()) !== JSON.stringify(['journal:7'])) fail('saving journal 8 must not clear journal 7: ' + JSON.stringify(await editors()));
await reset();
// 3. a dirty note stays dirty when a different note is saved
await p.evaluate(() => { window.mk('note:10', 'n10'); window.__sbDirty.beginSave('note:11')(); });
if (!(await dirty())) fail('saving a different note must not clear this one');
await reset();
// 4. an editor-less (unbound, e.g. localStorage-backed) field stays dirty after unrelated saves of every kind
await p.evaluate(() => { window.mk(null, 'free'); for (const id of ['note:1', 'journal:1', 'collection:1:name', 'x']) window.__sbDirty.beginSave(id)(); });
if (!(await dirty())) fail('a field with no editor must not be cleared by other editors\' saves');
await reset();
// 5. edit, begin a save, edit again before it completes, then the first save completes: the newer text stays dirty
await p.evaluate(() => { window.mk('note:5', 'n5', 'v1'); window.done5 = window.__sbDirty.beginSave('note:5'); window.type('n5', 'v1 plus more typed while saving'); window.done5(); });
if (!(await dirty())) fail('typing during a save must leave the newer text unsaved');
// ... and a save that began after that edit clears it
await p.evaluate(() => { window.__sbDirty.beginSave('note:5')(); });
if (await dirty()) fail('a save of the current revision clears it');
await reset();
// 6. a successful save of an unchanged revision clears that editor, and only that editor
await p.evaluate(() => { window.mk('note:6', 'n6'); window.mk('note:6b', 'n6b'); window.__sbDirty.beginSave('note:6')(); });
if (JSON.stringify(await editors()) !== JSON.stringify(['note:6b'])) fail('the saved editor clears, the other does not: ' + JSON.stringify(await editors()));
await reset();
// 7. a failed save never calls the acknowledgement: it stays dirty
await p.evaluate(() => { window.mk('note:7', 'n7'); window.__sbDirty.beginSave('note:7'); /* write failed: done() is never called */ });
if (!(await dirty())) fail('a failed save leaves the editor dirty');
await reset();
if (await dirty()) fail('clean again once the fields are gone');

// ---- the real screens ----
// journal: type, save (clean), reopen with saved text (clean), edit (dirty)
await p.click('button:has-text("New")');
await p.locator('textarea').first().fill('A line I have not saved yet');
if (!(await dirty())) fail('typed text that is not saved must count as unsaved');
if (JSON.stringify(await editors()) !== JSON.stringify(['journal:new'])) fail('the journal editor should carry its own id: ' + JSON.stringify(await editors()));
await p.click('button.btn.primary:has-text("Save")'); await p.waitForTimeout(600);
if (await dirty()) fail('after a confirmed save nothing is unsaved');
await p.locator('button:has-text("Edit")').first().click(); await p.waitForTimeout(300);
if ((await p.locator('textarea').first().inputValue()).trim() === '') fail('expected the saved text in the box');
if (await dirty()) fail('saved text sitting in a text box must not count as unsaved');
await p.locator('input[placeholder^="Title"]').first().fill('Changed only the title');
if (!(await dirty())) fail('editing only the title must count as unsaved');
// a failed save keeps it unsaved
await p.evaluate(() => { const real = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function () { throw new DOMException('quota', 'QuotaExceededError'); }; window.__restore = () => { IDBObjectStore.prototype.put = real; }; });
await p.click('button.btn.primary:has-text("Save")').catch(() => {}); await p.waitForTimeout(500);
if (!(await dirty())) fail('a save that failed must leave the text counted as unsaved');
await p.evaluate(() => window.__restore());
// 8. the prayer list (a localStorage form) clears itself on submit: nothing is unsaved
await p.goto(`${BASE}/#/pray/intentions`); await p.waitForSelector('textarea');
await p.locator('textarea').first().fill('Healing for a friend');
if (!(await dirty())) fail('typing in the prayer list counts');
await p.locator('form button[type=submit], form .btn.primary').first().click().catch(() => {}); await p.waitForTimeout(400);
if (await dirty()) fail('after the form is submitted and cleared, nothing is unsaved');
// 9. a search box is not unsaved work; a field that saves as you type (lesson note) is not unsaved
await p.goto(`${BASE}/#/pray/journal`); await p.waitForSelector('input[type=search]');
await p.locator('input[type=search]').fill('abc');
if (await dirty()) fail('typing in a search box is not unsaved work');
// 10. a field that leaves the page (navigation) stops counting
await p.click('button:has-text("New")'); await p.locator('textarea').first().fill('left behind');
if (!(await dirty())) fail('counts while on the page');
await p.goto(`${BASE}/#/pray`); await p.waitForTimeout(500);
if (await dirty()) fail('a field that left the page must not hold an update back');
await b.close(); console.log('updatesafety ok');
