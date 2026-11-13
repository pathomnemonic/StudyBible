import { describe, expect, it } from 'vitest';
import { completeLink, linkedTitles, notesLinkingTo, openLinkAt, resolveNoteLinks, suggestNotes } from '../src/lib/noteLinks';

describe('note-to-note links', () => {
  const notes = [{ id: 1, title: 'Bread of life', body: 'x' }, { id: 2, title: 'Manna', body: 'See [[bread of  life]] and [[Missing]]' }];
  it('finds the titles a note links to, once each', () => {
    expect(linkedTitles('a [[One]] b [[one]] c [[Two]]')).toEqual(['One', 'Two']);
    expect(linkedTitles('no links, [single] brackets, [[ ]]'.replace('[[ ]]', ''))).toEqual([]);
  });
  it('turns a matching title into a link and leaves an unknown one as plain text', () => {
    expect(resolveNoteLinks(notes[1].body, notes)).toBe('See [bread of  life](#/library/notes/1) and Missing');
  });
  it('lists the notes that link to a title', () => {
    expect(notesLinkingTo('Bread of life', notes).map((n) => n.id)).toEqual([2]);
    expect(notesLinkingTo(undefined, notes)).toEqual([]);
  });
});

describe('the [[ picker', () => {
  const notes = [{ id: 1, title: 'Bread of life' }, { id: 2, title: 'The bread and the cup' }, { id: 3, title: 'Prayer' }, { id: 4 }];
  it('finds an open [[ at the caret and only then', () => {
    expect(openLinkAt('see [[bre', 9)).toEqual({ start: 4, query: 'bre' });
    expect(openLinkAt('see [[bread]] more', 18)).toBeNull();
    expect(openLinkAt('see [[bre\nnext', 14)).toBeNull();
    expect(openLinkAt('no brackets', 5)).toBeNull();
  });
  it('suggests titles that start with the text first, then those that contain it', () => {
    expect(suggestNotes('bre', notes).map((n) => n.id)).toEqual([1, 2]);
    expect(suggestNotes('', notes).map((n) => n.id)).toEqual([1, 2, 3]);
    expect(suggestNotes('bre', notes, 1).map((n) => n.id)).toEqual([2]);
  });
  it('completes the link and puts the caret after it', () => {
    const r = completeLink('see [[bre and more', 4, 9, 'Bread of life');
    expect(r.body).toBe('see [[Bread of life]] and more');
    expect(r.caret).toBe(4 + '[[Bread of life]]'.length);
  });
});
