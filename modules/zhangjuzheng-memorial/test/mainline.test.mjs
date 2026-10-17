import test from 'node:test';
import assert from 'node:assert/strict';
import { MAINLINE_IDS, MAINLINE_MEMORIALS } from '../mainline.mjs';
import { MEMORIALS } from '../memorials.mjs';
import { TICKET_TEXTS, getTicketText } from '../ticket-texts.mjs';
import { createGameState, applyChoice, continueAfterResult, isVictory } from '../state.mjs';
import { evaluateEnding } from '../ending-evaluation.mjs';

const fresh = () => createGameState({ totalMemorials: MAINLINE_MEMORIALS.length });
function play(path) {
  return [...path].reduce((state, choice, index) => applyChoice(continueAfterResult(state), MAINLINE_MEMORIALS[index].choices[Number(choice) - 1].delta), fresh());
}
function completed(values, totalMemorials = 7) {
  return createGameState({ totalMemorials, memorialIndex: totalMemorials, phase: 'won', resources: Object.fromEntries(['treasury', 'people', 'defense'].map((key, index) => [key, values[index]])) });
}

test('seven unique mainline IDs resolve to original objects; all ten records and thirty drafts remain', () => {
  assert.deepEqual(MAINLINE_IDS, ['assessment-law', 'land-survey', 'single-whip', 'relief', 'jilong', 'mourning', 'legacy']);
  assert.equal(new Set(MAINLINE_IDS).size, 7);
  assert.equal(MEMORIALS.length, 10);
  assert.equal(Object.values(TICKET_TEXTS).flat().length, 30);
  let count = 0;
  MAINLINE_MEMORIALS.forEach((memorial, index) => {
    assert.equal(memorial, MEMORIALS.find(item => item.id === MAINLINE_IDS[index]));
    assert.equal(memorial.choices.length, 3);
    memorial.choices.forEach((choice, index) => {
      assert.equal(getTicketText(memorial.id, index), TICKET_TEXTS[memorial.id][index]);
      assert.ok(getTicketText(memorial.id, index)); count++;
    });
  });
  assert.equal(count, 21);
});

test('all 2187 mainline paths finish with exclusive approved evaluations and unchanged resources', () => {
  const counts = { good: 0, strength: 0, people: 0, difficult: 0 };
  let paths = 0;
  function walk(state) {
    if (state.memorialIndex === 7) {
      assert.equal(state.phase, 'won');
      const before = JSON.stringify(state), evaluation = evaluateEnding(state);
      assert.ok(evaluation); counts[evaluation.id]++; paths++;
      const { treasury: t, people: p, defense: d } = state.resources;
      const m = Math.min(t, p, d), s = t + p + d;
      const difficult = m < 40 || s < 175;
      const good = !difficult && m >= 55 && s >= 185;
      const people = !difficult && !good && 2 * p >= t + d;
      const strength = !difficult && !good && !people;
      assert.equal([difficult, good, people, strength].filter(Boolean).length, 1);
      assert.equal(evaluation.id, difficult ? 'difficult' : good ? 'good' : people ? 'people' : 'strength');
      assert.equal(JSON.stringify(state), before);
      assert.ok(evaluation.copy.startsWith('七折既毕'));
      return;
    }
    assert.notEqual(state.phase, 'failed');
    assert.equal(isVictory(state), false);
    assert.equal(evaluateEnding(state), null);
    for (const choice of MAINLINE_MEMORIALS[state.memorialIndex].choices) walk(applyChoice(continueAfterResult(state), choice.delta));
  }
  walk(fresh());
  assert.equal(paths, 2187);
  assert.deepEqual(counts, { good: 548, strength: 570, people: 650, difficult: 419 });
});

test('six decisions cannot finish; seven finish; restart clears previous state', () => {
  const six = play('222222');
  assert.equal(six.phase, 'result'); assert.equal(evaluateEnding(six), null);
  const seven = play('2222222');
  assert.equal(seven.phase, 'won');
  assert.deepEqual(seven.resources, { treasury: 66, people: 76, defense: 60 });
  assert.equal(evaluateEnding(seven).id, 'good');
  const reset = fresh();
  assert.equal(reset.totalMemorials, 7); assert.equal(reset.memorialIndex, 0);
  assert.equal(reset.lastChoice, null); assert.equal(reset.lastDelta, null);
  assert.equal(evaluateEnding(reset), null);
  assert.deepEqual(reset.resources, { treasury: 60, people: 60, defense: 55 });
});

test('seven-round boundaries and explicit length select the right evaluation profile', () => {
  for (const [values, id] of [
    [[39, 80, 80], 'difficult'], [[40, 67, 67], 'difficult'],
    [[40, 67, 68], 'people'], [[54, 65, 66], 'people'],
    [[55, 64, 65], 'people'], [[55, 65, 65], 'good'],
    [[60, 60, 60], 'people'], [[61, 59, 60], 'strength']
  ]) assert.equal(evaluateEnding(completed(values)).id, id, values.join('/'));
  assert.equal(evaluateEnding(completed([55, 65, 65], 10)).id, 'people');
  assert.equal(evaluateEnding(completed([40, 67, 68], 10)).id, 'difficult');
  for (const total of [1, 6, 8, 9, 11]) assert.equal(evaluateEnding(completed([60, 60, 60], total)), null);
  assert.equal(evaluateEnding({ ...completed([60, 60, 60]), totalMemorials: '7' }), null);
  assert.equal(evaluateEnding({ ...completed([60, 60, 60]), phase: 'failed' }), null);
  for (const totalMemorials of [0, -1, 2.5, '7']) assert.throws(() => createGameState({ totalMemorials }), RangeError);
});
