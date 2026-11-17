// Two devices, one account, the real server, a real browser's IndexedDB. Run as e2e/accounts.mjs is run:
//   VITE_ACCOUNTS=1 npx vite build --outDir dist-accounts
//   STATIC_DIR=dist-accounts PORT=8799 COOKIE_SECURE=false REGISTRATION=open DB_PATH=/tmp/acct-e2e.sqlite npx tsx server/index.ts &
//   BASE=http://127.0.0.1:8799 node e2e/sync-devices.mjs
// What it proves that the unit tests (which use an IndexedDB stand-in) cannot: in a real browser a local write is marked unsent
// and gets its identity, a push clears the mark, a pulled page arrives marked as sent, a deletion leaves its tombstone and its
// copy in Recently deleted only after the delete has committed, and the deletion reaches the other device.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8799';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const email = `sync${Date.now()}@example.com`, PW = 'a long enough passphrase';
const b = await chromium.launch();

async function device(name, how) {
  const ctx = await b.newContext({ viewport: { width: 1100, height: 1400 } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
  const p = await ctx.newPage(); p.setDefaultTimeout(20000);
  p.on('pageerror', (e) => fail(`${name}: page error: ${e.message}`));
  await p.goto(`${BASE}/#/account`); await p.waitForSelector('form.auth');
  const res = await p.evaluate(async ({ how, email, PW }) => {
    const r = await fetch(`/api/auth/${how}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-StudyBible': '1' }, body: JSON.stringify({ email, password: PW }) });
    return r.status;
  }, { how, email, PW });
  if (res >= 300) fail(`${name}: ${how} answered ${res}`);
  await p.reload();
  await p.getByRole('button', { name: 'Sync now' }).waitFor();
  const rows = (store) => p.evaluate(async (store) => {
    const req = indexedDB.open('studybible');
    const db = await new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
    const tx = db.transaction(store, 'readonly');
    const all = tx.objectStore(store).getAll();
    const out = await new Promise((res, rej) => { all.onsuccess = () => res(all.result); all.onerror = () => rej(all.error); });
    db.close(); return out;
  }, store);
  const sync = async () => {
    if (!/#\/account/.test(p.url())) { await p.goto(`${BASE}/#/account`); }
    // the page may already say nothing is waiting, so wait for the exchange itself, then for the page to settle
    const answered = p.waitForResponse((r) => r.url().includes('/api/sync') && r.request().method() === 'POST');
    await p.getByRole('button', { name: 'Sync now' }).click();
    if ((await answered).status() !== 200) fail(`${name}: the server refused the sync`);
    await p.getByText(/Last synced/).waitFor();
    await p.waitForTimeout(500);
    await p.getByText('Waiting to be sent from this device: 0.').waitFor().catch(async () => fail(`${name}: sync did not finish clean: ${(await p.locator('.page').innerText()).slice(0, 500)}`));
    // nothing may still be marked unsent once the page says nothing is waiting
    for (const t of ['notes', 'tombs']) { const left = (await rows(t)).filter((r) => r._unsent === 1); if (left.length) fail(`${name}: ${left.length} ${t} row(s) still marked unsent after a clean sync`); }
  };
  const newNote = async (title, body) => {
    await p.goto(`${BASE}/#/library`); await p.getByRole('button', { name: 'New note' }).click();
    await p.getByPlaceholder('Title (optional)').fill(title);
    await p.locator('textarea').first().fill(body);
    await p.getByRole('button', { name: /^Save/ }).click();
    for (let i = 0; i < 100 && !(await rows('notes')).some((n) => n.title === title); i++) await p.waitForTimeout(100);
    if (!(await rows('notes')).some((n) => n.title === title)) fail(`${name}: the note “${title}” was not saved`);
  };
  return { p, rows, sync, newNote, name };
}

const A = await device('A', 'register');
const B = await device('B', 'login');

// 1. a note written on A is a local change with an identity; a push clears the mark
await A.newNote('From device A', 'first text');
let a = (await A.rows('notes')).find((n) => n.title === 'From device A');
if (!a?.uid) fail('a new note must get a uid');
if (a._unsent !== 1) fail('a new note must be marked unsent, got ' + a._unsent);
await A.sync();
a = (await A.rows('notes')).find((n) => n.title === 'From device A');
if (a._unsent !== 0) fail('after a clean sync the note must be marked sent');

// 2. it arrives on B marked as sent, with the same identity and the same edit time
await B.sync();
const onB = (await B.rows('notes')).find((n) => n.uid === a.uid);
if (!onB) fail('the note did not reach device B');
if (onB._unsent !== 0 || onB.updatedAt !== a.updatedAt || onB.body !== 'first text') fail('the pulled note is not as the server holds it: ' + JSON.stringify(onB));
await B.p.goto(`${BASE}/#/library`); await B.p.getByText('From device A').first().waitFor();

// 3. B deletes it: the tombstone and the Recently-deleted copy are written (after the delete commits), and are unsent
await B.p.goto(`${BASE}/#/library/notes/${onB.id}`);
B.p.once('dialog', (d) => d.accept());
await B.p.getByRole('button', { name: 'Delete' }).click();
await B.p.waitForFunction(async () => {
  const req = indexedDB.open('studybible');
  const db = await new Promise((res) => { req.onsuccess = () => res(req.result); });
  const tx = db.transaction(['tombs', 'trash', 'notes'], 'readonly');
  const get = (s) => new Promise((res) => { const r = tx.objectStore(s).getAll(); r.onsuccess = () => res(r.result); });
  const [tombs, trash, notes] = await Promise.all([get('tombs'), get('trash'), get('notes')]);
  db.close(); return tombs.length === 1 && trash.length === 1 && notes.length === 0;
}, null, { timeout: 10000 }).catch(async () => fail('deleting must leave one tombstone and one Recently-deleted copy: ' + JSON.stringify({ tombs: await B.rows('tombs'), trash: (await B.rows('trash')).length, notes: (await B.rows('notes')).length })));
const tomb = (await B.rows('tombs'))[0];
if (tomb.uid !== a.uid || tomb._unsent !== 1 || !(tomb.updatedAt > a.updatedAt)) fail('the tombstone must name the note, be unsent, and be later than the note: ' + JSON.stringify(tomb));
await B.sync();

// 4. the deletion reaches A, which remembers it as already sent
await A.sync();
if ((await A.rows('notes')).some((n) => n.uid === a.uid)) fail('the note deleted on B is still on A');
const tombA = (await A.rows('tombs')).find((t) => t.uid === a.uid);
if (!tombA || tombA._unsent !== 0) fail('A must remember the deletion, marked as sent: ' + JSON.stringify(tombA));
if ((await A.rows('trash')).length) fail('a deletion that came from another device is not this device\'s own delete: nothing belongs in Recently deleted');

// 5. both devices write before either syncs: both notes survive on both, and a further sync sends nothing
await A.newNote('Written on A', 'a');
await B.newNote('Written on B', 'b');
await A.sync(); await B.sync(); await A.sync();
for (const d of [A, B]) {
  const titles = (await d.rows('notes')).map((n) => n.title).sort();
  if (JSON.stringify(titles) !== JSON.stringify(['Written on A', 'Written on B'])) fail(`${d.name} should hold both notes, has ${JSON.stringify(titles)}`);
}
console.log('sync-devices e2e ok');
await b.close();
