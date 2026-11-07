import type { Step } from './types';

/** Where to read a step's source in the app */
export function contextLink(s: Step): { to: string; text: string } | null {
  if (s.butler) { const m = /^(\d\d)-(\d\d):(\d+)$/.exec(s.butler); if (m) return { to: `/study/saints/${m[1]}-${m[2]}`, text: 'Read the whole life' }; }
  if (s.work && s.section) return { to: `/room/work/${s.work}/${s.section}`, text: 'Read it in context' };
  if (s.ccc) return { to: `/study/catechism/${s.ccc}`, text: `Catechism §${s.ccc}` };
  const m = s.ref && /^([A-Z0-9]{3})\.(\d+)\.(\d+)(?:-(\d+))?$/.exec(s.ref);
  if (m) return { to: `/read/webc/${m[1]}/${m[2]}?v=${m[3]}${m[4] ? `-${m[4]}` : ''}`, text: 'Read it in the Bible' };
  return null;
}
