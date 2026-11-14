/** "27-30,355" → [27,28,29,30,355]. Kept free of app imports so scripts can use it. */
export function cccList(spec: string): number[] {
  const out: number[] = [];
  for (const part of spec.split(',')) {
    const [a, b] = part.trim().split('-').map(Number);
    if (!Number.isFinite(a)) continue;
    if (b && b >= a) for (let n = a; n <= b; n++) out.push(n); else out.push(a);
  }
  return out;
}
