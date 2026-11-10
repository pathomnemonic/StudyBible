import { isSeen, hintsOn } from './seen';

/** Features that are not obvious from their name. The first tap on one (while it still has its red dot) shows a short note before opening it. Everything else just opens. */
export const TIP_IDS = new Set([
  'bible.dossier', 'bible.fulfilment', 'bible.walks', 'bible.slow', 'bible.conversation', 'bible.glossed', 'bible.fathers',
  'learn.map', 'learn.arguments', 'learn.development', 'learn.words', 'learn.zoom', 'learn.heresies', 'learn.compare', 'learn.claims', 'learn.timelapse', 'learn.lives', 'learn.coop', 'learn.online',
  'pray.mentors', 'pray.readingstogether', 'pray.office-companion', 'you.passport',
  'study.universe', 'study.constellation', 'study.themes', 'study.concepts', 'study.voices', 'study.ask-fathers', 'study.compare-fathers', 'study.apostolic-chain',
  'learn.apologetics-tracks', 'teach.run', 'listen.foryou',
]);

export const tipKey = (id: string) => `tip.dot.${id}`;
/** Should a click on this red-dot link first show its note? */
export function wantsTip(id: string, e: MouseEvent): boolean {
  if (!TIP_IDS.has(id) || !hintsOn() || isSeen(id) || isSeen(tipKey(id))) return false;
  return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0);
}
