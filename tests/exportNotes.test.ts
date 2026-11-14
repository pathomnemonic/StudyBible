import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
vi.stubGlobal('location', { origin: 'https://example.org' });

describe('exporting notes', () => {
  beforeEach(async () => { await Dexie.delete('studybible'); vi.resetModules(); store.clear(); });
  it('exports every note, or only those with a tag, keeping the passage reference', async () => {
    const { db } = await import('../src/db/db');
    const { exportNotesMarkdown } = await import('../src/db/ops');
    const t = Date.now();
    await db.notes.add({ title: 'Prayer one', body: 'Lord, hear.', kind: 'prayer', targets: [{ type: 'passage', ref: 'PSA.50.1' }], tags: ['prayer'], createdAt: t, updatedAt: t } as never);
    await db.notes.add({ title: 'Question', body: 'Why?', kind: 'question', targets: [], tags: ['questions'], createdAt: t, updatedAt: t + 1 } as never);
    const all = await exportNotesMarkdown();
    expect(all).toContain('Prayer one');
    expect(all).toContain('Question');
    const some = await exportNotesMarkdown({ tag: 'prayer' });
    expect(some).toContain('Prayer one');
    expect(some).toContain('Lord, hear.');
    expect(some).not.toContain('Why?');
    expect(some).toMatch(/Psalm|PSA/);
  });
});
