/**
 * Turns the app's own content into small search records (see rank.ts).
 * `docsFrom*` functions are pure, so tests feed them the data files straight from disk.
 */
import type { Chain, ChainMode, Life, Situation } from '../chains/types';
import { MODES } from '../chains/types';
import type { GlossaryEntry } from '../data/glossary';
import type { Council } from '../data/councils';
import type { Prayer } from '../data/prayers';
import type { Feast } from '../data/feasts';
import type { Feature } from '../lib/features';
import type { DoctrineTopic } from '../data/content';
import type { SearchDoc } from './rank';

const clip = (s: string | undefined, n: number) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s ?? '');

const CHAIN_KIND: Record<ChainMode, { kind: SearchDoc['kind']; badge: string }> = {
  arguments: { kind: 'argument', badge: 'Argument map' },
  claims: { kind: 'claim', badge: 'Is that true?' },
  development: { kind: 'development', badge: 'How a teaching developed' },
  heresies: { kind: 'heresy', badge: 'Heresy lab' },
  words: { kind: 'word', badge: 'Key words' },
};

export function docsFromChains(mode: ChainMode, chains: Chain[]): SearchDoc[] {
  const { kind, badge } = CHAIN_KIND[mode];
  return chains.map((c) => {
    const labels = c.steps.map((s) => s.label).join('. ');
    const quotes = c.steps.map((s) => s.quote ?? '').join(' ');
    const objections = (c.objections ?? []).map((o) => o.q).join(' ');
    const heresy = c.heresy ? `${c.heresy.who} ${c.heresy.claim} ${c.heresy.era}` : '';
    const verdict = c.verdict ? c.verdict.label : '';
    return {
      id: `${kind}:${c.id}`,
      kind,
      group: 'best',
      title: c.title,
      sub: c.question,
      text: [c.summary, labels, objections, heresy, c.verdict?.why ?? '', quotes].join(' '),
      alias: c.id.replace(/-/g, ' '),
      keys: [c.question, verdict].join(' '),
      href: `${MODES[mode].path}/${c.id}`,
      badge,
    } satisfies SearchDoc;
  });
}

export function docsFromSituations(list: Situation[]): SearchDoc[] {
  return list.map((s) => ({
    id: `mentor:${s.id}`,
    kind: 'mentor',
    group: 'fathers',
    title: s.title,
    sub: s.ask,
    text: [s.intro, ...s.mentors.map((m) => `${m.name} ${m.why} ${m.step.label}`)].join(' '),
    keys: [s.ask, ...s.mentors.map((m) => m.name)].join(' '),
    href: `/study/mentors/${s.id}`,
    badge: 'Saints who faced this',
  }));
}

export function docsFromLives(list: Life[]): SearchDoc[] {
  return list.map((l) => ({
    id: `life:${l.id}`,
    kind: 'life',
    group: 'fathers',
    title: l.name,
    sub: l.lifespan,
    text: [l.sketch, ...l.events.map((e) => e.text)].join(' '),
    keys: l.name,
    href: `/study/lives/${l.id}`,
    badge: 'A life in time',
  }));
}

export interface ApoLike { id: string; category: string; title: string; objection: string; tags: string[]; verses?: { ref: string }[] }
export function docsFromApologetics(topics: ApoLike[]): SearchDoc[] {
  return topics.map((t) => ({
    id: `apo:${t.id}`,
    kind: 'apologetics',
    group: 'best',
    title: t.title,
    sub: t.objection,
    text: [t.objection, t.category, (t.verses ?? []).map((v) => v.ref).join(' ')].join(' '),
    keys: [...t.tags, t.id.replace(/-/g, ' ')].join(' '),
    href: `/study/apologetics/${t.id}`,
    badge: 'Common question',
  }));
}

export function docsFromGlossary(list: GlossaryEntry[]): SearchDoc[] {
  return list.map((g) => ({
    id: `gloss:${g.term}`,
    kind: 'glossary',
    group: 'best',
    title: g.term,
    sub: clip(g.definition, 140),
    text: g.definition,
    keys: g.aliases.join(' '),
    href: `/study/glossary?t=${encodeURIComponent(g.term)}`,
    badge: 'Glossary',
  }));
}

export function docsFromCouncils(list: Council[]): SearchDoc[] {
  return list.map((c) => ({
    id: `council:${c.n}`,
    kind: 'council',
    group: 'teaching',
    title: `${c.name} (${c.years})`,
    sub: clip(c.why, 140),
    text: [c.why, ...c.settled, c.matters, c.place, c.calledBy].join(' '),
    keys: `council ${c.name}`,
    href: `/study/councils?n=${c.n}`,
    badge: 'Council',
  }));
}

export function docsFromTopics(list: DoctrineTopic[]): SearchDoc[] {
  return list.map((t) => ({
    id: `topic:${t.id}`,
    kind: 'topic',
    group: 'teaching',
    title: t.title,
    sub: clip(t.summary, 140),
    text: t.summary,
    keys: t.keywords.join(' '),
    href: `/study/topics/${t.id}`,
    badge: 'Doctrine topic',
  }));
}

export function docsFromPrayers(list: Prayer[]): SearchDoc[] {
  return list.map((p) => ({
    id: `prayer:${p.id}`,
    kind: 'prayer',
    group: 'do',
    title: p.title,
    sub: p.source,
    text: p.text,
    keys: `prayer ${p.id.replace(/-/g, ' ')}`,
    href: '/pray/prayers',
    badge: 'Prayer',
  }));
}

export function docsFromFeasts(list: Feast[]): SearchDoc[] {
  return list.map((f) => ({
    id: `feast:${f.id}`,
    kind: 'feast',
    group: 'do',
    title: f.name,
    sub: `${f.rank}, ${f.when}`,
    text: [f.about, f.customs ?? ''].join(' '),
    keys: `feast ${f.season} ${f.rank}`,
    href: '/pray/year',
    badge: 'Feast',
  }));
}

export function docsFromFeatures(list: Feature[]): SearchDoc[] {
  return list.map((f) => ({
    id: `feature:${f.id}`,
    kind: 'feature',
    group: 'do',
    title: f.title,
    sub: f.blurb,
    text: f.blurb,
    keys: f.keywords ?? '',
    href: f.to,
    badge: 'Page in this app',
  }));
}

export interface LessonUnit { n: number; title: string; eq?: string; lessons: { id: string; title: string; idea: string; question?: string; scripture?: string }[] }
export function docsFromLessons(gradeId: string, gradeName: string, units: LessonUnit[]): SearchDoc[] {
  return units.flatMap((u) =>
    u.lessons.map((l) => ({
      id: `lesson:${l.id}`,
      kind: 'lesson' as const,
      group: 'learn' as const,
      title: l.title,
      sub: `${gradeName}, unit ${u.n}: ${u.title}`,
      text: [l.idea, u.eq ?? '', l.scripture ?? ''].join(' '),
      keys: l.question ?? '',
      href: `/study/curriculum/${gradeId}/${l.id}`,
      badge: 'Lesson',
    })),
  );
}

// ---------------------------------------------------------------------------
// Browser loading, in two tiers so typing stays fast
// ---------------------------------------------------------------------------

/** Tier 1: in the app bundle or tiny. Ready at once. */
export async function loadQuickDocs(): Promise<SearchDoc[]> {
  const [{ GLOSSARY }, { COUNCILS }, { PRAYERS }, { FEASTS }, { FEATURES }] = await Promise.all([
    import('../data/glossary'), import('../data/councils'), import('../data/prayers'), import('../data/feasts'), import('../lib/features'),
  ]);
  return [...docsFromGlossary(GLOSSARY), ...docsFromCouncils(COUNCILS), ...docsFromPrayers(PRAYERS), ...docsFromFeasts(FEASTS), ...docsFromFeatures(FEATURES)];
}

/** Tier 2: the argument chains, claims, heresies, words, mentors, lives, apologetics and doctrine topics (JSON, loaded on first use). */
export async function loadLibraryDocs(): Promise<SearchDoc[]> {
  const [{ loadChains, loadSituations, loadLives }, { getJson }, { getDoctrine }] = await Promise.all([
    import('../chains/load'), import('../data/loader'), import('../data/content'),
  ]);
  const modes: ChainMode[] = ['arguments', 'claims', 'development', 'heresies', 'words'];
  const [chains, situations, lives, apo, doctrine] = await Promise.all([
    Promise.all(modes.map((m) => loadChains(m))), loadSituations(), loadLives(), getJson<{ topics: ApoLike[] }>('apologetics.json', true).catch(() => null), getDoctrine().catch(() => null),
  ]);
  return [
    ...modes.flatMap((m, i) => docsFromChains(m, chains[i])),
    ...docsFromSituations(situations),
    ...docsFromLives(lives),
    ...docsFromApologetics(apo?.topics ?? []),
    ...docsFromTopics((doctrine?.topics ?? []) as DoctrineTopic[]),
  ];
}

/** Tier 3: K-12 lessons (about 3 MB of JSON), only fetched by the full search page. */
export async function loadLessonDocs(): Promise<SearchDoc[]> {
  const { getJson } = await import('../data/loader');
  const idx = await getJson<{ id: string; name: string }[]>('curriculum/index.json', true);
  const grades = await Promise.all((idx ?? []).map((g) => getJson<{ id: string; name: string; units: LessonUnit[] }>(`curriculum/grade-${g.id}.json`, true).catch(() => null)));
  return grades.flatMap((g) => (g ? docsFromLessons(g.id, g.name, g.units) : []));
}
