/* Real Guanyu puzzle adapter. Owns only its iframe; the journey owns progress. */
(() => {
  window.WusanLandmarkGames.register('guanyu-huarong', {
    mount({ container, levelId, complete, cancel }) {
      const session = crypto.randomUUID();
      const frame = document.createElement('iframe');
      const url = new URL('../guanyu-shrine/index.html', document.baseURI);
      url.searchParams.set('embed', '1');
      url.searchParams.set('session', session);
      frame.src = url.href;
      frame.title = '关羽祠 · 华容道 · 义释';
      frame.className = 'guanyu-game-frame';
      const previousLayout = container.dataset.game;
      container.dataset.game = 'guanyu-huarong';
      let closed = false;
      const receive = event => {
        if (closed || event.source !== frame.contentWindow || event.origin !== location.origin) return;
        const data = event.data;
        if (data?.channel !== 'wusan-guanyu' || data.session !== session) return;
        if (data.action === 'complete') {
          closed = true;
          complete({ completed: true, levelId });
        } else if (data.action === 'cancel') {
          closed = true;
          cancel();
        }
      };
      window.addEventListener('message', receive);
      container.append(frame);
      return () => {
        closed = true;
        window.removeEventListener('message', receive);
        frame.remove();
        if (previousLayout === undefined) delete container.dataset.game;
        else container.dataset.game = previousLayout;
      };
    }
  });
})();
