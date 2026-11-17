import CURRICULUM_PROMPTS_1 from './deepWatersCurriculum1.generated.json';
import AUTHORED_DEEP_WATERS from './deepWatersAuthored.json';
import CURRICULUM_PROMPTS_2 from './deepWatersCurriculum2.generated.json';
import CURRICULUM_PROMPTS_3 from './deepWatersCurriculum3.generated.json';
import CURRICULUM_PROMPTS_4 from './deepWatersCurriculum4.generated.json';
import CURRICULUM_PROMPTS_5 from './deepWatersCurriculum5.generated.json';
import SCRIPTURE_PROMPTS_1 from './deepWatersScripture1b.generated.json';
import SCRIPTURE_PROMPTS_2 from './deepWatersScripture2b.generated.json';
import SCRIPTURE_PROMPTS_3 from './deepWatersScripture3b.generated.json';
import SCRIPTURE_PROMPTS_4 from './deepWatersScripture4b.generated.json';
/** Deep Waters combines authored category prompts, curriculum questions, and public-domain Scripture clozes. Tiers are editorial game weights. */
export type DeepTier = 1 | 2 | 3 | 4 | 5;
export interface DeepAnswer { answer: string; tier: DeepTier; aliases?: string[] }
export interface DeepPrompt { id: string; prompt: string; context: string; hint: string; answers: DeepAnswer[]; status?: 'draft' | 'reviewed'; answerMode?: 'single' | 'many'; source?: string; theme?: string }

export const DEEP_WATERS: DeepPrompt[] = [
  ...(AUTHORED_DEEP_WATERS as DeepPrompt[]),
  ...(CURRICULUM_PROMPTS_1 as DeepPrompt[]),
  ...(CURRICULUM_PROMPTS_2 as DeepPrompt[]),
  ...(CURRICULUM_PROMPTS_3 as DeepPrompt[]),
  ...(CURRICULUM_PROMPTS_4 as DeepPrompt[]),
  ...(CURRICULUM_PROMPTS_5 as DeepPrompt[]),
  ...(SCRIPTURE_PROMPTS_1 as DeepPrompt[]),
  ...(SCRIPTURE_PROMPTS_2 as DeepPrompt[]),
  ...(SCRIPTURE_PROMPTS_3 as DeepPrompt[]),
  ...(SCRIPTURE_PROMPTS_4 as DeepPrompt[]),
];
