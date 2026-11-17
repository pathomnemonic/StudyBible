// Prints { "<question text>": "<a common answer>" } for every Deep Waters question, so the browser test can play whatever the day's seven are.
import { DEEP_WATERS } from '../../src/data/deepWaters';
const out: Record<string, string> = {};
for (const p of DEEP_WATERS) {
  const a = [...p.answers].filter((x) => x.tier <= 2).sort((x, y) => x.answer.length - y.answer.length)[0] ?? p.answers[0];
  out[p.prompt] = a.answer;
}
console.log(JSON.stringify(out));
