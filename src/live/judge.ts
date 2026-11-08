import type { LiveQuestion } from './types';
import { isRight } from './engine';
/** Whether an answer is right: the same rule the live session uses (`loose` adds the forgiving name matching Who Am I? uses). */
export function isCorrect(q: LiveQuestion, v: (number | string)[], loose = false): boolean { return isRight(q, v, loose); }
