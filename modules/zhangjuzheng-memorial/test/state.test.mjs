import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_RESOURCES,
  TOTAL_MEMORIALS,
  createGameState,
  applyChoice,
  isCollapsed,
  isVictory
} from '../state.mjs';

test('creates a fresh ten memorial game with the expected starting resources', () => {
  const state = createGameState();

  assert.deepEqual(state.resources, INITIAL_RESOURCES);
  assert.equal(state.memorialIndex, 0);
  assert.equal(state.totalMemorials, TOTAL_MEMORIALS);
  assert.equal(state.phase, 'choosing');
});

test('applies a choice and keeps resource values within the 0 to 100 range', () => {
  const state = createGameState();
  const next = applyChoice(state, {
    treasury: 8,
    people: -6,
    defense: 0
  });

  assert.deepEqual(next.resources, { treasury: 68, people: 54, defense: 55 });
  assert.equal(next.memorialIndex, 1);
  assert.equal(next.phase, 'result');
});

test('marks a run collapsed when any resource reaches zero', () => {
  const state = createGameState({ resources: { treasury: 4, people: 30, defense: 30 } });
  const next = applyChoice(state, { treasury: -8, people: 0, defense: 0 });

  assert.equal(isCollapsed(next), true);
  assert.equal(isVictory(next), false);
  assert.equal(next.phase, 'failed');
});

test('wins only after all ten memorials and no resource has collapsed', () => {
  const state = createGameState({ memorialIndex: TOTAL_MEMORIALS - 1 });
  const next = applyChoice(state, { treasury: 0, people: 0, defense: 0 });

  assert.equal(isCollapsed(next), false);
  assert.equal(isVictory(next), true);
  assert.equal(next.phase, 'won');
});
