import { db } from '../db/db';
import { newCard } from '../lib/srs';
import type { Scheme } from '../lib/types';

export interface ReviewSource {
  /** the passage id as the lesson wrote it (English numbering), kept on the card */
  sourceRef: string;
  sourceScheme: Scheme;
  /** true when the lesson's numbering was not verified to map onto the anchor numbering */
  approximate?: boolean;
}

/**
 * Add a lesson's key verse to the memorize list. The existence check and the insert share one transaction, so two
 * rapid calls (or two tabs) cannot both pass the check and leave a duplicate. Resolves 'exists' when the card was
 * already there, and rejects (leaving nothing half-written) when the write fails.
 */
export async function addReviewCard(anchorRef: string, src: ReviewSource): Promise<'added' | 'exists'> {
  return db.transaction('rw', db.memory, async () => {
    if (await db.memory.where('ref').equals(anchorRef).count()) return 'exists';
    await db.memory.add({ ref: anchorRef, ...newCard(), createdAt: Date.now(), source: src.sourceRef, sourceScheme: src.sourceScheme, ...(src.approximate ? { approximate: true } : {}) });
    return 'added';
  });
}
