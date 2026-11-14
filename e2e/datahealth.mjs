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
  const result = await new Promise((resolve, reject) => { key.onsuccess = () => resolve(key.result); key.onerror = () => reject(key.error); tx.oncomplete = () => resolve(key.result); tx.onerror = () => reject(tx.error); });
  db.close(); return result;
});
await p.getByRole('button', { name: 'Run the check' }).click();
await p.getByRole('button', { name: 'Fix this' }).waitFor();
await p.evaluate(() => {
  const proto = IDBObjectStore.prototype;
  const put = proto.put, getAll = proto.getAll;
  let repairCommitted = false, failOnce = true;
  proto.put = function (...args) {
    const result = put.apply(this, args);
    if (this.name === 'notes') repairCommitted = true;
    return result;
  };
  proto.getAll = function (...args) {
    if (this.name === 'notes' && repairCommitted && failOnce) { failOnce = false; throw new DOMException('simulated refresh read failure', 'UnknownError'); }
    return getAll.apply(this, args);
  };
  window.__restoreDataHealthIDB = () => { proto.put = put; proto.getAll = getAll; };
});
await p.getByRole('button', { name: 'Fix this' }).click();
await p.getByRole('alert').filter({ hasText: 'repair was committed' }).waitFor();
if (await p.getByRole('button', { name: 'Fix this' }).count()) fail('stale repair actions must be cleared when the committed repair cannot be rechecked');
const repaired = await p.evaluate(async (id) => {
  const request = indexedDB.open('studybible');
  const db = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const tx = db.transaction('notes', 'readonly');
  const req = tx.objectStore('notes').get(id);
  const row = await new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
  db.close(); return row.targets[0].ref;
}, id);
if (repaired !== 'JHN.3.16') fail('the repair should be committed despite the failed refresh; got ' + repaired);
await p.evaluate(() => window.__restoreDataHealthIDB());
await p.reload();
await p.waitForSelector('h1');
await p.getByRole('button', { name: 'Run the check' }).click();
await p.getByText('Nothing wrong found.').waitFor();
await b.close();
console.log('datahealth committed-mutation/refresh-failure e2e ok');
