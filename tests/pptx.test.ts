import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { buildPptx } from '../src/curriculum/pptx';
import type { Slide } from '../src/curriculum/LessonSlides';

describe('PowerPoint export', () => {
  it('writes one slide per deck slide with the notes kept', async () => {
    const slides = [
      { kind: 'title', label: 'Grade 5', title: 'Christ in the sacraments', body: 'Why?', theme: 'sacrament' },
      { kind: 'idea', label: 'The big idea', title: 'Signs that do what they say', notes: ['Say it twice.'] },
    ] as Slide[];
    const p = await buildPptx(slides, 'Test');
    const buf = (await p.write({ outputType: 'nodebuffer' })) as Buffer;
    const zip = await JSZip.loadAsync(buf);
    expect(Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).length).toBe(2);
    expect(Object.keys(zip.files).some((f) => f.startsWith('ppt/notesSlides/'))).toBe(true);
  });
});
