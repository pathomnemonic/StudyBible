/** Study booklets for printing: build a plain model from chain, life, library or lesson data, then collect its sources and a page of fixed-template questions. No generated prose. */
import type { Chain, ChainMode, Life, Situation, Step } from '../chains/types';
import type { LibraryWorkMeta } from '../data/content';
import type { Lesson } from '../data/course';

export type BookletKind = 'argument' | 'development' | 'heresy' | 'claim' | 'mentor' | 'life' | 'work' | 'lesson';
export const KIND_LABEL: Record<BookletKind, string> = {
  argument: 'An argument chain', development: 'A development chain', heresy: 'A heresy and its answer', claim: 'A claim, checked',
  mentor: 'A mentor for a situation', life: 'A life', work: 'A library work (section range)', lesson: 'A catechism lesson',
};
export const KIND_MODE: Partial<Record<BookletKind, ChainMode>> = { argument: 'arguments', development: 'development', heresy: 'heresies', claim: 'claims' };

export interface BkItem { kind: Step['kind'] | 'text'; label: string; when?: string; quote?: string; note?: string; cite: string; step?: Step }
export interface BkSection { heading: string; lead?: string[]; items: BkItem[] }
export interface Booklet { kind: BookletKind; title: string; subtitle: string; sections: BkSection[]; question?: string; trimmed?: boolean }
export interface SourceRow { key: string; name: string; lines: string[] }

const SCRIPTURE_NAME = 'World English Bible, Catholic edition (WEB-C)';
const itemOf = (s: Step): BkItem => ({
  kind: s.kind, label: s.label, when: s.when, quote: s.quote, note: s.note, step: s,
  cite: s.ccc ? `Catechism of the Catholic Church, §${s.ccc}` : s.kind === 'scripture' ? `${s.label}, ${SCRIPTURE_NAME}` : s.label,
});

export function fromChain(kind: BookletKind, c: Chain): Booklet {
  const steps = kind === 'development' ? [...c.steps].sort((a, b) => (a.year ?? 0) - (b.year ?? 0)) : c.steps;
  const sections: BkSection[] = [];
  if (c.verdict) sections.push({ heading: `The verdict: ${c.verdict.label}`, lead: [c.verdict.why, `Where it comes from. ${c.verdict.origin}`], items: [] });
  if (c.heresy) {
    sections.push({ heading: `The error (${c.heresy.era})`, lead: [`Taught by ${c.heresy.who}.`, c.heresy.claim, `Why it attracted people. ${c.heresy.appeal}`], items: [] });
    if (c.heresy.advocate.length) sections.push({ heading: 'In their own words, as the Church’s writers preserved them', items: c.heresy.advocate.map(itemOf) });
  }
  sections.push({ heading: c.heresy ? 'What the Church teaches instead' : kind === 'development' ? 'The teaching, in time order' : 'The sources, in order', lead: [c.summary], items: steps.map(itemOf) });
  if (c.heresy?.whyItFails) sections.push({ heading: 'Where the error breaks', lead: [c.heresy.whyItFails], items: [] });
  if (c.objections?.length) sections.push({ heading: 'Objections and answers', lead: c.objections.flatMap((o) => [`Objection. ${o.q}`, `Answer. ${o.a}`]), items: c.objections.flatMap((o) => (o.steps ?? []).map(itemOf)) });
  return { kind, title: c.title, subtitle: KIND_LABEL[kind], question: c.question, sections };
}

export function fromSituation(s: Situation): Booklet {
  return {
    kind: 'mentor', title: s.title, subtitle: KIND_LABEL.mentor, question: s.ask,
    sections: [
      { heading: 'Where you may be', lead: [s.ask, s.intro], items: [] },
      ...s.mentors.map((m) => ({ heading: `${m.name} (${m.lifespan})`, lead: [m.why], items: [itemOf(m.step)] })),
    ],
  };
}

export function fromLife(l: Life): Booklet {
  return {
    kind: 'life', title: l.name, subtitle: `${KIND_LABEL.life}, ${l.lifespan}`,
    sections: [
      { heading: 'A sketch', lead: [l.sketch], items: [] },
      { heading: 'The life, in time order', items: l.events.map((e) => (e.step ? { ...itemOf(e.step), label: `${e.year}: ${e.text}`, note: e.step.note, cite: itemOf(e.step).cite } : { kind: 'text' as const, label: `${e.year}: ${e.text}`, cite: '' })) },
    ],
  };
}

export function fromWork(meta: LibraryWorkMeta, secs: { id: string; title: string; paras: string[] }[], maxWords = 2200): Booklet {
  let used = 0; let trimmed = false;
  const sections: BkSection[] = [];
  for (const s of secs) {
    const paras: string[] = [];
    for (const p of s.paras) {
      const n = p.split(/\s+/).length;
      if (used + n > maxWords && paras.length + sections.length > 0) { trimmed = true; break; }
      paras.push(p); used += n;
    }
    sections.push({ heading: s.title, items: paras.map((p) => ({ kind: 'text' as const, label: '', quote: p, cite: `${meta.author}, ${meta.title}, ${s.title}` })) });
    if (trimmed) break;
  }
  return { kind: 'work', title: meta.title, subtitle: `${meta.author}${meta.year ? `, ${meta.year}` : ''}`, sections, trimmed };
}

export function fromLesson(l: Lesson, passages: { ref: string; verses: { n: number; text: string }[] }[]): Booklet {
  return {
    kind: 'lesson', title: l.title, subtitle: `${KIND_LABEL.lesson} · ${l.era}`,
    sections: [
      { heading: 'This lesson', lead: [l.intro], items: [] },
      { heading: 'Read these passages', items: passages.map((p) => ({ kind: 'scripture' as const, label: p.ref, quote: p.verses.map((v) => `${v.n} ${v.text}`).join(' '), cite: `${p.ref}, ${SCRIPTURE_NAME}` })) },
      { heading: 'Check yourself', lead: l.quiz.flatMap((q, i) => [`${i + 1}. ${q.q}`, `Answer. ${q.options[q.answer]}. ${q.why}`]), items: [] },
    ],
  };
}

/** Every work quoted in the booklet, with translator, print date and the evidence for its rights, from the library index. */
export function collectSources(b: Booklet, lib: LibraryWorkMeta[]): SourceRow[] {
  const rows = new Map<string, SourceRow>();
  const add = (key: string, name: string, lines: string[]) => { if (!rows.has(key)) rows.set(key, { key, name, lines }); };
  const workIdFromCite = (cite: string) => lib.find((w) => cite.startsWith(`${w.author}, ${w.title}`));
  for (const sec of b.sections) for (const it of sec.items) {
    const s = it.step;
    if (s?.work) {
      const w = lib.find((x) => x.id === s.work);
      if (w) { add(`w:${w.id}`, `${w.author}, ${w.title}`, workLines(w)); continue; }
    }
    if (!s && it.cite) {
      const w = workIdFromCite(it.cite);
      if (w) { add(`w:${w.id}`, `${w.author}, ${w.title}`, workLines(w)); continue; }
    }
    if (!s) continue;
    if (s.kind === 'scripture') add('scripture', SCRIPTURE_NAME, ['Public-domain English Bible text bundled in this app.']);
    else if (s.ccc) add('ccc', 'Catechism of the Catholic Church', ['Quoted by paragraph number; the full text is in the app and at the Vatican’s website.']);
    else if (s.butler) add('butler', 'Alban Butler, Lives of the Saints', ['Quoted from the edition bundled in this app (public domain).']);
    else add(`o:${s.label}`, s.label, [`Quoted as given in the app’s sourced chains. Read it in context in the app.`]);
  }
  if (b.kind === 'lesson') add('scripture', SCRIPTURE_NAME, ['Public-domain English Bible text bundled in this app.']);
  return [...rows.values()];
}

function workLines(w: LibraryWorkMeta): string[] {
  const out: string[] = [];
  if (w.translator) out.push(`Translator: ${w.translator}`);
  if (w.printSource) out.push(`First printed in this translation: ${w.printSource}`);
  if (w.rightsEvidence) out.push(`Public-domain evidence: ${w.rightsEvidence}`);
  out.push(`Text taken from: ${w.source.name}${w.source.retrieved ? `, retrieved ${w.source.retrieved}` : ''}`);
  return out;
}

/** Reflection questions from fixed templates only; the booklet's own labels are slotted in, nothing is written by a model. */
export function reflectionQuestions(b: Booklet): string[] {
  const items = b.sections.flatMap((s) => s.items).filter((i) => i.kind !== 'text');
  const first = (k: Step['kind'][]) => items.find((i) => k.includes(i.kind as Step['kind']));
  const q: string[] = [];
  if (b.question) q.push(`In your own words, what is the question this booklet asks: “${b.question}”? What do you already think before reading?`);
  const sc = first(['scripture']); if (sc) q.push(`Read ${sc.label} again, slowly. Which word or phrase stays with you, and why?`);
  const fa = first(['father', 'saint', 'writer']); if (fa) q.push(`${fa.label} was written for people of its own time. What did they need to hear, and what do you need to hear today?`);
  const co = first(['council', 'magisterium']); if (co) q.push(`${co.label} puts the Church’s teaching in careful words. What does the careful wording protect?`);
  const cc = first(['catechism']); if (cc) q.push(`Read ${cc.cite}. How does it gather up what the earlier sources said?`);
  if (b.kind === 'life') q.push('Which moment in this life was a turning point? What did it ask of the person?', 'Which setback in this life do you find most like one of your own, and what did the person do next?');
  if (b.kind === 'mentor') q.push('Which of these mentors would you most like to talk with, and what would you ask?');
  if (b.kind === 'heresy') q.push('Why might this error have seemed true to those who held it? Where did it begin to break?');
  if (b.kind === 'claim') q.push('Where have you heard this claim before? What would you now say to the person who said it?');
  if (b.kind === 'development') q.push('Which stage in this story surprised you? What forced the Church to say more clearly what she had always believed?');
  if (b.kind === 'work') q.push('Which sentence in this reading would you copy into a notebook?', 'What is one thing the author assumes that you would want to ask about?');
  if (b.kind === 'lesson') q.push('Which passage in this lesson would you like to read again with a friend or family member?');
  q.push('Which quotation in this booklet spoke to you most? Why?', 'What is still unclear? Write one question to ask a priest, teacher or friend.', 'What is one small thing you will do this week because of what you read?');
  return q;
}
