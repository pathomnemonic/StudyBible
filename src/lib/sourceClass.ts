import type { Group } from './fathersSearch';

/**
 * What kind of voice a source is, in plain words, so a reader never mistakes one for another. The class comes from the work's own record
 * (its authority and kind in the library index), never from the words of the passage.
 */
export type SourceClass = 'official' | 'father' | 'saint' | 'scholar';
export const SOURCE_CLASS: Record<SourceClass, { label: string; note: string }> = {
  official: { label: 'Official teaching', note: 'A council or a Church document: the Church speaking.' },
  father: { label: 'Father of the Church', note: 'An early writer whose witness the Church honours; one voice, not the whole Church.' },
  saint: { label: 'A saint’s writing', note: 'A holy person’s own writing; helpful, but not official teaching.' },
  scholar: { label: 'Scholar or later writer', note: 'A view from a scholar or later writer; read it as one opinion.' },
};
export const classOf = (g: Group): SourceClass => (g === 'Councils' || g === 'Church documents' ? 'official' : g === 'Fathers' ? 'father' : g === 'Saints' ? 'saint' : 'scholar');
