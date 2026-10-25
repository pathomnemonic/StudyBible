import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal('fetch', async (url: string) => {
  const m = /data\/(.*)$/.exec(url);
  try { return { ok: true, status: 200, json: async () => JSON.parse(readFileSync(`public/data/${m![1]}`, 'utf8')) }; } catch { return { ok: false, status: 404, json: async () => null }; }
});

describe('the saint of the day finds Butler’s life of the same saint', async () => {
  const { butlerFor } = await import('../src/study/butler');
  const days: [string, string][] = JSON.parse(readFileSync('tests/fixtures/litcal-saints-2026.json', 'utf8'));
  it('maps most of the General Calendar saints', async () => {
    let ok = 0;
    const miss: string[] = [];
    for (const [d, n] of days) { if (await butlerFor(n, d)) ok++; else miss.push(`${d} ${n}`); }
    if (process.env.SHOW_MISSES) console.log(miss.join('\n'));
    // the rest were canonised after Butler wrote (Pius X, John Paul II, Faustina…) or are not in his book
    expect(ok / days.length).toBeGreaterThan(0.65);
  });
  it('maps well-known cases to the right life', async () => {
    expect(await butlerFor('Saint Lucy of Syracuse, Virgin and Martyr', '2026-12-13')).toBe('12-13');
    expect(await butlerFor('Saint Anthony, Abbot', '2026-01-17')).toBe('01-17');
    expect(await butlerFor('Saint Thomas Aquinas, Priest and Doctor of the Church', '2026-01-28')).toBe('03-07');
    expect(await butlerFor('Saint Francis de Sales, Bishop and Doctor of the Church', '2026-01-24')).toBe('01-29');
  });
});
