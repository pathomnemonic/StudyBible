/**
 * Draws one daily card on a canvas. The same code runs in the app (the one-click card) and in the social export (in a headless browser),
 * so a user's card and the day's post are the same picture.
 *
 * Composition: everything is centred. A quiet header (date, day name) at the top, the verse as the lead element in the middle,
 * the saint's words and the question beneath it, and a muted foot (the line about the app). There is no headline word. Margins are
 * equal on all four sides; whatever room is left is shared evenly above and below the body.
 */
export interface DayCardSpec {
  /** the Today card's header: the date and the liturgical day's name */
  dateLine: string; dayName: string; color: 'green' | 'violet' | 'white' | 'red' | 'rose';
  /** a line under the day name, e.g. "Advent walk · day 2 of 26" */
  walk?: string;
  verse: { text: string; label: string; translation: string };
  /** a verified Father or saint line for the date (never an unverified one) */
  father?: { text: string; who: string };
  question?: string;
  tagline?: string;
  /** small print under everything: the picture's credit, when asked for */
  credit?: string;
}

export const FLAT: Record<DayCardSpec['color'], [string, string]> = { violet: ['#3b2a5a', '#f1e9ff'], rose: ['#8a4a63', '#fff0f5'], white: ['#2f2a24', '#f7f1e3'], green: ['#25422f', '#eef7ee'], red: ['#6b1f1f', '#fff0ee'] };
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";

type Img = CanvasImageSource & { width: number; height: number };
export interface DrawOptions { img?: Img | null; /** 0-100, how much the picture is darkened for the words */ dim?: number }
export interface DrawResult { fit: number; textBottom: number }

const px = (font: string) => parseInt(font.match(/(\d+)px/)![1]);
function wrapAt(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}
/** wrapped to the column, then narrowed a little if that would leave a lone word on the last line */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  let lines = wrapAt(ctx, text, maxW);
  for (let k = 0.92; lines.length > 1 && lines[lines.length - 1].split(' ').length === 1 && k > 0.6; k -= 0.06) {
    const tighter = wrapAt(ctx, text, maxW * k);
    if (tighter.length <= lines.length) lines = tighter;
  }
  return lines;
}

interface Run { text: string; font: string; alpha: number; lh: number; caps?: boolean; gap: number }

export function drawDayCard(ctx: CanvasRenderingContext2D, W: number, H: number, spec: DayCardSpec, opts: DrawOptions = {}): DrawResult {
  const [bg, fg] = FLAT[spec.color] ?? FLAT.green;
  ctx.save();
  const img = opts.img;
  if (img) {
    const k = Math.max(W / img.width, H / img.height);
    ctx.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k);
    ctx.fillStyle = `rgba(8,8,20,${(opts.dim ?? 64) / 100})`;
    ctx.fillRect(0, 0, W, H);
  } else { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); }
  const ink = img ? '#ffffff' : fg;
  if (img) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = Math.round(W * 0.009); ctx.shadowOffsetY = Math.round(W * 0.001); }
  const f = (r: number) => Math.round(W * r);
  const M = f(0.09); // the same margin on every side
  const colW = f(0.78); // the reading column
  const cx = W / 2;
  ctx.textBaseline = 'top'; ctx.textAlign = 'center';

  const measure = (runs: Run[]) => runs.reduce((n, r) => { ctx.font = r.font; return n + wrap(ctx, r.caps ? r.text.toUpperCase() : r.text, colW).length * px(r.font) * r.lh + r.gap; }, 0);
  const paint = (runs: Run[], y: number) => {
    for (const r of runs) {
      ctx.font = r.font; ctx.fillStyle = ink; ctx.globalAlpha = r.alpha;
      (ctx as any).letterSpacing = r.caps ? `${Math.round(W * (px(r.font) > W * 0.04 ? 0.012 : 0.0035))}px` : '0px';
      for (const l of wrap(ctx, r.caps ? r.text.toUpperCase() : r.text, colW)) { ctx.fillText(l, cx, y); y += px(r.font) * r.lh; }
      y += r.gap; ctx.globalAlpha = 1; (ctx as any).letterSpacing = '0px';
    }
    return y;
  };

  // header: quiet and small
  const head: Run[] = [
    { text: spec.dateLine, font: `500 ${f(0.022)}px ${SANS}`, alpha: 0.72, lh: 1.3, caps: true, gap: f(0.01) },
    { text: spec.dayName, font: `400 ${f(0.036)}px ${SERIF}`, alpha: 0.95, lh: 1.25, gap: spec.walk ? f(0.012) : 0 },
  ];
  if (spec.walk) head.push({ text: spec.walk, font: `500 ${f(0.02)}px ${SANS}`, alpha: 0.7, lh: 1.3, caps: true, gap: 0 });
  const headTop = M;
  const headBottom = paint(head, headTop);

  // foot: muted, at the bottom margin
  const foot: Run[] = [];
  if (spec.tagline) foot.push({ text: spec.tagline, font: `500 ${f(0.022)}px ${SANS}`, alpha: 0.88, lh: 1.4, gap: spec.credit ? f(0.01) : 0 });
  if (spec.credit) foot.push({ text: spec.credit, font: `400 ${f(0.015)}px ${SANS}`, alpha: 0.5, lh: 1.35, gap: 0 });
  const footH = measure(foot);
  const footTop = H - M - footH;

  // body: the verse leads; the saint's words and the question follow at a slightly smaller size. Shrunk together until they fit.
  const avail = footTop - headBottom - M * 0.8;
  const build = (s: number) => {
    const base = f(0.054) * s;
    const focus: Run[] = [];
    focus.push({ text: spec.verse.text, font: `400 ${Math.round(base)}px ${SERIF}`, alpha: 1, lh: 1.36, gap: f(0.014) });
    focus.push({ text: `${spec.verse.label} · ${spec.verse.translation}`, font: `italic 400 ${Math.round(base * 0.55)}px ${SERIF}`, alpha: 0.85, lh: 1.3, gap: 0 });
    const quiet: Run[] = [];
    if (spec.father) {
      quiet.push({ text: `“${spec.father.text.replace(/“/g, '‘').replace(/”/g, '’')}”`, font: `400 ${Math.round(base * 0.72)}px ${SERIF}`, alpha: 1, lh: 1.38, gap: f(0.012) });
      quiet.push({ text: `— ${spec.father.who}`, font: `italic 400 ${Math.round(base * 0.5)}px ${SERIF}`, alpha: 0.85, lh: 1.3, gap: spec.question ? f(0.034) : 0 });
    }
    if (spec.question) quiet.push({ text: spec.question, font: `italic 400 ${Math.round(base * 0.68)}px ${SERIF}`, alpha: 0.96, lh: 1.36, gap: 0 });
    const between = quiet.length ? f(0.06) : 0; // the rule and the air around it
    return { focus, quiet, between, h: measure(focus) + between + measure(quiet) };
  };
  let s = 1, b = build(s);
  while (b.h > avail && s > 0.45) { s = Math.round((s - 0.03) * 100) / 100; b = build(s); }

  // centred in the room between header and foot
  let y = headBottom + M * 0.4 + Math.max(0, (avail - b.h) / 2);
  y = paint(b.focus, y);
  if (b.quiet.length) {
    const mid = y + b.between / 2;
    ctx.globalAlpha = 0.4; ctx.fillStyle = ink; ctx.fillRect(cx - f(0.04), mid, f(0.08), Math.max(1, f(0.0015))); ctx.globalAlpha = 1;
    y = paint(b.quiet, y + b.between);
  }
  paint(foot, footTop);
  ctx.restore();
  return { fit: s, textBottom: y };
}
