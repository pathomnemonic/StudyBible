import { WHO_AM_I } from '../data/whoami';
import { WHO_AM_I_2 } from '../data/whoami2';
import { COUNCILS } from '../data/councils';
import { NAME_SAINTS } from '../data/confirmationSaints';
import { GLOSSARY } from '../data/glossary';

export type DeepCandidateCategory = 'biblical-person' | 'council' | 'saint' | 'glossary';
export interface DeepCandidate {
  category: DeepCandidateCategory;
  answer: string;
  aliases: string[];
  source: string;
  sourceId: string;
  evidence: string;
  reviewStatus: 'needs-review';
  tier: null;
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9]/g, '');

export function generateDeepCandidates(): DeepCandidate[] {
  const rows: DeepCandidate[] = [];
  for (const person of [...WHO_AM_I, ...WHO_AM_I_2]) {
    rows.push({
      category: 'biblical-person', answer: person.name, aliases: person.also ?? [],
      source: 'Who Am I? question bank', sourceId: person.name,
      evidence: person.clues.join(' '), reviewStatus: 'needs-review', tier: null,
    });
  }
  for (const council of COUNCILS) {
    rows.push({
      category: 'council', answer: council.name, aliases: [],
      source: 'Ecumenical councils reference', sourceId: String(council.n),
      evidence: [council.years, council.place, council.why, ...council.settled].join(' '),
      reviewStatus: 'needs-review', tier: null,
    });
  }
  for (const saint of NAME_SAINTS) {
    rows.push({
      category: 'saint', answer: saint.name, aliases: [],
      source: 'Confirmation saints directory', sourceId: saint.name,
      evidence: [saint.feast, saint.tags.join(', '), saint.why].join(' '),
      reviewStatus: 'needs-review', tier: null,
    });
  }
  for (const term of GLOSSARY) {
    rows.push({
      category: 'glossary', answer: term.term, aliases: term.aliases,
      source: 'Catholic glossary', sourceId: String(term.ccc),
      evidence: `CCC ${term.ccc}: ${term.definition}`,
      reviewStatus: 'needs-review', tier: null,
    });
  }
  const unique = new Map<string, DeepCandidate>();
  for (const row of rows) {
    const key = `${row.category}:${normalize(row.answer)}`;
    const previous = unique.get(key);
    if (!previous || row.evidence.length > previous.evidence.length) unique.set(key, row);
  }
  return [...unique.values()].sort((a, b) => a.category.localeCompare(b.category) || a.answer.localeCompare(b.answer));
}

export const GENERATED_DEEP_CANDIDATES = generateDeepCandidates();
