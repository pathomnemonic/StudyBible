import type { AuthorityLevel, ItemFormat, Period } from '../lib/types';
import { formatRef, parseRefId, refId, refsOverlap, type Ref } from '../lib/refs';
import { getBook } from '../lib/canon';
import {
  CCC_OFFICIAL, cccUrl, getBiay, getCatena, getCccLinks, getDoctrine, getGlossa, getLibScripture, getLibraryIndex, getOverviews,
} from '../data/content';
import { getXrefs } from '../data/loader';
import { db } from '../db/db';

export type SectionKey = 'doctrine' | 'catechism' | 'fathers' | 'saints' | 'xref' | 'catholic-answers' | 'word-on-fire' | 'ascension' | 'biay' | 'context' | 'liturgy' | 'mine';

export const SECTIONS: { key: SectionKey; label: string; hint?: string }[] = [
  { key: 'doctrine', label: 'Catholic teaching', hint: 'Doctrine topics and official documents (suggested topical connections).' },
  { key: 'catechism', label: 'Catechism of the Catholic Church', hint: 'Verified verse-level citations only.' },
  { key: 'fathers', label: 'Church Fathers & early writers' },
  { key: 'saints', label: 'Saints & spiritual masters' },
  { key: 'xref', label: 'Cross-references' },
  { key: 'catholic-answers', label: 'Catholic Answers' },
  { key: 'word-on-fire', label: 'Bishop Barron & Word on Fire' },
  { key: 'ascension', label: 'Ascension Presents' },
  { key: 'biay', label: 'Bible in a Year with Fr. Mike Schmitz' },
  { key: 'context', label: 'Scholarly & historical context' },
  { key: 'liturgy', label: 'Liturgical connections' },
  { key: 'mine', label: 'My notes & highlights' },
];

export type MatchKind = 'direct-citation' | 'verse-by-verse' | 'explicit-reference' | 'passage' | 'topic' | 'editorial';

export const MATCH_LABEL: Record<MatchKind, string> = {
  'direct-citation': 'Direct citation — the source quotes this passage',
  'verse-by-verse': 'Verse-by-verse — the source comments on this verse',
  'explicit-reference': 'Explicit reference — the source cites or discusses this passage',
  passage: 'Passage-level — related to this chapter or passage, not this exact verse',
  topic: 'Shared topic — suggested connection, not a citation',
  editorial: 'Editorial suggestion',
};

export interface StudyItem {
  id: string;
  section: SectionKey;
  title: string;
  author?: string;
  authorId?: string;
  excerpt?: string;
  fullExcerpt?: string;
  url?: string;
  internal?: string; // in-app route
  authority: AuthorityLevel;
  period?: Period;
  format: ItemFormat;
  match: MatchKind;
  why: string; // human readable explanation of this connection
  sourceName: string;
  ref?: string; // passage the item is attached to
  date?: string;
  lang?: string;
  rightsNote?: string;
  votes?: number;
  xrefTarget?: string;
}

const AUTH_W: Record<AuthorityLevel, number> = { doctrine: 100, magisterial: 90, father: 70, saint: 60, scholarship: 40, historical: 35, reflection: 20, media: 10 };
const MATCH_W: Record<MatchKind, number> = { 'direct-citation': 30, 'verse-by-verse': 25, 'explicit-reference': 20, passage: 10, topic: 5, editorial: 0 };
export const score = (i: StudyItem) => AUTH_W[i.authority] * 10 + MATCH_W[i.match] * 3 + Math.min(i.votes ?? 0, 100) / 10;

const rangeOf = (r: Ref) => ({ a: r.c1 * 1000 + (r.v1 ?? 0), b: r.c2 * 1000 + (r.v2 ?? 999) });
const overlaps = (r: Ref, c1: number, v1: number, c2: number, v2: number) => {
  const x = rangeOf(r);
  const a = c1 * 1000 + (v1 || 0);
  const b = c2 * 1000 + (v2 || 999);
  return a <= x.b && x.a <= b;
};
const trim = (s: string, n = 420) => (s.length > n ? s.slice(0, s.lastIndexOf(' ', n)) + '…' : s);

export type Provider = (refs: Ref[]) => Promise<StudyItem[]>;

export const providers: Record<string, Provider> = {
  async catechism(refs) {
    const d = await getCccLinks();
    if (!d) return [];
    const out: StudyItem[] = [];
    for (const l of d.links) {
      const lr = parseRefId(l.ref)!;
      if (!refs.some((r) => refsOverlap(r, lr))) continue;
      out.push({
        id: `ccc-${l.para}-${l.ref}`,
        section: 'catechism',
        title: `Catechism of the Catholic Church §${l.para}`,
        author: 'Catechism of the Catholic Church',
        url: cccUrl(l.para),
        authority: 'doctrine',
        period: 'contemporary',
        format: 'external-link',
        match: l.kind === 'quotation' ? 'direct-citation' : 'explicit-reference',
        why: l.kind === 'quotation' ? `This paragraph quotes ${formatRef(lr)} (checked against the paragraph text on ${l.verifiedOn}).` : `This paragraph discusses ${formatRef(lr)} (checked on ${l.verifiedOn}).`,
        sourceName: 'Catechism of the Catholic Church',
        ref: l.ref,
        rightsNote: 'Text © LEV/USCCB; opens at the online paragraph. Not reproduced here.',
        xrefTarget: String(l.para),
      });
    }
    return out;
  },

  async doctrine(refs) {
    const d = await getDoctrine();
    if (!d) return [];
    const out: StudyItem[] = [];
    for (const t of d.topics) {
      const hit = t.scripture.map((s) => parseRefId(s)!).find((tr) => refs.some((r) => refsOverlap(r, tr)));
      if (!hit) continue;
      out.push({
        id: `topic-${t.id}`,
        section: 'doctrine',
        title: t.title,
        excerpt: trim(t.summary, 260),
        internal: `/study/topics/${t.id}`,
        authority: 'scholarship',
        format: 'summary',
        match: 'topic',
        why: `Suggested topical connection: ${formatRef(hit)} is one of the key passages listed for “${t.title}”. This is an editorial pointer, not a citation.`,
        sourceName: 'Study Bible editorial notes',
        ref: refId(hit),
      });
    }
    return out;
  },

  async fathers(refs) {
    const out: StudyItem[] = [];
    const book = refs[0].book;
    const authorsOnly = (await import('../data/content')).getAuthors;
    void authorsOnly;
    // Catena Aurea (verse-by-verse, Matthew & Mark)
    const cat = await getCatena(book);
    if (cat) {
      for (const g of cat.groups) {
        if (!refs.some((r) => overlaps(r, g.c, g.v1, g.c, g.v2))) continue;
        g.items.forEach((it, i) => {
          out.push({
            id: `catena-${book}-${g.c}-${g.v1}-${i}`,
            section: 'fathers',
            title: it.l || it.a,
            author: it.a,
            authorId: it.id,
            excerpt: trim(it.t),
            fullExcerpt: it.t,
            url: `https://ccel.org/ccel/aquinas/${cat.source}/${cat.source}`,
            authority: it.a.startsWith('Glossa') || it.a.startsWith('Aquinas') ? 'historical' : /Bede|Rabanus|Remig|Theophyl/.test(it.a) ? 'historical' : 'father',
            period: /Bede|Rabanus|Remig|Theophyl|Glossa/.test(it.a) ? 'medieval' : 'patristic',
            format: 'excerpt',
            match: 'verse-by-verse',
            why: `Quoted by Thomas Aquinas in the Catena Aurea beneath ${getBook(book).name} ${g.c}:${g.v1}${g.v2 > g.v1 ? '–' + g.v2 : ''}. Attribution as given in the Catena; the Catena's arrangement is the source of the verse link.`,
            sourceName: 'Catena Aurea (English translation, London 1842, via CCEL)',
            ref: refId({ book, c1: g.c, v1: g.v1, c2: g.c, v2: g.v2 }),
          });
        });
      }
    }
    // Library works
    const lib = await getLibraryIndex();
    const entries = (await getLibScripture(book)) ?? [];
    if (lib) {
      const seen = new Set<string>();
      for (const e of entries) {
        if (!refs.some((r) => overlaps(r, e[0], e[1], e[2], e[3]))) continue;
        const w = lib.works.find((x) => x.id === e[4]);
        if (!w) continue;
        const key = `${e[4]}-${e[5]}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const sec = w.sections[e[5]];
        const structural = e[6] === 's';
        out.push({
          id: `lib-${key}`,
          section: w.authority === 'saint' ? 'saints' : 'fathers',
          title: `${w.title}: ${sec.title}`,
          author: w.author,
          authorId: w.authorId,
          excerpt: structural ? `This section of ${w.title} is a ${w.kind === 'commentary' ? 'commentary' : 'homily'} on the passage.` : e[7],
          internal: `/study/works/${w.id}/${e[5]}`,
          authority: w.authority as AuthorityLevel,
          period: w.period as Period,
          format: 'full-text',
          match: structural ? 'verse-by-verse' : 'explicit-reference',
          why: structural
            ? `The section's own heading places it on this passage (structure of the CCEL edition).`
            : `The text cites this passage (scripture reference tagged in the CCEL edition; machine-tagged, so it shows where the passage is mentioned, not necessarily a commentary on it).`,
          sourceName: `${w.title} — ${w.translator ?? 'translator per source'} (CCEL)`,
          ref: `${book}.${e[0]}`,
        });
      }
    }
    // Glossa Ordinaria (Latin)
    const gl = await getGlossa(book);
    if (gl) {
      for (const r of refs) {
        for (let c = r.c1; c <= r.c2; c++) {
          const from = c === r.c1 ? (r.v1 ?? 1) : 1;
          const to = c === r.c2 ? (r.v2 ?? 200) : 200;
          for (const [k, parts] of Object.entries(gl)) {
            const [kc, kv] = k.split('.').map(Number);
            if (kc !== c || kv < from || kv > to) continue;
            const text = parts.map(([l, t]) => (l ? `${l} — ${t.trim()}` : t.trim())).join('\n\n');
            out.push({
              id: `glossa-${book}-${k}`,
              section: 'fathers',
              title: `Glossa Ordinaria on ${getBook(book).name} ${c}:${kv}`,
              author: 'Glossa Ordinaria (medieval compilation of the Fathers)',
              authorId: 'glossa',
              excerpt: trim(text, 360),
              fullExcerpt: text,
              url: 'https://ebible.org/latVUC/',
              authority: 'historical',
              period: 'medieval',
              format: 'excerpt',
              match: 'verse-by-verse',
              why: 'Latin gloss attached to this verse in the Migne edition of the Clementine Vulgate (1880). Latin only; shown unchanged. Medieval glosses compile patristic sayings and include interpretations not binding on Catholics.',
              sourceName: 'Glossa Ordinaria, Migne ed. (via eBible.org, public domain)',
              ref: `${book}.${c}.${kv}`,
              lang: 'la',
            });
          }
        }
      }
    }
    return out;
  },

  async xref(refs) {
    const x = (await getXrefs(refs[0].book)) ?? {};
    const merged = new Map<string, number>();
    for (const r of refs) {
      for (let c = r.c1; c <= r.c2; c++) {
        const from = c === r.c1 ? (r.v1 ?? 1) : 1;
        const to = c === r.c2 ? (r.v2 ?? 200) : 200;
        for (const [k, list] of Object.entries(x)) {
          const [kc, kv] = k.split('.').map(Number);
          if (kc !== c || kv < from || kv > to) continue;
          for (const [t, v] of list) merged.set(t, Math.max(merged.get(t) ?? 0, v));
        }
      }
    }
    return [...merged.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([t, v]): StudyItem => {
        const tr = parseRefId(t)!;
        return {
          id: `xref-${t}`,
          section: 'xref',
          title: formatRef(tr),
          authority: 'scholarship',
          format: 'summary',
          match: 'explicit-reference',
          why: `Listed as a cross-reference by OpenBible.info (community relevance score ${v}). Scholarly/community aid, not Church teaching.`,
          sourceName: 'OpenBible.info (CC BY)',
          ref: t,
          votes: v,
          xrefTarget: t,
        };
      });
  },

  async biay(refs) {
    const b = await getBiay();
    if (!b) return [];
    const out: StudyItem[] = [];
    const seenDay = new Set<number>();
    const eps = [...b.episodes].filter((e) => e.kind === 'day' && e.passages.length).sort((a, b2) => (b2.year ?? 0) - (a.year ?? 0));
    for (const e of eps) {
      if (e.day && seenDay.has(e.day)) continue;
      const hit = e.passages.map((p) => parseRefId(p)).find((pr) => pr && refs.some((r) => refsOverlap(r, pr)));
      if (!hit) continue;
      if (e.day) seenDay.add(e.day);
      out.push({
        id: `biay-${e.id}`,
        section: 'biay',
        title: `Day ${e.day}: ${e.short}`,
        author: 'Fr. Mike Schmitz / Ascension',
        excerpt: trim(e.description, 220),
        internal: `/listen/episode/${e.id}`,
        url: e.page,
        authority: 'media',
        period: 'contemporary',
        format: 'audio',
        match: 'passage',
        why: `Day ${e.day}'s reading includes ${formatRef(hit)}. Passage list comes from the show's own feed metadata (source: ${e.passageSource.replace('-', ' ')}). Chapter-level match, not this exact verse.`,
        sourceName: 'The Bible in a Year (Ascension)',
        ref: refId(hit),
        date: e.date,
      });
    }
    return out;
  },

  async context(refs) {
    const book = refs[0].book;
    const ov = await getOverviews();
    const out: StudyItem[] = [];
    if (ov?.[book]) {
      out.push({
        id: `overview-${book}`,
        section: 'context',
        title: `About ${getBook(book).name}`,
        author: 'Study Bible editorial notes',
        excerpt: ov[book],
        authority: 'scholarship',
        format: 'summary',
        match: 'passage',
        why: 'Short neutral overview written for this app. Not a magisterial text.',
        sourceName: 'Study Bible editorial notes',
      });
    }
    return out;
  },

  async liturgy(refs) {
    // Uses only data already on this device: imported/entered lectionary references and cached LitCal years.
    const out: StudyItem[] = [];
    const { getUserLectionary, SLOT_LABEL } = await import('../liturgy/readings');
    const { parseRefs } = await import('../lib/refs');
    const { convertRef } = await import('../lib/versification');
    const user = await getUserLectionary();
    const consider = (date: string, slot: string, text: string, source: string, name?: string) => {
      for (const piece of text.split('|')) {
        const p = parseRefs(piece.replace(/\s*[–—]\s*/g, '-'));
        if (!p.ok) continue;
        for (const { ref } of p.refs) {
          const anchor = ref.book === 'PSA' ? { ...ref } : convertRef('kjv', 'vulgate', ref).ref;
          if (ref.book !== 'PSA' && !refs.some((r) => refsOverlap(r, anchor))) continue;
          if (ref.book === 'PSA') continue; // psalm numbering differs; not matched automatically
          out.push({ id: `lit-${date}-${slot}`, section: 'liturgy', title: `${name ?? date}: ${SLOT_LABEL[slot as keyof typeof SLOT_LABEL] ?? slot}`, excerpt: text.replace(/\|/g, ' or '), internal: `/pray/readings/${date}`, authority: 'magisterial', period: 'contemporary', format: 'summary', match: 'direct-citation', why: `This passage is assigned on ${date} (${source}).`, sourceName: source, ref: refId(anchor), date });
          return;
        }
      }
    };
    for (const [date, r] of Object.entries(user)) for (const [slot, text] of Object.entries(r)) if (text) consider(date, slot, text as string, 'lectionary list on this device');
    const rows = await db.cache.filter((x) => x.key.startsWith('litcal:')).toArray();
    for (const row of rows) for (const e of (row.value as any).events ?? []) {
      const r = e.readings;
      const flat = r && typeof r.first_reading === 'string' ? r : r?.day ?? null;
      if (flat) for (const [slot, text] of Object.entries(flat)) if (typeof text === 'string' && text && slot !== 'gospel_acclamation') consider(e.date, slot, text, 'LitCal calendar data', e.name);
    }
    return out.slice(0, 12);
  },

  async mine(refs) {
    const book = refs[0].book;
    const out: StudyItem[] = [];
    const notes = await db.notes.where('chapterKeys').anyOf(refs.flatMap((r) => Array.from({ length: r.c2 - r.c1 + 1 }, (_, i) => `${book}.${r.c1 + i}`))).toArray();
    for (const n of notes) {
      const hit = n.targets.find((t) => t.type === 'passage' && refs.some((r) => refsOverlap(r, parseRefId(t.ref)!)));
      if (!hit) continue;
      out.push({ id: `note-${n.id}`, section: 'mine', title: n.title || (n.body.slice(0, 50) || 'Note'), excerpt: trim(n.body, 240), internal: `/library/notes/${n.id}`, authority: 'reflection', format: 'summary', match: 'direct-citation', why: 'Your private note on this passage.', sourceName: 'Your notes', date: new Date(n.updatedAt).toISOString().slice(0, 10) });
    }
    const marks = await db.highlights.where('[book+c]').between([book, 0], [book, 999], true, true).toArray();
    for (const h of marks) {
      const hr = parseRefId(h.ref);
      if (hr && refs.some((r) => refsOverlap(r, hr))) out.push({ id: `hl-${h.id}`, section: 'mine', title: `Highlight (${h.color})`, excerpt: formatRef(hr), authority: 'reflection', format: 'summary', match: 'direct-citation', why: 'Your highlight.', sourceName: 'Your highlights' });
    }
    const bms = await db.bookmarks.toArray();
    for (const b of bms) {
      const br = parseRefId(b.ref);
      if (br && refs.some((r) => refsOverlap(r, br))) out.push({ id: `bm-${b.id}`, section: 'mine', title: b.kind === 'later' ? 'Marked for later study' : 'Bookmark', excerpt: formatRef(br), authority: 'reflection', format: 'summary', match: 'direct-citation', why: 'Your bookmark.', sourceName: 'Your bookmarks' });
    }
    return out;
  },
};

/** Search links to external Catholic publishers. These are *links to their search pages*; the app does not claim they contain anything on this passage. */
export function externalSearchItems(refs: Ref[]): StudyItem[] {
  const q = formatRef(refs[0]);
  const enc = encodeURIComponent(q);
  const base = { authority: 'reflection' as AuthorityLevel, period: 'contemporary' as Period, match: 'passage' as MatchKind, format: 'external-link' as ItemFormat };
  return [
    {
      ...base,
      id: 'ext-ca',
      section: 'catholic-answers',
      title: `Search Catholic Answers for “${q}”`,
      url: `https://www.catholic.com/search?q=${enc}`,
      why: 'A link to Catholic Answers’ own search. Results are not curated or checked by this app; popular apologetics, not magisterial teaching.',
      sourceName: 'Catholic Answers',
    },
    {
      ...base,
      id: 'ext-wof',
      section: 'word-on-fire',
      title: `Find Bishop Barron on “${q}”`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent('Bishop Barron ' + q)}`,
      why: 'A YouTube search for Bishop Barron on this passage (Word on Fire has no public API and blocks automated lookups). Results are not curated or checked by this app.',
      sourceName: 'Word on Fire (via YouTube search)',
    },
    {
      ...base,
      id: 'ext-wof-site',
      section: 'word-on-fire',
      title: 'Word on Fire — Gospel commentaries and homilies',
      url: 'https://www.wordonfire.org/',
      why: 'The publisher’s site. Not matched to this passage.',
      sourceName: 'Word on Fire',
    },
    {
      ...base,
      id: 'ext-asc',
      section: 'ascension',
      title: `Search Ascension for “${q}”`,
      url: `https://ascensionpress.com/search?q=${enc}`,
      why: 'A link to Ascension’s own search page. Results are not curated or checked by this app.',
      sourceName: 'Ascension',
    },
  ];
}

export async function gatherAll(refs: Ref[], onSection: (key: SectionKey, items: StudyItem[]) => void) {
  const jobs: [SectionKey[], Promise<StudyItem[]>][] = [
    [['catechism'], providers.catechism(refs)],
    [['doctrine'], providers.doctrine(refs)],
    [['fathers', 'saints'], providers.fathers(refs)],
    [['xref'], providers.xref(refs)],
    [['biay'], providers.biay(refs)],
    [['context'], providers.context(refs)],
    [['liturgy'], providers.liturgy(refs)],
    [['mine'], providers.mine(refs)],
  ];
  onSection('catholic-answers', externalSearchItems(refs).filter((i) => i.section === 'catholic-answers'));
  onSection('word-on-fire', externalSearchItems(refs).filter((i) => i.section === 'word-on-fire'));
  onSection('ascension', externalSearchItems(refs).filter((i) => i.section === 'ascension'));
  await Promise.all(
    jobs.map(async ([keys, p]) => {
      let items: StudyItem[] = [];
      try {
        items = await p;
      } catch {
        items = [];
      }
      for (const k of keys) onSection(k, items.filter((i) => i.section === k).sort((a, b) => score(b) - score(a)));
    }),
  );
}
export { CCC_OFFICIAL };
