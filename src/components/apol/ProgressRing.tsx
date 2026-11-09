/** A small circular progress indicator with the percentage in the middle. */
export default function ProgressRing({ pct, size = 52, label }: { pct: number; size?: number; label?: string }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg className="apt-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? `${pct} percent done`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={pct >= 100 ? 'var(--ok)' : 'var(--accent)'} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(c * Math.min(100, pct)) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size > 60 ? 15 : 12} fontWeight="600" fill="currentColor">{pct >= 100 ? '✓' : `${pct}%`}</text>
    </svg>
  );
}
