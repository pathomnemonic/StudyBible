import type { AuthorityLevel, ItemFormat, Period } from '../lib/types';
import { formatRef, parseRefId, refId, refsOverlap, type Ref } from '../lib/refs';
import { getBook } from '../lib/canon';
import {
  CCC_OFFICIAL, cccUrl, getBiay, getCatena, getCccLinks, getDoctrine, getGlossa, getHaydock, getLibScripture, getLibraryIndex, getOverviews, getResourceCatalog, getResourceRefs, getResourceSources, getMagisteriumRefs, getMagisteriumIndex,
} from '../data/content';
import { getXrefs } from '../data/loader';
import type { ResourceSource } from '../data/content';
import { languageLinks } from './languageTools';
import { convertRef } from '../lib/versification';
import { db } from '../db/db';

export type SectionKey =
  | 'doctrine' | 'catechism' | 'magisterium' | 'liturgy' // teaching
  | 'commentary' // verse-by-verse Catholic commentaries
  | 'fathers' | 'saints'
  | 'xref'
  | 'catholic-answers' | 'creators' | 'word-on-fire' | 'ascension' | 'resources' | 'biay' | 'links' // media & apologetics
  | 'context' | 'language'
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
  { key: 'context', label: 'Context & translation notes' },
  { key: 'mine', label: 'My notes & highlights' },
];

/** How sections are grouped into the panel's tabs. */
export const TABS: { id: string; label: string; sections: SectionKey[] }[] = [
  { id: 'teaching', label: 'Teaching', sections: ['catechism', 'magisterium', 'doctrine', 'liturgy'] },
  { id: 'commentary', label: 'Commentary', sections: ['commentary'] },
  { id: 'fathers', label: 'Fathers & saints', sections: ['fathers', 'saints'] },
  { id: 'xref', label: 'Cross-refs', sections: ['xref'] },
  { id: 'media', label: 'Media & apologetics', sections: ['catholic-answers', 'creators', 'word-on-fire', 'ascension', 'biay', 'resources', 'links'] },
  { id: 'context', label: 'Context', sections: ['context', 'language'] },
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
  /** extra outbound links (e.g. search this creator on YouTube / podcast apps) */
  links?: { label: string; url: string }[];
}

const AUTH_W: Record<AuthorityLevel, number> = { doctrine: 100, magisterial: 90, father: 70, saint: 60, scholarship: 40, historical: 35, reflection: 20, media: 10 };
const MATCH_W: Record<MatchKind, number> = { 'direct-citation': 30, 'verse-by-verse': 25, 'explicit-reference': 20, passage: 10, topic: 5, editorial: 0 };
export const score = (i: StudyItem) => AUTH_W[i.authority] * 10 + MATCH_W[i.match] * 3 + Math.min(i.votes ?? 0, 100) / 10;

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
    const out: StudyItem[] = [];
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
        section: (w.authority === 'saint' ? 'saints' : 'fathers') as SectionKey,
        title: w.indexOnly ? `${w.title.replace(/ \(index.*\)/, '')}: ${sec.title}` : `${w.title}: ${sec.title}`,
        author: w.author,
        authorId: w.authorId,
        authority: w.authority as AuthorityLevel,
        period: w.period as Period,
        ref: `${book}.${e[0]}`,
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
          kind: w.kind === 'homilies' ? 'Homily' : w.kind === 'commentary' ? 'Commentary' : 'Work',
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
        r.how === 'url-slug'
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
        basis: r.basis === 'title-and-summary' ? 'Matched from title and summary, not a full read of the page.' : undefined,
        excerpt: r.note,
        url: r.url,
        authority: 'reflection',
        period: 'contemporary',
        format: r.type === 'video' ? 'video' : r.type === 'podcast' ? 'audio' : 'external-link',
        match: r.how === 'url-slug' ? 'explicit-reference' : r.basis === 'title-and-summary' ? 'passage' : 'direct-citation',
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
  const jobs: [SectionKey[], Promise<StudyItem[]>][] = [
    [['catechism'], providers.catechism(refs)],
    [['magisterium'], providers.magisterium(refs)],
    [['doctrine'], providers.doctrine(refs)],
    [['liturgy'], providers.liturgy(refs)],
    [['commentary'], providers.commentary(refs)],
    [['fathers', 'saints'], providers.fathers(refs)],
    [['xref'], providers.xref(refs)],
    [['catholic-answers', 'creators', 'word-on-fire', 'ascension', 'resources'], providers.external(refs)],
    [['links'], providers.userlinks(refs)],
    [['biay'], providers.biay(refs)],
    [['context'], providers.context(refs)],
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
        const mine = items.filter((i) => i.section === k).sort((a, b) => score(b) - score(a));
        if (k === 'catholic-answers' || k === 'creators' || k === 'word-on-fire' || k === 'ascension') emitExt(k, mine);
        else onSection(k, mine);
      }
    }),
  );
}
export { CCC_OFFICIAL };
