import type { DeepPrompt } from './deepWaters';
import LISTS from './deepWatersChatGPT.json';

/**
 * Lists drafted by ChatGPT on side branches and imported here: official liturgical books, historians of the Church, prayers known by their Latin names, saints invoked
 * for a need (from `feature/deep-waters-krillion-bank`), and nine lists from the Roman Curia and the Church's structure (apostolic constitutions, motu proprio,
 * apostolic letters, curial decrees, instructions, notes and documents, archdioceses, apostolic vicariates; from `work/deep-waters-long-tail-50`, sourced to
 * GCatholic). All but the patron saints are specialist lists and are asked only in the special packs. Not yet reviewed by a person. Left out on purpose: the
 * saints-by-country lists (the answers look scraped from a martyrology, with the best-known saints missing), the two-letter generated prompts (the problem this
 * app removed), and the fill-in-the-verse prompts (one fixed answer, so there is no rarity to climb).
 */
export const CHATGPT_PROMPTS = LISTS as unknown as DeepPrompt[];
