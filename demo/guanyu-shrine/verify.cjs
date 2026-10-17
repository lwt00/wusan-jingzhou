// Run from any directory: node --test demo/guanyu-shrine/verify.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const createEngine = require('./engine.js');

test('solver produces legal moves through the exit, including from a changed board', () => {
  const engine = createEngine();
  for (const displaced of [false, true]) {
    let state = engine.initial();
    if (displaced) state = engine.move(state, 8, 'right').state;
    const solution = engine.solve(state);
    assert.ok(solution.length > 0);
    solution.forEach((action, i) => {
      const result = engine.move(state, action.index, action.direction);
      assert.ok(result, 'every step must be legal');
      assert.equal(result.won, i === solution.length - 1);
      state = result.state;
    });
  }
});

function setup() {
  let adapter, listener, frame, completes = 0, cancels = 0;
  const origin = 'http://localhost:4174';
  const window = {
    WusanLandmarkGames: { register(id, value) { assert.equal(id, 'guanyu-huarong'); adapter = value; } },
    addEventListener(type, fn) { assert.equal(type, 'message'); listener = fn; },
    removeEventListener(type, fn) { assert.equal(listener, fn); listener = null; }
  };
  const document = { baseURI: origin + '/demo/journey/journey-demo.html', createElement(tag) {
    assert.equal(tag, 'iframe');
    frame = { contentWindow: {}, remove() { this.removed = true; } };
    return frame;
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../journey/landmark-guanyu-game.js'), 'utf8'),
    { window, document, location: { origin }, crypto: { randomUUID: () => 'test-session' }, URL });
  const container = { dataset: {}, append(value) { assert.equal(value, frame); } };
  const dispose = adapter.mount({ container, levelId: 'guanyu', complete(result) {
    assert.equal(result.completed, true); assert.equal(result.levelId, 'guanyu'); completes++;
  }, cancel() { cancels++; } });
  const valid = { source: frame.contentWindow, origin, data: { channel: 'wusan-guanyu', session: 'test-session', action: 'complete' } };
  return { frame, container, dispose, valid, send: event => listener(event),
    get counts() { return [completes, cancels]; }, get listener() { return listener; } };
}

test('adapter rejects foreign, malformed and stale completion messages and rewards once', () => {
  const s = setup();
  assert.equal(new URL(s.frame.src).pathname, '/demo/guanyu-shrine/index.html');
  for (const event of [
    { ...s.valid, source: {} }, { ...s.valid, origin: 'https://other.example' },
    { ...s.valid, data: null }, { ...s.valid, data: { ...s.valid.data, session: 'old-session' } },
    { ...s.valid, data: { ...s.valid.data, channel: 'other' } }
  ]) s.send(event);
  assert.deepEqual(s.counts, [0, 0]);
  s.send(s.valid); s.send(s.valid);
  assert.deepEqual(s.counts, [1, 0]);
  const queued = s.listener;
  s.dispose(); queued(s.valid);
  assert.equal(s.listener, null);
  assert.equal(s.frame.removed, true);
  assert.equal(s.container.dataset.game, undefined);
  assert.deepEqual(s.counts, [1, 0]);
});

test('cancel never awards an imprint, even if followed by a queued win', () => {
  const s = setup();
  s.send({ ...s.valid, data: { ...s.valid.data, action: 'cancel' } });
  s.send(s.valid);
  assert.deepEqual(s.counts, [0, 1]);
  s.dispose();
});
