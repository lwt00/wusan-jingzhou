import { evaluateEnding } from './ending-evaluation.mjs';

// Internal lifecycle only: no transport, rewards or persistent storage.
export function createSessionFlow(mode = 'standalone') {
  if (!['standalone', 'embedded'].includes(mode)) throw new TypeError('未知运行方式');
  let phase = 'idle', completion = null, exitResult = null;
  return Object.freeze({
    get mode() { return mode; },
    get phase() { return phase; },
    get completion() { return completion; },
    start() { phase = 'playing'; completion = null; exitResult = null; },
    complete(state) {
      if (completion) return completion;
      if (phase !== 'playing') return null;
      const evaluation = evaluateEnding(state);
      if (!evaluation) return null;
      completion = Object.freeze({ evaluation, resources: Object.freeze({ ...state.resources }), totalMemorials: state.totalMemorials });
      phase = 'completed';
      return completion;
    },
    exit() {
      if (!exitResult) {
        exitResult = Object.freeze({ mode, outcome: completion ? 'completed' : 'cancelled', completion });
        phase = 'exited';
      }
      return exitResult;
    },
    reset() { phase = 'idle'; completion = null; exitResult = null; }
  });
}
