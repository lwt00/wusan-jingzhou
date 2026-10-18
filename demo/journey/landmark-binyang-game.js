/* Owns only the Binyang iframe; the journey owns reveal, stamps and progress. */
(() => {
  window.WusanLandmarkGames.register('binyang-fenghuo', {
    mount({ container, levelId, complete, cancel }) {
      const session = crypto.randomUUID();
      const frame = document.createElement('iframe');
      const url = new URL('../../binyanglou-game/binyanglou-game.html', document.baseURI);
      url.searchParams.set('embed', '1');
      url.searchParams.set('session', session);
      frame.src = url.href;
      frame.title = '宾阳楼 · 烽火守城';
      frame.className = 'binyang-game-frame';
      const toolbar = document.createElement('div');
      toolbar.className = 'binyang-game-toolbar';
      const title = document.createElement('span');
      title.textContent = '宾阳楼 · 烽火守城';
      const exit = document.createElement('button');
      exit.type = 'button';
      exit.textContent = '退出守城 · 返回宾阳楼';
      toolbar.append(title, exit);
      const previousLayout = container.dataset.game;
      container.dataset.game = 'binyang-fenghuo';
      let closed = false, run = 0, playing = false;
      const receive = event => {
        if (closed || event.source !== frame.contentWindow || event.origin !== url.origin) return;
        const data = event.data;
        if (data?.channel !== 'wusan-binyang' || data.session !== session ||
            data.source !== 'binyanglou-game' || data.gameId !== 'binyanglou' ||
            !Number.isSafeInteger(data.run) || data.run < 1) return;
        if (data.type === 'start' && data.status === 'playing' && data.run > run) {
          run = data.run;
          playing = true;
        } else if (data.run === run && data.type === 'fail') {
          playing = false;
        } else if (data.run === run && playing && data.type === 'complete' &&
                   data.status === 'completed' && data.wave === 3 && data.totalWaves === 3 &&
                   Number.isFinite(data.wall) && data.wall > 0) {
          closed = true;
          complete({ completed: true, levelId });
        }
      };
      const leave = () => { if (!closed) { closed = true; cancel(); } };
      exit.addEventListener('click', leave);
      window.addEventListener('message', receive);
      container.append(toolbar, frame);
      return () => {
        closed = true;
        exit.removeEventListener('click', leave);
        window.removeEventListener('message', receive);
        frame.remove();
        toolbar.remove();
        if (previousLayout === undefined) delete container.dataset.game;
        else container.dataset.game = previousLayout;
      };
    }
  });
})();
