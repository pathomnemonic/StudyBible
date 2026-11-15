// Data Health: a committed repair remains committed and is reported honestly when its follow-up scan fails.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 900, height: 1100 } });
await ctx.addInitScript(() => {
  localStorage.setItem('sb:tour', '1');
  localStorage.setItem('sb:setup', '2');
  localStorage.setItem('sb:audienceAsked', '1');
  // Observe the actual store access made by Dexie's transaction, rather than
  // inferring its scope from IDBDatabase.transaction arguments. This also covers
  // dynamic tables passed to db.transaction() by restoreFromTrash().
  // Arm from the real notes write transaction and fail the first notes read transaction
  // after it commits. The database boundary catches every IndexedDB read strategy Dexie uses.
  const failNextNotesRead = (tx, state) => {
    if (!state?.enabled || state.readRequests > 0) return;
    if (!state.armed) {
      state.notesReadsBeforeArm = (state.notesReadsBeforeArm ?? 0) + 1;
      return;
    }
    state.readRequests = (state.readRequests ?? 0) + 1;
    try {
      tx.abort();
      state.abortedReads++;
    } catch {
      state.abortFailures++;
    }
  };

  const dbProto = IDBDatabase.prototype;
  const dbMarker = '__studyBibleDataHealthDatabaseTransactionFaultInstalled';
  if (!dbProto[dbMarker]) {
    const originalTransaction = dbProto.transaction;
    Object.defineProperty(dbProto, dbMarker, { value: true });
    dbProto.transaction = function (...args) {
      const tx = originalTransaction.apply(this, args);
      const state = [window.__dataHealthFault, window.__dataHealthRestoreFault].find((candidate) => candidate?.enabled);
      if (state?.enabled && this.name === 'studybible') {
        state.databaseTransactions = (state.databaseTransactions ?? 0) + 1;
        const names = Array.from(tx.objectStoreNames ?? []);
        if (tx.mode === 'readonly' && names.includes('notes')) {
          state.notesReadTransactions = (state.notesReadTransactions ?? 0) + 1;
          failNextNotesRead(tx, state);
        }
      }
      return tx;
    };
  }

  // Dexie may access a store from an already-created transaction. Observe that
  // boundary too, so the fault is tied to the actual readonly notes store.
  const txProto = IDBTransaction.prototype;
  const txMarker = '__studyBibleDataHealthTransactionFaultInstalled';
  if (!txProto[txMarker]) {
    const originalObjectStore = txProto.objectStore;
    const observedWrites = new WeakSet();
    Object.defineProperty(txProto, txMarker, { value: true });
    txProto.objectStore = function (...args) {
      const store = originalObjectStore.apply(this, args);
      const state = [window.__dataHealthFault, window.__dataHealthRestoreFault].find((candidate) => candidate?.enabled);
      if (state?.enabled && this.db?.name === 'studybible' && this.mode === 'readwrite' &&
          store.name === 'notes' && !observedWrites.has(this)) {
        observedWrites.add(this);
        state.notesTransactions = (state.notesTransactions ?? 0) + 1;
        this.addEventListener('complete', () => {
          if (state.enabled) { state.writes++; state.armed = true; }
        }, { once: true });
      } else if (state?.enabled && this.db?.name === 'studybible' &&
          this.mode === 'readonly' && store.name === 'notes') {
        state.notesReadStoreAccesses = (state.notesReadStoreAccesses ?? 0) + 1;
        failNextNotesRead(this, state);
      }
      return store;
    };

  // Arm the read fault after the actual notes write request succeeds, not after
  // the transaction's completion event. Dexie can start its follow-up scan before
  // the completion listener runs, so event-only arming misses that read.
  const storeProto = IDBObjectStore.prototype;
  const storeMarker = '__studyBibleDataHealthStoreWriteFaultInstalled';
  if (!storeProto[storeMarker]) {
    Object.defineProperty(storeProto, storeMarker, { value: true });
    for (const method of ['put', 'add']) {
      const original = storeProto[method];
      storeProto[method] = function (...args) {
        const request = original.apply(this, args);
        const state = [window.__dataHealthFault, window.__dataHealthRestoreFault].find((candidate) => candidate?.enabled);
        if (state?.enabled && this.name === 'notes' && this.transaction?.db?.name === 'studybible' &&
            this.transaction.mode === 'readwrite') {
          state.noteWriteRequests = (state.noteWriteRequests ?? 0) + 1;
          request.addEventListener('success', () => {
            if (state.enabled) state.armed = true;
          }, { once: true });
        }
        return request;
      };
    }
  }
  }
});
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
await p.evaluate(() => { window.__dataHealthFault = { enabled: true, armed: false, writes: 0, notesTransactions: 0, readRequests: 0, abortedReads: 0, abortFailures: 0 }; });
await p.getByRole('button', { name: 'Fix this' }).click();
await p.waitForFunction(() => window.__dataHealthFault?.writes > 0 && window.__dataHealthFault?.abortedReads > 0, null, { timeout: 5000 }).catch(async () => fail('the repair fault injector did not abort the follow-up notes read: ' + JSON.stringify(await p.evaluate(() => window.__dataHealthFault))));
await p.getByRole('alert').filter({ hasText: 'repair was committed' }).waitFor();
if (await p.getByRole('button', { name: 'Fix this' }).count()) fail('stale repair actions must be cleared when the committed repair cannot be rechecked');
if (await p.getByText(/Everything found/).count()) fail('stale findings must be cleared when the committed repair cannot be rechecked');
await p.evaluate(() => { window.__dataHealthFault.enabled = false; window.__dataHealthFault.armed = false; });
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
await p.evaluate(() => { window.__dataHealthRestoreFault = { enabled: true, armed: false, writes: 0, notesTransactions: 0, abortedReads: 0, abortFailures: 0 }; });
await p.getByRole('button', { name: 'Restore' }).click();
await p.waitForFunction(() => window.__dataHealthRestoreFault?.writes > 0 && window.__dataHealthRestoreFault?.abortedReads > 0, null, { timeout: 5000 }).catch(async () => fail('the restore fault injector did not abort the follow-up notes read: ' + JSON.stringify(await p.evaluate(() => window.__dataHealthRestoreFault))));
await p.getByRole('alert').filter({ hasText: 'Restore committed, but the check could not refresh' }).waitFor();
if (await p.getByRole('button', { name: 'Restore' }).count()) fail('stale restore actions must be cleared after a committed restore with a failed refresh');
if (await p.getByText('Nothing wrong found.').count()) fail('a stale check result must be cleared after a committed restore with a failed refresh');
await p.evaluate(() => { window.__dataHealthRestoreFault.enabled = false; window.__dataHealthRestoreFault.armed = false; });
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
