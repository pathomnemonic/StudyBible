import { describe, expect, it } from 'vitest';
import { linkedTitles, notesLinkingTo, resolveNoteLinks } from '../src/lib/noteLinks';

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
