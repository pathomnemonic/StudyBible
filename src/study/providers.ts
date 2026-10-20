import type { AuthorityLevel, ItemFormat, Period } from '../lib/types';
import { formatRef, parseRefId, refId, refsOverlap, type Ref } from '../lib/refs';
import { getBook } from '../lib/canon';
import {
  CCC_OFFICIAL, cccUrl, getBiay, getCatena, getCccLinks, getDoctrine, getGlossa, getHaydock, getChalloner, getLibScripture, getLibraryIndex, getOverviews, getResourceCatalog, getResourceRefs, getResourceSources, getMagisteriumRefs, getMagisteriumIndex, getPlaces, getPlacesByBook, getTopicIndex, getTopicsByBook,
} from '../data/content';
import { getXrefs } from '../data/loader';
import type { ResourceSource } from '../data/content';
import { languageLinks } from './languageTools';
import { chapterReadingItems } from './readingLinks';
import { getIndexes, getSynopsis, getVariants, getThemes, refsFromText } from './refData';
import { convertRef } from '../lib/versification';
import { db } from '../db/db';
import { lensItems } from './lens';

export type SectionKey =
  | 'doctrine' | 'catechism' | 'magisterium' | 'liturgy' // teaching
  | 'commentary' // verse-by-verse Catholic commentaries
  | 'fathers' | 'saints'
  | 'xref'
  | 'catholic-answers' | 'creators' | 'word-on-fire' | 'ascension' | 'resources' | 'biay' | 'links' // media & apologetics
  | 'context' | 'language' | 'places' | 'topics' | 'parallels' | 'art' | 'background' | 'typology'
  | 'quotes' | 'customs' | 'structure' | 'wordnotes' | 'versions' | 'witnesses' | 'echoes' | 'genre' | 'dependency' | 'reception' // lenses
  | 'mine';

export const SECTIONS: { key: SectionKey; label: string; hint?: string }[] = [
  { key: 'catechism', label: 'Catechism of the Catholic Church', hint: 'Verse-level citations, each checked against the paragraph.' },
  { key: 'magisterium', label: 'Church documents', hint: 'Dei Verbum, Verbum Domini, other encyclicals and Vatican II texts that cite this passage. Open the document at vatican.va and find the numbered article.' },
  { key: 'doctrine', label: 'Doctrine topics', hint: 'Editorial pointers: key passages for a teaching.' },
  { key: 'liturgy', label: 'Liturgical use' },
  { key: 'commentary', label: 'Catholic commentary', hint: 'Haydock and the Catena Aurea, verse by verse.' },
  { key: 'fathers', label: 'Church Fathers & Doctors', hint: 'Works in the library that comment on or cite this passage.' },
  { key: 'saints', label: 'Saints & spiritual masters' },
  { key: 'xref', label: 'Cross-references' },
  { key: 'catholic-answers', label: 'Catholic Answers', hint: 'Links to individual pages on catholic.com. Open them to read the full article there.' },
  { key: 'creators', label: 'Catholic creators & apologists', hint: 'Jimmy Akin, Trent Horn, Matt Fradd, Brant Pitre and others: videos, podcasts and articles, linked at their source.' },
  { key: 'word-on-fire', label: 'Bishop Barron & Word on Fire' },
  { key: 'ascension', label: 'Ascension Presents' },
  { key: 'biay', label: 'Bible in a Year with Fr. Mike Schmitz' },
  { key: 'resources', label: 'Other Catholic resources' },
  { key: 'links', label: 'Links you added' },
  { key: 'language', label: 'Original language', hint: 'Greek and Hebrew study tools for this verse (third-party sites, not checked by this app). Protocanonical books only.' },
  { key: 'typology', label: 'Types and fulfilment', hint: 'How the New Testament and the Fathers read this passage as promise or fulfilment, with their own words.' },
  { key: 'background', label: 'Jewish and historical background', hint: 'Scholars of the Temple, the synagogue and the Gospels’ world (public-domain, 19th century). They help with background, not doctrine.' },
  { key: 'art', label: 'Sacred art', hint: 'Public-domain paintings of scenes from the passage (The Metropolitan Museum of Art, open access).' },
  { key: 'parallels', label: 'Parallels and indexes', hint: 'Gospel parallels, parables, miracles, prophecy and fulfilment, covenants (an editorial index written for this app).' },
  { key: 'places', label: 'Places', hint: 'Locations named in this passage (OpenBible.info geocoding, CC BY). Open the map.' },
  { key: 'topics', label: 'Topical index', hint: 'Topics people have tied to this passage (OpenBible.info, CC BY; community-voted, not Church-reviewed).' },
  { key: 'context', label: 'Context & translation notes' },
  { key: 'quotes', label: 'Quoted and echoed', hint: 'Where the New Testament quotes or echoes the Old, and where this Old Testament text is taken up.' },
  { key: 'dependency', label: 'Read this first', hint: 'Earlier passages this one assumes.' },
  { key: 'customs', label: 'The world of the text', hint: 'Daily life, places, coins and customs, labelled by how well attested they are.' },
  { key: 'witnesses', label: 'Manuscripts', hint: 'Ancient copies that preserve this passage.' },
  { key: 'versions', label: 'Ancient versions', hint: 'Hebrew, Greek Old Testament, Latin and others compared.' },
  { key: 'structure', label: 'Shape of the passage', hint: 'Acrostics, refrains, chiasms and other patterns, marked as fact or proposal.' },
  { key: 'genre', label: 'Kind of writing' },
  { key: 'wordnotes', label: 'Translation and ambiguity notes', hint: 'Where a familiar English word hides a distinction, or the original allows more than one reading.' },
  { key: 'reception', label: 'How it has been read', hint: 'Interpretations through the centuries (not an endorsement of each).' },
  { key: 'echoes', label: 'In the Church’s worship', hint: 'Liturgy, prayers, hymns and devotions that use this passage.' },
  { key: 'mine', label: 'My notes & highlights' },
];

/** How sections are grouped into the panel's tabs. */
export const TABS: { id: string; label: string; sections: SectionKey[] }[] = [
  { id: 'notes', label: 'Notes', sections: ['commentary', 'fathers', 'saints'] },
  { id: 'teaching', label: 'Teaching', sections: ['catechism', 'magisterium', 'doctrine', 'liturgy', 'echoes', 'reception'] },
  { id: 'connections', label: 'Connections', sections: ['typology', 'quotes', 'xref', 'parallels', 'dependency', 'topics'] },
  { id: 'words', label: 'Words', sections: ['wordnotes', 'versions'] },
  { id: 'world', label: 'World', sections: ['customs', 'background', 'structure', 'genre', 'witnesses', 'places', 'context', 'language'] },
  { id: 'media', label: 'Media', sections: ['art', 'catholic-answers', 'creators', 'word-on-fire', 'ascension', 'biay', 'resources', 'links'] },
  { id: 'mine', label: 'Mine', sections: ['mine'] },
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
  internal?: string;
  authority: AuthorityLevel;
  period?: Period;
  format: ItemFormat;
  match: MatchKind;
  why: string;
  sourceName: string;
  ref?: string;
  date?: string;
  lang?: string;
  rightsNote?: string;
  votes?: number;
  xrefTarget?: string;
  /** a type badge such as "Q&A", "Navigator", "Homily" */
  kind?: string;
  /** the user's own link (can be removed) */
  userLinkId?: number;
  tags?: string[];
  /** podcast / programme name */
  show?: string;
  /** a Bible in a Year episode id: played by the app's own player */
  episodeId?: string;
  /** how the match was checked, shown to the reader */
  basis?: string;
  /** the publisher's own audio address, playable in the app */
  audio?: string;
  /** verbatim quotations from library works, each linking to its section */
  quotes?: { who: string; text: string; href: string }[];
  /** a small picture shown on the card (a path under the app's data folder) */
  thumb?: string;
  /** how firm an editorial claim is (see STATUS_LABEL in lens.ts) */
  status?: string;
  /** labelled sub-passages (the parts of a structure, a chain of earlier readings) */
  parts?: { label: string; note?: string; ref?: string }[];
  /** extra outbound links (e.g. search this creator on YouTube / podcast apps) */
  links?: { label: string; url: string }[];
}

const AUTH_W: Record<AuthorityLevel, number> = { doctrine: 100, magisterial: 90, father: 70, saint: 60, scholarship: 40, historical: 35, reflection: 20, media: 10 };
const MATCH_W: Record<MatchKind, number> = { 'direct-citation': 30, 'verse-by-verse': 25, 'explicit-reference': 20, passage: 10, topic: 5, editorial: 0 };
/**
 * How useful an item is for the passage that is selected. Ordered by what a reader wants first:
 *   1. how specific it is to these verses (a note on exactly this verse, then a note shared by a few verses, then chapter-level);
 *   2. whether the substance is in the app (a real note or quotation you can read here) rather than a link you have to leave for;
 *   3. only then the source's authority, as a tie-break, and community votes.
 * With no verse selected (chapter view) specificity falls back to how the item was matched.
 */
export function relevance(i: StudyItem, sel: Ref[] = []): number {
  let spec: number;
  const s = sel.length === 1 && sel[0].v1 !== undefined && sel[0].c1 === sel[0].c2 ? sel[0] : null;
  const r = i.ref ? parseRefId(i.ref) : null;
  if (s && r && r.book === s.book && r.v1 !== undefined && r.c1 === r.c2 && r.c1 === s.c1) {
    const a = r.v1;
    const b = r.v2 ?? r.v1;
    const sa = s.v1!;
    const sb = s.v2 ?? s.v1!;
    if (a === sa && b === sb) spec = 100;
    else if (a >= sa && b <= sb) spec = 92;
    else if (a <= sa && sb <= b) spec = Math.max(60, 92 - 3 * (b - a));
    else spec = 35; // overlaps only part of the selection
  } else if (s && r && r.book === s.book && (r.v1 === undefined || r.c1 !== r.c2)) {
    spec = 25; // a chapter or longer passage
  } else {
    spec = { 'direct-citation': 85, 'verse-by-verse': 85, 'explicit-reference': 60, passage: 30, topic: 12, editorial: 12 }[i.match];
  }
  // a work that merely mentions the verse is not commentary on it
  if (i.match === 'explicit-reference') spec = Math.min(spec, 75);
  const text = (i.fullExcerpt ?? i.excerpt ?? '').length;
  let substance = text >= 120 ? 30 : text >= 40 ? 15 : 0;
  if (i.url && !i.internal && text < 40) substance -= 15; // you have to click out to get anything
  if (i.links?.length && text < 40) substance -= 10;
  if (i.kind === 'Search') substance -= 40;
  if (i.kind && ['Read with notes', 'Chapter summary', 'Book introduction'].includes(i.kind)) substance -= 20;
  if (i.audio || i.episodeId) substance += 10; // plays here
  // a note written on the verse beats a work that merely mentions it
  const kind = { 'verse-by-verse': 12, 'direct-citation': 6, 'explicit-reference': 0, passage: -5, topic: -10, editorial: -10 }[i.match];
  return spec + substance + kind + AUTH_W[i.authority] / 10 + Math.min(i.votes ?? 0, 100) / 10;
}
export const score = (i: StudyItem, sel: Ref[] = []) => relevance(i, sel);

const overlaps = (r: Ref, c1: number, v1: number, c2: number, v2: number) => {
  const a = r.c1 * 1000 + (r.v1 ?? 0);
  const b = r.c2 * 1000 + (r.v2 ?? 999);
  return c1 * 1000 + (v1 || 0) <= b && a <= c2 * 1000 + (v2 || 999);
};
const trim = (s: string, n = 420) => (s.length > n ? s.slice(0, s.lastIndexOf(' ', n)) + '…' : s);
const anyOverlap = (refs: Ref[], c1: number, v1: number, c2: number, v2: number) => refs.some((r) => overlaps(r, c1, v1, c2, v2));

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
        title: `Catechism §${l.para}`,
        author: 'Catechism of the Catholic Church',
        url: cccUrl(l.para),
        authority: 'doctrine',
        period: 'contemporary',
        format: 'external-link',
        match: l.kind === 'quotation' ? 'direct-citation' : 'explicit-reference',
        why: l.kind === 'quotation' ? `This paragraph quotes ${formatRef(lr)} (checked against the paragraph text on ${l.verifiedOn}).` : `This paragraph discusses ${formatRef(lr)} (checked on ${l.verifiedOn}).`,
        sourceName: 'Catechism of the Catholic Church',
        ref: l.ref,
        rightsNote: 'Text © LEV/USCCB; opens at the online paragraph.',
        xrefTarget: String(l.para),
        kind: 'CCC',
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
        why: `Suggested topical connection: ${formatRef(hit)} is one of the key passages listed for “${t.title}”. An editorial pointer, not a citation.`,
        sourceName: 'Study Bible editorial notes',
        ref: refId(hit),
        kind: 'Topic',
      });
    }
    return out;
  },

  /** Verse-by-verse Catholic commentary: Haydock, the Catena Aurea, and the Glossa Ordinaria. */
  async commentary(refs) {
    const out: StudyItem[] = [...chapterReadingItems(refs)];
    const book = refs[0].book;
    const bookName = getBook(book).name;

    const hay = await getHaydock(book);
    if (hay) {
      hay.forEach(([c1, v1, c2, v2, text], i) => {
        if (!anyOverlap(refs, c1, v1, c2, v2)) return;
        const label = `${bookName} ${c1}:${v1}${c2 !== c1 || v2 !== v1 ? '–' + (c2 !== c1 ? c2 + ':' : '') + v2 : ''}`;
        out.push({
          id: `haydock-${book}-${i}`,
          section: 'commentary',
          title: `Haydock on ${label}`,
          author: 'George Leo Haydock (compiler)',
          authorId: 'haydock',
          excerpt: trim(text, 380),
          fullExcerpt: text,
          url: `https://www.sermonindex.net/commentary/haydock-c/${book}/${c1}`,
          authority: 'historical',
          period: 'early-modern',
          format: 'excerpt',
          match: 'verse-by-verse',
          why: `Haydock’s note on this verse in his Douay-Rheims commentary (1859 edition). It gathers sayings of the Fathers and later Catholic scholars; individual opinions are not binding.`,
          sourceName: 'Haydock’s Catholic Bible Commentary (public domain, via SermonIndex)',
          ref: refId({ book, c1, v1, c2, v2 }),
          kind: 'Haydock',
        });
      });
    }


    const ch = await getChalloner(book);
    if (ch) {
      const seenCh = new Set<number>();
      for (const r of refs) for (let c = r.c1; c <= r.c2; c++) seenCh.add(c);
      for (const c of seenCh) {
        const sum = ch.chapters[String(c)];
        if (!sum) continue;
        out.push({
          id: `challoner-sum-${book}-${c}`,
          section: 'commentary',
          title: `${bookName} ${c}: summary of the chapter (Challoner)`,
          author: 'Bishop Richard Challoner',
          authorId: 'challoner',
          excerpt: sum,
          authority: 'historical',
          period: 'early-modern',
          format: 'excerpt',
          match: 'passage',
          why: 'The one-line summary Bishop Challoner printed at the head of this chapter in the Douay-Rheims Bible (1749–1752). It is a heading for the whole chapter, not a note on this verse.',
          sourceName: 'Douay-Rheims Bible, Challoner revision (public domain, via Project Gutenberg)',
          ref: `${book}.${c}`,
          kind: 'Chapter summary',
        });
      }
      ch.notes.forEach(([c1, v1, c2, v2, text], i) => {
        if (!anyOverlap(refs, c1, v1, c2, v2)) return;
        out.push({
          id: `challoner-${book}-${i}`,
          section: 'commentary',
          title: `Challoner’s note on ${bookName} ${c1}:${v1}`,
          author: 'Bishop Richard Challoner',
          authorId: 'challoner',
          excerpt: trim(text, 380),
          fullExcerpt: text,
          url: 'https://www.gutenberg.org/ebooks/8300',
          authority: 'historical',
          period: 'early-modern',
          format: 'excerpt',
          match: 'verse-by-verse',
          why: 'Bishop Challoner’s annotation on this verse in the Douay-Rheims Bible (1749–1752). The note’s key words come first, followed by “…”. An eighteenth-century note: some of the scholarship is dated.',
          sourceName: 'Douay-Rheims Bible, Challoner revision (public domain, via Project Gutenberg)',
          ref: refId({ book, c1, v1, c2, v2 }),
          kind: 'Challoner',
        });
      });
      if (ch.intro && refs.some((r) => r.c1 === 1)) {
        out.push({
          id: `challoner-intro-${book}`,
          section: 'commentary',
          title: `${bookName}: Challoner’s introduction`,
          author: 'Bishop Richard Challoner',
          authorId: 'challoner',
          excerpt: trim(ch.intro, 380),
          fullExcerpt: ch.intro,
          authority: 'historical',
          period: 'early-modern',
          format: 'excerpt',
          match: 'passage',
          why: 'The introduction Bishop Challoner printed before this book in the Douay-Rheims Bible (1749–1752). Its views on authorship and date are traditional and predate modern scholarship.',
          sourceName: 'Douay-Rheims Bible, Challoner revision (public domain, via Project Gutenberg)',
          ref: `${book}.1`,
          kind: 'Book introduction',
        });
      }
    }

    const cat = await getCatena(book);
    if (cat) {
      for (const g of cat.groups) {
        if (!anyOverlap(refs, g.c, g.v1, g.c, g.v2)) continue;
        const where = `${bookName} ${g.c}:${g.v1}${g.v2 > g.v1 ? '–' + g.v2 : ''}`;
        g.items.forEach((it, i) => {
          const medieval = /Bede|Rabanus|Remig|Theophyl|Anselm|Gloss|Alcuin|Isidore|Damascene/.test(it.a);
          out.push({
            id: `catena-${book}-${g.c}-${g.v1}-${i}`,
            section: 'commentary',
            title: it.a,
            author: it.l && it.l !== it.a ? it.l : undefined,
            authorId: it.id,
            excerpt: trim(it.t, 460),
            fullExcerpt: it.t,
            url: 'https://crosswire.org/sword/modules/ModInfo.jsp?modName=Catena',
            authority: medieval ? 'historical' : 'father',
            period: medieval ? 'medieval' : 'patristic',
            format: 'excerpt',
            match: 'verse-by-verse',
            why: `Quoted by Thomas Aquinas in the Catena Aurea beneath ${where}. Attribution as printed in the Catena (translation 1842, public domain).`,
            sourceName: 'Catena Aurea (Aquinas; English translation 1842)',
            ref: refId({ book, c1: g.c, v1: g.v1, c2: g.c, v2: g.v2 }),
            kind: 'Catena Aurea',
          });
        });
      }
    }

    const gl = await getGlossa(book);
    if (gl) {
      for (const [k, parts] of Object.entries(gl)) {
        const [kc, kv] = k.split('.').map(Number);
        if (!anyOverlap(refs, kc, kv, kc, kv)) continue;
        const text = parts.map(([l, t]) => (l ? `${l} — ${t.trim()}` : t.trim())).join('\n\n');
        out.push({
          id: `glossa-${book}-${k}`,
          section: 'commentary',
          title: `Glossa Ordinaria on ${bookName} ${kc}:${kv}`,
          author: 'Medieval gloss, compiled from the Fathers',
          authorId: 'glossa',
          excerpt: trim(text, 300),
          fullExcerpt: text,
          url: 'https://ebible.org/latVUC/',
          authority: 'historical',
          period: 'medieval',
          format: 'excerpt',
          match: 'verse-by-verse',
          why: 'Latin gloss attached to this verse in the Migne edition of the Clementine Vulgate (1880). Latin only, shown unchanged; it includes interpretations not binding on Catholics.',
          sourceName: 'Glossa Ordinaria, Migne ed. (public domain, via eBible.org)',
          ref: `${book}.${kc}.${kv}`,
          lang: 'la',
          kind: 'Glossa (Latin)',
        });
      }
    }
    return out;
  },

  /** Works in the Fathers & saints library (full texts and the Summa's citation index). */
  async fathers(refs) {
    const out: StudyItem[] = [];
    const book = refs[0].book;
    const lib = await getLibraryIndex();
    const entries = (await getLibScripture(book)) ?? [];
    if (!lib) return out;
    const seen = new Set<string>();
    for (const e of entries) {
      if (!anyOverlap(refs, e[0], e[1], e[2], e[3])) continue;
      const w = lib.works.find((x) => x.id === e[4]);
      if (!w) continue;
      const key = `${e[4]}-${e[5]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const sec = w.sections[e[5]];
      const structural = e[6] === 's';
      const base = {
        id: `lib-${key}`,
        section: (w.authority === 'saint' ? 'saints' : w.authority === 'scholarship' ? 'background' : 'fathers') as SectionKey,
        title: w.indexOnly ? `${w.title.replace(/ \(index.*\)/, '')}: ${sec.title}` : `${w.title}: ${sec.title}`,
        author: w.author,
        authorId: w.authorId,
        authority: w.authority as AuthorityLevel,
        period: w.period as Period,
        ref: refId({ book, c1: e[0], v1: e[1] || undefined, c2: e[2], v2: e[3] || undefined }),
      };
      if (w.indexOnly) {
        out.push({ ...base, excerpt: e[7], url: w.sectionUrl!.replace('{id}', sec.id), format: 'excerpt', match: 'explicit-reference', kind: 'Summa', why: 'This article of the Summa Theologiae cites the passage (tagged in the CCEL edition, Vulgate numbering). The excerpt shows the sentence around the citation; the full article opens at CCEL.', sourceName: `Summa Theologica — ${w.translator} (CCEL)` });
      } else {
        out.push({
          ...base,
          excerpt: structural ? `This section of ${w.title} is a ${w.kind === 'commentary' ? 'commentary' : 'homily'} on the passage.` : e[7],
          internal: `/study/works/${w.id}/${e[5]}`,
          format: 'full-text',
          match: structural ? 'verse-by-verse' : 'explicit-reference',
          kind: w.authorId === 'edersheim' ? 'Jewish background' : w.kind === 'homilies' ? 'Homily' : w.kind === 'commentary' ? 'Commentary' : 'Work',
          why: structural
            ? `The section's own heading places it on this passage (structure of the CCEL edition).`
            : `The text cites this passage (scripture reference tagged in the CCEL edition: machine-tagged, so it shows where the passage is mentioned, not necessarily a commentary on it).`,
          sourceName: `${w.title} — ${w.translator ?? 'translator per source'} (CCEL)`,
        });
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
          why: `Listed as a cross-reference by OpenBible.info (community relevance score ${v}). A scholarly/community aid, not Church teaching.`,
          sourceName: 'OpenBible.info (CC BY)',
          ref: t,
          votes: v,
          xrefTarget: t,
        };
      });
  },

  /** Articles, Q&As, videos and episodes from Catholic publishers that are tied to this passage in the resource catalog. */
  /** Magisterial documents whose numbered articles cite this passage (article numbers and references only; the text stays at vatican.va). */
  async magisterium(refs) {
    const book = refs[0].book;
    const [list, idx] = await Promise.all([getMagisteriumRefs(book), getMagisteriumIndex()]);
    if (!list || !idx) return [];
    const out: StudyItem[] = [];
    const seen = new Set<string>();
    for (const [c1, v1, c2, v2, di, art] of list) {
      if (!anyOverlap(refs, c1, v1, c2, v2)) continue;
      const d = idx.documents[di];
      const key = `${di}-${art}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const era = d.date.slice(0, 4);
      out.push({
        id: `mag-${d.id}-${art}`,
        section: 'magisterium',
        title: `${d.short} ${d.kind === 'Encyclical' || d.kind === 'Apostolic exhortation' ? '§' : 'art. '}${art}`,
        author: `${d.author}, ${era}`,
        url: d.url,
        authority: 'magisterial',
        period: 'contemporary',
        format: 'external-link',
        match: 'explicit-reference',
        why: `Article ${art} of ${d.title} cites ${formatRef(parseRefId(refId({ book, c1, v1, c2, v2 }))!)} in its text or notes (read automatically from the Vatican’s page; article numbers can occasionally be off by one, so check at the source).`,
        sourceName: 'Vatican.va',
        rightsNote: 'Document © Libreria Editrice Vaticana; opens on vatican.va.',
        kind: d.kind,
        date: d.date,
      });
    }
    return out;
  },

  /** Editorial reference indexes: Gospel parallels, parables, miracles, prophecy/fulfilment, covenants. */
  async parallels(refs) {
    const [syn, idx, vars, themes] = await Promise.all([getSynopsis(), getIndexes(), getVariants(), getThemes()]);
    const out: StudyItem[] = [];
    const hit = (text: string) => refsFromText(text).filter((r) => refs.some((x) => refsOverlap(x, r)));
    const add = (id: string, kind: string, title: string, others: string[], why: string, link?: string) =>
      out.push({
        id, section: 'parallels', title, excerpt: others.length ? `See also: ${others.join(' · ')}` : undefined, internal: link,
        authority: 'scholarship', period: 'contemporary', format: 'external-link', match: 'explicit-reference', why, sourceName: 'Study Bible reference index (editorial)', kind,
      });
    for (const r of syn?.rows ?? []) {
      const cols = r.slice(1);
      if (!cols.some((c) => c && hit(c).length)) continue;
      const others = cols.filter((c) => c && !hit(c).length);
      add(`syn-${r[0]}`, 'Gospel parallel', r[0], others, 'This passage belongs to a pericope that appears in more than one Gospel (common synopses; the grouping is editorial). Open the synopsis to read them side by side.', `/study/synopsis?p=${encodeURIComponent(r[0])}`);
    }
    for (const r of idx?.parables ?? []) if (hit(r[1]).length) add(`par-${r[0]}`, 'Parable', r[0], [r[1]], 'Listed among the parables of Jesus.', '/study/index?tab=parables');
    for (const r of idx?.miracles ?? []) if (hit(r[1]).length) add(`mir-${r[0]}`, 'Miracle', r[0], [r[1]], `Listed among the miracles of Jesus (${r[2]}).`, '/study/index?tab=miracles');
    for (const r of idx?.prophecies ?? []) {
      const ot = hit(r[1]).length;
      const nt = hit(r[2]).length;
      if (ot || nt) add(`pro-${r[0]}`, ot ? 'Prophecy' : 'Fulfilment', r[0], ot ? [r[2]] : [r[1]], 'A passage the New Testament itself cites or applies; the pairing is the New Testament’s own, not a modern guess.', '/study/index?tab=prophecies');
    }
    for (const x of vars?.variants ?? []) if (hit(x.refs).length) add(`var-${x.id}`, 'Textual variant', x.title, [], 'Manuscripts or ancient versions differ here. Open the textual-history page for the evidence and the bundled editions side by side.', `/study/textual?v=${x.id}`);
    for (const th of themes?.themes ?? []) {
      const st = th.stages.find((s) => hit(s.refs).length);
      if (st) add(`theme-${th.id}`, 'Biblical theme', th.title, [st.label], 'This passage is a stage in the theme traced in the biblical theology explorer.', `/study/themes?t=${th.id}`);
    }
    for (const r of idx?.covenants ?? []) if (hit(r[1]).length) add(`cov-${r[0]}`, 'Covenant', r[0], [], r[2], '/study/index?tab=covenants');
    return out;
  },

  /** Places named in the passage, from the OpenBible geocoding data. */
  async places(refs) {
    const book = refs[0].book;
    const [byBook, places] = await Promise.all([getPlacesByBook(book), getPlaces()]);
    if (!byBook || !places) return [];
    const out: StudyItem[] = [];
    const seen = new Set<number>();
    for (const [c, v, idx] of byBook) {
      if (seen.has(idx) || !anyOverlap(refs, c, v, c, v)) continue;
      const pl = places[idx];
      if (!pl) continue;
      seen.add(idx);
      out.push({
        id: `place-${idx}`,
        section: 'places',
        title: pl.n,
        excerpt: [pl.c, pl.r ? `Same site as ${pl.r}` : '', pl.a ? 'Location approximate' : ''].filter(Boolean).join(' · ') || undefined,
        internal: `/study/maps?place=${idx}`,
        authority: 'scholarship',
        period: 'contemporary',
        format: 'external-link',
        match: 'explicit-reference',
        why: `${pl.n} is named in ${formatRef(refs[0])}. Coordinates are scholarly best guesses from OpenBible.info (CC BY 4.0).`,
        sourceName: 'OpenBible.info geocoding',
        kind: 'Place',
      });
    }
    return out;
  },

  /** Topics tied to the passage in the OpenBible topical index. */
  async topics(refs) {
    const book = refs[0].book;
    const [byBook, names] = await Promise.all([getTopicsByBook(book), getTopicIndex()]);
    if (!byBook || !names) return [];
    const best = new Map<number, number>();
    for (const [c1, v1, c2, v2, ti, score] of byBook) if (anyOverlap(refs, c1, v1, c2, v2)) best.set(ti, Math.max(best.get(ti) ?? 0, score));
    return [...best.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([ti, score]) => ({
        id: `topic-${ti}`,
        section: 'topics' as SectionKey,
        title: names[ti][0],
        internal: `/study/topical?topic=${encodeURIComponent(names[ti][0])}`,
        authority: 'reflection' as AuthorityLevel,
        period: 'contemporary' as Period,
        format: 'external-link' as ItemFormat,
        match: 'topic' as MatchKind,
        why: `Readers of the OpenBible topical index tied this passage to “${names[ti][0]}” (score ${score}). It is a shared-topic suggestion, not a citation or a Church teaching.`,
        sourceName: 'OpenBible.info topics',
        kind: 'Topic',
        votes: score,
      }));
  },

  async external(refs) {
    const out: StudyItem[] = [];
    const book = refs[0].book;
    const [list, catalog, sources] = await Promise.all([getResourceRefs(book), getResourceCatalog(), getResourceSources()]);
    if (!list || !catalog) return out;
    const srcById = new Map((sources ?? []).map((x) => [x.id, x]));
    const seen = new Set<string>();
    for (const [c1, v1, c2, v2, id] of list) {
      if (!anyOverlap(refs, c1, v1, c2, v2) || seen.has(id)) continue;
      seen.add(id);
      const r = catalog[id];
      if (!r) continue;
      const src = srcById.get(r.source);
      const section = (src?.section as SectionKey) ?? 'resources';
      const how =
        r.how === 'feed-lectionary'
          ? 'Matched by the liturgical calendar: it is a homily given on the Sunday when this Gospel is read at Mass.'
          : r.how === 'url-pattern'
            ? 'Word on Fire’s own index page for this liturgical week or Bible chapter; its address follows the publisher’s pattern, confirmed on a sample of pages.'
            : r.how === 'url-slug'
          ? 'The passage was read from the page address in the publisher’s own sitemap; the page itself was not collected.'
          : r.how === 'human-reviewed'
            ? `Matched to this passage from its title and summary (${r.reviewedBy}, ${r.reviewedOn}); open it to confirm how it treats the verse.`
            : 'Mapping supplied by the publisher.';
      out.push({
        id: `ext-${id}`,
        section,
        title: r.title,
        author: r.author,
        tags: r.tags,
        show: r.show,
        basis: r.basis === 'title-and-summary' ? 'Matched from title and summary, not a full read of the page.' : r.basis === 'lectionary-confirmed' ? 'Matched by the Sunday calendar, and the episode’s wording agrees with this Gospel.' : r.basis === 'lectionary-date' ? 'Matched by the Sunday calendar only; the homily may be on another reading of the day.' : undefined,
        audio: r.audio,
        excerpt: r.note,
        url: r.url,
        authority: 'reflection',
        period: 'contemporary',
        format: r.type === 'video' ? 'video' : r.type === 'podcast' ? 'audio' : 'external-link',
        match: r.how === 'url-pattern' ? 'passage' : r.how === 'url-slug' ? 'explicit-reference' : r.basis === 'title-and-summary' || r.basis === 'lectionary-date' ? 'passage' : r.basis === 'lectionary-confirmed' ? 'explicit-reference' : 'direct-citation',
        ref: refId({ book, c1, v1: v1 || undefined, c2, v2: v2 || undefined }),
        why: `${how} Apologetics and popular teaching, not magisterial.`,
        sourceName: src?.name ?? r.source,
        date: r.date,
        kind: ({ navigator: 'Bible Navigator', qa: 'Q&A', tract: 'Tract', article: 'Article', video: 'Video', podcast: 'Podcast', homily: 'Homily', page: 'Page' } as Record<string, string>)[r.type] ?? r.type,
      });
    }
    return out;
  },

  /** Links the signed-in (or local) user attached to this passage themselves. */
  async userlinks(refs) {
    const book = refs[0].book;
    const rows = await db.userLinks.filter((l) => l.ref.startsWith(book + '.')).toArray();
    const out: StudyItem[] = [];
    for (const l of rows) {
      const lr = parseRefId(l.ref);
      if (!lr || !refs.some((r) => refsOverlap(r, lr))) continue;
      const host = (() => {
        try {
          return new URL(l.url).hostname.replace(/^www\./, '');
        } catch {
          return l.url;
        }
      })();
      out.push({
        id: `ul-${l.id}`,
        section: 'links',
        title: l.title,
        excerpt: l.note,
        url: l.url,
        authority: 'reflection',
        format: 'external-link',
        match: 'direct-citation',
        why: `You attached this link to ${formatRef(lr)}. It syncs with your account.`,
        sourceName: host,
        ref: l.ref,
        userLinkId: l.id,
        kind: 'My link',
        date: new Date(l.createdAt).toISOString().slice(0, 10),
      });
    }
    return out;
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
        author: 'Fr. Mike Schmitz · Ascension',
        excerpt: trim(e.description, 220),
        internal: `/listen/episode/${e.id}`,
        url: e.page,
        authority: 'media',
        period: 'contemporary',
        format: 'audio',
        match: 'passage',
        why: `Day ${e.day}'s reading includes ${formatRef(hit)}. The passage list comes from the show's feed metadata (${e.passageSource.replace(/-/g, ' ')}); chapter-level, not this exact verse.`,
        sourceName: 'The Bible in a Year (Ascension)',
        ref: refId(hit),
        date: e.date,
        kind: 'Podcast',
        episodeId: e.id,
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
        kind: 'Overview',
      });
    }
    return out;
  },

  async liturgy(refs) {
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
          if (ref.book === 'PSA') continue; // psalm numbering differs; not matched automatically
          const anchor = convertRef('kjv', 'vulgate', ref).ref;
          if (!refs.some((r) => refsOverlap(r, anchor))) continue;
          out.push({ id: `lit-${date}-${slot}`, section: 'liturgy', title: `${name ?? date}: ${SLOT_LABEL[slot as keyof typeof SLOT_LABEL] ?? slot}`, excerpt: text.replace(/\|/g, ' or '), internal: `/pray/readings/${date}`, authority: 'magisterial', period: 'contemporary', format: 'summary', match: 'direct-citation', why: `This passage is assigned on ${date} (${source}).`, sourceName: source, ref: refId(anchor), date, kind: 'Lectionary' });
          return;
        }
      }
    };
    for (const [date, r] of Object.entries(user)) for (const [slot, text] of Object.entries(r)) if (text) consider(date, slot, text as string, 'lectionary list on this device');
    const rows = await db.cache.filter((x) => x.key.startsWith('litcal:')).toArray();
    for (const row of rows)
      for (const e of (row.value as any).events ?? []) {
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
      out.push({ id: `note-${n.id}`, section: 'mine', title: n.title || n.body.slice(0, 50) || 'Note', excerpt: trim(n.body, 240), internal: `/library/notes/${n.id}`, authority: 'reflection', format: 'summary', match: 'direct-citation', why: 'Your private note on this passage.', sourceName: 'Your notes', date: new Date(n.updatedAt).toISOString().slice(0, 10), kind: 'Note' });
    }
    const marks = await db.highlights.where('[book+c]').between([book, 0], [book, 999], true, true).toArray();
    for (const h of marks) {
      const hr = parseRefId(h.ref);
      if (hr && refs.some((r) => refsOverlap(r, hr))) out.push({ id: `hl-${h.id}`, section: 'mine', title: `Highlight (${h.color})`, excerpt: formatRef(hr), authority: 'reflection', format: 'summary', match: 'direct-citation', why: 'Your highlight.', sourceName: 'Your highlights', kind: 'Highlight' });
    }
    for (const b of await db.bookmarks.toArray()) {
      const br = parseRefId(b.ref);
      if (br && refs.some((r) => refsOverlap(r, br))) out.push({ id: `bm-${b.id}`, section: 'mine', title: b.kind === 'later' ? 'Marked for later study' : 'Bookmark', excerpt: formatRef(br), authority: 'reflection', format: 'summary', match: 'direct-citation', why: 'Your bookmark.', sourceName: 'Your bookmarks', kind: 'Bookmark' });
    }
    return out;
  },
};

/**
 * Search links to Catholic publishers and creators: links to *their* search pages (or YouTube / podcast-app searches with their name).
 * The app does not claim these sources discuss a given verse.
 */
export function externalSearchItems(refs: Ref[], sources: ResourceSource[] = []): StudyItem[] {
  const q = formatRef(refs[0], { noDual: true });
  const enc = encodeURIComponent(q);
  const base = { authority: 'reflection' as AuthorityLevel, period: 'contemporary' as Period, match: 'passage' as MatchKind, format: 'external-link' as ItemFormat, kind: 'Search' };
  const yt = (name: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} ${q}`)}`;
  const pod = (name: string) => `https://podcasts.apple.com/search?term=${encodeURIComponent(`${name} ${q}`)}`;
  const items: StudyItem[] = [
    { ...base, id: 'ext-ca-search', section: 'catholic-answers', title: `Search Catholic Answers for “${q}”`, url: `https://www.catholic.com/search?q=${enc}`, why: 'Opens Catholic Answers’ own search. Results are not checked by this app; attach anything you find with “Add link”.', sourceName: 'Catholic Answers' },
    { ...base, id: 'ext-wof-site', section: 'word-on-fire', title: 'Word on Fire: Gospel commentaries and homilies', url: 'https://www.wordonfire.org/', why: 'The publisher’s site. Not matched to this passage.', sourceName: 'Word on Fire' },
    { ...base, id: 'ext-asc-search', section: 'ascension', title: `Search Ascension for “${q}”`, url: `https://ascensionpress.com/search?q=${enc}`, why: 'Opens Ascension’s own search. Results are not checked by this app.', sourceName: 'Ascension' },
  ];
  const short = (n: string) => n.split(' / ')[0].split(' (')[0];
  for (const [group, label] of [['creators', 'creators and apologists'], ['scholars', 'Catholic Scripture scholars']] as const) {
    const list = sources.filter((x) => x.youtubeQuery && (x.group ?? 'creators') === group);
    if (!list.length) continue;
    items.push({
      ...base,
      id: `ext-find-${group}`,
      section: 'creators',
      title: `Videos and podcasts on ${q} from ${label}`,
      why: 'Search links built from each name and this passage; the results are the platforms’ own and are not checked or ranked by this app. Pick items that directly explain the passage.',
      sourceName: 'YouTube / Apple Podcasts search',
      links: list.flatMap((c) => [
        { label: `${short(c.name)} ▶`, url: yt(c.youtubeQuery!) },
        ...(c.podcastQuery ? [{ label: `${short(c.name)} 🎧`, url: pod(c.podcastQuery) }] : []),
      ]),
    });
  }
  const r0 = refs[0];
  const kj = convertRef('vulgate', 'kjv', { ...r0, c2: r0.c1, v2: r0.v1 ?? 1 }).ref;
  const lang = languageLinks(r0.book, kj.c1, kj.v1 ?? 1);
  if (lang.length) {
    items.push({
      ...base,
      id: 'ext-language',
      section: 'language',
      title: `Greek / Hebrew tools for ${formatRef(kj, { noDual: true })}`,
      why: 'Opens third-party sites using English (KJV) verse numbering. Their content is not checked by this app.',
      sourceName: 'Bible Hub / Blue Letter Bible',
      links: lang,
    });
  }
  return items;
}

export async function gatherAll(refs: Ref[], onSection: (key: SectionKey, items: StudyItem[]) => void) {
  const ext = externalSearchItems(refs, (await getResourceSources().catch(() => null)) ?? []);
  const emitExt = (key: SectionKey, extra: StudyItem[] = []) => onSection(key, [...extra, ...ext.filter((i) => i.section === key)]);
  const lens = lensItems(refs);
  const jobs: [SectionKey[], Promise<StudyItem[]>][] = [
    [['catechism'], providers.catechism(refs)],
    [['magisterium'], providers.magisterium(refs)],
    [['doctrine'], providers.doctrine(refs)],
    [['liturgy'], providers.liturgy(refs)],
    [['commentary'], providers.commentary(refs)],
    [['fathers', 'saints', 'background'], providers.fathers(refs)],
    [['xref'], providers.xref(refs)],
    [['catholic-answers', 'creators', 'word-on-fire', 'ascension', 'resources'], providers.external(refs)],
    [['links'], providers.userlinks(refs)],
    [['biay'], providers.biay(refs)],
    [['context'], providers.context(refs)],
    [['quotes', 'customs', 'structure', 'wordnotes', 'versions', 'witnesses', 'echoes', 'genre', 'dependency', 'reception', 'art', 'typology'], lens],
    [['parallels'], Promise.all([providers.parallels(refs), lens.then((l) => l.filter((i) => i.section === 'parallels'))]).then(([a, b]) => [...b, ...a])],
    [['places'], providers.places(refs)],
    [['topics'], providers.topics(refs)],
    [['mine'], providers.mine(refs)],
  ];
  emitExt('catholic-answers');
  emitExt('creators');
  emitExt('language');
  emitExt('word-on-fire');
  emitExt('ascension');
  await Promise.all(
    jobs.map(async ([keys, p]) => {
      let items: StudyItem[] = [];
      try {
        items = await p;
      } catch {
        items = [];
      }
      for (const k of keys) {
        const mine = items.filter((i) => i.section === k).sort((a, b) => score(b, refs) - score(a, refs));
        if (k === 'catholic-answers' || k === 'creators' || k === 'word-on-fire' || k === 'ascension') emitExt(k, mine);
        else onSection(k, mine);
      }
    }),
  );
}
export { CCC_OFFICIAL };
