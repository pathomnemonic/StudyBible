import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Every piece of text the app ships is read for the kinds of damage that reached the reader: control characters, garbled accents,
// leaked code values and calendar-style region tags. (The RSV-2CE scan problem, the "[ US ]" saint name and similar all started
// in data, not in the screens.)
const ROOT = join(__dirname, '..', 'public', 'data');
const SKIP = new Set(['manifest.json', 'versification.json', 'search-index']);
const files: string[] = [];
const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); const s = statSync(p); if (s.isDirectory()) { if (!SKIP.has(f)) walk(p); } else if (f.endsWith('.json') && !SKIP.has(f)) files.push(p); } };
walk(ROOT);

const RULES: [RegExp, string][] = [
  [/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/, 'a control character'],
  [/Ã[\u0080-¿©¨«¼¶±³²]|â€[™œ\u009d\u0093\u0094\u0098]|Â[ -¿]/, 'garbled accents (text read with the wrong encoding)'],
  [/\[object [A-Za-z]+\]|\bNaN\b/, 'a leaked code value'],
  [/\{\{[^}]*\}\}/, 'an unfilled template'],
];
// Region tags such as "[ US ] Saint Frances Cabrini" are stripped by the app when it reads the calendar service; none should be stored.
const TAG = /^\s*\[\s?[A-Z]{2,4}\s?\]\s/;

function* strings(v: unknown, path = ''): Generator<[string, string]> {
  if (typeof v === 'string') yield [path, v];
  else if (Array.isArray(v)) for (let i = 0; i < v.length; i++) yield* strings(v[i], `${path}[${i}]`);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) yield* strings(x, `${path}.${k}`);
}

describe('shipped text', () => {
  it('has no control characters, garbled accents, leaked code values or region tags', () => {
    const bad: string[] = [];
    for (const f of files) {
      let data: unknown;
      try { data = JSON.parse(readFileSync(f, 'utf8')); } catch { bad.push(`${f.replace(ROOT, '')}: not valid JSON`); continue; }
      let n = 0;
      for (const [path, s] of strings(data)) {
        for (const [re, what] of RULES) if (re.test(s)) { if (n++ < 2) bad.push(`${f.replace(ROOT, '')}${path}: ${what}: ${JSON.stringify(s.slice(0, 60))}`); break; }
        if (TAG.test(s)) { if (n++ < 2) bad.push(`${f.replace(ROOT, '')}${path}: region tag: ${JSON.stringify(s.slice(0, 60))}`); }
      }
    }
    expect(bad.slice(0, 25)).toEqual([]);
  }, 120000);
});
