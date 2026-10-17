import { evaluateEnding } from './ending-evaluation.mjs';
export const CHANNEL = 'wusan:minigame';
export const VERSION = 1;
export const GAME_ID = 'zhangjuzheng-memorial';
export const LEVEL_ID = 'zhangjuzheng';
export const token = value => typeof value === 'string' && value.length > 0 && value.length <= 128;
export function message(type, sessionId, messageId, payload = {}, runId) {
  return { channel: CHANNEL, version: VERSION, gameId: GAME_ID, levelId: LEVEL_ID, sessionId, messageId, type, payload, ...(runId ? { runId } : {}) };
}
export function validMessage(data) {
  return data && typeof data === 'object' && data.channel === CHANNEL && data.version === VERSION && data.gameId === GAME_ID && data.levelId === LEVEL_ID && token(data.sessionId) && token(data.messageId) && ['GAME_INIT', 'GAME_READY', 'GAME_COMPLETE', 'GAME_EXIT', 'GAME_ACK'].includes(data.type) && data.payload && typeof data.payload === 'object' && !Array.isArray(data.payload);
}
export function validCompletion(payload) {
  if (payload?.completed !== true || payload.completedCount !== 7 || payload.totalMemorials !== 7) return false;
  const r = payload.resources;
  if (!r || !['treasury', 'people', 'defense'].every(key => Number.isInteger(r[key]) && r[key] > 0 && r[key] <= 100)) return false;
  const evaluation = evaluateEnding({ phase: 'won', memorialIndex: 7, totalMemorials: 7, resources: r });
  return !!evaluation && evaluation.id === payload.evaluationId;
}

// Pure per-document host state; mount/dispose own the actual iframe and transport.
export function createHostSession(sessionId) {
  let runId = null, generation = -1, completion = null, closed = false;
  const retired = new Set(), seen = new Map();
  return {
    get runId() { return runId; },
    get closed() { return closed; },
    receive(data) {
      if (closed || !validMessage(data) || data.sessionId !== sessionId || !token(data.runId)) return { accepted: false };
      if (retired.has(data.runId)) return { accepted: false };
      const signature = JSON.stringify(data);
      if (seen.has(data.messageId)) return { accepted: seen.get(data.messageId) === signature, duplicate: true };
      if (data.type === 'GAME_READY') {
        const next = data.payload.runGeneration;
        if (!Number.isSafeInteger(next) || next < 0 || retired.has(data.runId)) return { accepted: false };
        if (runId === data.runId ? next !== generation : next <= generation) return { accepted: false };
        if (runId !== data.runId) { if (runId) retired.add(runId); runId = data.runId; generation = next; completion = null; }
      } else {
        if (data.runId !== runId || retired.has(data.runId)) return { accepted: false };
        if (data.type === 'GAME_COMPLETE') {
          if (!validCompletion(data.payload)) return { accepted: false };
          if (completion && JSON.stringify(completion.payload) !== JSON.stringify(data.payload)) return { accepted: false };
          completion ??= { messageId: data.messageId, payload: data.payload };
        } else if (data.type === 'GAME_EXIT') {
          if (data.payload.outcome === 'completed') {
            if (!completion || data.payload.completionMessageId !== completion.messageId) return { accepted: false };
          } else if (data.payload.outcome !== 'cancelled' || completion) return { accepted: false };
          seen.set(data.messageId, signature);
          closed = true;
          return { accepted: true, outcome: data.payload.outcome };
        } else return { accepted: false };
      }
      if (seen.size >= 500) return { accepted: false };
      seen.set(data.messageId, signature);
      return { accepted: true };
    },
    dispose() { closed = true; seen.clear(); retired.clear(); completion = null; }
  };
}
