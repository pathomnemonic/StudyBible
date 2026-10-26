import type { LiveSlide } from './types';

/** The lesson's slides as plain data for a live class. The quiz slides are left out, because the live quiz replaces them. */
export function toLiveSlides(slides: { kind: string; label: string; title?: string; body?: string; items?: string[]; ref?: string; img?: { src: string; alt: string }; video?: { id: string }; word?: { w: string; d: string }; poll?: string[]; reveal?: string; sides?: string[]; frames?: string[] }[]): LiveSlide[] {
  const abs = (src: string) => (src.startsWith('http') ? src : new URL(src, location.href).pathname);
  const out: LiveSlide[] = [];
  for (const s of slides.filter((x) => x.kind !== 'quiz' && x.kind !== 'end')) {
    // a myth-or-truth card becomes a vote, then the answer; a debate becomes a vote, then what the Church teaches
    if (s.kind === 'myth') { out.push({ label: s.label, title: `Myth or truth? “${s.title}”`, poll: { options: ['Truth', 'Myth'] } }, { label: 'The answer', title: s.reveal?.split('.')[0], body: s.reveal?.split('. ').slice(1).join('. ') || undefined }); continue; }
    if (s.kind === 'debate') { out.push({ label: s.label, title: `Agree or disagree? “${s.title}”`, poll: { options: s.sides ?? ['Agree', 'Disagree'] }, items: s.frames }, { label: 'What the Church teaches', body: s.reveal }); continue; }
    if (s.kind === 'poll' && s.poll) { out.push({ label: s.label, title: s.title, poll: { options: s.poll } }); continue; }
    out.push({
      label: s.label,
    title: s.word ? s.word.w : s.title,
    body: s.word ? s.word.d : s.body,
    items: s.items,
    ref: s.ref,
    img: s.img ? { src: abs(s.img.src), alt: s.img.alt } : undefined,
    videoId: s.video?.id,
    } as LiveSlide);
  }
  return out;
}
