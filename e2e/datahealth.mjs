// Data Health: a committed repair remains committed and is reported honestly when its follow-up scan fails.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 900, height: 1100 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
const p = await ctx.newPage(); p.setDefaultTimeout(20000);
await p.goto(`${BASE}/#/library?tab=export`);
await p.waitForSelector('h1');
await p.waitForFunction(() => indexedDB.databases().then((ds) => ds.some((d) => d.name === 'studybible')));
const id = await p.evaluate(async () => {
  const request = indexedDB.open('studybible');
  const db = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const row = { kind: 'note', uid: 'e2e-data-health-repair', title: 'Data Health repair test', body: 'Regression fixture', targets: [{ type: 'passage', ref: 'jhn.3.16' }], tags: [], chapterKeys: [], createdAt: Date.now(), updatedAt: Date.now() };
  const tx = db.transaction('notes', 'readwrite');
  const key = tx.objectStore('notes').add(row);
  const result = await new Promise((resolve, reject) => { key.onerror = () => reject(key.error); tx.oncomplete = () => resolve(key.result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error ?? new Error('fixture transaction aborted')); });
  db.close(); return result;
});
await p.getByRole('button', { name: 'Run the check' }).click();
await p.getByRole('button', { name: 'Fix this' }).waitFor();
await p.evaluate(() => {
  // Dexie may use get/put, cursor.update, or a bulk API depending on the IndexedDB implementation.
  // Observe the transaction boundary instead of guessing which write primitive it uses, then fail
  // all immediate notes reads so the Data Health follow-up scan deterministically receives an error.
  const proto = IDBDatabase.prototype, transaction = proto.transaction;
  let failReadsUntil = 0;
  proto.transaction = function (...args) {
    const tx = transaction.apply(this, args);
    const names = typeof args[0] === 'string' ? [args[0]] : Array.from(args[0] ?? []);
    const mode = typeof args[1] === 'string' ? args[1] : 'readonly';
    if (this.name === 'studybible' && names.includes('notes')) {
      if (mode === 'readwrite') {
        tx.addEventListener('complete', () => { failReadsUntil = Date.now() + 2500; }, { once: true });
      } else if (Date.now() < failReadsUntil) {
        try { tx.abort(); } catch { /* transaction may already have completed */ }
      }
    }
    return tx;
  };
  window.__restoreDataHealthIDB = () => { proto.transaction = transaction; };
});
await p.getByRole('button', { name: 'Fix this' }).click();
await p.getByRole('alert').filter({ hasText: 'repair was committed' }).waitFor();
if (await p.getByRole('button', { name: 'Fix this' }).count()) fail('stale repair actions must be cleared when the committed repair cannot be rechecked');
await p.evaluate(() => window.__restoreDataHealthIDB());
const repaired = await p.evaluate(async (id) => {
  const request = indexedDB.open('studybible');
  const db = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const tx = db.transaction('notes', 'readonly');
  const req = tx.objectStore('notes').get(id);
  const row = await new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
  db.close(); return row.targets[0].ref;
}, id);
if (repaired !== 'JHN.3.16') fail('the repair should be committed despite the failed refresh; got ' + repaired);
await p.reload();
await p.waitForSelector('h1');
await p.getByRole('button', { name: 'Run the check' }).click();
await p.getByText('Nothing wrong found.').waitFor();

// A collection item whose note is in Recently deleted: restoration is committed even if its follow-up scan fails.
const restoreFixture = await p.evaluate(async () => {
  const request = indexedDB.open('studybible');
  const db = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const uid = 'e2e-data-health-restore';
  const note = { uid, kind: 'note', title: 'Restorable note', body: 'Keep this note', targets: [], tags: [], chapterKeys: [], createdAt: Date.now(), updatedAt: Date.now() };
  const tx = db.transaction(['collections', 'trash', 'tombs'], 'readwrite');
  const collection = tx.objectStore('collections').add({ uid: 'e2e-restore-collection', name: 'Restore test collection', items: [{ type: 'note', uid, label: 'Restorable note' }], createdAt: Date.now(), updatedAt: Date.now() });
  const trash = tx.objectStore('trash').add({ tbl: 'notes', data: note, deletedAt: Date.now() });
  tx.objectStore('tombs').add({ tbl: 'notes', uid, updatedAt: Date.now() });
  const ids = await new Promise((resolve, reject) => { tx.oncomplete = () => resolve({ collectionId: collection.result, trashId: trash.result, uid }); tx.onerror = () => reject(tx.error); });
  db.close(); return ids;
});
await p.getByRole('button', { name: 'Run the check' }).click();
await p.getByRole('button', { name: 'Restore' }).waitFor();
await p.evaluate(() => {
  const proto = IDBDatabase.prototype, transaction = proto.transaction;
  let failReadsUntil = 0;
  proto.transaction = function (...args) {
    const tx = transaction.apply(this, args);
    const names = typeof args[0] === 'string' ? [args[0]] : Array.from(args[0] ?? []);
    const mode = typeof args[1] === 'string' ? args[1] : 'readonly';
    if (this.name === 'studybible' && names.includes('notes')) {
      if (mode === 'readwrite') {
        tx.addEventListener('complete', () => { failReadsUntil = Date.now() + 2500; }, { once: true });
      } else if (Date.now() < failReadsUntil) {
        try { tx.abort(); } catch { /* transaction may already have completed */ }
      }
    }
    return tx;
  };
  window.__restoreDataHealthRestoreIDB = () => { proto.transaction = transaction; };
});
await p.getByRole('button', { name: 'Restore' }).click();
await p.getByRole('alert').filter({ hasText: 'Restore committed, but the check could not refresh' }).waitFor();
if (await p.getByRole('button', { name: 'Restore' }).count()) fail('stale restore actions must be cleared after a committed restore with a failed refresh');
await p.evaluate(() => window.__restoreDataHealthRestoreIDB());
const restoreState = await p.evaluate(async (ids) => {
  const request = indexedDB.open('studybible');
  const db = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const tx = db.transaction(['notes', 'trash', 'tombs'], 'readonly');
  const noteReq = tx.objectStore('notes').index('uid').get(ids.uid);
  const trashReq = tx.objectStore('trash').get(ids.trashId);
  const tombReq = tx.objectStore('tombs').getAll();
  const result = await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve({ note: noteReq.result, trash: trashReq.result, tombs: tombReq.result.filter((t) => t.uid === ids.uid) });
    tx.onerror = () => reject(tx.error);
  });
  db.close(); return result;
}, restoreFixture);
if (!restoreState.note || restoreState.trash || restoreState.tombs.length) fail('restore must commit the note and consume its trash row and tombstone despite the failed refresh');
await p.reload();
await p.waitForSelector('h1');
await p.getByRole('button', { name: 'Run the check' }).click();
await p.getByText('Nothing wrong found.').waitFor();
await b.close();
console.log('datahealth committed-mutation/refresh-failure e2e ok');
