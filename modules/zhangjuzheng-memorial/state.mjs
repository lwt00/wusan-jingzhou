export const INITIAL_RESOURCES = Object.freeze({
  treasury: 60,
  people: 60,
  defense: 55
});

export const TOTAL_MEMORIALS = 10;

const RESOURCE_KEYS = ['treasury', 'people', 'defense'];

export function createGameState(overrides = {}) {
  if (overrides.totalMemorials !== undefined && (!Number.isInteger(overrides.totalMemorials) || overrides.totalMemorials <= 0)) {
    throw new RangeError('本局题目总数必须为正整数');
  }
  const resources = { ...INITIAL_RESOURCES, ...(overrides.resources || {}) };
  return {
    resources: clampResources(resources),
    memorialIndex: Number.isInteger(overrides.memorialIndex) ? overrides.memorialIndex : 0,
    totalMemorials: overrides.totalMemorials ?? TOTAL_MEMORIALS,
    phase: overrides.phase || 'choosing',
    lastDelta: null,
    lastChoice: null
  };
}

export function applyChoice(state, delta, choice = null) {
  const resources = clampResources(RESOURCE_KEYS.reduce((next, key) => {
    next[key] = state.resources[key] + (Number(delta?.[key]) || 0);
    return next;
  }, {}));
  const memorialIndex = Math.min(state.memorialIndex + 1, state.totalMemorials);
  const next = {
    ...state,
    resources,
    memorialIndex,
    lastDelta: RESOURCE_KEYS.reduce((result, key) => {
      result[key] = resources[key] - state.resources[key];
      return result;
    }, {}),
    lastChoice: choice
  };
  next.phase = isCollapsed(next) ? 'failed' : isVictory(next) ? 'won' : 'result';
  return next;
}

export function isCollapsed(state) {
  return RESOURCE_KEYS.some(key => state.resources[key] <= 0);
}

export function isVictory(state) {
  return state.memorialIndex >= state.totalMemorials && !isCollapsed(state);
}

export function continueAfterResult(state) {
  if (state.phase !== 'result') return state;
  return { ...state, phase: 'choosing' };
}

function clampResources(resources) {
  return RESOURCE_KEYS.reduce((next, key) => {
    next[key] = Math.max(0, Math.min(100, Number(resources[key]) || 0));
    return next;
  }, {});
}
