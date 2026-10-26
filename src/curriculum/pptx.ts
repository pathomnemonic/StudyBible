import type { Slide } from './LessonSlides';
import { slideLines } from './LessonSlides';

const THEMES: Record<string, { bg: string; accent: string }> = {
  creed: { bg: '1E1B4B', accent: 'C4B5FD' },
  sacrament: { bg: '4A1D1D', accent: 'FCA5A5' },
  moral: { bg: '14352E', accent: '6EE7B7' },
  prayer: { bg: '3B2A12', accent: 'FCD34D' },
};

/** The lesson deck as a real PowerPoint file, with the teacher notes in the speaker notes. Loaded only when asked for. */
export async function buildPptx(slides: Slide[], title: string) {
  const { default: Pptx } = await import('pptxgenjs');
  const p = new Pptx();
  p.layout = 'LAYOUT_16x9';
  p.title = title;
  for (const sl of slides) {
    const t = THEMES[sl.theme ?? 'creed'] ?? THEMES.creed;
    const s = p.addSlide();
    s.background = { color: t.bg };
    s.addText(sl.label.toUpperCase(), { x: 0.6, y: 0.3, w: 8.8, h: 0.4, fontSize: 12, color: t.accent, bold: true, charSpacing: 3 });
    const lines = slideLines(sl);
    const head = sl.kind === 'title' || sl.kind === 'section' || sl.kind === 'wonder' || sl.kind === 'end' ? lines[0] : undefined;
    if (head) {
      s.addText(head, { x: 0.6, y: 1.4, w: 8.8, h: 1.6, fontSize: sl.kind === 'title' ? 40 : 34, color: 'FFFFFF', bold: true, fontFace: 'Georgia', valign: 'middle' });
      const rest = lines.slice(1).join('\n');
      if (rest) s.addText(rest, { x: 0.6, y: 3.1, w: 8.8, h: 1.8, fontSize: 20, color: 'DDDDEE', valign: 'top' });
    } else {
      const body = lines.length ? lines : [sl.label];
      s.addText(body.map((txt, i) => ({ text: txt, options: { breakLine: true, bold: i === 0 && body.length > 1, fontSize: i === 0 && body.length > 1 ? 28 : 22, color: i === 0 ? 'FFFFFF' : 'E5E7EB', paraSpaceAfter: 8 } })), { x: 0.6, y: 0.9, w: 8.8, h: 4.2, valign: 'top', fontFace: 'Georgia', fit: 'shrink' });
    }
    if (sl.notes?.length) s.addNotes(sl.notes.join('\n'));
  }
  return p;
}

export async function exportPptx(slides: Slide[], title: string) {
  const p = await buildPptx(slides, title);
  await p.writeFile({ fileName: `${title.replace(/[^\w]+/g, '-').slice(0, 40) || 'lesson'}.pptx` });
}
