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
export interface LiveSlide { poll?: { options: string[] }; label: string; title?: string; body?: string; items?: string[]; ref?: string; img?: { src: string; alt: string }; videoId?: string }
export interface LiveContent { title: string; slides: LiveSlide[]; questions: LiveQuestion[] }
export interface LiveSettings {
  teams: number; shuffleQuestions: boolean; shuffleOptions: boolean; lateJoin: boolean; showNames: boolean;
  /** 'game' is paced by the teacher; 'exam' lets each student work alone against one clock */
  mode: 'game' | 'exam' | 'race' | 'build';
  /** in a paced game, anyone who misses a question is out; the last ones standing win */
  elimination: boolean;
  /** race and build: minutes on the clock, and how many right answers finish the road or build the cathedral */
  runMinutes: number;
  goal: number;
  examMinutes: number;
  /** after an exam, show each student their score (and, if showAnswers, the right answers) */
  showResults: boolean; showAnswers: boolean;
  /** with a class list, students must pick their own name from it */
  rosterOnly: boolean;
}
export type Phase = 'lobby' | 'slides' | 'question' | 'results' | 'board' | 'exam' | 'run' | 'ended';
export interface PlayerResult { id: string; name: string; score: number; correct: number; answered: number; total: number; joinedAt: number; submitted: boolean; team?: number }
export interface QStat { q: string; correctPct: number; answeredPct: number }

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
  players: { id: string; name: string; score: number; answered: boolean; team?: number; connected: boolean; progress?: number; submitted?: boolean }[];
  board: { id: string; name: string; score: number; rank: number; streak: number; team?: number }[];
  teams?: { team: number; score: number; members: number }[];
  /** the teacher always gets the full results, so they can be kept in the class record */
  results?: { players: PlayerResult[]; questions: QStat[]; startedAt: number };
  roster?: string[];
  /** votes on the poll slide being shown */
  poll?: { counts: number[]; total: number; mine?: number };
  /** race and build: each student's own stream of questions, with the class's progress */
  run?: { deadline: number; goal: number; classSteps: number; classGoal: number; track: { id: string; name: string; steps: number; answered: number; finished: boolean; streak: number }[]; mine?: { question?: { type: QType; q: string; options?: string[]; points: number }; steps: number; streak: number; feedback?: { ok: boolean; why?: string; correct: (number | string)[]; q: string; options?: string[]; n: number } } };
  /** when an exam ends, on the server's clock */
  examDeadline?: number;
  exam?: { questions: { type: QType; q: string; options?: string[]; points: number }[]; answers: ((number | string)[] | null)[]; deadline: number; submitted: boolean; result?: { percent: number; correct: number; total: number; review?: { correct: (number | string)[]; mine: (number | string)[] | null; ok: boolean; why?: string }[] } };
  me?: { id: string; name: string; score: number; rank: number; streak: number; answered: boolean; out?: boolean; team?: number; last?: { correct: boolean; points: number; bonus: number } | null; picked?: (number | string)[] };
}
