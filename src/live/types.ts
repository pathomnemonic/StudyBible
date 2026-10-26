/** Shapes shared by the classroom server and the app. Plain data only, so a room can be sent as JSON. */
export type QType = 'mc' | 'tf' | 'multi' | 'text' | 'order';
export interface LiveQuestion {
  type: QType;
  q: string;
  /** choices (mc, tf, multi) or the items to put in order */
  options?: string[];
  /** mc/tf: [index]; multi: the indexes that are right; order: item indexes in the right order; text: accepted answers */
  correct: (number | string)[];
  /** seconds to answer */
  time: number;
  /** 0 no points, 1 standard, 2 double */
  points: 0 | 1 | 2;
  why?: string;
}
export interface LiveSlide { label: string; title?: string; body?: string; items?: string[]; ref?: string; img?: { src: string; alt: string }; videoId?: string }
export interface LiveContent { title: string; slides: LiveSlide[]; questions: LiveQuestion[] }
export interface LiveSettings { teams: number; shuffleQuestions: boolean; shuffleOptions: boolean; lateJoin: boolean; showNames: boolean }
export type Phase = 'lobby' | 'slides' | 'question' | 'results' | 'board' | 'ended';

/** what a player or the host is shown */
export interface LiveView {
  role: 'host' | 'player';
  code: string;
  title: string;
  phase: Phase;
  now: number;
  locked: boolean;
  settings: LiveSettings;
  slideIndex: number;
  slideCount: number;
  slides?: LiveSlide[];
  qIndex: number;
  qCount: number;
  question?: { type: QType; q: string; options?: string[]; time: number; points: number; deadline: number; answered: number; total: number; multiHint?: number };
  /** shown once the question is over */
  reveal?: { correct: (number | string)[]; why?: string; counts: number[]; text?: Record<string, number> };
  players: { id: string; name: string; score: number; answered: boolean; team?: number; connected: boolean }[];
  board: { id: string; name: string; score: number; rank: number; streak: number; team?: number }[];
  teams?: { team: number; score: number; members: number }[];
  me?: { id: string; name: string; score: number; rank: number; streak: number; answered: boolean; team?: number; last?: { correct: boolean; points: number; bonus: number } | null; picked?: (number | string)[] };
}
