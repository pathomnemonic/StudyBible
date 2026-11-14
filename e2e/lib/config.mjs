// Validation of the crawler's and runner's settings. An empty or nonsensical selection must FAIL, never "pass" with nothing checked.
export function parseShard(raw = '1/1') {
  const m = /^(\d+)\/(\d+)$/.exec(String(raw).trim());
  if (!m) throw new Error(`shard "${raw}" is not of the form I/N (for example 2/4)`);
  const i = Number(m[1]), n = Number(m[2]);
  if (n < 1 || i < 1 || i > n) throw new Error(`shard ${raw} is out of range: I must be between 1 and N, and N at least 1`);
  return [i, n];
}
export function parseConcurrency(raw = '5') {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 32) throw new Error(`concurrency "${raw}" must be a whole number from 1 to 32`);
  return n;
}
export function pickSizes(raw, all) {
  const want = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
  if (!want.length) throw new Error('SWEEP_SIZES is set but names no size');
  const known = new Set(all.map((s) => s.name));
  const bad = want.filter((w) => !known.has(w));
  if (bad.length) throw new Error(`unknown size${bad.length > 1 ? 's' : ''} in SWEEP_SIZES: ${bad.join(', ')} (known: ${[...known].join(', ')})`);
  return all.filter((s) => want.includes(s.name));
}
/** the routes this run covers; throws when ONLY / the shard leave nothing, or when the manifest itself is empty */
export function pickRoutes(all, only, [i, n]) {
  if (!all.length) throw new Error('the route manifest is empty');
  let r = only ? all.filter((x) => x.includes(only)) : all;
  if (!r.length) throw new Error(`ONLY="${only}" matches no route in the manifest`);
  r = r.filter((_, k) => k % n === i - 1);
  if (!r.length) throw new Error(`shard ${i}/${n} of ${only ? `the ${all.filter((x) => x.includes(only)).length} routes matching ONLY="${only}"` : `${all.length} routes`} is empty (more shards than routes)`);
  return r;
}
