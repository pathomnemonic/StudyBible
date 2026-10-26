import { parseRefs, type Ref } from '../lib/refs';

const STOP = new Set('genesis exodus leviticus numbers deuteronomy matthew luke john acts romans corinthians galatians ephesians philippians colossians thessalonians timothy hebrews james peter jude revelation psalm psalms proverbs isaiah jeremiah ezekiel daniel samuel kings chronicles gospel letter chapter explained explain study studies catholic bible biblical series video episode part homily sunday ordinary podcast show talk answers answer question questions introduction intro overview book books new old testament shorts short feast fr mike dr brant pitre scott hahn bishop barron trent horn timothy peters tim staples jimmy akin ask me anything focus aquinas a an the of and or to in on is are was be for with at by from as it its this that these those our we you your us god jesus christ lord his her their who what why how when not no do does did can will have has had one all any more most about into than then them they he she i my me gospel book chapter chapters part saint st'.split(' '));
const words = (s: string) => (s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z]{4,}/g) ?? []).map((w) => w.replace(/(ing|ed|es|s)$/, '')).filter((w) => w.length > 3 && !STOP.has(w));

const spans = (s: string): Ref[] => s.split(';').flatMap((x) => { const p = parseRefs(x.trim()); return p.ok ? p.refs.map((r) => r.ref) : []; });
const inside = (a: Ref, b: Ref) => a.book === b.book && a.c1 >= b.c1 && (a.c2 ?? a.c1) <= (b.c2 ?? b.c1) && (a.v1 === undefined || b.v1 === undefined || (a.c1 > b.c1 || a.v1 >= b.v1) && ((a.c2 ?? a.c1) < (b.c2 ?? b.c1) || (a.v2 ?? a.v1 ?? 999) <= (b.v2 ?? b.v1 ?? 999)));

/**
 * Does a resource (a video, a picture, a children's story) belong with this lesson? Sharing a chapter is not enough: a video on all of
 * Matthew 28 does not belong with a lesson on the Trinity just because the lesson quotes Matthew 28:19.
 * It belongs when its own passage lies within the lesson's passage (it is about that very text), or when its title speaks of what the lesson is about.
 */
export function relevant(lesson: { title: string; scripture: string; vocab?: string[]; idea?: string }, resourceTitle: string, resourceRefs: string): boolean {
  const own = spans(lesson.scripture), theirs = spans(resourceRefs);
  // a resource on exactly the lesson's own passage is about that very text
  if (theirs.length && theirs.every((t) => own.some((o) => inside(t, o) && inside(o, t)))) return true;
  const strong = new Set([...words(lesson.title), ...(lesson.vocab ?? []).flatMap((v) => words(v.replace(/-/g, ' ')))]);
  const weak = new Set(words(lesson.idea ?? ''));
  const theirWords = [...new Set(words(resourceTitle))];
  // a word of the lesson's title or vocabulary in the resource's title, or two words from the lesson's big idea
  return theirWords.some((w) => strong.has(w)) || theirWords.filter((w) => weak.has(w)).length >= 2;
}
