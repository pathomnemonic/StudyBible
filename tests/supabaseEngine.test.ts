import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import Dexie from 'dexie';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
vi.stubGlobal('navigator', { language: 'en-US', storage: undefined });

/** the whole path: the app's sync engine → the Supabase adapter → the studybible SQL functions, in a real Postgres. Only Supabase's own plumbing is stood in. */
const ME = '00000000-0000-4000-8000-0000000000a1';
let pg: PGlite;
beforeAll(async () => {
  pg = new PGlite();
  await pg.exec(`
    create role anon nologin; create role authenticated nologin; create schema auth;
    create table auth.users (id uuid primary key, email text, created_at timestamptz default now());
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
    grant usage on schema auth to anon, authenticated; grant execute on function auth.jwt(), auth.uid() to anon, authenticated;
    insert into auth.users (id, email) values ('${ME}', 'me@example.org');`);
  for (const f of ['20261123000000_studybible_schema.sql', '20261123010000_studybible_accounts.sql']) await pg.exec(readFileSync(`supabase/migrations/${f}`, 'utf8'));
  await pg.exec(`set role authenticated; select set_config('request.jwt.claims', '${JSON.stringify({ sub: ME, is_anonymous: false })}', false); select studybible.create_account('Me'); reset role;`);
}, 60_000);
afterAll(async () => { await pg.close(); });

const asMe = `reset role; select set_config('request.jwt.claims', '${JSON.stringify({ sub: ME, is_anonymous: false })}', false); set role authenticated;`;
const client = {
  auth: { getSession: async () => ({ data: { session: { user: { id: ME, email: 'me@example.org', created_at: '2026-01-01T00:00:00Z' }, expires_at: 2e9 } }, error: null }) },
  schema: () => ({
    rpc: async (fn: string, args: Record<string, unknown>) => {
      const names = Object.keys(args);
      await pg.exec(asMe);
      try {
        const r = await pg.query(`select studybible.${fn}(${names.map((_, i) => `$${i + 1}`).join(', ')}) as out`, names.map((n) => (typeof args[n] === 'object' ? JSON.stringify(args[n]) : args[n])));
        return { data: (r.rows[0] as { out: unknown }).out, error: null };
      } catch (e: any) { return { data: null, error: { message: e.message, code: e.code } }; } finally { await pg.exec('reset role'); }
    },
  }),
};

async function device(work: (d: { db: any; sync: () => Promise<{ pushed: number; pulled: number; rejected: number }> }) => Promise<void>) {
  await Dexie.delete('studybible'); vi.resetModules(); for (const k of [...store.keys()]) if (k.startsWith('studybible.sync')) store.delete(k);
  const { db } = await import('../src/db/db');
  const { runSync } = await import('../src/sync/engine');
  const { createSupabaseApi } = await import('../src/sync/supabaseApi');
  const backend = createSupabaseApi(async () => client);
  await work({ db, sync: () => runSync(ME, backend) });
}

describe('the sync engine against the Supabase functions', () => {
  it('carries notes, a highlight, an edit and a deletion across three fresh devices', async () => {
    await device(async ({ db, sync }) => {
      await db.notes.add({ kind: 'note', title: 'Kept', body: 'Fiat', tags: ['t'], chapterKeys: [], targets: [], createdAt: 1, updatedAt: 10 } as any);
      await db.notes.add({ kind: 'note', title: 'Dropped', body: 'x', tags: [], chapterKeys: [], targets: [], createdAt: 1, updatedAt: 11 } as any);
      await db.highlights.add({ ref: 'JHN.1.1', color: 'yellow', createdAt: 1, updatedAt: 12 } as any);
      const r = await sync();
      expect(r.pushed).toBeGreaterThanOrEqual(3); expect(r.rejected).toBe(0);
    });
    await device(async ({ db, sync }) => {
      expect((await sync()).pulled).toBeGreaterThanOrEqual(3);
      const all = await db.notes.toArray();
      expect(all.map((n: any) => n.title).sort()).toEqual(['Dropped', 'Kept']);
      expect(await db.highlights.count()).toBe(1);
      const keep = all.find((n: any) => n.title === 'Kept'), drop = all.find((n: any) => n.title === 'Dropped');
      await db.notes.update(keep.id, { body: 'Fiat, edited', updatedAt: Date.now() });
      await db.notes.delete(drop.id);
      await sync();
    });
    await device(async ({ db, sync }) => {
      await sync();
      const notes = await db.notes.toArray();
      expect(notes.map((n: any) => n.title)).toEqual(['Kept']);
      expect(notes[0].body).toBe('Fiat, edited');
      expect(await sync()).toMatchObject({ pushed: 0, pulled: 0 }); // nothing new: nothing sent, nothing received
    });
  });
  it('after deleting the StudyBible account, sync is refused until a new one is created, which starts empty', async () => {
    await pg.exec(asMe);
    await pg.query('select studybible.delete_account()');
    await pg.exec('reset role');
    await device(async ({ sync }) => { await expect(sync()).rejects.toThrow(/do not have a StudyBible account/); }); // no account: refused
    await pg.exec(asMe); await pg.query("select studybible.create_account('Me again')"); await pg.exec('reset role');
    await device(async ({ db, sync }) => {
      expect((await sync()).pulled).toBe(0);
      expect(await db.notes.count()).toBe(0);
      await db.notes.add({ kind: 'note', body: 'new start', tags: [], chapterKeys: [], targets: [], createdAt: 1, updatedAt: 99 } as any);
      expect((await sync()).rejected).toBe(0);
    });
  });
});
