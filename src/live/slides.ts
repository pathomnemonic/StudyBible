import type { LiveSlide } from './types';

/** The lesson's slides as plain data for a live class. The quiz slides are left out, because the live quiz replaces them. */
export function toLiveSlides(slides: { kind: string; label: string; title?: string; body?: string; items?: string[]; ref?: string; img?: { src: string; alt: string }; video?: { id: string }; word?: { w: string; d: string } }[]): LiveSlide[] {
  const abs = (src: string) => (src.startsWith('http') ? src : new URL(src, location.href).pathname);
  return slides.filter((s) => s.kind !== 'quiz' && s.kind !== 'end').map((s) => ({
    label: s.label,
    title: s.word ? s.word.w : s.title,
    body: s.word ? s.word.d : s.body,
    items: s.items,
    ref: s.ref,
    img: s.img ? { src: abs(s.img.src), alt: s.img.alt } : undefined,
    videoId: s.video?.id,
  }));
}
