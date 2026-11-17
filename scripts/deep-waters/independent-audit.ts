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
const authored = DEEP_WATERS.filter((prompt) => prompt.id.startsWith('authored-') || prompt.id.startsWith('batch2-'));
const secondBatch = authored.filter((prompt) => prompt.id.startsWith('batch2-'));
assert.equal(authored.length, 50, 'hand-authored prompt count');
assert.equal(secondBatch.length, 25, 'second hand-authored batch count');
assert.ok(new Set(authored.map((prompt) => prompt.theme)).size >= 20, 'hand-authored bank must span distinct themes');
const authoredNormalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim();
for (const prompt of authored) {
  assert.ok(prompt.answerMode === 'open' || prompt.answerMode === 'closed', `authored prompt must declare open/closed mode: ${prompt.id}`);
  assert.ok(prompt.source?.startsWith('Hand-authored'), `missing authored provenance: ${prompt.id}`);
  assert.ok(prompt.context.trim().length > 20, `insufficient scope context: ${prompt.id}`);
  assert.ok(prompt.prompt.trim().split(/\s+/).length <= 20, `player prompt exceeds 20 words: ${prompt.id}`);
  assert.equal((prompt.prompt.match(/[.!?](?:\s|$)/g) ?? []).length, 1, `player prompt must be one sentence: ${prompt.id}`);
  assert.ok((prompt.context.match(/[.!?](?:\s|$)/g) ?? []).length <= 1, `context must be one sentence: ${prompt.id}`);
  assert.ok(!/\b(above|below)\b/i.test(`${prompt.prompt} ${prompt.context} ${prompt.hint}`), `forbidden player-facing wording: ${prompt.id}`);
  assert.equal(prompt.commonGuesses?.length, 10, `ten likely guesses required: ${prompt.id}`);
  const accepted = new Map<string, string>();
  for (const answer of prompt.answers) {
    assert.ok(answer.answer.trim().split(/\s+/).length <= 4, `answer exceeds four words: ${prompt.id}: ${answer.answer}`);
    assert.ok(answer.source?.trim(), `missing per-answer source: ${prompt.id}: ${answer.answer}`);
    assert.ok([1, 2, 3, 4, 5, 6].includes(answer.tier), `invalid rarity tier: ${prompt.id}: ${answer.answer}`);
    for (const value of [answer.answer, ...(answer.aliases ?? [])]) {
      const key = authoredNormalize(value);
      assert.ok(!accepted.has(key) || accepted.get(key) === answer.answer, `answer/alias collision in ${prompt.id}: ${value}`);
      accepted.set(key, answer.answer);
    }
  }
  for (const guess of prompt.commonGuesses ?? []) {
    const match = prompt.answers.find((answer) => [answer.answer, ...(answer.aliases ?? [])].some((value) => authoredNormalize(value) === authoredNormalize(guess.guess)));
    if (guess.accept) {
      assert.ok(match, `accepted common guess is missing from key: ${prompt.id}: ${guess.guess}`);
      assert.equal(match?.answer, guess.answer, `accepted common guess maps incorrectly: ${prompt.id}: ${guess.guess}`);
    } else {
      assert.ok(guess.reason?.trim(), `rejected guess needs a reason: ${prompt.id}: ${guess.guess}`);
      assert.equal(match, undefined, `rejected guess is actually in the answer key: ${prompt.id}: ${guess.guess}`);
    }
  }
  if (prompt.answerMode === 'closed') {
    assert.match(prompt.context, new RegExp(`count: ${prompt.answers.length}\\.`, 'i'), `closed set count mismatch: ${prompt.id}`);
    assert.match(prompt.source ?? '', /authorit(?:y|ies):|sources?:/i, `closed set must name an authority: ${prompt.id}`);
    if (prompt.answers.length >= 20) assert.equal(new Set(prompt.answers.map((answer) => answer.tier)).size, 6, `closed set with twenty or more answers must use all six tiers: ${prompt.id}`);
  } else {
    assert.ok(prompt.answers.length >= 60, `open prompt needs at least 60 answers: ${prompt.id}`);
    const counts = [1, 2, 3, 4, 5, 6].map((tier) => prompt.answers.filter((answer) => answer.tier === tier).length);
    assert.ok(counts.every((count) => count > 0), `open prompt must use all six tiers: ${prompt.id}`);
    const target = [0.08, 0.12, 0.20, 0.25, 0.25, 0.10];
    counts.forEach((count, index) => assert.ok(Math.abs(count / prompt.answers.length - target[index]) <= 0.08, `tier distribution outside tolerance: ${prompt.id}, tier ${index + 1}`));
  }
}
for (let i = 0; i < authored.length; i++) {
  for (let j = i + 1; j < authored.length; j++) {
    const a = new Set(authored[i].answers.flatMap((answer) => [answer.answer, ...(answer.aliases ?? [])].map(authoredNormalize)));
    const b = new Set(authored[j].answers.flatMap((answer) => [answer.answer, ...(answer.aliases ?? [])].map(authoredNormalize)));
    const overlap = [...a].filter((value) => b.has(value)).length / Math.min(a.size, b.size);
    assert.ok(overlap <= 0.2, `authored prompts overlap more than 20%: ${authored[i].id} / ${authored[j].id}`);
  }
}

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
