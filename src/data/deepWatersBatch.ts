import type { DeepPrompt } from './deepWaters';
import LISTS from './deepWatersBatch.json';

/**
 * The seventh batch of everyday lists, written in parallel by several writers (saints, the Old Testament, the Gospels and Acts, the Mass and the church year, prayer and
 * devotion, Church history and culture, doctrine and the moral life, places and art) to the same rules: a broad plain question, answers that are surely correct, and a tail
 * of rarer ones. Checked and repaired by `scripts/deepwaters/import-batch.ts` (repeated answers, collisions and near-duplicates of existing lists are dropped). Written from
 * memory and not yet reviewed by a person (see src/data/deepWaters.review.json).
 */
export const BATCH_PROMPTS = LISTS as unknown as DeepPrompt[];
