/**
 * Draws one daily card on a canvas. The same code runs in the app (the one-click card) and in the social export (in a headless browser),
 * so a user's card and the day's post are the same picture.
 */
export interface DayCardSpec {
  /** the Today card's header: the date and the liturgical day's name */
  dateLine: string; dayName: string; color: 'green' | 'violet' | 'white' | 'red' | 'rose';
  /** a line under the day name, e.g. "Advent walk · day 2 of 26" */
  walk?: string;
  /** our one-word title for the day, where there is one */
  word?: string;
  verse: { text: string; label: string; translation: string };
  /** a verified Father or saint line for the date (never an unverified one) */
  father?: { text: string; who: string };
  question?: string;
  catechism?: { n: number; text: string };
  /** Mass reading citations (citations only; the lectionary wording is copyrighted) */
  readings?: string;
  tagline?: string;
  /** small print under everything: the picture's credit, when asked for */
  credit?: string;
}

export const FLAT: Record<DayCardSpec['color'], [string, string]> = { violet: ['#3b2a5a', '#f1e9ff'], rose: ['#8a4a63', '#fff0f5'], white: ['#2f2a24', '#f7f1e3'], green: ['#25422f', '#eef7ee'], red: ['#6b1f1f', '#fff0ee'] };
export const MAX_CCC = 340; // a Catechism paragraph is quoted whole or not at all: a longer one is pointed to by number
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";

type Img = CanvasImageSource & { width: number; height: number };
export interface DrawOptions { img?: Img | null; /** 0-100, how much the picture is darkened for the words */ dim?: number }
export interface DrawResult { fit: number; droppedCatechism: 'none' | 'pointer' | 'removed'; textBottom: number }

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

interface Block { rule: boolean; parts: { text: string; font: string; alpha: number; lh: number; caps?: boolean; space?: number }[] }

export function drawDayCard(ctx: CanvasRenderingContext2D, W: number, H: number, spec: DayCardSpec, opts: DrawOptions = {}): DrawResult {
  const [bg, fg] = FLAT[spec.color] ?? FLAT.green;
  ctx.save();
  const img = opts.img;
  if (img) {
    const k = Math.max(W / img.width, H / img.height);
    ctx.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k);
    const d = (opts.dim ?? 64) / 100;
    ctx.fillStyle = `rgba(8,8,20,${d})`;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }
  const ink = img ? '#ffffff' : fg;
  if (img) { ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = Math.round(W * 0.008); ctx.shadowOffsetY = Math.round(W * 0.001); }
  const padX = Math.round(W * 0.085), padTop = Math.round(W * 0.07), padBot = Math.round(W * 0.05);
  const maxW = W - padX * 2;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // header
  let y = padTop;
  const f = (r: number) => Math.round(W * r);
  const head = (text: string, font: string, alpha: number, caps = false) => {
    ctx.font = font; ctx.fillStyle = ink; ctx.globalAlpha = alpha;
    const t = caps ? text.toUpperCase() : text;
    (ctx as any).letterSpacing = caps ? `${Math.round(W * 0.003)}px` : '0px';
    const lines = wrap(ctx, t, maxW);
    for (const l of lines) { ctx.fillText(l, padX, y); y += parseInt(font.match(/(\d+)px/)![1]) * 1.25; }
    ctx.globalAlpha = 1; (ctx as any).letterSpacing = '0px';
  };
  head(spec.dateLine, `500 ${f(0.026)}px ${SANS}`, 0.85, true);
  head(spec.dayName, `400 ${f(0.04)}px ${SERIF}`, 0.97);
  if (spec.walk) { y += f(0.006); head(spec.walk, `500 ${f(0.024)}px ${SANS}`, 0.78, true); }
  const headBottom = y;

  // footer, measured first so the body knows how much room it has
  const foot: { text: string; font: string; alpha: number }[] = [];
  if (spec.readings) foot.push({ text: `Mass readings: ${spec.readings}`, font: `${f(0.022)}px ${SANS}`, alpha: 0.78 });
  if (spec.tagline) foot.push({ text: spec.tagline, font: `600 ${f(0.024)}px ${SANS}`, alpha: 0.95 });
  if (spec.credit) foot.push({ text: spec.credit, font: `${f(0.016)}px ${SANS}`, alpha: 0.6 });
  const footLines = foot.map((x) => { ctx.font = x.font; return { ...x, lines: wrap(ctx, x.text, maxW), lh: parseInt(x.font.match(/(\d+)px/)![1]) * 1.35 }; });
  const footH = footLines.reduce((n, x) => n + x.lines.length * x.lh, 0) + (footLines.length - 1) * f(0.008);
  const footTop = H - padBot - footH;

  // body: try a size, shrink until it fits; if it still does not, shorten the Catechism, then drop it (never the verse, the saint's words or the question)
  const avail = footTop - headBottom - f(0.03);
  let ccc: 'full' | 'pointer' | 'none' = spec.catechism ? (spec.catechism.text.length <= MAX_CCC ? 'full' : 'pointer') : 'none';
  const build = (s: number): { blocks: Block[]; h: number } => {
    const base = f(0.044) * s;
    const blocks: Block[] = [];
    const lines = (text: string, font: string, mw = maxW) => { ctx.font = font; return wrap(ctx, text, mw); };
    const mk = (rule: boolean, parts: Block['parts']) => blocks.push({ rule, parts });
    const parts: Block['parts'] = [];
    if (spec.word) parts.push({ text: spec.word.toUpperCase(), font: `800 ${Math.round(f(0.066) * Math.min(1, s + 0.15))}px ${SANS}`, alpha: 1, lh: 1.15, caps: true, space: f(0.012) });
    parts.push({ text: spec.verse.text, font: `400 ${Math.round(base)}px ${SERIF}`, alpha: 1, lh: 1.34 });
    parts.push({ text: `${spec.verse.label} · ${spec.verse.translation}`, font: `italic 400 ${Math.round(base * 0.68)}px ${SERIF}`, alpha: 0.9, lh: 1.3, space: 0 });
    mk(false, parts);
    if (spec.father) mk(true, [{ text: `“${spec.father.text.replace(/“/g, '‘').replace(/”/g, '’')}”`, font: `400 ${Math.round(base * 0.8)}px ${SERIF}`, alpha: 1, lh: 1.32 }, { text: `— ${spec.father.who}`, font: `italic 400 ${Math.round(base * 0.58)}px ${SERIF}`, alpha: 0.88, lh: 1.3, space: f(0.004) }]);
    if (ccc === 'full' && spec.catechism) mk(true, [{ text: `CATECHISM OF THE CATHOLIC CHURCH · ${spec.catechism.n}`, font: `500 ${Math.round(base * 0.5)}px ${SANS}`, alpha: 0.7, lh: 1.3 }, { text: spec.catechism.text, font: `400 ${Math.round(base * 0.74)}px ${SERIF}`, alpha: 0.95, lh: 1.32 }]);
    if (ccc === 'pointer' && spec.catechism) mk(true, [{ text: `In the Catechism of the Catholic Church: paragraph ${spec.catechism.n}`, font: `400 ${Math.round(base * 0.52)}px ${SANS}`, alpha: 0.85, lh: 1.3 }]);
    if (spec.question) mk(true, [{ text: spec.question, font: `italic 400 ${Math.round(base * 0.8)}px ${SERIF}`, alpha: 0.95, lh: 1.32 }]);
    let h = 0;
    for (const b of blocks) {
      if (b.rule) h += f(0.04);
      for (const p of b.parts) { const ls = lines(p.text, p.font); h += ls.length * parseInt(p.font.match(/(\d+)px/)![1]) * p.lh + (p.space ?? f(0.008)); }
    }
    return { blocks, h };
  };
  let s = 1, built = build(s);
  while (built.h > avail && s > 0.5) { s = Math.round((s - 0.03) * 100) / 100; built = build(s); }
  let dropped: DrawResult['droppedCatechism'] = 'none';
  if (built.h > avail && ccc === 'full') { ccc = 'pointer'; dropped = 'pointer'; s = 1; built = build(s); while (built.h > avail && s > 0.5) { s = Math.round((s - 0.03) * 100) / 100; built = build(s); } }
  if (built.h > avail && ccc !== 'none') { ccc = 'none'; dropped = 'removed'; s = 1; built = build(s); while (built.h > avail && s > 0.4) { s = Math.round((s - 0.03) * 100) / 100; built = build(s); } }

  // draw the body centred in the space between the header and the footer
  let by = headBottom + f(0.03) + Math.max(0, (avail - built.h) / 2);
  for (const b of built.blocks) {
    if (b.rule) { by += f(0.014); ctx.globalAlpha = 0.3; ctx.fillStyle = ink; ctx.fillRect(padX, by, maxW, Math.max(1, f(0.0015))); ctx.globalAlpha = 1; by += f(0.026); }
    for (const p of b.parts) {
      ctx.font = p.font; ctx.fillStyle = ink; ctx.globalAlpha = p.alpha;
      (ctx as any).letterSpacing = p.caps ? `${Math.round(W * 0.012)}px` : '0px';
      const px = parseInt(p.font.match(/(\d+)px/)![1]);
      for (const l of wrap(ctx, p.text, maxW)) { ctx.fillText(l, padX, by); by += px * p.lh; }
      by += p.space ?? f(0.008);
      ctx.globalAlpha = 1; (ctx as any).letterSpacing = '0px';
    }
  }
  // footer
  let fy = footTop;
  for (const x of footLines) {
    ctx.font = x.font; ctx.fillStyle = ink; ctx.globalAlpha = x.alpha;
    for (const l of x.lines) { ctx.fillText(l, padX, fy); fy += x.lh; }
    fy += f(0.008); ctx.globalAlpha = 1;
  }
  ctx.restore();
  return { fit: s, droppedCatechism: dropped, textBottom: by };
}
