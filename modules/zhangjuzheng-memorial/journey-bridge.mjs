import { message, validMessage, validCompletion, token } from './journey-protocol.mjs';
export function createJourneyBridge({ window: win = window, onStatus = () => {} } = {}) {
  const query = new URLSearchParams(win.location.search);
  const bootstrap = query.get('bootstrap');
  const enabled = win.parent !== win && query.get('embed') === '1' && token(bootstrap) && /^https?:$/.test(win.location.protocol);
  if (!enabled) return Object.freeze({ enabled: false, get ready() { return false; }, newRun() {}, complete() {}, exit() {}, retry() {}, dispose() {} });
  const origin = win.location.origin, parent = win.parent;
  let sessionId = null, runId = win.crypto.randomUUID(), generation = 0, ready = false, disposed = false;
  let readyMessage = null, completeMessage = null, completion = null, completeAck = false, exitOutcome = null, exitMessage = null;
  const pending = new Map();
  function clearPending() { for (const item of pending.values()) win.clearInterval(item.timer); pending.clear(); }
  function send(data) {
    const item = { data, attempts: 0, timer: null };
    const attempt = () => {
      if (disposed) return;
      if (item.attempts >= 5) { win.clearInterval(item.timer); onStatus('连接暂未确认，请重试连接或使用外层返回入口。', true); return; }
      item.attempts++; parent.postMessage(data, origin);
    };
    pending.set(data.messageId, item);
    item.timer = win.setInterval(attempt, 800); attempt();
  }
  function envelope(type, payload) { return message(type, sessionId, win.crypto.randomUUID(), payload, runId); }
  function flush() {
    if (!ready || disposed) return;
    if (completion && !completeMessage) { completeMessage = envelope('GAME_COMPLETE', completion); send(completeMessage); }
    if (exitOutcome && !exitMessage && (exitOutcome === 'cancelled' || completeAck)) {
      exitMessage = envelope('GAME_EXIT', { outcome: exitOutcome, ...(completeMessage ? { completionMessageId: completeMessage.messageId } : {}) });
      send(exitMessage);
    }
  }
  function announce() { ready = false; readyMessage = envelope('GAME_READY', { runGeneration: generation }); send(readyMessage); }
  function receive(event) {
    if (disposed || event.source !== parent || event.origin !== origin || !validMessage(event.data)) return;
    const data = event.data;
    if (data.type === 'GAME_INIT') {
      if (data.payload.bootstrap !== bootstrap || (sessionId && sessionId !== data.sessionId)) return;
      if (!sessionId) { sessionId = data.sessionId; announce(); }
      else if (readyMessage) parent.postMessage(readyMessage, origin);
      return;
    }
    if (data.type !== 'GAME_ACK' || data.sessionId !== sessionId || data.runId !== runId) return;
    const item = pending.get(data.payload.ackMessageId);
    if (!item) return;
    win.clearInterval(item.timer); pending.delete(item.data.messageId);
    if (data.payload.accepted !== true) { ready = false; onStatus('本局连接已失效，请使用外层返回入口重新进入。', true); return; }
    if (item.data.type === 'GAME_READY') ready = true;
    if (item.data.type === 'GAME_COMPLETE') completeAck = true;
    onStatus('', false); flush();
  }
  function dispose() { if (disposed) return; disposed = true; clearPending(); win.removeEventListener('message', receive); win.removeEventListener('pagehide', dispose); }
  win.addEventListener('message', receive); win.addEventListener('pagehide', dispose);
  return Object.freeze({
    enabled: true,
    get ready() { return ready; },
    newRun() {
      if (disposed) return;
      clearPending(); runId = win.crypto.randomUUID(); generation++; ready = false;
      readyMessage = null; completeMessage = null; completion = null; completeAck = false; exitOutcome = null; exitMessage = null;
      if (sessionId) announce();
    },
    complete(snapshot) {
      if (disposed || completion || exitOutcome || !snapshot) return;
      const data = { completed: true, completedCount: snapshot.totalMemorials, totalMemorials: snapshot.totalMemorials, resources: { ...snapshot.resources }, evaluationId: snapshot.evaluation.id };
      if (!validCompletion(data)) return;
      completion = data; flush();
    },
    exit(result) {
      if (disposed || exitOutcome) return;
      if (result.outcome === 'completed') this.complete(result.completion);
      exitOutcome = completion ? 'completed' : 'cancelled';
      onStatus('正在返回主游戏…', false); flush();
    },
    retry() {
      if (disposed) return;
      const messages = [...pending.values()].map(item => item.data); clearPending();
      for (const data of messages) send(data);
      if (sessionId && messages.length === 0) win.location.reload();
      if (!sessionId) onStatus('尚未连接主游戏，请使用外层重试加载或返回入口。', true);
    },
    dispose
  });
}
