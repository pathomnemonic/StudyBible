import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Text that points at another part of the page ("the outline below", "the button above") breaks when that part is not shown:
 * a page that says "see below" with nothing below it is a bug the user sees. New uses of these words in what people read must be
 * checked against every state the page can be in (empty, loading, another tradition, signed out) and then added to the counts here.
 * Prefer wording that does not point: name the thing ("the Catechism section") or say nothing.
 */
const KNOWN: Record<string, number> = {
  'components/WordStudy.tsx': 1, 'components/StudyPanel.tsx': 2, 'pages/pray/ReadingsPage.tsx': 5, 'pages/library/GraphPage.tsx': 1,
  'pages/PrivacyPage.tsx': 1, 'pages/MementoPage.tsx': 1, 'pages/ReadPage.tsx': 2, 'pages/study/SearchPage.tsx': 2, 'pages/pray/SessionBuilderPage.tsx': 1,
  'pages/pray/ExaminationPage.tsx': 1, 'pages/DownloadsPage.tsx': 1, 'pages/listen/ListenHome.tsx': 1, 'pages/AccountPage.tsx': 1, 'liturgy/readings.ts': 2, 'liturgy/massSteps.ts': 1, 'pages/study/CurriculumGrade.tsx': 1,
};
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.(tsx|ts)$/.test(p) ? [p] : []; });
const SKIP = /^(data\/|styles\/|i18n\/|featureStatus|sync\/|db\/|App\.tsx|components\/Tour|components\/WeekCard)/;
const phrase = /(?:['"`>][^'"`<\n]*|^\s*[A-Z][^<>{}\n]*)\b(below|above)\b(?! the fold)/gm;

describe('words that point elsewhere on the page', () => {
  const found: Record<string, number> = {};
  const root = new URL('../src/', import.meta.url).pathname;
  for (const f of walk(root)) {
    const rel = f.slice(root.length);
    if (SKIP.test(rel)) continue;
    const text = readFileSync(f, 'utf8').split('\n').filter((l) => !/\.(above|below)\(|^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
    const n = [...text.matchAll(phrase)].length;
    if (n) found[rel] = n;
  }
  it('has no new "above" or "below" in user-facing text', () => {
    for (const [f, n] of Object.entries(found)) expect(n, `${f} points at something above or below (${n}); check that it is always there, or reword`).toBeLessThanOrEqual(KNOWN[f] ?? 0);
  });
});
