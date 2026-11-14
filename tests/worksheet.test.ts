import { describe, expect, it } from 'vitest';
import { worksheetHtml, worksheetParts } from '../src/curriculum/worksheet';

const lesson = { id: 'l1', title: 'The <Bread> of Life', idea: 'Jesus gives himself as food (CCC 1374).', ccc: '1374', scripture: 'John 6:51-58', vocab: ['Eucharist', 'Sacrament'], question: 'Why does Jesus call himself bread?', activity: 'Draw a loaf.', prayer: null, talk: ['What do we need to live?', 'Who feeds you?', 'Third?'], life: 'Thank someone who feeds you.', mem: 'John 6:35' } as any;
const quiz = [{ q: 'Which word fits?', options: ['one', 'two', 'three', 'four'], answer: 2 }];

describe('student worksheet', () => {
  it('uses only the lesson’s own parts, in order', () => {
    const p = worksheetParts(lesson);
    expect(p.goals).toEqual(['Jesus gives himself as food.']);
    expect(p.questions).toEqual(['Why does Jesus call himself bread?', 'What do we need to live?', 'Who feeds you?']);
    expect(p.vocab).toEqual(['Eucharist', 'Sacrament']);
  });
  it('escapes the title and has no answers on the student copy', () => {
    const h = worksheetHtml(lesson, { grade: 'Grade 4', quiz });
    expect(h).toContain('The &lt;Bread&gt; of Life');
    expect(h).not.toContain('✔');
    expect(h).not.toContain('ANSWER KEY');
    expect(h).toContain('Name');
  });
  it('marks the right answer only on the key', () => {
    const h = worksheetHtml(lesson, { grade: 'Grade 4', quiz, key: true });
    expect(h).toContain('ANSWER KEY');
    expect(h).toContain('three ✔');
    expect(h.match(/✔/g)).toHaveLength(1);
  });
});
