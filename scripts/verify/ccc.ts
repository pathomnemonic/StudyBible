/**
 * Verify curated Catechism links against the text of each paragraph (single-paragraph pages from the
 * St. Charles Borromeo Catechism mirror, which republishes the Vatican text). Polite: one request per
 * paragraph, 2 s apart. The paragraph text is only used for the check and is never stored.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { CURATED, readJson, today, writeJson } from '../ingest/lib/util';

const norm = (s: string) =>
  s.toLowerCase().replace(/&[a-z#0-9]+;/g, ' ').replace(/[“”"‘’'`]/g, '').replace(/\s+/g, ' ').trim();

const file = join(CURATED, 'ccc-links.json');
const data = readJson(file);
let ok = 0;
let bad = 0;
const cache = new Map<number, string>();
for (const l of data.links) {
  let text = cache.get(l.para);
  if (text === undefined) {
    try {
      text = execFileSync('curl', ['-fsSL', '-m', '30', `https://www.scborromeo.org/ccc/para/${l.para}.htm`]).toString();
    } catch {
      text = '';
    }
    cache.set(l.para, text);
    await new Promise((r) => setTimeout(r, 2000));
  }
  const body = norm(text.replace(/<[^>]+>/g, ' '));
  const found = body.includes(norm(l.evidence));
  l.verified = found;
  l.verifiedOn = found ? today() : undefined;
  l.verifiedBy = found ? 'phrase found in paragraph text (scborromeo.org mirror of the Vatican text)' : undefined;
  found ? ok++ : bad++;
  console.log(found ? '✓' : '✗', l.ref, 'CCC', l.para, found ? '' : `(missing: "${l.evidence}")`);
}
writeJson(file, data, true);
console.log(`verified ${ok}, failed ${bad}`);
