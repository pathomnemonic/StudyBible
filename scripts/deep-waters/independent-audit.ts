import { strict as assert } from 'node:assert';
import { DEEP_WATERS } from '../../src/data/deepWaters';
import { DEEP_ROUNDS } from '../../src/lib/deepWaters';

const normalize = (value: string) => value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const generated = DEEP_WATERS.filter((prompt) => prompt.answerMode === 'single');
const curriculum = generated.filter((prompt) => prompt.source?.startsWith('Curriculum quiz bank /'));
const scripture = generated.filter((prompt) => prompt.source?.startsWith('Douay-Rheims public-domain text /'));

assert.equal(curriculum.length, 2105, 'curriculum prompt count');
assert.equal(scripture.length, 450, 'Scripture cloze prompt count');
assert.equal(generated.length, 2555, 'single-answer generated prompt count');
assert.ok(DEEP_WATERS.length >= 365 * DEEP_ROUNDS, 'bank must cover 365 complete daily dives');

const ids = DEEP_WATERS.map((prompt) => prompt.id);
assert.equal(new Set(ids).size, ids.length, 'prompt IDs must be unique');
const promptKeys = DEEP_WATERS.map((prompt) => normalize(prompt.prompt));
assert.equal(new Set(promptKeys).size, promptKeys.length, 'prompt text must be unique after normalization');

for (const prompt of generated) {
  assert.ok(prompt.source, `missing provenance: ${prompt.id}`);
  assert.ok(prompt.context.trim(), `missing context: ${prompt.id}`);
  assert.ok(prompt.hint.trim(), `missing hint: ${prompt.id}`);
  assert.equal(prompt.answers.length, 1, `single-answer prompt has multiple answers: ${prompt.id}`);
  assert.ok(prompt.answers[0].answer.trim(), `empty answer: ${prompt.id}`);
  assert.ok([1, 2, 3, 4, 5].includes(prompt.answers[0].tier), `invalid tier: ${prompt.id}`);
}
for (const prompt of scripture) {
  assert.equal((prompt.prompt.match(/_____/g) ?? []).length, 1, `verse must contain exactly one blank: ${prompt.id}`);
  assert.ok(prompt.context.startsWith('Douay-Rheims · '), `missing verse reference: ${prompt.id}`);
  assert.ok(/^[A-Za-z][A-Za-z'-]{4,11}$/.test(prompt.answers[0].answer), `verse answer must be one content word: ${prompt.id}`);
}

// Independently reproduce the published seeded shuffle and day-window selection.
// This intentionally does not call dailyDeepPrompts().
let state = (78031 * 2654435761) % 4294967296 || 1;
const random = () => {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
};
const bag = [...DEEP_WATERS];
for (let i = bag.length - 1; i > 0; i--) {
  const j = Math.floor(random() * (i + 1));
  [bag[i], bag[j]] = [bag[j], bag[i]];
}
const used = new Set<string>();
for (let day = 1; day <= 365; day++) {
  const start = ((day - 1) * DEEP_ROUNDS) % bag.length;
  const daily = Array.from({ length: DEEP_ROUNDS }, (_, index) => bag[(start + index) % bag.length]);
  assert.equal(new Set(daily.map((prompt) => prompt.id)).size, DEEP_ROUNDS, `duplicate within day ${day}`);
  for (const prompt of daily) {
    assert.ok(!used.has(prompt.id), `prompt repeated within the 365-day schedule: ${prompt.id}`);
    used.add(prompt.id);
  }
}
assert.equal(used.size, 365 * DEEP_ROUNDS, 'all 2,555 annual slots must be distinct');

console.log(`Deep Waters independent audit passed: ${DEEP_WATERS.length} total prompts; ${curriculum.length} curriculum + ${scripture.length} Scripture; ${used.size} unique prompts across 365 days; ${DEEP_WATERS.length - used.size} reserve prompts.`);
