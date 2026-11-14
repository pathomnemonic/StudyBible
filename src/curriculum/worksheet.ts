/** A printable student worksheet made only from the lesson's own parts. Nothing is added: no new questions, no new facts. */
import type { LessonSpec, Question } from './model';

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const clean = (t: string) => t.replace(/\s*\((?:see )?(?:CCC|Catechism)\s*[^)]*\)/gi, '').trim();
const lines = (n: number) => '<div class="ln"></div>'.repeat(n);

export interface WorksheetOptions { grade: string; quiz: Question[]; key?: boolean; answerLines?: number }

/** The pieces, in print order, as plain data (tested) before they become HTML. */
export function worksheetParts(l: LessonSpec) {
  const goals = (l.objectives?.length ? l.objectives : [clean(l.idea)]).filter(Boolean);
  return {
    goals,
    scripture: l.scripture,
    vocab: l.vocab ?? [],
    questions: [l.question, ...(l.talk ?? []).slice(0, 2)].filter(Boolean),
    activity: l.activity,
    life: l.life,
    mem: l.mem,
    remember: l.remember ?? [],
  };
}

export function worksheetHtml(l: LessonSpec, o: WorksheetOptions): string {
  const p = worksheetParts(l);
  const n = o.answerLines ?? 3;
  const quiz = o.quiz.map((q, i) => `<li>${esc(q.q)}<ol type="A">${q.options.map((x, j) => `<li>${esc(x)}${o.key && j === q.answer ? ' ✔' : ''}</li>`).join('')}</ol></li>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>${esc(l.title)}: worksheet</title><style>
body{font:15px/1.5 Georgia,serif;max-width:700px;margin:20px auto;padding:0 16px;color:#111}
h1{font-size:22px;margin:0}h2{font-size:15px;margin:16px 0 4px;text-transform:uppercase;letter-spacing:.04em}
.who{display:flex;gap:24px;margin:10px 0;font:14px sans-serif}.who span{flex:1;border-bottom:1px solid #000;padding-bottom:2px}
.ln{border-bottom:1px solid #999;height:26px}ol,ul{margin:4px 0 4px 20px}.k{font:12px sans-serif;color:#555}
@media print{body{margin:0}}</style>
<h1>${esc(l.title)}</h1><p class="k">${esc(o.grade)}${o.key ? ' · ANSWER KEY' : ''}</p>
<div class="who"><span>Name</span><span>Date</span></div>
<h2>Today you will</h2><ul>${p.goals.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
<h2>Read</h2><p>${esc(p.scripture)}</p>
${p.vocab.length ? `<h2>Words to know</h2><ol>${p.vocab.map((v) => `<li>${esc(v)}: ${'_'.repeat(34)}</li>`).join('')}</ol>` : ''}
<h2>Think and write</h2><ol>${p.questions.map((q) => `<li>${esc(q)}${lines(n)}</li>`).join('')}</ol>
${quiz ? `<h2>Check what you know</h2><ol>${quiz}</ol>` : ''}
${p.activity ? `<h2>Try it</h2><p>${esc(p.activity)}</p>${lines(2)}` : ''}
${p.remember.length ? `<h2>Remember</h2><ul>${p.remember.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
${p.mem ? `<h2>Learn by heart</h2><p>${esc(p.mem)}</p>` : ''}
${p.life ? `<h2>This week</h2><p>${esc(p.life)}</p>` : ''}
<p class="k">Catechism §${esc(l.ccc)}</p>`;
}
