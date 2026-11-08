import { useMemo } from 'react';
import { encodeQr } from '../lib/qr';

/** A QR code as an inline picture. Always dark on white with a quiet zone of four squares, so it scans in the dark theme too. */
export default function QrCode({ text, label, size = 220 }: { text: string; label?: string; size?: number }) {
  const qr = useMemo(() => { try { return encodeQr(text); } catch { return null; } }, [text]);
  if (!qr) return null;
  const Q = 4, n = qr.size + Q * 2;
  let d = '';
  qr.modules.forEach((row, r) => { let c = 0; while (c < row.length) { if (!row[c]) { c++; continue; } let e = c; while (e < row.length && row[e]) e++; d += `M${c + Q} ${r + Q}h${e - c}v1h${-(e - c)}z`; c = e; } });
  return (
    <svg className="lv-qr" role="img" aria-label={label ?? 'QR code for the join link'} viewBox={`0 0 ${n} ${n}`} width={size} height={size} shapeRendering="crispEdges" style={{ width: `min(${size}px, 70vw)`, height: 'auto', background: '#fff', borderRadius: 8 }}>
      <rect width={n} height={n} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}
