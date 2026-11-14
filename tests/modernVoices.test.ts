import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const f = JSON.parse(readFileSync('public/data/modern/quotes.json', 'utf8'));
describe('quotations from modern books stay short and credited', () => {
  it('each quotation is at most 45 words and names a known book and topic', () => {
    for (const q of f.quotes) {
      expect(q.text.split(/\s+/).length, q.text).toBeLessThanOrEqual(45);
      expect(f.books[q.book], q.book).toBeTruthy();
      expect(f.topics[q.topic], q.topic).toBeTruthy();
    }
  });
  it('no book contributes more than 12 quotations in all, and each book names author, title, publisher and year', () => {
    const n: Record<string, number> = {};
    for (const q of f.quotes) n[q.book] = (n[q.book] ?? 0) + 1;
    for (const [b, c] of Object.entries(n)) expect(c, b).toBeLessThanOrEqual(12);
    for (const b of Object.values<any>(f.books)) for (const k of ['author', 'title', 'publisher', 'year']) expect(b[k]).toBeTruthy();
  });
});
