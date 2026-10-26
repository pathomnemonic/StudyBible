import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';

type Lesson = { id: string; title: string; saint?: string; saintStory?: string; tryit?: string[]; script?: { open: string; teach: string[]; ask: string[]; practice: string[]; close: string } };
const dir = new URL('../public/data/curriculum/', import.meta.url);
const grades = readdirSync(dir).filter((f) => /^grade-.+\.json$/.test(f));
const lessons: Lesson[] = grades.flatMap((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')).units.flatMap((u: { lessons: Lesson[] }) => u.lessons));

describe('lesson content a teacher can teach from', () => {
  it('covers every grade', () => {
    expect(grades.length).toBe(14);
    expect(lessons.length).toBeGreaterThan(390);
  });

  it('gives every lesson a full teaching script', () => {
    const bad: string[] = [];
    for (const l of lessons) {
      const s = l.script;
      if (!s || !s.open || !s.close || s.teach?.length < 3 || s.ask?.length < 3 || s.practice?.length < 3) bad.push(l.id);
      else if (s.teach.some((t) => t.length < (/^(K|1|2)-/.test(l.id) ? 60 : 120))) bad.push(`${l.id} (thin teaching paragraph)`);
    }
    expect(bad).toEqual([]);
  });

  it('gives every lesson student steps and a three-part saint story', () => {
    const bad: string[] = [];
    for (const l of lessons) {
      if (!l.tryit || l.tryit.length < 2) bad.push(`${l.id} tryit`);
      if (!l.saintStory || l.saintStory.split('\n').length < 3) bad.push(`${l.id} story`);
    }
    expect(bad).toEqual([]);
  });

  it('tells the story of the saint it names', () => {
    const bad: string[] = [];
    for (const l of lessons) {
      const head = (l.saint ?? '').split(':')[0];
      const words = head.split(/[^A-Za-zÀ-ÿ]+/).filter((w) => /^[A-ZÀ-Ý]/.test(w) && w.length > 2 && !/^(Saint|Saints|Blessed|Venerable|The|Great|and)$/.test(w));
      const story = (l.saintStory ?? '').toLowerCase();
      if (words.length && !words.some((w) => story.includes(w.toLowerCase()))) bad.push(`${l.id}: ${head}`);
    }
    expect(bad).toEqual([]);
  });

  it('does not repeat itself: every opening and every saint story is its own', () => {
    const seen = new Map<string, string>();
    const dup: string[] = [];
    for (const l of lessons) {
      for (const k of [`o:${l.script?.open}`, `s:${l.saintStory}`]) {
        const prev = seen.get(k);
        if (prev) dup.push(`${l.id} = ${prev}`);
        else seen.set(k, l.id);
      }
    }
    expect(dup).toEqual([]);
  });

  it('varies how lessons begin and what students do', () => {
    // formula check: within one grade, no single opening verb or first-activity wording may dominate
    for (const f of grades) {
      const ls: Lesson[] = JSON.parse(readFileSync(new URL(f, dir), 'utf8')).units.flatMap((u: { lessons: Lesson[] }) => u.lessons);
      const firstWord = (s: string) => s.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
      const counts = new Map<string, number>();
      for (const l of ls) counts.set(firstWord(l.script!.open), (counts.get(firstWord(l.script!.open)) ?? 0) + 1);
      const top = Math.max(...counts.values());
      expect(top / ls.length, `${f} opens too uniformly`).toBeLessThan(0.45);
      const steps = new Set(ls.map((l) => (l.tryit ?? [])[0]));
      expect(steps.size, `${f} repeats its first student step`).toBeGreaterThan(ls.length * 0.8);
    }
  });
});
