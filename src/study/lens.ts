import { getJson } from '../data/loader';
import { formatRef, parseRefId, refId, refsOverlap, type Ref } from '../lib/refs';
import type { StudyItem, SectionKey } from './providers';

/**
 * "Lens" notes: short editorial explanations of a passage from one angle (see scripts/ingest/lens.ts). They are written for this
 * app, never copied, and each says how firm its claim is.
 */
interface Part {
  label: string;
  note?: string;
  a?: string[];
}
interface LensEntry {
  id: string;
  title?: string;
  note?: string;
  kind?: string;
  status?: string;
  wording?: string;
  date?: string;
  where?: string;
  a?: string[];
  b?: string[];
  parts?: Part[];
  chain?: Part[];
  stages?: Part[];
  [k: string]: unknown;
}
interface LensFile {
  about: string;
  entries: LensEntry[];
}

const cache = new Map<string, Promise<LensFile | null>>();
const load = (type: string) => {
  if (!cache.has(type)) cache.set(type, getJson<LensFile>(`lens/${type}.json`, true).catch(() => null));
  return cache.get(type)!;
};

export const STATUS_LABEL: Record<string, string> = {
  attested: 'Directly attested (inscription or artefact)',
  documented: 'Documented',
  supported: 'Supported by archaeology',
  proposed: 'Scholarly proposal',
  traditional: 'Traditional identification',
  disputed: 'Disputed',
  'textual-fact': 'Textual fact',
  interpretive: 'Interpretive',
  editorial: 'Editorial',
};
const WORDING: Record<string, string> = {
  lxx: 'Follows the Greek Old Testament',
  hebrew: 'Follows the Hebrew text',
  differs: 'Wording differs from both',
  composite: 'Combines more than one text',
  free: 'Free adaptation',
};
const QUOTE_KIND: Record<string, string> = { citation: 'Quotation', allusion: 'Allusion', echo: 'Echo' };

const ranges = (ids: string[] | undefined) => (ids ?? []).map((x) => parseRefId(x)).filter(Boolean) as Ref[];
const overlapsAny = (sel: Ref[], ids: string[] | undefined) => ranges(ids).some((r) => sel.some((s) => refsOverlap(s, r)));
const label = (ids: string[] | undefined) => ranges(ids).map((r) => formatRef(r, { noDual: true })).join('; ');

const base = {
  authority: 'scholarship' as const,
  period: 'contemporary' as const,
  format: 'summary' as const,
  sourceName: 'Editorial note written for this app',
};

type Maker = (e: LensEntry, sel: Ref[]) => StudyItem | null;

const MAKERS: Record<string, { section: SectionKey; make: Maker }> = {
  quotes: {
    section: 'quotes',
    make: (e, sel) => {
      const ntSide = overlapsAny(sel, e.a);
      const otSide = overlapsAny(sel, e.b);
      if (!ntSide && !otSide) return null;
      const here = ntSide ? e.a : e.b;
      const other = ntSide ? e.b : e.a;
      const target = ranges(other)[0];
      return {
        ...base,
        id: e.id,
        section: 'quotes',
        title: ntSide ? `Draws on ${label(e.b)}` : `Taken up in ${label(e.a)}`,
        excerpt: e.note,
        kind: QUOTE_KIND[e.kind ?? 'citation'] ?? 'Quotation',
        tags: [e.wording ? WORDING[e.wording] : ''].filter(Boolean),
        match: 'explicit-reference',
        why: `${ntSide ? 'The New Testament passage you are reading uses' : 'This Old Testament passage is used by'} ${label(other)}. ${e.kind === 'citation' ? 'It is introduced as Scripture.' : 'It is an allusion or echo rather than a formal citation.'} Whether a wording follows the Hebrew or the Greek Old Testament is sometimes debated.`,
        ref: here?.[0],
        xrefTarget: target ? refId(target) : undefined,
      };
    },
  },
  customs: {
    section: 'customs',
    make: (e, sel) =>
      overlapsAny(sel, e.a)
        ? { ...base, id: e.id, section: 'customs', title: e.title!, excerpt: e.note, kind: e.kind ?? 'World', status: e.status, tags: [STATUS_LABEL[e.status ?? ''] ?? ''].filter(Boolean), match: 'explicit-reference', why: `A note on the setting of ${label(e.a)}. The label says how firm it is: an inscription or artefact, archaeological support, a scholarly reconstruction, or a disputed identification.`, ref: e.a?.[0] }
        : null,
  },
  structure: {
    section: 'structure',
    make: (e, sel) =>
      overlapsAny(sel, e.a)
        ? { ...base, id: e.id, section: 'structure', title: e.title!, excerpt: e.note, kind: e.kind, status: e.status, tags: [STATUS_LABEL[e.status ?? ''] ?? ''].filter(Boolean), match: 'explicit-reference', why: e.status === 'textual-fact' ? 'The pattern is on the face of the text (for example an acrostic or a repeated refrain).' : 'A proposed structure. Scholars read this passage in more than one way; treat the outline as an aid to reading, not a settled fact.', ref: e.a?.[0], parts: (e.parts ?? []).map((p) => ({ label: p.label, note: p.note, ref: p.a?.[0] })) }
        : null,
  },
  wordnotes: {
    section: 'wordnotes',
    make: (e, sel) =>
      overlapsAny(sel, e.a)
        ? { ...base, id: e.id, section: 'wordnotes', title: e.title!, excerpt: e.note, kind: e.kind === 'ambiguity' ? 'Ambiguity' : e.kind === 'textual' ? 'Textual note' : 'Translation note', match: 'explicit-reference', why: 'A word or phrase where a familiar English rendering hides a distinction, or where the original allows more than one reading.', ref: e.a?.[0] }
        : null,
  },
  versions: {
    section: 'versions',
    make: (e, sel) =>
      overlapsAny(sel, e.a)
        ? { ...base, id: e.id, section: 'versions', title: e.title!, excerpt: e.note, kind: 'Ancient versions', match: 'explicit-reference', why: 'How the Hebrew text, the Greek Old Testament (Septuagint), the Latin Vulgate and other ancient versions differ here.', ref: e.a?.[0] }
        : null,
  },
  witnesses: {
    section: 'witnesses',
    make: (e, sel) =>
      overlapsAny(sel, e.a)
        ? { ...base, id: e.id, section: 'witnesses', title: e.title!, excerpt: e.note, kind: 'Manuscript', tags: [e.date as string, e.where as string].filter(Boolean), match: 'explicit-reference', why: `A manuscript that preserves this passage. Dates are scholarly estimates.`, url: e.url as string | undefined, ref: e.a?.[0] }
        : null,
  },
  parallels: {
    section: 'parallels',
    make: (e, sel) => {
      const aSide = overlapsAny(sel, e.a);
      const bSide = overlapsAny(sel, e.b);
      if (!aSide && !bSide) return null;
      const other = aSide ? e.b : e.a;
      const target = ranges(other)[0];
      return { ...base, id: e.id, section: 'parallels', title: `Parallel account: ${label(other)}`, excerpt: e.note, kind: 'Parallel account', match: 'explicit-reference', why: 'The same event or text told twice. Differences are listed so that you can compare them; a difference is not assumed to be a contradiction.', ref: (aSide ? e.a : e.b)?.[0], xrefTarget: target ? refId(target) : undefined };
    },
  },
  echoes: {
    section: 'echoes',
    make: (e, sel) =>
      overlapsAny(sel, e.a)
        ? { ...base, id: e.id, section: 'echoes', title: e.title!, excerpt: e.note, kind: (e.kind as string) ?? 'Liturgy', match: 'explicit-reference', why: 'Where this passage is heard in the Church’s worship and prayer. Texts are named, not reproduced.', ref: e.a?.[0] }
        : null,
  },
  genre: {
    section: 'genre',
    make: (e, sel) =>
      overlapsAny(sel, e.a)
        ? { ...base, id: e.id, section: 'genre', title: e.title!, excerpt: e.note, kind: 'Genre', match: 'passage', why: 'How the kind of writing changes how its language works.', ref: e.a?.[0] }
        : null,
  },
  dependency: {
    section: 'dependency',
    make: (e, sel) =>
      overlapsAny(sel, e.a)
        ? { ...base, id: e.id, section: 'dependency', title: e.title!, excerpt: e.note, kind: 'Read first', match: 'explicit-reference', why: 'The earlier passages this one assumes. Reading them first makes the passage easier to follow.', ref: e.a?.[0], parts: (e.chain ?? []).map((p) => ({ label: p.label, note: p.note, ref: p.a?.[0] })) }
        : null,
  },
  reception: {
    section: 'reception',
    make: (e, sel) =>
      overlapsAny(sel, e.a)
        ? { ...base, id: e.id, section: 'reception', title: e.title!, excerpt: e.note, kind: 'Reception', match: 'explicit-reference', why: 'How this passage has been read in different centuries. Listing a reading is not endorsing it; the Church’s own teaching is in the Teaching tab.', ref: e.a?.[0], parts: (e.stages ?? []).map((p) => ({ label: p.label, note: p.note, ref: p.a?.[0] })) }
        : null,
  },
};

export const LENS_TYPES = Object.keys(MAKERS);

export async function lensItems(sel: Ref[]): Promise<StudyItem[]> {
  const out: StudyItem[] = [];
  await Promise.all(
    Object.entries(MAKERS).map(async ([type, m]) => {
      const f = await load(type);
      if (!f) return;
      for (const e of f.entries) {
        const it = m.make(e, sel);
        if (it) out.push(it);
      }
    }),
  );
  return out;
}

/** all entries of one lens (for explorer pages) */
export async function lensFile(type: string) {
  return load(type);
}
