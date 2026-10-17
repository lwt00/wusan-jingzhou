import test from 'node:test';
import assert from 'node:assert/strict';
import { writingFrame, WRITING_DURATION } from '../brush-writing.mjs';
import { getTicketText } from '../ticket-texts.mjs';
import { MEMORIALS } from '../memorials.mjs';
test('every existing choice has a concise, distinct original draft', () => {
  let count = 0;
  for (const memorial of MEMORIALS) {
    const texts = memorial.choices.map((_, index) => getTicketText(memorial.id, index));
    assert.equal(new Set(texts).size, 3, memorial.id);
    assert.ok(texts.every(text => typeof text === 'string' && text.startsWith('拟：') && [...text].length <= 30), memorial.id);
    assert.equal(getTicketText(memorial.id, 3), null);
    count += texts.length;
  }
  assert.equal(count, 30);
  assert.equal(getTicketText('unknown', 0), null);
});
test('ink waits for pen approach and finishes before pen withdrawal', () => {
  assert.equal(writingFrame(399).ink, 0);
  assert.equal(writingFrame(700).ink, .5);
  assert.equal(writingFrame(1000).ink, 1);
  assert.equal(writingFrame(1000).leave, 0);
  assert.equal(writingFrame(WRITING_DURATION).leave, 1);
  assert.equal(writingFrame(WRITING_DURATION).done, true);
  assert.equal(writingFrame(1299).done, false);
});

test('skip, cancellation and reduced motion cannot settle a draft twice', async () => {
  const { startBrushWriting } = await import('../brush-writing.mjs');
  const saved = Object.fromEntries(['document', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'].map(key => [key, globalThis[key]]));
  let next = 0, clock = 0;
  const queued = new Map();
  function element() {
    return { style: { setProperty() {} }, children: [], dataset: {}, clientWidth: 500,
      replaceChildren() { this.children = []; }, append(child) { this.children.push(child); },
      setAttribute() {}, removeAttribute() {},
      getBoundingClientRect() { return { left: 0, top: 0, right: 200, width: 200, height: 40 }; }
    };
  }
  try {
    globalThis.document = { createElement: name => name === 'canvas' ? { getContext: () => ({ measureText: text => ({ width: text.length * 20 }) }) } : element() };
    globalThis.getComputedStyle = () => ({ fontWeight: '400', fontSize: '22px', fontFamily: 'serif' });
    globalThis.performance = { now: () => clock };
    globalThis.requestAnimationFrame = callback => {
      const id = ++next;
      queued.set(id, time => { queued.delete(id); callback(time); });
      return id;
    };
    globalThis.cancelAnimationFrame = id => queued.delete(id);
    function fixture(reduced) {
      const area = element();
      const parts = Object.fromEntries(['.draft-ink', '.writing-brush-actor', '.draft-writing-stage', '.writing-controls'].map(key => [key, element()]));
      area.querySelector = key => parts[key];
      let settled = 0;
      const run = startBrushWriting({ area, text: '拟：先择要害衙门试行，再议推广。', reduced, onComplete: () => settled++ });
      return { area, parts, run, count: () => settled };
    }
    const skipped = fixture(false);
    skipped.run.skip(); skipped.run.skip(); skipped.run.cancel();
    assert.equal(skipped.count(), 1);
    const cancelled = fixture(false);
    const stale = [...queued.values()][0];
    cancelled.run.cancel(); cancelled.run.skip(); stale?.(performance.now() + 1400);
    assert.equal(cancelled.count(), 0);
    const paused = fixture(false);
    const pausedTick = [...queued.values()][0];
    clock = 500; pausedTick(500);
    const mask = paused.parts['.draft-ink'].children[0].children[0].style.clipPath;
    paused.run.pause();
    clock = 2500; pausedTick(2500);
    assert.equal(paused.parts['.draft-ink'].children[0].children[0].style.clipPath, mask);
    assert.equal(paused.count(), 0);
    paused.run.resume();
    const resumed = [...queued.values()][0];
    clock = 2700; resumed(2700);
    assert.equal(paused.parts['.draft-ink'].children[0].children[0].style.clipPath, 'inset(0 50% 0 0)');
    paused.run.skip(); paused.run.resume();
    assert.equal(paused.count(), 1);
    const reduced = fixture(true);
    assert.equal(reduced.count(), 0);
    const callback = [...queued.values()][0];
    callback(); reduced.run.skip();
    assert.equal(reduced.count(), 1);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  }
});
