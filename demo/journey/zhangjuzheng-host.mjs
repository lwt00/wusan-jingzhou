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
  let frame, bootstrap, removeFrameListeners = () => {}, documentLoaded = false, loadedDocument = null, sessionDocument = null;
  const url = new URL('../../modules/zhangjuzheng-memorial/index.html', document.baseURI);
  url.searchParams.set('embed', '1');
  const previousLayout = container.dataset.game;
  container.dataset.game = 'zhangjuzheng-memorial';
  const scene = container.closest?.('#landmark-scene');
  const notice = document.createElement('div'); notice.className = 'zhang-connection'; notice.setAttribute('role', 'status');
  const text = document.createElement('p');
  const retry = document.createElement('button'); retry.textContent = '重试加载';
  const back = document.createElement('button'); back.textContent = '返回地标';
  notice.append(text, retry, back);
  let disposed = false, finished = false, failed = false, session = null, sessionId = '', init = null, ready = false;
  let initTimer, loadTimer, timeout, transitionTimer, returnTimer, controller, attempt = 0, preparing = false;
  function entry(state) { container.dataset.entry = state; if (scene) scene.dataset.zhangEntry = state; }
  function clearTimers() { clearInterval(initTimer); clearTimeout(loadTimer); clearTimeout(timeout); clearTimeout(transitionTimer); clearTimeout(returnTimer); }
  function later(callback, ms) { const current = attempt; return setTimeout(() => { if (!disposed && current === attempt) callback(); }, ms); }
  function post(data) { if (!disposed) frame.contentWindow?.postMessage(data, origin); }
  function invalidate() {
    attempt++; controller?.abort(); controller = null; preparing = false;
    session?.dispose(); session = null; ready = false; clearTimers();
  }
  function hideFrame() { if (frame) { frame.inert = true; frame.setAttribute('aria-hidden', 'true'); } }
  function fail(reason = 'connection') {
    if (disposed || finished) return;
    failed = true; invalidate(); hideFrame(); entry('error'); observer?.disconnect();
    notice.hidden = false; text.textContent = '小游戏暂未连接，请重试或返回地标。本次不计入完成。'; retry.hidden = false;
    container.dataset.entryFailure = reason;
  }
  function slow(stage) {
    if (disposed || finished || failed || ['shown', 'revealing'].includes(container.dataset.entry)) return;
    if (stage === 'document' && (documentLoaded || ready)) return;
    container.dataset.entryWait = stage;
    text.textContent = stage === 'visual' ? '首屏画卷仍在准备，请稍候；也可重试或返回地标。' : '资源加载较慢，仍在等待；可重试或返回地标。';
    notice.hidden = false; retry.hidden = false;
  }
  function handshakeExpired() {
    if (disposed || finished || failed || ready) return;
    clearInterval(initTimer); entry('error'); container.dataset.entryWait = 'handshake';
    notice.hidden = false; retry.hidden = false;
    text.textContent = '连接暂未确认，可重试或返回地标。本次不计入完成。';
    // Retain this session so a delayed, valid READY can still recover; no unbounded INIT retry.
  }
  function connect() {
    sessionId = crypto.randomUUID(); session = createHostSession(sessionId);
    init = message('GAME_INIT', sessionId, crypto.randomUUID(), { bootstrap });
    stamp('init'); post(init);
    const current = attempt, target = frame;
    initTimer = setInterval(() => { if (!disposed && !finished && !failed && current === attempt && target === frame) post(init); }, 700);
  }
  function load() {
    if (disposed || finished) return;
    invalidate(); failed = false; hideFrame(); entry('loading');
    removeFrameListeners(); frame?.remove();
    bootstrap = crypto.randomUUID(); url.searchParams.set('bootstrap', bootstrap);
    frame = document.createElement('iframe'); stamp('iframeCreated');
    frame.title = '张居正故居 · 案前票拟'; frame.className = 'zhangjuzheng-game-frame';
    hideFrame(); documentLoaded = false; loadedDocument = null; sessionDocument = null;
    delete container.dataset.entryFailure; delete container.dataset.entryWait;
    notice.hidden = false; text.textContent = '正在准备案前票拟…'; retry.hidden = true;
    const target = frame;
    const onLoad = () => { if (target === frame) loaded(); };
    const onError = () => { if (target === frame) fail('network'); };
    target.addEventListener('load', onLoad); target.addEventListener('error', onError); target.addEventListener('transitionend', transitioned);
    removeFrameListeners = () => { target.removeEventListener('load', onLoad); target.removeEventListener('error', onError); target.removeEventListener('transitionend', transitioned); };
    frame.src = url.href; container.append(frame, notice);
    loadTimer = later(() => slow('document'), 10000);
    // Child module readiness need not wait for hidden, non-intro images delaying window.load.
    connect();
  }
  function loaded() {
    if (disposed || finished || failed) return;
    const doc = frame.contentDocument;
    if ((doc?.URL || doc?.documentURI) === 'about:blank') return;
    if (documentLoaded && doc && doc === loadedDocument) return;
    if (documentLoaded || (sessionDocument && doc && doc !== sessionDocument)) { invalidate(); sessionDocument = null; hideFrame(); entry('loading'); connect(); }
    documentLoaded = true; loadedDocument = doc; stamp('load'); clearTimeout(loadTimer);
    // A first/duplicate load after early READY must not reset the child's locked session.
    if (!ready) { clearTimeout(timeout); timeout = later(handshakeExpired, 8000); }
  }
  function revealed() {
    if (disposed || finished || failed || container.dataset.entry !== 'revealing') return;
    clearTimeout(transitionTimer); entry('shown'); stamp('fullyVisible'); observer?.disconnect();
    delete container.dataset.entryWait;
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
      else transitionTimer = later(revealed, 650); // Only a lost-transitionend cleanup fallback.
    } catch (error) { if (current === attempt && error.name !== 'AbortError') fail('visual'); }
  }
  let returned = false;
  function finishReturn() {
    if (disposed || returned) return;
    returned = true; clearTimeout(returnTimer); stamp('exitFullyHidden'); cancel();
  }
  function returnFromIntro() {
    stamp('exitReceived'); hideFrame(); notice.hidden = true; entry('returning');
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) finishReturn();
    else returnTimer = later(finishReturn, 580);
  }
  function transitioned(event) {
    if (event.target !== frame || event.propertyName !== 'opacity') return;
    if (container.dataset.entry === 'returning') finishReturn(); else revealed();
  }
  function receive(event) {
    if (disposed || finished || failed || event.origin !== origin || event.source !== frame.contentWindow) return;
    const data = event.data;
    if (sessionDocument && frame.contentDocument && sessionDocument !== frame.contentDocument) return;
    if (!validMessage(data) || data.sessionId !== sessionId || !session) return;
    const result = session.receive(data);
    post(message('GAME_ACK', sessionId, crypto.randomUUID(), { ackMessageId: data.messageId, accepted: result.accepted }, data.runId));
    if (!result.accepted) return;
    if (data.type === 'GAME_READY') {
      ready = true; sessionDocument = frame.contentDocument; clearInterval(initTimer); clearTimeout(loadTimer);
      if (!preparing && container.dataset.entry !== 'shown') {
        stamp('ready'); clearTimeout(timeout); entry('loading'); notice.hidden = false; retry.hidden = true;
        timeout = later(() => slow('visual'), 8000); reveal();
      }
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
  window.addEventListener('message', receive);
  load();
  return () => {
    disposed = true; invalidate(); observer?.disconnect();
    window.removeEventListener('message', receive);
    removeFrameListeners();
    retry.removeEventListener('click', load); back.removeEventListener('click', leave);
    frame.remove(); notice.remove(); delete container.dataset.entry; delete container.dataset.entryWait; delete container.dataset.entryFailure; if (scene) delete scene.dataset.zhangEntry;
    if (previousLayout === undefined) delete container.dataset.game; else container.dataset.game = previousLayout;
  };
}
