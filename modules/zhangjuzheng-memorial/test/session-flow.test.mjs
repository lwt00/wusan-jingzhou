import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionFlow } from '../session-flow.mjs';
import { createGameState, applyChoice, continueAfterResult } from '../state.mjs';
import { MAINLINE_MEMORIALS } from '../mainline.mjs';
function play(path) {
  return [...path].reduce((s, n, index) => applyChoice(continueAfterResult(s), MAINLINE_MEMORIALS[index].choices[Number(n) - 1].delta), createGameState({ totalMemorials: 7 }));
}
test('idle and unfinished exits are cancelled and idempotent in both modes', () => {
  for (const mode of ['standalone', 'embedded']) {
    const flow = createSessionFlow(mode);
    assert.equal(flow.mode, mode);
    assert.equal(flow.exit().outcome, 'cancelled');
    flow.start();
    assert.equal(flow.complete(play('222222')), null);
    const exit = flow.exit();
    assert.equal(exit.outcome, 'cancelled');
    assert.equal(flow.exit(), exit);
    assert.equal(flow.complete(play('2222222')), null);
    assert.equal(flow.completion, null);
  }
});
test('completed results are immutable snapshots created only once until restart', () => {
  const flow = createSessionFlow(); flow.start();
  const state = play('2222222'), before = JSON.stringify(state);
  const complete = flow.complete(state);
  assert.equal(flow.phase, 'completed');
  assert.equal(flow.complete(state), complete);
  assert.equal(JSON.stringify(state), before);
  assert.equal(flow.exit().outcome, 'completed');
  assert.equal(flow.exit().completion, complete);
  assert.ok(Object.isFrozen(complete.resources));
  state.resources.treasury = 1;
  assert.equal(complete.resources.treasury, 66);
  flow.reset();
  assert.equal(flow.phase, 'idle'); assert.equal(flow.completion, null);
  flow.start();
  assert.notEqual(flow.complete(play('2222222')), complete);
});
test('all four completed evaluations remain exploration completion', () => {
  for (const [path, id] of [['1111121', 'good'], ['1111111', 'strength'], ['1111321', 'people'], ['1111112', 'difficult']]) {
    const flow = createSessionFlow(); flow.start();
    assert.equal(flow.complete(play(path)).evaluation.id, id);
    assert.equal(flow.exit().outcome, 'completed');
  }
});
