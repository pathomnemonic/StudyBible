// Draws share cards (PNG) from the exported JSON. Text is only what the export holds; nothing is composed here.
//   npx tsx scripts/social/cards.ts --from social-out --out social-out/cards [--format 1080x1350,1080x1920,1000x1500]
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import type { SocialDay } from './lib';
import { buildDay, cccFor, verseCard } from './lib';
import { parseRefId } from '../../src/lib/refs';

const arg = (k: string, d: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const SIZES = arg('format', '1080x1350,1080x1920,1000x1500').split(',').map((s) => s.split('x').map(Number) as [number, number]);
const PALETTE: Record<string, [string, string]> = { violet: ['#3b2a5a', '#f1e9ff'], rose: ['#8a4a63', '#fff0f5'], white: ['#f7f1e3', '#2a2118'], green: ['#25422f', '#eef7ee'], red: ['#6b1f1f', '#fff0ee'] };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function page(w: number, h: number, color: string, kicker: string, body: string, cite: string, foot: string) {
  const [bg, fg] = PALETTE[color] ?? PALETTE.green;
  const size = Math.round(w * (body.length > 260 ? 0.042 : body.length > 160 ? 0.05 : 0.06));
  return `<html><body style="margin:0;width:${w}px;height:${h}px;background:${bg};color:${fg};font-family:Georgia,'Times New Roman',serif;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;padding:${Math.round(w * 0.09)}px">
  <div style="font:600 ${Math.round(w * 0.03)}px system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;opacity:.8">${esc(kicker)}</div>
  <div><div style="font-size:${size}px;line-height:1.38">${esc(body)}</div><div style="margin-top:${Math.round(w * 0.04)}px;font:italic ${Math.round(w * 0.04)}px Georgia,serif;opacity:.9">${esc(cite)}</div></div>
  <div style="font:${Math.round(w * 0.026)}px system-ui,sans-serif;opacity:.7">${esc(foot)}</div></body></html>`;
}

const MAX_CCC = 340; // a Catechism paragraph is quoted whole or not at all: a longer one is pointed to by number

export interface DayCard {
  /** the Today card's header: the date and the liturgical day's name */
  dateLine: string; dayName: string; color: string;
  /** our one-word title for the day (the hand-picked slate); absent on days made straight from the Today card */
  word?: string;
  /** a line under the day name, e.g. the Advent walk day */
  walk?: string;
  verse: { text: string; label: string };
  /** a Father or saint line, only when the app marks it verified */
  father?: { text: string; who: string };
  /** a question written for the day (the app's own, or one supplied with the slate); never generated here */
  question?: string;
  catechism?: { n: number; text: string };
  /** Mass reading citations (citations only; the lectionary wording is copyrighted) */
  readings?: string;
}

const longDate = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** One card with everything the Today screen carries for the day, in the same order: date and day name, verse with its reference, the Father line, the question; then the Catechism and the Mass readings that the Today screen links to. */
export function dayCardHtml(c: DayCard, w: number, h: number): string {
  const [bg, fg] = PALETTE[c.color] ?? PALETTE.green;
  const vlen = c.verse.text.length + (c.father?.text.length ?? 0) * 0.6 + (c.catechism && c.catechism.text.length <= MAX_CCC ? c.catechism.text.length * 0.6 : 0);
  const base = vlen > 700 ? 0.031 : vlen > 520 ? 0.034 : vlen > 380 ? 0.039 : 0.045;
  const f = (r: number) => Math.round(w * r);
  const rule = `border-top:1px solid ${fg}33;padding-top:${f(0.018)}px;margin-top:${f(0.022)}px`;
  const sans = `font-family:system-ui,sans-serif`;
  const small = (x: string) => `<div style="${sans};font-size:${f(0.024)}px;letter-spacing:.12em;text-transform:uppercase;opacity:.7;margin-bottom:${f(0.006)}px">${esc(x)}</div>`;
  const ccc = c.catechism ? (c.catechism.text.length <= MAX_CCC
    ? `<div style="${rule}">${small('Catechism of the Catholic Church · ' + c.catechism.n)}<div style="font-size:${f(base * 0.8)}px;line-height:1.35">${esc(c.catechism.text)}</div></div>`
    : `<div style="${rule};${sans};font-size:${f(0.026)}px;opacity:.85">In the Catechism of the Catholic Church: paragraph ${c.catechism.n}</div>`) : '';
  return `<html><body style="margin:0;width:${w}px;height:${h}px;background:${bg};color:${fg};font-family:Georgia,'Times New Roman',serif;display:flex;flex-direction:column;box-sizing:border-box;padding:${f(0.075)}px ${f(0.085)}px;overflow:hidden">
  <div style="${sans};font-size:${f(0.026)}px;letter-spacing:.12em;text-transform:uppercase;opacity:.8">${esc(c.dateLine)}</div>
  <div style="font-size:${f(0.04)}px;margin-top:${f(0.008)}px;opacity:.95">${esc(c.dayName)}</div>
  ${c.walk ? `<div style="${sans};font-size:${f(0.024)}px;letter-spacing:.12em;text-transform:uppercase;opacity:.75;margin-top:${f(0.01)}px">${esc(c.walk)}</div>` : ''}
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:${f(0.004)}px">
    ${c.word ? `<div style="${sans};font-weight:700;font-size:${f(0.07)}px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:${f(0.02)}px">${esc(c.word)}</div>` : ''}
    <div style="font-size:${f(base)}px;line-height:1.38">${esc(c.verse.text)}</div>
    <div style="margin-top:${f(0.014)}px;font:italic ${f(0.032)}px Georgia,serif;opacity:.9">${esc(c.verse.label)} · Douay-Rheims</div>
    ${c.father ? `<div style="${rule}"><div style="font-size:${f(base * 0.82)}px;line-height:1.35">“${esc(c.father.text)}”</div><div style="margin-top:${f(0.008)}px;font:italic ${f(0.026)}px Georgia,serif;opacity:.85">— ${esc(c.father.who)}</div></div>` : ''}
    ${ccc}
    ${c.question ? `<div style="${rule}"><div style="font-size:${f(base * 0.9)}px;line-height:1.35;font-style:italic">${esc(c.question)}</div></div>` : ''}
  </div>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;${sans};font-size:${f(0.022)}px;opacity:.75">
    <div>${c.readings ? 'Mass readings: ' + esc(c.readings) : ''}</div><div>Cathology</div></div></body></html>`;
}

/** the card for a day made straight from the Today card's own content (its verse, verified Father line and question) */
export function todayCard(d: SocialDay): DayCard | null {
  const dw = d.dailyWord;
  if (!dw?.verse) return null;
  const f = dw.church.father;
  const cit = d.massReadings?.citations;
  return {
    dateLine: longDate(d.date), dayName: d.liturgical.name, color: d.liturgical.color,
    verse: { text: dw.verse.text, label: dw.verse.label },
    father: f && f.verified ? { text: f.text, who: f.who } : undefined,
    question: dw.reflectionQuestion || undefined,
    catechism: dw.church.catechism ? { n: dw.church.catechism.n, text: dw.church.catechism.text } : undefined,
    readings: cit ? [cit.first_reading, cit.second_reading, cit.gospel].filter(Boolean).join(' · ') : undefined,
  };
}

export function cardsFor(d: SocialDay, w: number, h: number): { name: string; html: string }[] {
  const out: { name: string; html: string }[] = [];
  const color = d.liturgical.color;
  const dw = d.dailyWord;
  const full = todayCard(d);
  if (full) out.push({ name: 'daily-word', html: dayCardHtml(full, w, h) });
  if (d.advent?.verse) {
    const cit = d.massReadings?.citations;
    const a = d.advent;
    out.push({ name: 'advent', html: dayCardHtml({
      dateLine: longDate(d.date), dayName: d.liturgical.name, color: d.liturgical.color === 'rose' ? 'rose' : 'violet',
      walk: `Advent walk · day ${a.day} of ${a.of}`, word: a.theme ?? undefined,
      verse: { text: a.verse!.text, label: a.verse!.label },
      catechism: a.catechism ? { n: a.catechism.n, text: a.catechism.text } : undefined,
      readings: cit ? [cit.first_reading, cit.second_reading, cit.gospel].filter(Boolean).join(' · ') : undefined,
    }, w, h) });
  }
  if (d.feastFather && d.feastFather.quote.length < 520) out.push({ name: 'feast-father', html: page(w, h, color, d.feastFather.feast, d.feastFather.quote, `${d.feastFather.author}, ${d.feastFather.source}`, 'Cathology · From the Fathers') });
  return out;
}

/** The hand-picked Daily Word slate (scripts/social/slate.json): one word and one whole verse, not numbered. */
export function slateCards(w: number, h: number) {
  const slate = JSON.parse(readFileSync(new URL('./slate.json', import.meta.url).pathname, 'utf8')) as { word: string; ref: string; date: string; question?: string }[];
  return slate.map((s) => {
    const ref = parseRefId(s.ref)!;
    const v = verseCard(ref)!;
    const day = buildDay(s.date);
    const paras = cccFor(ref, 6);
    const ccc = paras.find((p) => p.text.length <= MAX_CCC) ?? paras[0]; // a whole short paragraph if there is one, else a pointer to the first
    const cit = day.massReadings?.citations;
    const card: DayCard = {
      dateLine: longDate(s.date), dayName: day.liturgical.name, color: day.liturgical.color, word: s.word,
      verse: { text: v.text, label: v.label },
      question: s.question,
      catechism: ccc ? { n: ccc.n, text: ccc.text } : undefined,
      readings: cit ? [cit.first_reading, cit.second_reading, cit.gospel].filter(Boolean).join(' · ') : undefined,
    };
    return { name: `word-${s.word.toLowerCase()}`, html: dayCardHtml(card, w, h) };
  });
}

async function main() {
  const dir = arg('from', 'social-out'), out = arg('out', `${dir}/cards`);
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  let n = 0;
  for (const f of process.argv.includes('--slate-only') ? [] : readdirSync(dir).filter((x) => /^\d{4}-\d\d-\d\d\.json$/.test(x))) {
    const d = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')) as SocialDay;
    for (const [w, h] of SIZES) {
      for (const c of cardsFor(d, w, h).filter((c) => !process.argv.includes('--advent-only') || c.name === 'advent')) {
        const p = await browser.newPage({ viewport: { width: w, height: h } });
        await p.setContent(c.html);
        await p.screenshot({ path: `${out}/${d.date}-${c.name}-${w}x${h}.png` });
        await p.close(); n++;
      }
    }
  }
  if (process.argv.includes('--slate')) for (const [w, h] of SIZES) for (const c of slateCards(w, h)) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.setContent(c.html); await p.screenshot({ path: `${out}/${c.name}-${w}x${h}.png` }); await p.close(); n++;
  }
  await browser.close();
  console.log(`drew ${n} card(s) in ${out}/`);
}
if (process.argv[1]?.endsWith('cards.ts')) main();
