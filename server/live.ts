import { randomInt, randomBytes } from 'node:crypto';
import type { LiveContent, LiveQuestion, LiveSettings, LiveSlide, LiveView, Phase } from '../src/live/types';

export const MAX_PLAYERS = 200;
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const clean = (s: unknown, n: number) => String(s ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, n);
const strs = (a: unknown, n: number, len: number) => (Array.isArray(a) ? a.slice(0, n).map((x) => clean(x, len)).filter(Boolean) : []);
const safeSrc = (s: unknown) => { const v = clean(s, 400); return /^(\/|https:\/\/)/.test(v) && !v.startsWith('//') ? v : ''; };

/** Check what a host sent and cut it to size; the server never trusts the shape it is given. */
export function sanitizeContent(raw: any): LiveContent {
  const slides: LiveSlide[] = (Array.isArray(raw?.slides) ? raw.slides : []).slice(0, 80).map((s: any) => {
    const img = s?.img && safeSrc(s.img.src) ? { src: safeSrc(s.img.src), alt: clean(s.img.alt, 200) } : undefined;
    const video = /^[\w-]{6,20}$/.test(String(s?.videoId ?? '')) ? String(s.videoId) : undefined;
    return { label: clean(s?.label, 40) || 'Slide', title: clean(s?.title, 200) || undefined, body: clean(s?.body, 1500) || undefined, items: strs(s?.items, 12, 400), ref: clean(s?.ref, 80) || undefined, img, videoId: video };
  });
  const questions: LiveQuestion[] = [];
  for (const r of (Array.isArray(raw?.questions) ? raw.questions : []).slice(0, 120)) {
    const type = ['mc', 'tf', 'multi', 'text', 'order'].includes(r?.type) ? r.type : null;
    const q = clean(r?.q, 400);
    if (!type || !q) continue;
    const options = type === 'tf' ? ['True', 'False'] : type === 'text' ? undefined : strs(r.options, 6, 200);
    if (type !== 'text' && (!options || options.length < 2)) continue;
    let correct: (number | string)[] = [];
    if (type === 'text') correct = strs(r.correct, 8, 80);
    else correct = (Array.isArray(r.correct) ? r.correct : []).map(Number).filter((n: number) => Number.isInteger(n) && n >= 0 && n < options!.length);
    if (!correct.length) continue;
    if ((type === 'mc' || type === 'tf') && correct.length !== 1) continue;
    if (type === 'order' && correct.length !== options!.length) continue;
    questions.push({ type, q, options, correct, time: Math.min(120, Math.max(5, Math.round(Number(r.time) || 20))), points: r.points === 0 ? 0 : r.points === 2 ? 2 : 1, why: clean(r.why, 400) || undefined });
  }
  return { title: clean(raw?.title, 120) || 'Class session', slides, questions };
}
export function sanitizeSettings(raw: any): LiveSettings {
  return { teams: Math.min(6, Math.max(0, Math.round(Number(raw?.teams) || 0))), shuffleQuestions: !!raw?.shuffleQuestions, shuffleOptions: raw?.shuffleOptions !== false, lateJoin: raw?.lateJoin !== false, showNames: raw?.showNames !== false };
}

interface Player { id: string; token: string; name: string; score: number; streak: number; team?: number; lastSeen: number; answer?: { value: (number | string)[]; at: number }; last?: { correct: boolean; points: number; bonus: number } | null; log: { q: number; correct: boolean; points: number }[] }

/** One class session: who is in it, where it is up to, and the scores. No I/O here; the server feeds it time and requests. */
export class LiveRoom {
  readonly code: string;
  readonly hostKey = randomBytes(16).toString('hex');
  readonly content: LiveContent;
  readonly settings: LiveSettings;
  phase: Phase = 'lobby';
  locked = false;
  slideIndex = 0;
  qIndex = -1;
  deadline = 0;
  createdAt: number;
  touched: number;
  version = 0;
  private players = new Map<string, Player>();
  private counts: number[] = [];
  private textCounts: Record<string, number> = {};
  private order: number[] = [];
  private optionOrder: number[][] = [];

  constructor(code: string, content: LiveContent, settings: LiveSettings, private now: () => number = Date.now) {
    this.code = code;
    this.settings = settings;
    this.createdAt = this.touched = now();
    // questions may be reordered, and each question's choices shuffled, once for the room, so every player sees the same thing
    const idx = content.questions.map((_, i) => i);
    this.order = settings.shuffleQuestions ? shuffle(idx) : idx;
    this.content = { ...content, questions: this.order.map((i) => content.questions[i]) };
    this.content.questions = this.content.questions.map((q) => {
      if (!settings.shuffleOptions || !q.options || q.type === 'tf') return q;
      const perm = shuffle(q.options.map((_, i) => i)); // perm[newIndex] = oldIndex
      const options = perm.map((o) => q.options![o]);
      const back = (old: number) => perm.indexOf(old);
      // for an ordering question the options are shuffled and the answer says which shuffled item comes first, second, ...
      const correct = q.type === 'order' ? (q.correct as number[]).map(back) : (q.correct as number[]).map(back).sort((a, b) => a - b);
      return { ...q, options, correct };
    });
  }

  get playerCount() { return this.players.size; }
  private touch() { this.touched = this.now(); this.version++; }
  private ranked() { return [...this.players.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)); }
  private nameFree(name: string) { let n = name, k = 2; const taken = new Set([...this.players.values()].map((p) => p.name.toLowerCase())); while (taken.has(n.toLowerCase())) n = `${name} ${k++}`; return n; }

  join(rawName: string, token?: string): { id: string; token: string } {
    if (token) { const p = [...this.players.values()].find((x) => x.token === token); if (p) { p.lastSeen = this.now(); this.touch(); return { id: p.id, token: p.token }; } }
    if (this.locked) throw new Error('This session is locked.');
    if (this.phase !== 'lobby' && !this.settings.lateJoin) throw new Error('This session has already started.');
    if (this.phase === 'ended') throw new Error('This session has ended.');
    if (this.players.size >= MAX_PLAYERS) throw new Error('This session is full.');
    const name = this.nameFree(clean(rawName, 20) || 'Pilgrim');
    const p: Player = { id: randomBytes(5).toString('hex'), token: randomBytes(16).toString('hex'), name, score: 0, streak: 0, lastSeen: this.now(), log: [] };
    if (this.settings.teams > 0) {
      const sizes = Array.from({ length: this.settings.teams }, (_, t) => [...this.players.values()].filter((x) => x.team === t).length);
      p.team = sizes.indexOf(Math.min(...sizes));
    }
    this.players.set(p.id, p);
    this.touch();
    return { id: p.id, token: p.token };
  }
  ping(token: string) { const p = [...this.players.values()].find((x) => x.token === token); if (p) p.lastSeen = this.now(); }
  playerByToken(token: string) { return [...this.players.values()].find((x) => x.token === token); }

  private startQuestion(i: number) {
    this.qIndex = i;
    const q = this.content.questions[i];
    this.phase = 'question';
    this.deadline = this.now() + q.time * 1000;
    this.counts = new Array(q.options?.length ?? 0).fill(0);
    this.textCounts = {};
    for (const p of this.players.values()) { p.answer = undefined; p.last = null; }
  }

  private finishQuestion() {
    if (this.phase !== 'question') return;
    const q = this.content.questions[this.qIndex];
    for (const p of this.players.values()) {
      const a = p.answer;
      let correct = false;
      if (a) correct = isRight(q, a.value);
      let points = 0, bonus = 0;
      if (correct && q.points > 0) {
        const frac = Math.min(1, Math.max(0, (a!.at - (this.deadline - q.time * 1000)) / (q.time * 1000)));
        points = Math.round(1000 * q.points * (1 - frac / 2));
        bonus = Math.min(p.streak, 5) * 100;
        p.score += points + bonus;
      }
      p.streak = correct ? p.streak + 1 : 0;
      p.last = { correct, points, bonus };
      p.log.push({ q: this.qIndex, correct, points: points + bonus });
      if (a) {
        if (q.type === 'text') { const k = fold(String(a.value[0] ?? '')); if (k) this.textCounts[k] = (this.textCounts[k] ?? 0) + 1; }
        else if (q.type !== 'order') for (const v of a.value) { const n = Number(v); if (this.counts[n] !== undefined) this.counts[n]++; }
      }
    }
    this.phase = 'results';
    this.touch();
  }

  answer(token: string, value: unknown): boolean {
    const p = this.playerByToken(token);
    if (!p || this.phase !== 'question' || p.answer) return false;
    const q = this.content.questions[this.qIndex];
    let v: (number | string)[];
    if (q.type === 'text') v = [clean(Array.isArray(value) ? value[0] : value, 80)];
    else {
      v = (Array.isArray(value) ? value : [value]).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < (q.options?.length ?? 0));
      if (q.type === 'order') { if (new Set(v).size !== q.options!.length || v.length !== q.options!.length) return false; }
      else v = [...new Set(v)];
      if (!v.length || ((q.type === 'mc' || q.type === 'tf') && v.length !== 1)) return false;
    }
    if (q.type === 'text' && !v[0]) return false;
    p.answer = { value: v, at: Math.min(this.now(), this.deadline) };
    this.touch();
    if ([...this.players.values()].every((x) => x.answer)) this.finishQuestion();
    return true;
  }

  /** Called on a timer: ends a question when its time is up, and counts players who dropped off. */
  tick(): boolean {
    if (this.phase === 'question' && this.now() >= this.deadline) { this.finishQuestion(); return true; }
    return false;
  }

  host(action: string, arg?: any): void {
    const last = this.content.questions.length - 1;
    switch (action) {
      case 'start': if (this.phase !== 'lobby') return; if (this.content.slides.length) { this.phase = 'slides'; this.slideIndex = 0; } else if (last >= 0) this.startQuestion(0); else return; break;
      case 'slide': if (this.phase !== 'slides') return; this.slideIndex = Math.min(this.content.slides.length - 1, Math.max(0, Math.round(Number(arg) || 0))); break;
      case 'quiz': if ((this.phase !== 'slides' && this.phase !== 'lobby') || last < 0) return; this.startQuestion(0); break;
      case 'skip': this.finishQuestion(); return;
      case 'next':
        if (this.phase === 'results') { this.phase = 'board'; }
        else if (this.phase === 'board') { if (this.qIndex >= last) this.phase = 'ended'; else this.startQuestion(this.qIndex + 1); }
        else if (this.phase === 'ended') return;
        else return;
        break;
      case 'lock': this.locked = !!arg; break;
      case 'kick': this.players.delete(String(arg)); break;
      case 'end': this.phase = 'ended'; break;
      default: return;
    }
    this.touch();
  }

  /** Scores as comma-separated rows, for the teacher to keep. */
  csv(): string {
    const q = this.content.questions;
    const esc = (s: string | number) => { const t = String(s); return /^[=+\-@]/.test(t) ? `'${t}` : t; };
    const q2 = (s: string | number) => `"${esc(s).replace(/"/g, '""')}"`;
    const rows = [['Rank', 'Name', 'Team', 'Score', 'Correct', ...q.map((_, i) => `Q${i + 1}`)].map(q2).join(',')];
    this.ranked().forEach((p, r) => rows.push([r + 1, p.name, p.team === undefined ? '' : p.team + 1, p.score, p.log.filter((l) => l.correct).length, ...q.map((_, i) => { const l = p.log.find((x) => x.q === i); return l ? (l.correct ? 'right' : 'wrong') : ''; })].map(q2).join(',')));
    return rows.join('\n');
  }

  view(role: 'host' | 'player', token?: string): LiveView {
    const ranked = this.ranked();
    const rankOf = new Map(ranked.map((p, i) => [p.id, i + 1]));
    const q = this.content.questions[this.qIndex];
    const showAnswers = this.phase === 'results' || this.phase === 'board' || this.phase === 'ended';
    const me = role === 'player' && token ? this.playerByToken(token) : undefined;
    const answered = [...this.players.values()].filter((p) => p.answer).length;
    const v: LiveView = {
      role, code: this.code, title: this.content.title, phase: this.phase, now: this.now(), locked: this.locked, settings: this.settings,
      slideIndex: this.slideIndex, slideCount: this.content.slides.length,
      slides: this.phase === 'slides' || role === 'host' ? this.content.slides : undefined,
      qIndex: this.qIndex, qCount: this.content.questions.length,
      players: [...this.players.values()].map((p) => ({ id: p.id, name: p.name, score: p.score, answered: !!p.answer, team: p.team, connected: this.now() - p.lastSeen < 45_000 })),
      board: ranked.slice(0, this.phase === 'ended' ? 10 : 5).map((p) => ({ id: p.id, name: p.name, score: p.score, rank: rankOf.get(p.id)!, streak: p.streak, team: p.team })),
    };
    if (role === 'player') v.players = v.players.map((p) => ({ ...p, name: this.settings.showNames ? p.name : '', answered: false }));
    if (q && (this.phase === 'question' || showAnswers)) {
      v.question = { type: q.type, q: q.q, options: q.options, time: q.time, points: q.points, deadline: this.deadline, answered, total: this.players.size, multiHint: q.type === 'multi' ? (q.correct as number[]).length : undefined };
      if (showAnswers) v.reveal = { correct: q.correct, why: q.why, counts: this.counts, text: q.type === 'text' ? this.textCounts : undefined };
    }
    if (this.settings.teams > 0) {
      v.teams = Array.from({ length: this.settings.teams }, (_, t) => { const m = [...this.players.values()].filter((p) => p.team === t); return { team: t, members: m.length, score: m.length ? Math.round(m.reduce((a, p) => a + p.score, 0) / m.length) : 0 }; });
    }
    if (me) v.me = { id: me.id, name: me.name, score: me.score, rank: rankOf.get(me.id)!, streak: me.streak, answered: !!me.answer, team: me.team, last: showAnswers ? me.last : null, picked: me.answer?.value };
    return v;
  }
}

export function isRight(q: LiveQuestion, v: (number | string)[]): boolean {
  if (q.type === 'text') { const a = fold(String(v[0] ?? '')); return !!a && (q.correct as string[]).some((c) => fold(c) === a); }
  if (q.type === 'order') return v.length === q.correct.length && v.every((x, i) => Number(x) === Number(q.correct[i]));
  const a = [...v].map(Number).sort((x, y) => x - y), b = [...q.correct].map(Number).sort((x, y) => x - y);
  return a.length === b.length && a.every((x, i) => x === b[i]);
}
function shuffle<T>(a: T[]): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = randomInt(i + 1); [r[i], r[j]] = [r[j], r[i]]; } return r; }

/** All live rooms on this server, with the limits that keep one classroom from using the machine. */
export class LiveHub {
  rooms = new Map<string, LiveRoom>();
  constructor(private now: () => number = Date.now, private maxRooms = 300) {}
  create(content: LiveContent, settings: LiveSettings): LiveRoom {
    this.sweep();
    if (this.rooms.size >= this.maxRooms) throw new Error('The server is busy. Try again in a few minutes.');
    let code = '';
    do code = String(randomInt(100000, 1000000)); while (this.rooms.has(code));
    const r = new LiveRoom(code, content, settings, this.now);
    this.rooms.set(code, r);
    return r;
  }
  get(code: string) { return this.rooms.get(code); }
  /** forget sessions that were left: two hours with nothing happening, or six hours old */
  sweep() { const t = this.now(); for (const [c, r] of this.rooms) if (t - r.touched > 2 * 3600_000 || t - r.createdAt > 6 * 3600_000) this.rooms.delete(c); }
}
