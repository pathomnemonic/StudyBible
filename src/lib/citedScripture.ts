import { parseRefs, type Ref } from './refs';

/** The Bible passages named in a list of Catechism footnotes ("Jn 6:51; cf. Mt 26:26"), first mention first, each once. Anything that does not parse as a passage is ignored. */
export function citedScripture(footnotes: string[], max = 6): Ref[] {
  const seen = new Set<string>();
  const out: Ref[] = [];
  for (const f of footnotes) {
    for (const piece of f.split(/[;.]\s*/)) {
      const m = /^\s*(?:cf\.?\s*)?((?:[1-3]\s)?[A-Z][a-z]+\.?\s*\d+(?:[:,]\s*\d+(?:[-–]\d+)?)?)/.exec(piece);
      if (!m) continue;
      const r = parseRefs(m[1]);
      if (!r.ok) continue;
      const ref = r.refs[0].ref;
      const key = `${ref.book}.${ref.c1}.${ref.v1 ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(ref);
      if (out.length >= max) return out;
    }
  }
  return out;
}
