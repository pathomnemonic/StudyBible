/**
 * A canonical text for any value: object keys sorted at EVERY level, array order kept, so the same data always gives the same text on every
 * device and two different values never give the same text. (JSON.stringify with a key list as the replacer also filters nested keys, which
 * made two different target conflicts look identical.) Empty values of every kind (undefined, null, "", [], false) are one value.
 */
export function canonical(v: unknown): string {
  const walk = (x: unknown): unknown => {
    if (x === undefined || x === null || x === '' || x === false) return null;
    if (Array.isArray(x)) return x.length ? x.map(walk) : null;
    if (typeof x === 'object') {
      const o = x as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(o).sort()) { const w = walk(o[k]); if (w !== null) out[k] = w; }
      return Object.keys(out).length ? out : null;
    }
    return x;
  };
  return JSON.stringify(walk(v));
}

/** do two values mean the same thing, whatever order their object keys were written in? */
export const sameValue = (a: unknown, b: unknown) => canonical(a) === canonical(b);
