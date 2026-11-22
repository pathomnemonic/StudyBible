/** "PT1H2M10S" → 3730 seconds; "P0D" (a live stream that has not started) → 0. A missing or unreadable value is also 0: YouTube sends no duration at all for some items (an upcoming premiere, for one). */
export function isoSeconds(d: string | null | undefined): number {
  if (typeof d !== 'string') return 0;
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(d.trim());
  if (!m) return 0;
  return (+(m[1] ?? 0)) * 86400 + (+(m[2] ?? 0)) * 3600 + (+(m[3] ?? 0)) * 60 + +(m[4] ?? 0);
}
