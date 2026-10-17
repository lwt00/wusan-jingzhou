import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateEnding, ENDING_NOTICE } from '../ending-evaluation.mjs';
import { createGameState, applyChoice, TOTAL_MEMORIALS } from '../state.mjs';
import { MEMORIALS } from '../memorials.mjs';
function completed(t, p, d) {
  return createGameState({ memorialIndex: TOTAL_MEMORIALS, phase: 'won', resources: { treasury: t, people: p, defense: d } });
}
function play(path) {
  let state = createGameState();
  for (let i = 0; i < path.length; i++) state = applyChoice(state, MEMORIALS[i].choices[Number(path[i]) - 1].delta);
  return state;
}
test('all 59049 paths receive exactly one evaluation with approved counts', () => {
  const counts = { good: 0, strength: 0, people: 0, difficult: 0 };
  let visited = 0;
  function walk(state) {
    if (state.memorialIndex === 10) {
      const before = JSON.stringify(state);
      const result = evaluateEnding(state);
      assert.ok(result && Object.hasOwn(counts, result.id));
      assert.ok(result.copy && result.name && result.reason);
      const { treasury: t, people: p, defense: d } = state.resources;
      const m = Math.min(t, p, d), sum = t + p + d;
      const weak = m < 40 || sum < 180, good = !weak && m >= 55 && sum >= 195;
      const people = !weak && !good && 2 * p >= t + d;
      assert.equal([weak, good, people, !weak && !good && !people].filter(Boolean).length, 1);
      assert.equal(JSON.stringify(state), before);
      counts[result.id]++; visited++; return;
    }
    for (const choice of MEMORIALS[state.memorialIndex].choices) walk(applyChoice(state, choice.delta));
  }
  walk(createGameState());
  assert.equal(visited, 59049);
  assert.deepEqual(counts, { good: 12900, strength: 17715, people: 13777, difficult: 14657 });
});
test('the four approved example paths preserve final resources and evaluations', () => {
  for (const [path, id, values] of [
    ['2222222222', 'good', [61, 86, 71]],
    ['1111111211', 'strength', [73, 49, 91]],
    ['2222222223', 'people', [52, 97, 65]],
    ['3333333333', 'difficult', [59, 58, 34]]
  ]) {
    const state = play(path);
    assert.deepEqual(Object.values(state.resources), values);
    assert.equal(evaluateEnding(state).id, id);
  }
});
test('strict and inclusive thresholds and priority are correct', () => {
  for (const [values, id] of [
    [[39, 100, 100], 'difficult'], [[40, 40, 99], 'difficult'],
    [[40, 40, 100], 'strength'], [[54, 73, 73], 'people'],
    [[55, 69, 70], 'people'], [[55, 70, 70], 'good'],
    [[60, 60, 60], 'people'], [[61, 59, 60], 'strength'],
    [[75, 75, 75], 'good']
  ]) assert.equal(evaluateEnding(completed(...values)).id, id, values.join('/'));
});
test('unfinished, failed and invalid states have no evaluation; restart is clean', () => {
  for (const state of [null, createGameState(), play('222222222'),
    { ...completed(60, 60, 60), phase: 'choosing' },
    { ...completed(60, 60, 60), phase: 'failed' },
    completed(0, 60, 60),
    { ...completed(60, 60, 60), resources: { treasury: NaN, people: 60, defense: 60 } },
    { ...completed(60, 60, 60), totalMemorials: 1 }
  ]) assert.equal(evaluateEnding(state), null);
  const state = completed(61, 86, 71);
  Object.freeze(state.resources); Object.freeze(state);
  assert.equal(evaluateEnding(state).name, '经世善治');
  assert.equal(evaluateEnding(createGameState()), null);
  assert.equal(ENDING_NOTICE, '本评价依据本局虚构数值生成，不代表对张居正本人或真实历史的定论。');
});
