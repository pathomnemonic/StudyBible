// Draws the daily social cards from the exported JSON with the SAME generator the app's one-click card uses (src/lib/dayCard).
//   npx tsx scripts/social/cards.ts --from social-out --out social-cards/advent-2026 [--slate] [--advent-only] [--format 1080x1350,...]
//     --date 2026-12-01 --art <library id | path to an image>   draw one date with a picture chosen by hand
//     --tagline "<text>" | <number in TAGLINES>               use one tagline for this run
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseRefId } from '../../src/lib/refs';
import { buildSpec, DAILY_WORDS, type DailyWord } from '../../src/lib/dayCard/content';
import type { ArtHints } from '../../src/lib/dayCard/art';
import { ADVENT_ONLY, TAGLINES } from '../../src/lib/dayCard/taglines';
import { ArtPicker } from './art';
import { withRenderer } from './render';
import { buildDay, verseCard, type SocialDay } from './lib';

const arg = (k: string, d = '') => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const has = (k: string) => process.argv.includes(`--${k}`);
const SIZES = arg('format', '1080x1350,1080x1920,1000x1500').split(',').map((s) => s.split('x').map(Number) as [number, number]);
const ONLY_DATE = arg('date');
const ART_OVERRIDE = arg('art') || null;
const tagArg = arg('tagline');
const TAGLINE: string | number | null = tagArg ? (/^\d+$/.test(tagArg) ? +tagArg : tagArg) : null;
const SEASON: Record<string, ArtHints['season']> = { Advent: 'advent', Christmas: 'christmas', Lent: 'lent', Triduum: 'triduum', Easter: 'easter' };

export interface Job { key: string; name: string; date: string; inputs: Parameters<typeof buildSpec>[0]; hints: ArtHints }


/** every card a day produces: the Today card (or the hand-picked word for the date), and on Advent days the Walk card */
export function jobsFor(d: SocialDay): Job[] {
  const jobs: Job[] = [];
  const dw = d.dailyWord;
  const saint = dw?.church.father ? { text: dw.church.father.text, who: dw.church.father.who, work: dw.church.father.work, verified: dw.church.father.verified } : null;
  const common = { date: d.date, dayName: d.liturgical.name, color: d.liturgical.color as 'green', saint };
  const season = SEASON[d.liturgical.season] ?? 'ordinary';
  const hintsFor = (refId: string | undefined, verseText: string, word?: string): ArtHints => {
    const r = refId ? parseRefId(refId) : null;
    return { book: r?.book, chapter: r?.c1, words: [word ?? '', verseText], saint: saint?.who, season, seed: d.date };
  };
  const slate: DailyWord | null = DAILY_WORDS.find((w) => w.date === d.date) ?? null;
  if (slate) {
    const ref = parseRefId(slate.ref)!; const v = verseCard(ref)!;
    jobs.push({ key: d.date, name: `word-${slate.word.toLowerCase()}`, date: d.date, hints: hintsFor(slate.ref, v.text, slate.word), inputs: { ...common, verse: { text: v.text, label: v.label }, word: slate.word, question: slate.question } });
  } else if (dw?.verse) {
    const ref = parseRefId((dw.passage && /^[1-3A-Z]{3}\./.test(dw.passage)) ? dw.passage : '') ?? null;
    jobs.push({ key: d.date, name: 'daily-word', date: d.date, hints: hintsFor(undefined, dw.verse.text), inputs: { ...common, verse: { text: dw.verse.text, label: dw.verse.label }, question: dw.reflectionQuestion } });
    void ref;
  }
  if (d.advent?.verse) {
    const a = d.advent;
    jobs.push({ key: d.date, name: 'advent', date: d.date, hints: { ...hintsFor(a.keyVerse ?? a.passage, a.verse!.text, a.theme ?? undefined), season: 'advent' }, inputs: { ...common, color: d.liturgical.color === 'rose' ? 'rose' : 'violet', verse: { text: a.verse!.text, label: a.verse!.label }, word: a.theme ?? undefined, walk: `Advent walk · day ${a.day} of ${a.of}` } });
  }
  return jobs;
}

async function main() {
  const dir = arg('from', 'social-out'), out = arg('out', `${dir}/cards`);
  mkdirSync(out, { recursive: true });
  const picker = new ArtPicker(`${out}/art-picks.json`);
  const credits: string[] = [];
  const flags: string[] = [];
  let n = 0;
  const days: SocialDay[] = [];
  if (has('slate-only') || has('slate')) for (const w of DAILY_WORDS) days.push(buildDay(w.date));
  if (!has('slate-only')) for (const f of readdirSync(dir).filter((x) => /^\d{4}-\d\d-\d\d\.json$/.test(x))) if (!days.some((x) => x.date === f.slice(0, 10))) days.push(JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')) as SocialDay);
  await withRenderer(async (render) => {
    for (const d of days.sort((a, b) => a.date.localeCompare(b.date))) {
      if (ONLY_DATE && d.date !== ONLY_DATE) continue;
      for (const job of jobsFor(d)) {
        if (has('advent-only') && job.name !== 'advent' && !job.name.startsWith('word-')) continue;
        if (has('slate') && has('advent-only') === false && false) continue;
        const pick = picker.choose(job.key, job.hints, ONLY_DATE ? ART_OVERRIDE : null);
        const imagePath = pick ? (existsSync(pick.file) ? pick.file : new URL(`../../public/${pick.file}`, import.meta.url).pathname) : null;
        const { spec, issues } = buildSpec({ ...job.inputs, tagline: TAGLINE, advent: d.liturgical.season === 'Advent' });
        for (const i of issues) flags.push(`${d.date} ${job.name}: ${i}`);
        for (const [w, h] of SIZES) {
          const ext = imagePath && !has('png') ? 'jpg' : 'png';
          const r = await render({ spec, w, h, imagePath, format: ext === 'jpg' ? 'jpeg' : 'png' });
          writeFileSync(`${out}/${job.name === 'advent' || job.name === 'daily-word' ? d.date + '-' : ''}${job.name}-${w}x${h}.${ext}`, r.png);
          if (r.fit < 0.7) flags.push(`${d.date} ${job.name} ${w}x${h}: text shrunk to ${Math.round(r.fit * 100)}% to fit`);
          n++;
        }
        credits.push(`- ${d.date} ${job.name}: ${pick ? `${pick.title}${pick.artist ? ', ' + pick.artist : ''} (${pick.source}; ${pick.why.join(', ')}). ${pick.credit}${pick.page ? ' ' + pick.page : ''}` : 'flat colour (no picture)'} | footer: ${spec.tagline}`);
      }
    }
  });
  picker.save();
  writeFileSync(`${out}/CREDITS.md`, `# Picture credits and footer lines\n\nOne line per card (all sizes share the picture). Use the credit in the caption if you want it shown.\n\n${credits.join('\n')}\n`);
  console.log(`drew ${n} card(s) in ${out}/ (footer lines in rotation: ${TAGLINES.length}, plus ${ADVENT_ONLY.length} for Advent)`);
  if (flags.length) console.log('\nNeeds attention:\n' + flags.map((x) => ' - ' + x).join('\n'));
}
if (process.argv[1]?.endsWith('cards.ts')) main();
