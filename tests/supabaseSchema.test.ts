import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * The StudyBible schema and its functions, run in a real (in-process) Postgres with a stand-in for what Supabase provides: the roles, auth.users, auth.uid() and
 * auth.jwt(). A caller is simulated the way Supabase does it: the role is switched and the token's claims are set for the session.
 */
const MIGRATION = readFileSync('supabase/migrations/20261123000000_studybible_schema.sql', 'utf8');
const A = '00000000-0000-4000-8000-00000000000a', B = '00000000-0000-4000-8000-00000000000b', ANON = '00000000-0000-4000-8000-0000000000ff';
let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, created_at timestamptz default now());
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.jwt(), auth.uid() to anon, authenticated;
    insert into auth.users (id, email) values ('${A}', 'a@example.org'), ('${B}', 'b@example.org'), ('${ANON}', null);
  `);
  await db.exec(MIGRATION);
}, 60_000);
afterAll(async () => { await db.close(); });

/** run `fn` as a signed-in person (or as `anon`, or as nobody) */
async function as<T>(who: string | null, fn: () => Promise<T>, opts: { anonymous?: boolean; role?: 'authenticated' | 'anon' } = {}): Promise<T> {
  await db.exec(`reset role; select set_config('request.jwt.claims', '${who ? JSON.stringify({ sub: who, is_anonymous: !!opts.anonymous }) : ''}', false); set role ${opts.role ?? 'authenticated'};`);
  try { return await fn(); } finally { await db.exec('reset role'); }
}
const call = async (who: string | null, fn: string, ...args: unknown[]) => {
  const r = await db.query(`select studybible.${fn}(${args.map((_, i) => `$${i + 1}`).join(', ')}) as out`, args.map((a) => (typeof a === 'object' && a !== null ? JSON.stringify(a) : a)));
  return (r.rows[0] as { out: any }).out;
};
const sync = (who: string, cursor: number, changes: unknown[]) => as(who, () => call(who, 'sync', 1, cursor, changes));
const note = (uid: string, updatedAt: number, body = 'x') => ({ table: 'notes', uid, updatedAt, payload: { body } });
const gone = (uid: string, updatedAt: number) => ({ table: 'notes', uid, updatedAt, deleted: true, payload: {} });
const fails = async (p: Promise<unknown>, re: RegExp) => { await expect(p).rejects.toThrow(re); };

describe('sync', () => {
  it('stores a person’s changes and hands them to their other device, without echoing what the call just wrote', async () => {
    const first = await sync(A, 0, [note('n1', 100, 'hello'), note('n2', 101)]);
    expect(first.rejected).toBe(0); expect(first.changes).toEqual([]); expect(first.cursor).toBeGreaterThan(0);
    const other = await sync(A, 0, []);
    expect(other.changes.map((c: any) => c.uid)).toEqual(['n1', 'n2']);
    expect(other.changes[0]).toMatchObject({ table: 'notes', updatedAt: 100, deleted: false, payload: { body: 'hello' } });
    expect((await sync(A, other.cursor, [])).changes).toEqual([]); // nothing new after the cursor
  });
  it('lets a newer copy win and tells the sender about it, and keeps a deletion', async () => {
    await sync(A, 0, [note('w1', 500, 'new')]);
    const stale = await sync(A, 0, [note('w1', 400, 'old')]);
    expect(stale.changes.find((c: any) => c.uid === 'w1')?.payload.body).toBe('new'); // the held copy is newer, so it comes back
    await sync(A, 0, [gone('w1', 600)]);
    const all = await sync(A, 0, []);
    const w1 = all.changes.find((c: any) => c.uid === 'w1');
    expect(w1.deleted).toBe(true); expect(w1.updatedAt).toBe(600);
  });
  it('never shows one person’s rows to another', async () => {
    await sync(A, 0, [note('secret', 1, 'mine alone')]);
    const b = await sync(B, 0, []);
    expect(JSON.stringify(b.changes)).not.toContain('mine alone');
    const direct = await as(B, async () => (await db.query('select count(*)::int as n from studybible.records')).rows[0] as { n: number });
    expect(direct.n).toBe(0); // row-level security hides the others even from a direct select
  });
  it('refuses a wrong shape, an unknown table, an oversized record and a bad timestamp, and counts them', async () => {
    const r = await sync(B, 0, [
      { table: 'notes', uid: 'bad1', updatedAt: 1, payload: { body: 5 } },
      { table: 'nope', uid: 'bad2', updatedAt: 1, payload: {} },
      { table: 'notes', uid: 'bad3', updatedAt: 'soon', payload: { body: 'x' } },
      { table: 'notes', uid: 'x'.repeat(201), updatedAt: 1, payload: { body: 'x' } },
      { table: 'notes', uid: 'bad5', updatedAt: 1, payload: { body: 'y'.repeat(262_200) } },
      { table: 'userLinks', uid: 'bad6', updatedAt: 1, payload: { url: 'javascript:alert(1)', ref: 'x' } },
      { table: 'highlights', uid: 'ok1', updatedAt: 1, payload: { ref: 'JHN.1.1', color: 'yellow' } },
    ]);
    expect(r.rejected).toBe(6);
    const back = await sync(B, 0, []);
    expect(back.changes.map((c: any) => c.uid)).toEqual(['ok1']);
  });
  it('caps a clock set far ahead, so one device cannot win every later conflict', async () => {
    const far = Date.now() + 10 * 86_400_000;
    await sync(B, 0, [note('skew', far, 'from the future')]);
    const row = (await sync(B, 0, [])).changes.find((c: any) => c.uid === 'skew');
    expect(row.updatedAt).toBeLessThan(Date.now() + 6 * 60_000);
  });
  it('refuses more than 1000 changes in one call and a newer protocol', async () => {
    await fails(sync(B, 0, Array.from({ length: 1001 }, (_, i) => note(`big${i}`, 1))), /at most 1000/);
    await fails(as(B, () => call(B, 'sync', 2, 0, [])), /newer than the sync service/);
  });
  it('pages a long catch-up and says when there is more', async () => {
    const c = '00000000-0000-4000-8000-00000000000c';
    await db.exec(`insert into auth.users (id, email) values ('${c}', 'c@example.org')`);
    for (let k = 0; k < 3; k++) await sync(c, 0, Array.from({ length: 1000 }, (_, i) => note(`p${k}-${i}`, 5 + i)));
    const p1 = await sync(c, 0, []);
    expect(p1.changes).toHaveLength(2000); expect(p1.more).toBe(true);
    const p2 = await sync(c, p1.cursor, []);
    expect(p2.changes).toHaveLength(1000); expect(p2.more).toBe(false);
  }, 60_000);
  it('keeps the per-person limits', async () => {
    const d = '00000000-0000-4000-8000-00000000000d';
    await db.exec(`insert into auth.users (id, email) values ('${d}', 'd@example.org')`);
    await sync(d, 0, [note('first', 1)]);
    await db.exec(`update studybible.sync_state set records = 200000 where user_id = '${d}'`);
    expect((await sync(d, 0, [note('second', 1)])).rejected).toBe(1); // a new record past the count limit
    expect((await sync(d, 0, [note('first', 2, 'changed')])).rejected).toBe(0); // changing one already held is allowed
    await db.exec(`update studybible.sync_state set bytes = 104857600 where user_id = '${d}'`);
    expect((await sync(d, 0, [note('first', 3, 'a bit more')])).rejected).toBe(1); // past the size limit
  });
});

describe('who may do what', () => {
  it('refuses a call with no sign-in, an anonymous visitor, and the anon role', async () => {
    await fails(as(null, () => call(null, 'sync', 1, 0, [])), /not signed in/);
    await fails(as(ANON, () => call(ANON, 'sync', 1, 0, [note('x', 1)]), { anonymous: true }), /sign in with an email/);
    await fails(as(ANON, () => call(ANON, 'export_all'), { anonymous: true }), /sign in with an email/);
    await fails(as(ANON, () => call(ANON, 'delete_my_data'), { anonymous: true }), /sign in with an email/);
    await fails(as(A, () => call(A, 'sync', 1, 0, []), { role: 'anon' }), /permission denied/);
  });
  it('lets no one write a row, change a counter, or reach the helper functions directly', async () => {
    await fails(as(A, () => db.query(`insert into studybible.records (user_id, tbl, uid, updated_at, payload, seq) values ('${A}', 'notes', 'hack', 1, '{}', 1)`)), /permission denied/);
    await fails(as(A, () => db.query(`update studybible.records set payload = '{}'`)), /permission denied/);
    await fails(as(A, () => db.query(`delete from studybible.records`)), /permission denied/);
    await fails(as(A, () => db.query(`update studybible.sync_state set bytes = 0`)), /permission denied/);
    await fails(as(A, () => db.query(`insert into studybible.profiles (user_id) values ('${B}')`)), /permission denied/);
    await fails(as(A, () => call(A, 'caller')), /permission denied/);
    await fails(as(A, () => db.query(`select studybible.payload_ok('notes', '{}', false)`)), /permission denied/);
  });
  it('shows an anonymous or signed-out caller nothing, even by a direct select', async () => {
    await fails(as(ANON, () => db.query('select * from studybible.records'), { role: 'anon' }), /permission denied/);
  });
  it('touches nothing outside its own schema', async () => {
    const r = await db.query(`select table_schema, table_name from information_schema.tables where table_schema not in ('information_schema','pg_catalog','auth','studybible') and table_schema not like 'pg_%'`);
    expect(r.rows).toEqual([]);
  });
});

describe('download and delete', () => {
  it('downloads everything a person has (live records, their profile) and nothing of anyone else’s', async () => {
    const e = await as(A, () => call(A, 'export_all'));
    expect(e.format).toBe('studybible-supabase-export'); expect(e.user.email).toBe('a@example.org');
    const uids = e.records.map((r: any) => r.uid);
    expect(uids).toContain('n1'); expect(uids).not.toContain('w1'); // deleted ones are not exported
    expect(JSON.stringify(e)).not.toContain('from the future');
  });
  it('reports what a person is using', async () => {
    const s = await as(A, () => call(A, 'stats'));
    expect(s.limits).toEqual({ records: 200000, bytes: 104857600 }); expect(s.bytes).toBeGreaterThan(0);
    expect(s.tables.find((t: any) => t.table === 'notes').records).toBeGreaterThan(0);
  });
  it('sets and clears a display name', async () => {
    await as(A, () => call(A, 'set_display_name', '  Alex  '));
    expect((await as(A, () => call(A, 'export_all'))).user.name).toBe('Alex');
    await as(A, () => call(A, 'set_display_name', '   '));
    expect((await as(A, () => call(A, 'export_all'))).user.name).toBeNull();
  });
  it('"delete my StudyBible data" removes this app’s rows for that person only, and leaves the shared sign-in', async () => {
    await sync(B, 0, [note('bnote', 1, 'b stays')]);
    const out = await as(A, () => call(A, 'delete_my_data'));
    expect(out.ok).toBe(true); expect(out.recordsRemoved).toBeGreaterThan(0);
    expect((await db.query(`select count(*)::int as n from studybible.records where user_id = '${A}'`)).rows[0]).toEqual({ n: 0 });
    expect((await db.query(`select count(*)::int as n from studybible.sync_state where user_id = '${A}'`)).rows[0]).toEqual({ n: 0 });
    expect((await db.query(`select count(*)::int as n from studybible.profiles where user_id = '${A}'`)).rows[0]).toEqual({ n: 0 });
    expect((await db.query(`select count(*)::int as n from auth.users where id = '${A}'`)).rows[0]).toEqual({ n: 1 }); // the sign-in is untouched
    expect(JSON.stringify((await sync(B, 0, [])).changes)).toContain('b stays'); // and so is everyone else’s data
    // starting again from nothing works
    expect((await sync(A, 0, [note('again', 1)])).rejected).toBe(0);
  });
  it('removes everything when the shared sign-in itself is deleted', async () => {
    await db.exec(`delete from auth.users where id = '${B}'`);
    for (const t of ['records', 'sync_state', 'profiles']) expect((await db.query(`select count(*)::int as n from studybible.${t} where user_id = '${B}'`)).rows[0]).toEqual({ n: 0 });
  });
});
