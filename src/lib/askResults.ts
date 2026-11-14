import type { Target } from '../db/db';
import { locator, type Hit } from './fathersSearch';

/** one collection item per result: the work and section, labelled with the author and exact place of the best passage */
export function hitTargets(hits: Hit[]): Target[] {
  return hits.map((h) => ({ type: 'work', workId: h.workId, section: String(h.sectionIdx), label: `${h.author}: ${locator(h, h.passages[0]?.para ?? 0)}` }));
}

/** the result set as a note body: the question, then each passage verbatim with its exact locator. Quotes only; nothing is written for the reader. */
export function hitsAsNote(question: string, hits: Hit[]): string {
  const lines = [`Question: ${question}`, '', 'Passages found in the library (verbatim; this is a search result, not an answer):', ''];
  for (const h of hits) {
    lines.push(`**${h.author}**, ${locator(h, h.passages[0]?.para ?? 0)}${h.yearText ? `, ${h.yearText}` : ''}`);
    for (const p of h.passages) lines.push(`> ${p.text.replace(/\n+/g, ' ')}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}
