import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEditions } from '../data/EditionsContext';
import { useSettings } from '../lib/store';
import { passageText } from '../lib/bibleText';
import { formatRef, parseRefId, parseRefs, refId } from '../lib/refs';
import { convertRef } from '../lib/versification';
import { readerPath } from '../lib/nav';
import { useToast } from '../components/Toast';

const STYLES: Record<string, { bg: string; fg: string; accent: string }> = {
  parchment: { bg: '#f6efe0', fg: '#2a2218', accent: '#8a2f39' },
  night: { bg: '#15120f', fg: '#efe8da', accent: '#e28d95' },
  white: { bg: '#ffffff', fg: '#111111', accent: '#8a2f39' },
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

/** A shareable image and text for a passage. The image is drawn on your device; nothing is uploaded. */
export default function SharePage() {
  const [sp] = useSearchParams();
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const toast = useToast();
  const [refText, setRefText] = useState(sp.get('ref') ?? 'John 3:16');
  const [edId, setEdId] = useState(s.defaultEdition === 'vulgate' ? 'dra' : s.defaultEdition);
  const [style, setStyle] = useState('parchment');
  const [verse, setVerse] = useState<{ text: string; label: string; link: string } | null>(null);
  const [err, setErr] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const ed = get(edId) ?? editions[0];

  useEffect(() => {
    let live = true;
    (async () => {
      setErr('');
      const anchor = parseRefId(refText);
      const p = anchor ? null : parseRefs(refText);
      const ref = anchor ?? (p && p.ok ? convertRef('kjv', 'vulgate', p.refs[0].ref).ref : null);
      if (!ref) return live && (setVerse(null), setErr('Type a reference such as John 3:16.'));
      const vs = await passageText(ed, ref, 6);
      if (!live) return;
      if (!vs.length) return setVerse(null), setErr('That passage is not in this translation.');
      const base = location.href.split('#')[0];
      setVerse({ text: vs.map((v) => v.text).join(' '), label: `${formatRef(anchor ? ref : p!.ok ? p!.refs[0].ref : ref, { noDual: true })} (${ed.shortName})`, link: `${base}#${readerPath(ed, ref)}` });
    })();
    return () => {
      live = false;
    };
  }, [refText, ed.id]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !verse) return;
    const W = 1080;
    const st = STYLES[style];
    const ctx = c.getContext('2d')!;
    const pad = 90;
    ctx.font = '500 52px Georgia, serif';
    const lines = wrap(ctx, verse.text.length > 420 ? verse.text.slice(0, verse.text.lastIndexOf(' ', 420)) + '…' : verse.text, W - pad * 2);
    const H = Math.max(1080, pad * 2 + lines.length * 74 + 200);
    c.width = W;
    c.height = H;
    ctx.fillStyle = st.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = st.accent;
    ctx.fillRect(pad, pad - 30, 90, 6);
    ctx.fillStyle = st.fg;
    ctx.font = '500 52px Georgia, serif';
    ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, pad, pad + 20 + i * 74));
    ctx.fillStyle = st.accent;
    ctx.font = '600 38px system-ui, sans-serif';
    ctx.fillText(verse.label, pad, pad + 50 + lines.length * 74);
    ctx.fillStyle = st.fg;
    ctx.globalAlpha = 0.6;
    ctx.font = '28px system-ui, sans-serif';
    ctx.fillText(ed.attribution?.slice(0, 70) ?? ed.name, pad, H - pad - 10);
    ctx.globalAlpha = 1;
  }, [verse, style, ed.id]);

  const png = () =>
    canvas.current?.toBlob((b) => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'verse.png';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  const copy = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
      toast('Copied.');
    } catch {
      toast('Copy was blocked by the browser.', 'error');
    }
  };
  const share = async () => {
    if (!verse) return;
    try {
      await navigator.share?.({ title: verse.label, text: `“${verse.text}” — ${verse.label}`, url: verse.link });
    } catch {
      /* cancelled */
    }
  };
  return (
    <div className="page">
      <h1>Share a verse</h1>
      <div className="row" style={{ marginBottom: 8 }}>
        <input type="text" value={refText} onChange={(e) => setRefText(e.target.value)} aria-label="Reference" style={{ flex: 1, minWidth: 180 }} />
        <select value={edId} onChange={(e) => setEdId(e.target.value)} aria-label="Translation">{editions.filter((e) => e.language === 'en' || e.id === 'vulgate').map((e) => <option key={e.id} value={e.id}>{e.shortName}</option>)}</select>
        <select value={style} onChange={(e) => setStyle(e.target.value)} aria-label="Card style">{Object.keys(STYLES).map((k) => <option key={k}>{k}</option>)}</select>
      </div>
      {err && <p className="notice">{err}</p>}
      {verse && (
        <>
          <canvas ref={canvas} style={{ width: '100%', maxWidth: 520, borderRadius: 12, border: '1px solid var(--border)' }} role="img" aria-label={`Verse card: ${verse.text} ${verse.label}`} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn primary" onClick={png}>Download image</button>
            <button className="btn" onClick={() => copy(`“${verse.text}” — ${verse.label}`)}>Copy text</button>
            <button className="btn" onClick={() => copy(verse.link)}>Copy link</button>
            {'share' in navigator && <button className="btn" onClick={share}>Share…</button>}
          </div>
          <p className="muted small">The image is made on your device. Only public-domain translations are offered, so you may share them freely; the link opens this passage in the app.</p>
        </>
      )}
    </div>
  );
}
