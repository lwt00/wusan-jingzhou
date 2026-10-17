export const WRITING_DURATION = 1300;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => value * value * (3 - 2 * value);
export function writingFrame(elapsed) {
  return {
    enter: smooth(clamp(elapsed / 400)),
    ink: clamp((elapsed - 400) / 600),
    leave: smooth(clamp((elapsed - 1000) / 300)),
    done: elapsed >= WRITING_DURATION
  };
}

export function startBrushWriting({ area, text, reduced, onComplete }) {
  const ink = area.querySelector('.draft-ink');
  const brush = area.querySelector('.writing-brush-actor');
  const stage = area.querySelector('.draft-writing-stage');
  const controls = area.querySelector('.writing-controls');
  ink.replaceChildren();
  // Measure the same HTML font; reveal whole strokes through continuous masks, not typed characters.
  const style = getComputedStyle(ink);
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const maxWidth = Math.max(100, ink.clientWidth);
  const strings = [];
  let line = '';
  for (const char of text) {
    if (line && measure.measureText(line + char).width > maxWidth) { strings.push(line); line = ''; }
    line += char;
  }
  if (line) strings.push(line);
  const lines = strings.map(content => {
    const row = document.createElement('div');
    row.className = 'draft-line';
    const span = document.createElement('span');
    span.textContent = content;
    row.append(span); ink.append(row);
    return span;
  });
  ink.setAttribute('aria-label', text);
  lines.forEach(line => line.style.clipPath = 'inset(0 100% 0 0)');
  controls.hidden = reduced;
  area.dataset.writing = 'true';
  area.setAttribute('aria-busy', 'true');
  let frameId = 0, stopped = false;
  const clockStart = performance.now();
  let pausedAt = null, pausedMs = 0;
  const weights = strings.map(value => value.length);
  const total = weights.reduce((a, b) => a + b, 0);
  function paint(frame) {
    const travelMs = 60;
    const writeBudget = 600 - travelMs * (lines.length - 1);
    let remaining = frame.ink * 600;
    let active = 0, local = 0, travel = null;
    lines.forEach((line, index) => {
      const duration = writeBudget * weights[index] / total;
      const part = clamp(remaining / duration);
      line.style.clipPath = `inset(0 ${(1 - part) * 100}% 0 0)`;
      if (remaining >= 0) { active = index; local = part; }
      remaining -= duration;
      if (index < lines.length - 1) {
        if (remaining >= 0 && remaining < travelMs) travel = { index, progress: smooth(remaining / travelMs) };
        remaining -= travelMs;
      }
    });
    const rect = lines[active].getBoundingClientRect();
    const origin = stage.getBoundingClientRect();
    let x = rect.left - origin.left + rect.width * local;
    let y = rect.top - origin.top + rect.height * .76;
    if (travel) {
      const from = lines[travel.index].getBoundingClientRect();
      const to = lines[travel.index + 1].getBoundingClientRect();
      x = from.right - origin.left + (to.left - from.right) * travel.progress;
      y = from.top - origin.top + from.height * .76 + (to.top - from.top) * travel.progress - Math.sin(travel.progress * Math.PI) * 12;
    }
    const entering = 1 - frame.enter;
    brush.style.left = `${x + entering * 65 + frame.leave * 45}px`;
    brush.style.top = `${y - entering * 40 - frame.leave * 55 + Math.sin(frame.ink * Math.PI * 12) * 1.6}px`;
    brush.style.opacity = String(frame.enter * (1 - frame.leave));
    brush.style.setProperty('--brush-tilt', `${155 + Math.sin(frame.ink * Math.PI * 6) * 3}deg`);
  }
  function cleanup() {
    cancelAnimationFrame(frameId);
    brush.style.opacity = '0';
    controls.hidden = true;
    delete area.dataset.writing;
    area.removeAttribute('aria-busy');
  }
  function finish() {
    if (stopped) return;
    stopped = true;
    area.dataset.durationMs = String(Math.round(performance.now() - clockStart - pausedMs - (pausedAt == null ? 0 : performance.now() - pausedAt)));
    paint(writingFrame(WRITING_DURATION));
    cleanup();
    area.dataset.written = 'true';
    onComplete();
  }
  function tick(time) {
    if (stopped || pausedAt != null) return;
    const frame = writingFrame(time - clockStart - pausedMs);
    paint(frame);
    if (frame.done) finish(); else frameId = requestAnimationFrame(tick);
  }
  // Reduced motion still completes asynchronously so the caller owns the cancellation handle first.
  frameId = requestAnimationFrame(reduced ? finish : tick);
  return {
    skip: finish,
    pause() {
      if (stopped || pausedAt != null) return;
      pausedAt = performance.now();
      cancelAnimationFrame(frameId);
    },
    resume() {
      if (stopped || pausedAt == null) return;
      pausedMs += performance.now() - pausedAt;
      pausedAt = null;
      frameId = requestAnimationFrame(reduced ? finish : tick);
    },
    cancel() {
      if (stopped) return;
      stopped = true;
      cleanup();
      ink.replaceChildren();
      ink.removeAttribute('aria-label');
      delete area.dataset.written;
    }
  };
}
