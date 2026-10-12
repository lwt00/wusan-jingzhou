// 地图视觉实验：只读取现有 class 状态，不读写业务状态或 localStorage。
(() => {
  const map = document.getElementById('mapScene');
  const markers = [...map.querySelectorAll('.map-marker')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const completed = new Map(markers.map(marker => [marker, marker.classList.contains('complete')]));
  let visible = false;
  let pointerListeners = null;
  let frame = 0;
  let observers = [];
  let intersection;
  let suspended = false;

  function resetDepth() {
    cancelAnimationFrame(frame); frame = 0;
    map.style.setProperty('--map-depth-x', '0px');
    map.style.setProperty('--map-depth-y', '0px');
  }
  function moveDepth(event) {
    if (frame) return;
    const rect = map.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    frame = requestAnimationFrame(() => {
      frame = 0;
      map.style.setProperty('--map-depth-x', `${x * 8}px`);
      map.style.setProperty('--map-depth-y', `${y * 5}px`);
    });
  }
  function sync() {
    const blocked = document.querySelector('.intro-overlay.visible, .video-overlay.visible, dialog[open]');
    const active = !suspended && visible && !document.hidden && !map.classList.contains('inactive') && !blocked && !reduced.matches;
    if (map.classList.contains('map-motion-paused') === active) map.classList.toggle('map-motion-paused', !active);
    if (active && finePointer.matches && !pointerListeners) {
      pointerListeners = new AbortController();
      map.addEventListener('pointermove', moveDepth, { passive: true, signal: pointerListeners.signal });
      map.addEventListener('pointerleave', resetDepth, { passive: true, signal: pointerListeners.signal });
    } else if ((!active || !finePointer.matches) && pointerListeners) {
      pointerListeners.abort(); pointerListeners = null; resetDepth();
    }
    for (const marker of markers) {
      const done = marker.classList.contains('complete');
      if (done && !completed.get(marker) && !reduced.matches) marker.classList.add('stamp-awaken');
      if (!done && marker.classList.contains('stamp-awaken')) marker.classList.remove('stamp-awaken');
      completed.set(marker, done);
    }
  }
  function connect() {
    suspended = false;
    intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
    intersection.observe(map);
    const watch = (element, attributes, subtree = false) => {
      const observer = new MutationObserver(sync);
      observer.observe(element, { attributes: true, attributeFilter: attributes, subtree }); observers.push(observer);
    };
    watch(map, ['class'], true);
    document.querySelectorAll('dialog').forEach(dialog => watch(dialog, ['open']));
    ['introOverlay', 'videoOverlay'].forEach(id => watch(document.getElementById(id), ['class']));
    sync();
  }
  markers.forEach(marker => marker.addEventListener('animationend', event => {
    if (event.animationName === 'map-stamp-reveal') marker.classList.remove('stamp-awaken');
  }));
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => { resetDepth(); sync(); });
  finePointer.addEventListener('change', sync);
  window.addEventListener('pagehide', () => {
    suspended = true; intersection.disconnect(); observers.forEach(observer => observer.disconnect()); observers = [];
    sync(); resetDepth();
  });
  window.addEventListener('pageshow', event => { if (event.persisted) connect(); });
  connect();
})();
