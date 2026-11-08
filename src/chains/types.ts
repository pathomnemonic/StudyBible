/** A "sourced chain": a line of reasoning laid out as real sources in order. Every quotation is checked against the app's own text by tests/chains.test.ts. */
export type StepKind = 'scripture' | 'father' | 'council' | 'catechism' | 'magisterium' | 'saint' | 'liturgy' | 'writer';

export interface Step {
  kind: StepKind;
  /** Short heading, e.g. "Augustine, Tractates on John 26" */
  label: string;
  /** Rough date shown on timelines, e.g. "c. 110", "325", "1551" */
  when?: string;
  /** Sort key for timelines (year, negative for BC) */
  year?: number;
  /** Scripture OSIS range inside one chapter, e.g. "JHN.6.53-56" */
  ref?: string;
  /** Library work id (public/data/library/works/<id>.json) and its section id */
  work?: string;
  section?: string;
  /** Butler's Lives of the Saints entry, "MM-DD:index" as in public/data/saints/butler/MM.json days[DD][index] */
  butler?: string;
  /** Catechism paragraph number */
  ccc?: number;
  /** Verbatim words from the source. Use "…" between separate stretches of the same section. */
  quote?: string;
  /** One or two plain sentences: what this source adds to the argument. */
  note: string;
}

export interface Objection { q: string; a: string; steps?: Step[] }

export interface Chain {
  id: string;
  title: string;
  /** The question the chain answers, in plain words */
  question: string;
  /** Two or three sentences: the answer in brief */
  summary: string;
  steps: Step[];
  objections?: Objection[];
  /** Claim check only: an honest verdict on a claim people often make */
  verdict?: { label: 'False' | 'Mostly false' | 'Partly true' | 'True, but incomplete' | 'True' | 'Disputed'; why: string; origin: string };
  /** Heresy lab only */
  heresy?: { era: string; who: string; claim: string; appeal: string; advocate: Step[]; whyItFails: string };
  /** CCC paragraphs to read next */
  readNext?: number[];
}

export type ChainMode = 'arguments' | 'development' | 'heresies' | 'words' | 'claims';
export const MODES: Record<ChainMode, { title: string; blurb: string; path: string }> = {
  arguments: { title: 'The Argument Map', blurb: 'Each teaching as a chain of real sources, from Scripture through the Fathers and councils to the Catechism, with the strongest objections.', path: '/study/arguments' },
  development: { title: 'How a teaching developed', blurb: 'Follow a doctrine through time: where it first appears, what forced it to be stated precisely, and the words the Church settled on.', path: '/study/development' },
  claims: { title: 'Is that true?', blurb: 'Common claims about the Church, checked fairly against what she actually teaches and the sources: what is true, what is not, and where the misunderstanding comes from.', path: '/study/claims' },
  words: { title: 'Key words, followed through time', blurb: 'The Greek, Hebrew and Latin words that carry the faith: where each appears, what it meant, and how the Fathers and councils used it.', path: '/study/words' },
  heresies: { title: 'The Heresy Lab', blurb: 'Each major error made at its strongest, in the words of those who answered it, then shown where it breaks against Scripture and the councils.', path: '/study/heresies' },
};

/** A saint who lived through something, matched to a situation in a person's life. */
export interface Mentor { name: string; lifespan: string; why: string; step: Step }
export interface Situation { id: string; title: string; ask: string; intro: string; mentors: Mentor[]; readNext?: number[] }

/** A saint's life laid out in time, set against what was happening in the world. */
export interface LifeEvent { year: number; text: string; kind: 'turning' | 'setback' | 'work' | 'writing' | 'world'; step?: Step }
export interface Life { id: string; name: string; lifespan: string; sketch: string; butler?: string; events: LifeEvent[] }
