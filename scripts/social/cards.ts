// Draws share cards (PNG) from the exported JSON. Text is only what the export holds; nothing is composed here.
//   npx tsx scripts/social/cards.ts --from social-out --out social-out/cards [--format 1080x1350,1080x1920,1000x1500]
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import type { SocialDay } from './lib';
import { verseCard } from './lib';
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

export function cardsFor(d: SocialDay, w: number, h: number): { name: string; html: string }[] {
  const out: { name: string; html: string }[] = [];
  const color = d.liturgical.color;
  const dw = d.dailyWord;
  if (dw?.verse) out.push({ name: 'daily-word', html: page(w, h, color, `${d.liturgical.name}`, dw.verse.text, `${dw.verse.label} · Douay-Rheims`, 'Cathology · Douay-Rheims Bible (public domain)') });
  const c = dw?.church.catechism;
  if (c && c.text.length < 420) out.push({ name: 'church-sees', html: page(w, h, color, 'What the Church teaches', c.text, `Catechism of the Catholic Church, ${c.n}`, 'Cathology') });
  const f = dw?.church.father;
  if (f?.verified && f.text.length < 420) out.push({ name: 'father', html: page(w, h, color, 'From the Fathers', f.text, f.who, 'Cathology') });
  if (d.advent?.verse) out.push({ name: 'advent', html: page(w, h, 'violet', `Advent · day ${d.advent.day} of ${d.advent.of}${d.advent.theme ? ' · ' + d.advent.theme : ''}`, d.advent.verse.text, `${d.advent.verse.label} · Douay-Rheims`, 'Cathology · Advent walk') });
  if (d.feastFather && d.feastFather.quote.length < 520) out.push({ name: 'feast-father', html: page(w, h, color, d.feastFather.feast, d.feastFather.quote, `${d.feastFather.author}, ${d.feastFather.source}`, 'Cathology · From the Fathers') });
  return out;
}

/** The hand-picked Daily Word slate (scripts/social/slate.json): one word and one whole verse, not numbered. */
export function slateCards(w: number, h: number) {
  const slate = JSON.parse(readFileSync(new URL('./slate.json', import.meta.url).pathname, 'utf8')) as { word: string; ref: string }[];
  return slate.map((s) => {
    const v = verseCard(parseRefId(s.ref)!)!;
    return { name: `word-${s.word.toLowerCase()}`, html: page(w, h, 'green', `Daily Word · ${s.word}`, v.text, `${v.label} · Douay-Rheims`, 'Cathology · Douay-Rheims Bible (public domain)') };
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
