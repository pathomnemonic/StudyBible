import { join } from 'node:path';
import { liturgicalDay, parseIso } from '../../src/liturgy/compute';
import { parseRefs } from '../../src/lib/refs';
import { CURATED, PUBLIC_DATA, RAW, Report, exists, readJson, readText } from './lib/util';
import type { ExternalRow } from './external';

/**
 * Sunday homilies from two podcast feeds that their publishers distribute for podcast apps (Bishop Barron's Sunday Sermons, Fr. Mike Schmitz's
 * Sunday Homilies). Each episode is tied to the Gospel read at Mass on the Sunday it was given, using the Lectionary's list of references
 * (references only) and the liturgical calendar. Only the title, date, page address and audio address are kept; nothing is copied.
 *
 * The match is by calendar, so a homily may concentrate on another reading of that day; where the episode description also shares several
 * distinctive words with the Gospel chapter the match is marked "confirmed" in the app.
 */
interface Item {
  title: string;
  link: string;
  date: Date;
  desc: string;
  audio?: string;
}

const strip = (s: string) =>
  s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, '’').replace(/&#8220;|&#8221;/g, '"').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function parseFeed(xml: string): Item[] {
  const out: Item[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const it = m[1];
    const t = /<title>([\s\S]*?)<\/title>/.exec(it)?.[1];
    const l = /<link>([\s\S]*?)<\/link>/.exec(it)?.[1];
    const d = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(it)?.[1];
    const desc = /<description>([\s\S]*?)<\/description>/.exec(it)?.[1] ?? '';
    const enc = /<enclosure[^>]*url="([^"]+)"/.exec(it)?.[1];
    if (!t || !l || !d) continue;
    out.push({ title: strip(t), link: strip(l), date: new Date(d), desc: strip(desc), audio: enc });
  }
  return out;
}

const ORD: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17, eighteenth: 18, nineteenth: 19, twentieth: 20, 'twenty-first': 21, 'twenty-second': 22, 'twenty-third': 23, 'twenty-fourth': 24, 'twenty-fifth': 25, 'twenty-sixth': 26, 'twenty-seventh': 27, 'twenty-eighth': 28, 'twenty-ninth': 29, thirtieth: 30, 'thirty-first': 31, 'thirty-second': 32, 'thirty-third': 33, 'thirty-fourth': 34 };

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const STOP = new Set(['because', 'through', 'between', 'before', 'around', 'another', 'should', 'without', 'together', 'something', 'himself', 'themselves', 'whether', 'during', 'against', 'people', 'always', 'really', 'little', 'things', 'these', 'those', 'their', 'there', 'would', 'could', 'which', 'while', 'where']);
const wordsOf = (s: string) => new Set((s.toLowerCase().match(/[a-z]{6,}/g) ?? []).filter((w) => !STOP.has(w)));

export function buildHomilyRows(report: Report): ExternalRow[] {
  const tbl = readJson(join(CURATED, 'lectionary-sundays.json'));
  const feeds: { file: string; source: string; show: string; author: string }[] = [
    { file: 'feed-barron-sunday.xml', source: 'word-on-fire', show: 'Bishop Barron’s Sunday Sermons', author: 'Bishop Robert Barron' },
    { file: 'feed-frmike-homilies.xml', source: 'ascension', show: 'Sunday Homilies with Fr. Mike Schmitz', author: 'Fr. Mike Schmitz' },
  ];
  // chapter text of the Douay-Rheims, to compare words with an episode description
  const cache = new Map<string, Set<string>>();
  const chapterWords = (book: string, ch: number) => {
    const k = `${book}.${ch}`;
    if (cache.has(k)) return cache.get(k)!;
    let w = new Set<string>();
    try {
      const data = readJson(join(PUBLIC_DATA, 'bible/dra', `${book}.json`));
      const chap = data.chapters[ch - 1];
      const text = chap.blocks.map((b: any) => (typeof b[1] === 'string' ? '' : b[1].map((r: any) => r[1]).join(' '))).join(' ');
      w = wordsOf(text);
    } catch {
      /* ignore */
    }
    cache.set(k, w);
    return w;
  };

  const rows: ExternalRow[] = [];
  const stats: Record<string, number> = {};
  for (const f of feeds) {
    const path = join(RAW, f.file);
    if (!exists(path)) {
      report.warn(`homilies: ${f.file} not fetched`);
      continue;
    }
    let mapped = 0;
    let confirmed = 0;
    const items = parseFeed(readText(path));
    for (const it of items) {
      const text = `${it.title} ${it.desc}`;
      // the Sunday: Fr. Mike titles carry the date; otherwise the Sunday on or after the publication date
      const td = /^(\d{1,2})\/(\d{1,2})\/(\d{2})\b/.exec(it.title);
      let sunday = td ? new Date(2000 + +td[3], +td[1] - 1, +td[2]) : it.date;
      while (sunday.getDay() !== 0) sunday = addDays(sunday, td ? -1 : 1);
      const ordText = /\b((?:twenty|thirty)-\w+|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|thirtieth)\s+Sunday\s+(?:of|in)\s+(?:the\s+)?(Advent|Lent|Easter|Ordinary Time|the year|year)/i.exec(text);
      let ref: string | undefined;
      let label = '';
      const cycleOf = (d: Date) => liturgicalDay(parseIso(iso(d)), 'universal').sundayCycle;
      const lit = (d: Date) => liturgicalDay(parseIso(iso(d)), 'universal');
      const dayNames = [sunday, addDays(sunday, -7), addDays(sunday, 7)].map((d) => lit(d).dayName);
      const calHas = (re: RegExp) => dayNames.some((n) => re.test(n));
      const head = text.slice(0, 450);
      const hint = /\bGospel\b/i.test(head) ? 'gospel' : /\b(first|second) reading\b|\bepistle\b|\bletter (?:to|of)\b|\bpsalm\b/i.test(head) ? 'other' : 'unknown';
      if (hint === 'other') continue; // about a different reading of the day
      const feastRaw = /Corpus Christi|Body and Blood of Christ|Most Holy Body/i.test(text) ? 'corpus-christi' : /Christ the King|King of the Universe/i.test(text) ? 'christ-king' : /(Trinity Sunday|Most Holy Trinity|Solemnity of the (?:Most )?Holy Trinity)/i.test(text) ? 'trinity' : /Holy Family/i.test(text) ? 'holy-family' : /Baptism of the Lord/i.test(text) ? 'baptism' : /(Solemnity of the Ascension|Ascension Sunday|Ascension of the Lord)/i.test(text) ? 'ascension' : null;
      // a feast is only believed when the calendar agrees (Corpus Christi is not named by the app's calendar, so it must fall the week after Trinity)
      const calFeast: Record<string, RegExp> = { 'christ-king': /King of the Universe/, trinity: /Trinity/, 'holy-family': /Holy Family/, baptism: /Baptism of the Lord/, ascension: /Ascension/ };
      const trin = [sunday, addDays(sunday, -7)].some((d) => /Trinity/.test(lit(d).dayName));
      const feast = feastRaw === 'corpus-christi' ? (trin ? feastRaw : null) : feastRaw && calFeast[feastRaw].test(dayNames.join('|')) ? feastRaw : null;
      if (feast) {
        const c = cycleOf(sunday);
        ref = tbl.feasts[feast][c];
        const nice: Record<string, string> = { 'corpus-christi': 'Solemnity of the Body and Blood of Christ', 'christ-king': 'Solemnity of Christ the King', trinity: 'Solemnity of the Most Holy Trinity', 'holy-family': 'Feast of the Holy Family', baptism: 'Baptism of the Lord', ascension: 'Solemnity of the Ascension' };
        label = `${nice[feast]} (Year ${c})`;
      } else if (/Palm Sunday|Sunday of the Passion/i.test(text) && calHas(/Palm Sunday/)) {
        const c = cycleOf(sunday);
        ref = tbl.seasons.lent[c]['6'];
        label = `Palm Sunday (Year ${c})`;
      } else if (/Easter Sunday|Easter Vigil/i.test(text) && calHas(/Easter Sunday/)) {
        ref = 'John 20:1-9';
        label = 'Easter Sunday';
      } else if (/Pentecost/i.test(text) && /Sunday|Solemnity/i.test(text) && calHas(/Pentecost/)) {
        ref = 'John 20:19-23';
        label = 'Pentecost Sunday';
      } else if (ordText) {
        const n = ORD[ordText[1].toLowerCase()];
        const season = /advent/i.test(ordText[2]) ? 'advent' : /lent/i.test(ordText[2]) ? 'lent' : /easter/i.test(ordText[2]) ? 'easter' : 'ordinary';
        // choose the Sunday (this one or one week either side) whose calendar position agrees with the text
        const cand = [sunday, addDays(sunday, -7), addDays(sunday, 7)].find((d) => {
          const x = liturgicalDay(parseIso(iso(d)), 'universal');
          return x.season === season && x.week === n;
        });
        const d = cand ?? sunday;
        const c = cycleOf(d);
        ref = season === 'ordinary' ? tbl.ordinary[c]?.[String(n)] : tbl.seasons[season]?.[c]?.[String(n)];
        label = `${ordText[1]} Sunday of ${ordText[2].replace(/the year|year/i, 'Ordinary Time')} (Year ${c})`;
      }
      let calendarOnly = false;
      if (!ref && !td && hint === 'gospel') {
        // no ordinal in the text: use the calendar for the coming Sunday, but only keep it when the wording agrees with that Gospel
        const x = lit(sunday);
        const c = x.sundayCycle;
        if (x.season === 'ordinary' && x.week && x.rank === 'sunday') ref = tbl.ordinary[c]?.[String(x.week)];
        else if ((x.season === 'advent' || x.season === 'lent' || x.season === 'easter') && x.week && x.rank === 'sunday') ref = tbl.seasons[x.season]?.[c]?.[String(x.week)];
        label = `${x.dayName} (Year ${c})`;
        calendarOnly = !!ref;
      }
      if (!ref) continue;
      const parsed = parseRefs(ref.split(';')[0]);
      if (!parsed.ok) continue;
      const r0 = parsed.refs[0].ref;
      const shared = [...wordsOf(it.desc)].filter((w) => chapterWords(r0.book, r0.c1).has(w));
      const ok = shared.length >= 3;
      if (calendarOnly && shared.length < 2) continue;
      mapped++;
      if (ok) confirmed++;
      rows.push({
        id: `hom-${f.source}-${iso(it.date)}-${rows.length}`,
        source: f.source,
        type: 'podcast',
        title: it.title.replace(/^\d{1,2}\/\d{1,2}\/\d{2}\s*/, ''),
        url: it.link,
        author: f.author,
        show: f.show,
        date: iso(it.date),
        refs: [ref],
        how: 'feed-lectionary',
        note: `Homily for the ${label.replace(/^the /, '')}; the Gospel that Sunday is ${ref}.${ok ? '' : ' It may focus on another reading of the day.'}`,
        tags: ['Sunday homily', 'Gospel'],
        basis: ok ? 'lectionary-confirmed' : 'lectionary-date',
        audio: it.audio,
      } as ExternalRow);
    }
    stats[f.source] = (stats[f.source] ?? 0) + mapped;
    stats[`${f.source}-confirmed`] = (stats[`${f.source}-confirmed`] ?? 0) + confirmed;
    stats[`${f.source}-episodes`] = items.length;
  }
  report.stats['homilies'] = stats;
  return rows;
}

/**
 * Word on Fire organises its homilies and Gospel reflections on calendar pages per liturgical week (the same page serves every three-year cycle)
 * and on one page per Bible chapter. The addresses follow a regular pattern that was confirmed on a sample of pages (found through search); the
 * pages are not fetched by this build. Each calendar page is tied to the Sunday Gospels (Years A, B and C) of that week, and each Gospel
 * chapter page to its chapter.
 */
export function buildWordOnFireIndexRows(report: Report): ExternalRow[] {
  const tbl = readJson(join(CURATED, 'lectionary-sundays.json'));
  const rows: ExternalRow[] = [];
  const base = 'https://www.wordonfire.org/';
  const gospels = (...refs: (string | undefined)[]) => [...new Set(refs.filter(Boolean) as string[])].join('; ');
  const add = (slug: string, title: string, ref: string, note: string) => {
    if (!ref) return;
    rows.push({ id: `wofcal-${slug}`, source: 'word-on-fire', type: 'page', title, url: `${base}${slug}/`, author: 'Word on Fire', refs: [ref], how: 'url-pattern', note, tags: ['Sunday Gospel', 'homilies'], basis: 'url-pattern' } as ExternalRow);
  };
  const ordinal = (n: number) => `${n}${[11, 12, 13].includes(n % 100) ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
  for (let n = 2; n <= 33; n++) {
    const ref = gospels(tbl.ordinary.A[n], tbl.ordinary.B[n], tbl.ordinary.C[n]);
    add(`calendar/ordinary-time-${n}`, `Word on Fire: homilies and reflections for the ${ordinal(n)} week of Ordinary Time`, ref, `Word on Fire’s page for this liturgical week lists Bishop Barron’s sermons and Gospel reflections for it across several years. Sunday Gospels of the three cycles: ${ref}.`);
  }
  add('calendar/christ-the-king', 'Word on Fire: homilies for Christ the King', gospels(tbl.feasts['christ-king'].A, tbl.feasts['christ-king'].B, tbl.feasts['christ-king'].C), 'Bishop Barron’s sermons and reflections for the Solemnity of Christ the King (Years A, B and C).');
  for (const [season, count, label] of [['advent', 4, 'Advent'], ['lent', 5, 'Lent'], ['easter', 7, 'Easter']] as const) {
    for (let n = season === 'easter' ? 2 : 1; n <= count; n++) {
      const t = tbl.seasons[season];
      add(`calendar/${season}-${n}`, `Word on Fire: homilies and reflections for the ${ordinal(n)} week of ${label}`, gospels(t.A[n], t.B[n], t.C[n]), `Word on Fire’s page for this liturgical week lists Bishop Barron’s sermons and Gospel reflections for it across several years.`);
    }
  }
  add('calendar/palm-sunday', 'Word on Fire: homilies and reflections for Palm Sunday', gospels(tbl.seasons.lent.A['6'], tbl.seasons.lent.B['6'], tbl.seasons.lent.C['6']), 'Bishop Barron’s Palm Sunday sermons and reflections (the Passion in Years A, B and C).');
  add('calendar/pentecost', 'Word on Fire: homilies and reflections for Pentecost', 'John 20:19-23', 'Bishop Barron’s Pentecost sermons and reflections.');
  // one page per Gospel chapter
  const eds = readJson(join(PUBLIC_DATA, 'editions.json')).editions;
  const vc: Record<string, number[]> = eds.find((e: any) => e.id === 'vulgate').verseCounts;
  const slug: Record<string, [string, string]> = { MAT: ['matthew', 'Matthew'], MRK: ['mark', 'Mark'], LUK: ['luke', 'Luke'], JHN: ['john', 'John'] };
  for (const [id, [sl, nm]] of Object.entries(slug)) {
    for (let c = 1; c <= vc[id].length; c++) add(`scripture/${sl}-${c}`, `Word on Fire: sermons and reflections on ${nm} ${c}`, `${nm} ${c}:1-${vc[id][c - 1]}`, `Word on Fire’s page gathering its sermons, articles and reflections tagged to ${nm} ${c}.`);
  }
  report.stats['wofIndex'] = { rows: rows.length };
  return rows;
}
