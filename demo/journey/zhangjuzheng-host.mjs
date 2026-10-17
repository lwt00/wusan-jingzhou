import { createHostSession, message, validMessage, LEVEL_ID } from '../../modules/zhangjuzheng-memorial/journey-protocol.mjs';
import { waitForZhangIntro } from './zhang-entry-ready.mjs';
export function mountZhangGame({ container, levelId, complete, cancel, prepareIntro = waitForZhangIntro }) {
  if (levelId !== LEVEL_ID) throw new Error('张居正关卡不匹配');
  const origin = location.origin;
  if (!/^https?:$/.test(location.protocol)) throw new Error('请通过本地HTTP服务打开');
  // Local diagnostics only: reveal timestamps are DOM/transition signals, not GPU paint times.
  const timings = { click: Number(container.dataset.entryClick) || performance.now() };
  const stamp = name => { timings[name] = performance.now() - timings.click; container.dataset.entryTimings = JSON.stringify(timings); };
  let observer;
  if (globalThis.PerformanceObserver?.supportedEntryTypes?.includes('longtask')) {
    observer = new PerformanceObserver(list => {
      const entries = list.getEntries().filter(entry => entry.startTime >= timings.click);
      timings.longTaskCount = (timings.longTaskCount || 0) + entries.length;
      timings.longTaskMs = (timings.longTaskMs || 0) + entries.reduce((sum, entry) => sum + entry.duration, 0);
      container.dataset.entryTimings = JSON.stringify(timings);
    });
    observer.observe({ type: 'longtask', buffered: true });
  }
  const bootstrap = crypto.randomUUID();
  const frame = document.createElement('iframe'); stamp('iframeCreated');
  frame.title = '张居正故居 · 案前票拟';
  frame.className = 'zhangjuzheng-game-frame';
  const url = new URL('../../modules/zhangjuzheng-memorial/index.html', document.baseURI);
  url.searchParams.set('embed', '1'); url.searchParams.set('bootstrap', bootstrap);
  const previousLayout = container.dataset.game;
  container.dataset.game = 'zhangjuzheng-memorial';
  const scene = container.closest?.('#landmark-scene');
  const notice = document.createElement('div'); notice.className = 'zhang-connection'; notice.setAttribute('role', 'status');
  const text = document.createElement('p');
  const retry = document.createElement('button'); retry.textContent = '重试加载';
  const back = document.createElement('button'); back.textContent = '返回地标';
  notice.append(text, retry, back);
  let disposed = false, finished = false, failed = false, session = null, sessionId = '', init = null, ready = false;
  let initTimer, timeout, transitionTimer, returnTimer, controller, attempt = 0, preparing = false;
  function entry(state) { container.dataset.entry = state; if (scene) scene.dataset.zhangEntry = state; }
  function clearTimers() { clearInterval(initTimer); clearTimeout(timeout); clearTimeout(transitionTimer); clearTimeout(returnTimer); }
  function post(data) { if (!disposed) frame.contentWindow?.postMessage(data, origin); }
  function invalidate() {
    attempt++; controller?.abort(); controller = null; preparing = false;
    session?.dispose(); session = null; ready = false; clearTimers();
  }
  function hideFrame() { frame.inert = true; frame.setAttribute('aria-hidden', 'true'); }
  function fail() {
    if (disposed || finished) return;
    failed = true; invalidate(); hideFrame(); entry('error'); observer?.disconnect();
    notice.hidden = false; text.textContent = '小游戏暂未连接，请重试或返回地标。本次不计入完成。'; retry.hidden = false;
  }
  function load() {
    if (disposed || finished) return;
    invalidate(); failed = false; hideFrame(); entry('loading');
    notice.hidden = false; text.textContent = '正在准备案前票拟…'; retry.hidden = true;
    timeout = setTimeout(fail, 10000); frame.src = url.href;
  }
  function loaded() {
    if (disposed || finished || failed) return;
    stamp('load'); invalidate(); hideFrame(); entry('loading');
    sessionId = crypto.randomUUID(); session = createHostSession(sessionId);
    init = message('GAME_INIT', sessionId, crypto.randomUUID(), { bootstrap });
    stamp('init'); post(init);
    initTimer = setInterval(() => post(init), 700); timeout = setTimeout(fail, 8000);
  }
  function revealed() {
    if (disposed || finished || failed || container.dataset.entry !== 'revealing') return;
    clearTimeout(transitionTimer); entry('shown'); stamp('fullyVisible'); observer?.disconnect();
    frame.inert = false; frame.setAttribute('aria-hidden', 'false');
    notice.hidden = true;
  }
  async function reveal() {
    if (preparing || container.dataset.entry === 'shown') return;
    preparing = true; const current = attempt; controller = new AbortController();
    try {
      await prepareIntro(frame, { signal: controller.signal, onStage: name => { if (current === attempt) stamp(name); } });
      if (disposed || finished || failed || current !== attempt) return;
      clearTimeout(timeout); timings.transitionDuration = window.getComputedStyle?.(frame).transitionDuration || ''; stamp('visible'); entry('revealing');
      text.textContent = '案前票拟已备妥';
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) revealed();
      else transitionTimer = setTimeout(revealed, 650); // Only a lost-transitionend cleanup fallback.
    } catch (error) { if (current === attempt && error.name !== 'AbortError') fail(); }
  }
  let returned = false;
  function finishReturn() {
    if (disposed || returned) return;
    returned = true; clearTimeout(returnTimer); stamp('exitFullyHidden'); cancel();
  }
  function returnFromIntro() {
    stamp('exitReceived'); hideFrame(); notice.hidden = true; entry('returning');
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) finishReturn();
    else returnTimer = setTimeout(finishReturn, 580);
  }
  function transitioned(event) {
    if (event.target !== frame || event.propertyName !== 'opacity') return;
    if (container.dataset.entry === 'returning') finishReturn(); else revealed();
  }
  function receive(event) {
    if (disposed || finished || failed || event.origin !== origin || event.source !== frame.contentWindow) return;
    const data = event.data;
    if (!validMessage(data) || data.sessionId !== sessionId || !session) return;
    const result = session.receive(data);
    post(message('GAME_ACK', sessionId, crypto.randomUUID(), { ackMessageId: data.messageId, accepted: result.accepted }, data.runId));
    if (!result.accepted) return;
    if (data.type === 'GAME_READY') {
      ready = true; clearInterval(initTimer);
      if (!preparing && container.dataset.entry !== 'shown') { stamp('ready'); clearTimeout(timeout); timeout = setTimeout(fail, 8000); reveal(); }
    }
    if (result.outcome && ready) {
      finished = true; invalidate(); observer?.disconnect();
      if (result.outcome === 'completed') complete({ completed: true, levelId });
      else if (container.dataset.entry === 'shown' && frame.contentDocument?.body?.dataset.screen === 'intro') returnFromIntro();
      else cancel();
    }
  }
  function leave() { if (disposed || finished) return; finished = true; invalidate(); observer?.disconnect(); cancel(); }
  retry.addEventListener('click', load); back.addEventListener('click', leave);
  frame.addEventListener('load', loaded); frame.addEventListener('error', fail); frame.addEventListener('transitionend', transitioned);
  window.addEventListener('message', receive);
  load(); container.append(frame, notice);
  return () => {
    disposed = true; invalidate(); observer?.disconnect();
    window.removeEventListener('message', receive);
    frame.removeEventListener('load', loaded); frame.removeEventListener('error', fail); frame.removeEventListener('transitionend', transitioned);
    retry.removeEventListener('click', load); back.removeEventListener('click', leave);
    frame.remove(); notice.remove(); delete container.dataset.entry; if (scene) delete scene.dataset.zhangEntry;
    if (previousLayout === undefined) delete container.dataset.game; else container.dataset.game = previousLayout;
  };
}
