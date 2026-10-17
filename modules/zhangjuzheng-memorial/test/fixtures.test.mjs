import test from 'node:test';
import assert from 'node:assert/strict';
import { MEMORIALS } from '../memorials.mjs';

test('provides ten playable memorials with two or three choices each', () => {
  assert.equal(MEMORIALS.length, 10);
  for (const memorial of MEMORIALS) {
    assert.ok(memorial.title);
    assert.ok(memorial.context);
    assert.ok(memorial.scene);
    assert.ok(memorial.era);
    assert.ok(memorial.choices.length >= 2 && memorial.choices.length <= 3);
    for (const choice of memorial.choices) {
      assert.ok(choice.label);
      assert.ok(choice.note);
      for (const key of ['treasury', 'people', 'defense']) assert.equal(typeof choice.delta[key], 'number');
    }
  }
});
