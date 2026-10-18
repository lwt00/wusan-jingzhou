/* Owns only the museum iframe. The existing journey owns the heritage stamp and save. */
(() => {
  window.WusanLandmarkGames.register('chuyun-reborn', {
    mount({ container, levelId, complete, cancel }) {
      const session = crypto.randomUUID();
      const frame = document.createElement('iframe');
      const url = new URL('../../chuyun-reborn-game/index.html', document.baseURI);
      url.searchParams.set('embed', '1');
      url.searchParams.set('session', session);
      frame.src = url.href;
      frame.title = '荆州博物馆 · 楚韵重生';
      frame.className = 'museum-game-frame';
      const previousLayout = container.dataset.game;
      container.dataset.game = 'chuyun-reborn';
      let closed = false, started = false;
      const receive = event => {
        if (closed || event.source !== frame.contentWindow || event.origin !== url.origin) return;
        const data = event.data;
        if (data?.channel !== 'wusan-museum' || data.session !== session || data.gameId !== 'chuyun-reborn') return;
        if (data.action === 'start') started = true;
        else if (data.action === 'cancel') { closed = true; cancel(); }
        else if (data.action === 'complete' && started && data.completed === true &&
                 data.total === 3 && Array.isArray(data.artifacts) && data.artifacts.length === 3 &&
                 ['cup', 'pigbox', 'drum'].every(id => data.artifacts.includes(id))) {
          closed = true;
          complete({ completed: true, levelId });
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
