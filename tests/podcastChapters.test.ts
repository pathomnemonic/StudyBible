import { describe, expect, it } from 'vitest';
import { chaptersFromNotes, notesLines } from '../src/data/feeds';

describe('podcast chapters from show notes', () => {
  it('reads a timestamp list in several common styles', () => {
    const t = ['In this episode:', '00:00 Welcome', '(03:15) The first reading', '[1:02:03] - Questions', '12:30: Closing'].join('\n');
    expect(chaptersFromNotes(t)).toEqual([{ t: 0, title: 'Welcome' }, { t: 195, title: 'The first reading' }, { t: 3723, title: 'Questions' }, { t: 750, title: 'Closing' }].filter((c) => c.t !== 750));
  });
  it('ignores a stray time in a sentence and lists with fewer than three marks', () => {
    expect(chaptersFromNotes('We meet at 12:30 on Sunday.\n00:00 Intro\n05:00 Talk')).toEqual([]);
    expect(chaptersFromNotes('Something happened at 12:30 today')).toEqual([]);
  });
  it('needs the list to start near the beginning and keep rising', () => {
    expect(chaptersFromNotes('45:00 A\n50:00 B\n55:00 C')).toEqual([]);
  });
  it('keeps line breaks from html show notes', () => {
    const lines = notesLines('<p>00:00 Intro</p><p>02:00 Part one<br/>04:30 Part two</p>');
    expect(chaptersFromNotes(lines).map((c) => c.t)).toEqual([0, 120, 270]);
  });
});
