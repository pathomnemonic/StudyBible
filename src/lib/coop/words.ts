import { ANSWERS } from '../../data/verbum';
/** Today's Verbum word, worked out exactly as the solo game does (VerbumPage), so a family solving together gets the same word as everyone else. */
export const verbumAnswer = (day: number) => ANSWERS[(day * 7919) % ANSWERS.length];
