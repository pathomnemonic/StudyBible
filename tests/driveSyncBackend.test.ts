import { describe, expect, it } from 'vitest';
import { COMPACT_AT, DriveSyncBackend, FILES_PER_CALL, type DriveFile, type DriveFiles, type SeenStore } from '../src/sync/driveSyncBackend';
import type { WireChange } from '../src/sync/api';

/** a pretend Drive app folder: a list of files, with creation times that only go up */
class FakeDrive implements DriveFiles {
  files = new Map<string, { f: DriveFile; body: string }>();
  clock = 1_000; n = 0; hidden = new Set<string>(); failRemove = false;
  async list() { return [...this.files.values()].map((x) => x.f).filter((f) => !this.hidden.has(f.id)); }
  async read(id: string) { const x = this.files.get(id); if (!x) throw new Error('404'); return x.body; }
  async create(name: string, body: string) { const f = { id: `id${++this.n}`, name, createdTime: (this.clock += 10), size: body.length }; this.files.set(f.id, { f, body }); return f; }
  async remove(id: string) { if (this.failRemove) throw new Error('403'); this.files.delete(id); }
}
const memSeen = (): SeenStore => { let s = new Set<string>(); return { load: () => new Set(s), save: (x) => { s = new Set(x); } }; };
const device = (drive: FakeDrive, id: string) => new DriveSyncBackend(drive, id, memSeen());
const note = (uid: string, updatedAt: number, body = 'x'): WireChange => ({ table: 'notes', uid, updatedAt, payload: { body } });
const gone = (uid: string, updatedAt: number): WireChange => ({ table: 'notes', uid, updatedAt, deleted: true, payload: {} });
const pull = async (d: DriveSyncBackend) => { const all: WireChange[] = []; let cur = 0; for (;;) { const r = await d.sync(cur, []); all.push(...r.changes); cur = r.cursor; if (!r.more) return all; } };

describe('sync through a Drive app folder', () => {
  it('carries a change from one device to another, and not back to the sender', async () => {
    const drive = new FakeDrive(); const a = device(drive, 'aaaa'), b = device(drive, 'bbbb');
    const r = await a.sync(0, [note('n1', 5, 'hello')]);
    expect(r.changes).toEqual([]); expect(r.rejected).toBe(0);
    expect((await b.sync(0, [])).changes).toEqual([note('n1', 5, 'hello')]);
    expect((await a.sync(0, [])).changes).toEqual([]); // its own push is not handed back
  });
  it('reads each file once, so a second pull brings nothing new', async () => {
    const drive = new FakeDrive(); const a = device(drive, 'aaaa'), b = device(drive, 'bbbb');
    await a.sync(0, [note('n1', 5)]);
    expect((await b.sync(0, [])).changes).toHaveLength(1);
    expect((await b.sync(0, [])).changes).toHaveLength(0);
    await a.sync(0, [note('n2', 6)]);
    expect((await b.sync(0, [])).changes.map((c) => c.uid)).toEqual(['n2']);
  });
  it('lets two devices write at the same moment without touching each other’s files', async () => {
    const drive = new FakeDrive(); const a = device(drive, 'aaaa'), b = device(drive, 'bbbb'), c = device(drive, 'cccc');
    await Promise.all([a.sync(0, [note('a1', 1)]), b.sync(0, [note('b1', 2)])]);
    expect((await pull(c)).map((x) => x.uid).sort()).toEqual(['a1', 'b1']);
    expect(drive.files.size).toBe(2);
  });
  it('pages a long catch-up like the server does', async () => {
    const drive = new FakeDrive(); const a = device(drive, 'aaaa'), late = device(drive, 'zzzz');
    for (let i = 0; i < FILES_PER_CALL + 5; i++) await a.sync(0, [note(`n${i}`, i + 1)]);
    const first = await late.sync(0, []);
    expect(first.more).toBe(true); expect(first.changes).toHaveLength(FILES_PER_CALL);
    expect((await pull(late)).length).toBe(5); // the rest, from where it stopped
  });
  it('skips a file it cannot read or does not understand, for good, and keeps going', async () => {
    const drive = new FakeDrive(); const a = device(drive, 'aaaa'), b = device(drive, 'bbbb');
    await drive.create('sbs-chg-xxxx-garbage.json', '{not json');
    await drive.create('sbs-chg-yyyy-future.json', JSON.stringify({ v: 2, device: 'yyyy', changes: [note('z', 1)] }));
    await a.sync(0, [note('ok', 3)]);
    expect((await b.sync(0, [])).changes.map((c) => c.uid)).toEqual(['ok']);
  });
  it('sends deletions as deletions', async () => {
    const drive = new FakeDrive(); const a = device(drive, 'aaaa'), b = device(drive, 'bbbb');
    await a.sync(0, [note('n1', 1)]); await a.sync(0, [gone('n1', 2)]);
    const got = await pull(b);
    expect(got.find((c) => c.deleted)?.uid).toBe('n1');
  });

  describe('compaction', () => {
    const fill = async (drive: FakeDrive, a: DriveSyncBackend, n = COMPACT_AT + 2) => { for (let i = 0; i < n; i++) await a.sync(0, [note(`n${i % 7}`, i + 1, `v${i}`)]); };
    it('does nothing while the log is short', async () => {
      const drive = new FakeDrive(); const a = device(drive, 'aaaa');
      await fill(drive, a, 5);
      expect(await a.compact()).toBeNull();
    });
    it('folds many pushes into one snapshot that keeps the newest version of every record and every deletion', async () => {
      const drive = new FakeDrive(); const a = device(drive, 'aaaa'), fresh = device(drive, 'bbbb');
      await fill(drive, a);
      await a.sync(0, [gone('n1', 9999)]);
      const before = drive.files.size;
      const r = await a.compact();
      expect(r!.removed).toBeGreaterThan(40); expect(drive.files.size).toBeLessThan(before / 10);
      expect(await a.logLength()).toBe(0);
      const got = await pull(fresh);
      const byUid = new Map(got.map((c) => [c.uid, c]));
      expect(byUid.get('n1')?.deleted).toBe(true);
      expect(byUid.get('n0')?.payload).toEqual({ body: `v${[...Array(COMPACT_AT + 2).keys()].filter((i) => i % 7 === 0).pop()}` }); // the last write to n0
    });
    it('gives a device that was away through the whole compaction the same state as one that never left', async () => {
      const drive = new FakeDrive(); const a = device(drive, 'aaaa'), away = device(drive, 'bbbb'), steady = device(drive, 'cccc');
      await a.sync(0, [note('early', 1, 'first')]);
      expect((await away.sync(0, [])).changes).toHaveLength(1);
      const steadyAll = await pull(steady);
      await fill(drive, a); await a.compact();
      await a.sync(0, [note('after', 99)]);
      const lateAway = await pull(away); const lateSteady = await pull(steady);
      expect(steadyAll).toHaveLength(1);
      const norm = (x: WireChange[]) => new Map(x.map((c) => [c.uid, c.updatedAt]));
      expect(norm(lateAway).get('after')).toBe(99); expect(norm(lateSteady).get('after')).toBe(99);
      expect(norm(lateAway).get('n3')).toBe(norm(lateSteady).get('n3'));
    });
    it('does not make the compacting device lose what it had not read yet', async () => {
      const drive = new FakeDrive(); const a = device(drive, 'aaaa'), b = device(drive, 'bbbb');
      for (let i = 0; i < COMPACT_AT + 1; i++) await b.sync(0, [note(`b${i}`, i + 1)]);
      await a.compact(); // a never pulled b's changes before folding them away
      expect((await pull(a)).filter((c) => c.uid.startsWith('b'))).toHaveLength(COMPACT_AT + 1);
    });
    it('is safe when two devices compact together', async () => {
      const drive = new FakeDrive(); const a = device(drive, 'aaaa'), b = device(drive, 'bbbb'), fresh = device(drive, 'dddd');
      await fill(drive, a);
      await Promise.all([a.compact(), b.compact()]);
      const got = await pull(fresh);
      expect(new Set(got.map((c) => c.uid))).toEqual(new Set(['n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6']));
    });
    it('never deletes a file it could not understand, and survives a failed delete', async () => {
      const drive = new FakeDrive(); const a = device(drive, 'aaaa');
      const odd = await drive.create('sbs-chg-qqqq-weird.json', 'nope');
      await fill(drive, a);
      drive.failRemove = true; await a.compact(); drive.failRemove = false;
      expect(drive.files.has(odd.id)).toBe(true);
      await a.compact();
      expect(drive.files.has(odd.id)).toBe(true);
    });
  });
  it('can remove everything it ever wrote', async () => {
    const drive = new FakeDrive(); const a = device(drive, 'aaaa');
    await a.sync(0, [note('n1', 1)]); await a.sync(0, [note('n2', 2)]);
    expect(await a.deleteAll()).toBe(2); expect(drive.files.size).toBe(0);
  });
});
