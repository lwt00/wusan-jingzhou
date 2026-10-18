/* Optional, same-origin journey transport. Standalone museum archives remain independent. */
(() => {
  const params = new URLSearchParams(location.search);
  const session = params.get('session');
  const enabled = parent !== window && params.get('embed') === '1' && !!session;
  const repaired = new Set();
  let started = false, closed = false;
  const send = (action, detail = {}) => {
    if (enabled) parent.postMessage({ channel: 'wusan-museum', gameId: 'chuyun-reborn', session, action, ...detail }, location.origin);
  };
  const begin = () => { if (!enabled || started || closed) return; started = true; send('start'); };
  const artifactComplete = id => {
    if (enabled && started && !closed && window.CHUYUN_DATA.artifacts.some(a => a.id === id)) repaired.add(id);
  };
  const completeHall = () => {
    const ids = window.CHUYUN_DATA.artifacts.map(a => a.id);
    if (!enabled || !started || closed || !ids.length || !ids.every(id => repaired.has(id))) return;
    closed = true;
    send('complete', { completed: true, artifacts: ids, total: ids.length });
  };
  const cancel = () => { if (!enabled || closed) return; closed = true; send('cancel'); };
  window.ChuyunJourney = Object.freeze({ enabled, begin, artifactComplete, completeHall, cancel });
  if (enabled) {
    const exit = document.createElement('button');
    exit.type = 'button';
    exit.className = 'journey-museum-exit';
    exit.textContent = '退出修复 · 返回博物馆';
    exit.style.cssText = 'position:fixed;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:1000;padding:10px 14px;border:1px solid #b89458;border-radius:4px;background:#19131fee;color:#f0e4ce;font:13px sans-serif;cursor:pointer';
    exit.addEventListener('click', cancel);
    document.body.append(exit);
    window.addEventListener('pagehide', () => { closed = true; }, { once: true });
  }
})();
