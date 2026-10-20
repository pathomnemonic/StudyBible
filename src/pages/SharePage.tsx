import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEditions } from '../data/EditionsContext';
import { useSettings } from '../lib/store';
import { passageText } from '../lib/bibleText';
import { formatRef, parseRefId, parseRefs, refId } from '../lib/refs';
import { convertRef } from '../lib/versification';
import { readerPath } from '../lib/nav';
import { useToast } from '../components/Toast';
import { getJson } from '../data/loader';

interface Painting { id: number; theme: string; title: string; artist: string; date: string; credit: string; img: string; file: string; page: string }

const BACKGROUNDS: Record<string, { label: string; stops: string[]; fg: string; accent: string }> = {
  twilight: { label: 'Twilight', stops: ['#1b1740', '#0b0b1e'], fg: '#f1edff', accent: '#b9a8ff' },
  dawn: { label: 'Dawn', stops: ['#f7d9c4', '#c9b8e8'], fg: '#2a1f3d', accent: '#7a3b69' },
  ocean: { label: 'Ocean', stops: ['#0f3a4a', '#061a24'], fg: '#e8f6fa', accent: '#7fd0e0' },
  forest: { label: 'Forest', stops: ['#1f3b2c', '#0b1a12'], fg: '#eef6ee', accent: '#9fd6a8' },
  parchment: { label: 'Parchment', stops: ['#f6efe0', '#eadcbc'], fg: '#2a2218', accent: '#8a2f39' },
  paper: { label: 'Paper', stops: ['#ffffff', '#f2f2f2'], fg: '#111111', accent: '#8a2f39' },
};
const FONTS: Record<string, { label: string; css: string }> = {
  serif: { label: 'Classic', css: "'Cormorant Garamond', Georgia, serif" },
  book: { label: 'Book', css: "Georgia, 'Times New Roman', serif" },
  sans: { label: 'Clean', css: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
};
const SIZES: Record<string, { label: string; w: number; h: number }> = {
  square: { label: 'Square', w: 1080, h: 1080 },
  portrait: { label: 'Portrait', w: 1080, h: 1350 },
  story: { label: 'Story', w: 1080, h: 1920 },
  wide: { label: 'Wide', w: 1600, h: 900 },
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split(/\n/)) {
    let line = '';
    for (const w of para.split(/\s+/).filter(Boolean)) {
      const t = line ? `${line} ${w}` : w;
      if (ctx.measureText(t).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else line = t;
    }
    lines.push(line);
  }
  return lines;
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('image'));
    i.src = src;
  });

/** A shareable image and text for a passage, with your own words and an optional public-domain painting. Drawn on your device; nothing is uploaded. */
export default function SharePage() {
  const [sp] = useSearchParams();
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const toast = useToast();
  const [refText, setRefText] = useState(sp.get('ref') ?? 'John 3:16');
  const [edId, setEdId] = useState(s.defaultEdition === 'vulgate' ? 'dra' : s.defaultEdition);
  const [bg, setBg] = useState('twilight');
  const [font, setFont] = useState('serif');
  const [size, setSize] = useState('square');
  const [align, setAlign] = useState<'left' | 'center'>('center');
  const [thoughts, setThoughts] = useState('');
  const [art, setArt] = useState<Painting[]>([]);
  const [paint, setPaint] = useState<Painting | null>(null);
  const [dim, setDim] = useState(62);
  const [theme, setTheme] = useState('All');
  const [imgErr, setImgErr] = useState(false);
  const [verse, setVerse] = useState<{ text: string; label: string; link: string } | null>(null);
  const [err, setErr] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const ed = get(edId) ?? editions[0];

  useEffect(() => {
    getJson<{ works: Painting[] }>('art.json', true).then((a) => setArt(a?.works ?? [])).catch(() => setArt([]));
  }, []);

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
    let live = true;
    (async () => {
      const { w: W, h: H } = SIZES[size];
      const st = BACKGROUNDS[bg];
      const onArt = !!paint && !imgErr;
      const fg = onArt ? '#ffffff' : st.fg;
      const accent = onArt ? '#f3e3b0' : st.accent;
      let img: HTMLImageElement | null = null;
      if (paint) {
        try {
          img = await loadImage(import.meta.env.BASE_URL + paint.file);
          setImgErr(false);
        } catch {
          setImgErr(true);
        }
      }
      if (!live) return;
      c.width = W;
      c.height = H;
      const ctx = c.getContext('2d')!;
      if (img) {
        const k = Math.max(W / img.width, H / img.height);
        ctx.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k);
        ctx.fillStyle = `rgba(6,6,16,${dim / 100})`;
        ctx.fillRect(0, 0, W, H);
      } else {
        const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
        g.addColorStop(0, st.stops[0]);
        g.addColorStop(1, st.stops[1]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      const pad = Math.round(W * 0.09);
      const maxW = W - pad * 2;
      const verseText = verse.text.length > 520 ? verse.text.slice(0, verse.text.lastIndexOf(' ', 520)) + '…' : verse.text;
      const fam = FONTS[font].css;
      const note = thoughts.trim();
      // fit the verse (and thoughts) into the space available
      let fs = Math.round(W * 0.062);
      let lines: string[] = [];
      let nfs = 0;
      let nlines: string[] = [];
      const avail = H - pad * 2 - 150;
      for (; fs >= 22; fs -= 2) {
        ctx.font = `500 ${fs}px ${fam}`;
        lines = wrap(ctx, `“${verseText}”`, maxW);
        nfs = Math.round(fs * 0.62);
        ctx.font = `italic 400 ${nfs}px ${fam}`;
        nlines = note ? wrap(ctx, note, maxW) : [];
        const total = lines.length * fs * 1.34 + (note ? 40 + nlines.length * nfs * 1.4 : 0) + fs;
        if (total <= avail) break;
      }
      const textH = lines.length * fs * 1.34 + fs * 0.9 + (note ? 40 + nlines.length * nfs * 1.4 : 0);
      let y = Math.max(pad, (H - textH) / 2 - 30);
      ctx.textBaseline = 'top';
      ctx.textAlign = align;
      const x = align === 'center' ? W / 2 : pad;
      ctx.fillStyle = fg;
      ctx.font = `500 ${fs}px ${fam}`;
      for (const l of lines) {
        ctx.fillText(l, x, y);
        y += fs * 1.34;
      }
      y += fs * 0.3;
      ctx.fillStyle = accent;
      ctx.font = `600 ${Math.round(fs * 0.5)}px system-ui, sans-serif`;
      ctx.fillText(verse.label, x, y);
      y += fs * 0.6;
      if (note) {
        y += 40;
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.9;
        ctx.font = `italic 400 ${nfs}px ${fam}`;
        for (const l of nlines) {
          ctx.fillText(l, x, y);
          y += nfs * 1.4;
        }
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.7;
      const cfs = Math.round(W * 0.019);
      ctx.font = `${cfs}px system-ui, sans-serif`;
      ctx.textBaseline = 'alphabetic';
      const credit = [ed.attribution ?? ed.name, img && paint ? `Painting: ${paint.title}, ${paint.artist}, ${paint.date}. The Met, public domain.` : ''].filter(Boolean).join('  ·  ');
      const cl = wrap(ctx, credit, maxW).slice(0, 3);
      cl.forEach((l, i) => ctx.fillText(l, x, H - pad * 0.55 - (cl.length - 1 - i) * cfs * 1.35));
      ctx.globalAlpha = 1;
    })();
    return () => {
      live = false;
    };
  }, [verse, bg, font, size, align, thoughts, paint, dim, ed.id]);

  const png = () =>
    canvas.current?.toBlob((b) => {
      if (!b) return toast('The picture could not be exported. Try a different background.', 'error');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'verse.png';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  const fullText = () => (verse ? `“${verse.text}” — ${verse.label}${thoughts.trim() ? `\n\n${thoughts.trim()}` : ''}` : '');
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
      await navigator.share?.({ title: verse.label, text: fullText(), url: verse.link });
    } catch {
      /* cancelled */
    }
  };
  const themes = ['All', ...new Set(art.map((a) => a.theme))];
  const shown = art.filter((a) => theme === 'All' || a.theme === theme);
  return (
    <div className="page share-page">
      <h1>Share a verse</h1>
      <div className="row" style={{ marginBottom: 8 }}>
        <input type="text" value={refText} onChange={(e) => setRefText(e.target.value)} aria-label="Reference" style={{ flex: 1, minWidth: 180 }} />
        <select value={edId} onChange={(e) => setEdId(e.target.value)} aria-label="Translation">{editions.filter((e) => e.language === 'en' || e.id === 'vulgate').map((e) => <option key={e.id} value={e.id}>{e.shortName}</option>)}</select>
      </div>
      {err && <p className="notice">{err}</p>}
      {verse && (
        <div className="share-grid">
          <div>
            <canvas ref={canvas} className="share-canvas" role="img" aria-label={`Verse card: ${verse.text} ${verse.label}`} />
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn primary" onClick={png}>Download image</button>
              <button className="btn" onClick={() => copy(fullText())}>Copy text</button>
              <button className="btn" onClick={() => copy(verse.link)}>Copy link</button>
              {'share' in navigator && <button className="btn" onClick={share}>Share…</button>}
            </div>
          </div>
          <div className="share-controls">
            <label className="field">
              <span>Your thoughts (optional)</span>
              <textarea rows={3} value={thoughts} onChange={(e) => setThoughts(e.target.value)} placeholder="Add a line of your own under the verse…" maxLength={400} />
            </label>
            <div className="field">
              <span>Shape</span>
              <div className="chips" aria-label="Shape">
                {Object.entries(SIZES).map(([k, v]) => <button key={k} aria-pressed={size === k} className={'chip' + (size === k ? ' sel' : '')} onClick={() => setSize(k)}>{v.label}</button>)}
              </div>
            </div>
            <div className="field">
              <span>Lettering</span>
              <div className="chips" aria-label="Lettering">
                {Object.entries(FONTS).map(([k, v]) => <button key={k} aria-pressed={font === k} className={'chip' + (font === k ? ' sel' : '')} onClick={() => setFont(k)}>{v.label}</button>)}
                <button aria-pressed={align === 'center'} className={'chip' + (align === 'center' ? ' sel' : '')} onClick={() => setAlign(align === 'center' ? 'left' : 'center')}>{align === 'center' ? 'Centred' : 'Left'}</button>
              </div>
            </div>
            <div className="field">
              <span>Background</span>
              <div className="chips" aria-label="Background colour">
                {Object.entries(BACKGROUNDS).map(([k, v]) => (
                  <button key={k} aria-pressed={!paint && bg === k} className={'chip' + (!paint && bg === k ? ' sel' : '')} onClick={() => { setPaint(null); setBg(k); }}>
                    <span className="swatch" style={{ background: `linear-gradient(135deg, ${v.stops[0]}, ${v.stops[1]})` }} aria-hidden="true" /> {v.label}
                  </button>
                ))}
              </div>
            </div>
            {art.length > 0 && (
              <details className="field" open={!!paint}>
                <summary>Or choose a painting</summary>
                <div className="chips" style={{ margin: '8px 0' }}>
                  {themes.map((t) => <button key={t} className={'chip' + (theme === t ? ' sel' : '')} onClick={() => setTheme(t)}>{t}</button>)}
                </div>
                <div className="art-grid">
                  {shown.map((a) => (
                    <button key={a.id} className={'art-thumb' + (paint?.id === a.id ? ' on' : '')} onClick={() => { setPaint(a); setImgErr(false); }} aria-label={`${a.title}, ${a.artist}`} aria-pressed={paint?.id === a.id}>
                      <img src={import.meta.env.BASE_URL + a.file} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
                {paint && (
                  <>
                    <label className="field" style={{ marginTop: 8 }}><span>Darken for legibility</span><input type="range" min={15} max={85} value={dim} onChange={(e) => setDim(+e.target.value)} aria-label="Darken the painting" /></label>
                    <p className="muted small">{paint.title}, {paint.artist}, {paint.date}. {paint.credit}. <a href={paint.page} target="_blank" rel="noreferrer">Source at The Met</a> (public domain, CC0).{imgErr && ' The picture could not be loaded; using a colour instead.'}</p>
                  </>
                )}
              </details>
            )}
          </div>
        </div>
      )}
      <p className="muted small">The image is made on your device. Only public-domain translations are offered, and paintings come from The Metropolitan Museum of Art's open-access collection. The link opens this passage in the app.</p>
    </div>
  );
}
