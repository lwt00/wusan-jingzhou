'use strict';
(() => {
  const engine = createHuarongEngine();
  const moveSound = createHuarongMoveSound();
  const $ = id => document.getElementById(id);
  const directionNames = { left: '左', up: '上', down: '下', right: '右' };
  // Drop your generated images into assets/ and set a relative path here.
  // Example: cao: 'assets/cao.webp', guan: 'assets/green-dragon-blade.webp'
  const PIECE_IMAGES = { cao: 'assets/cao.jpg', guan: 'assets/guan.jpg', zhang: 'assets/zhang.jpg', zhao: 'assets/zhao.jpg', ma: 'assets/ma.jpg', huang: 'assets/huang.jpg', pawn1: 'assets/pawn1.jpg', pawn2: 'assets/pawn2.jpg', pawn3: 'assets/pawn3.jpg', pawn4: 'assets/pawn1.jpg' };
  let state = engine.initial(), revealed = new Set(), history = [];
  let selected = null, steps = 0, started = false, paused = false, won = false;
  let elapsed = 0, runningSince = 0, worker = null, hintPath = null, version = 0;
  let drag = null, suppressClick = false, lastSeconds = -1;
  let autoMode = '', autoPath = [], autoTimer = null;
  const pieceElements = [];
  let clouds;

  function seconds() { return Math.floor((elapsed + (started && !paused && !won ? performance.now() - runningSince : 0)) / 1000); }
  function formattedTime(value) { return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`; }
  function message(text) { $('game-message').textContent = text; }
  function startClock() {
    if (started) return;
    started = true; runningSince = performance.now();
    $('session-badge').textContent = '对弈中';
    $('session-tip').textContent = '心定，方能见出路';
  }
  function visibleCells(index, position = state[index]) {
    const result = [], piece = engine.definitions[index];
    for (let y = 0; y < piece.h; y++) for (let x = 0; x < piece.w; x++) result.push(position + y * 4 + x);
    return result;
  }
  function isKnown(index) { return visibleCells(index).some(cell => revealed.has(cell)); }
  function revealOne(index, previous) {
    const oldCells = new Set(visibleCells(index, previous));
    const current = visibleCells(index);
    const priority = [...current.filter(cell => !oldCells.has(cell)), ...current, ...Array.from({ length: 20 }, (_, i) => i).sort((a, b) => {
      const distance = c => Math.abs(c % 4 - state[index] % 4) + Math.abs(Math.floor(c / 4) - Math.floor(state[index] / 4));
      return distance(a) - distance(b) || b - a;
    })];
    const cell = priority.find(c => !revealed.has(c));
    if (cell !== undefined) revealed.add(cell);
  }
  function makeBoard() {
    engine.definitions.forEach((piece, index) => {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'piece mysterious'; el.dataset.group = piece.group;
      el.dataset.piece = piece.id; el.setAttribute('aria-pressed', 'false');
      el.style.width = `calc(${piece.w * 25}% - 8px)`;
      el.style.height = `calc(${piece.h * 20}% - 8px)`;
      if (PIECE_IMAGES[piece.id]) {
        const img = document.createElement('img');
        img.className = 'piece-art'; img.alt = ''; img.draggable = false; img.src = PIECE_IMAGES[piece.id];
        el.classList.add('has-art');
        img.onerror = () => { img.remove(); el.classList.remove('has-art'); }; el.append(img);
      }
      const glyph = document.createElement('span'); glyph.className = 'piece-glyph'; glyph.textContent = piece.glyph; el.append(glyph);
      if (index === 0) { const detail = document.createElement('span'); detail.className = 'piece-detail'; detail.textContent = '华容待释'; el.append(detail); }
      el.addEventListener('click', () => {
        if (suppressClick) { suppressClick = false; return; }
        select(index);
      });
      el.addEventListener('pointerdown', event => {
        if (paused || won || autoMode || (event.pointerType === 'mouse' && event.button !== 0)) return;
        select(index); drag = { index, x: event.clientX, y: event.clientY, id: event.pointerId };
        el.setPointerCapture(event.pointerId);
      });
      el.addEventListener('pointerup', event => {
        if (!drag || drag.id !== event.pointerId) return;
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) >= 16) {
          suppressClick = true;
          movePiece(drag.index, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        }
        drag = null;
      });
      el.addEventListener('pointercancel', () => { drag = null; });
      $('piece-layer').append(el); pieceElements.push(el);
    });
    clouds = new CloudFog($('fog-layer'));
    $('board-hint').innerHTML = '<span>雾起华容 · 待君破局</span>';
  }
  function updateTime() {
    $('time-count').textContent = formattedTime(seconds());
  }
  function render() {
    pieceElements.forEach((el, index) => {
      const p = engine.definitions[index], known = isKnown(index);
      el.style.left = `calc(${state[index] % 4 * 25}% + 4px)`;
      el.style.top = `calc(${Math.floor(state[index] / 4) * 20}% + 4px)`;
      el.classList.toggle('selected', selected === index);
      el.classList.toggle('mysterious', !known);
      el.setAttribute('aria-pressed', String(selected === index));
      el.setAttribute('aria-label', `${known ? p.name : '迷雾棋子'}，${p.w}列${p.h}行，第${Math.floor(state[index] / 4) + 1}行第${state[index] % 4 + 1}列`);
      el.disabled = paused || won || !!autoMode;
    });
    clouds.update(revealed, paused);
    $('fog-count').textContent = `${revealed.size} / 20`;
    $('fog-progress').style.width = `${revealed.size * 5}%`;
    $('move-count').textContent = String(steps).padStart(3, '0');
    $('board-hint').classList.toggle('hide', selected !== null || steps > 0);
    $('undo-btn').disabled = history.length === 0 || paused || won || !!autoMode;
    $('hint-btn').disabled = paused || won || !!worker || !!autoMode;
    const unlocked = revealed.size === 20;
    $('auto-solve-btn').disabled = !unlocked || paused || won || !!autoMode || !!worker;
    $('auto-solve-btn').classList.toggle('unlocked', unlocked && !won);
    $('auto-solve-btn').title = unlocked ? '从当前棋局自动移动至通关' : '迷雾全部散去后解锁';
    $('auto-solve-label').textContent = won ? '已通关' : autoMode === 'planning' ? '推演中…' : autoMode === 'playing' ? '解局中…' : '一键通关';
    $('auto-unlock-note').textContent = won ? '华容道已解开 · 文化卡已解锁' : autoMode ? (paused ? '自动解局已暂停，继续对弈后恢复' : '正在自动解局，请看棋子逐步让出归路') : unlocked ? '一键通关已解锁 · 可自动解开当前棋局' : `再驱散 ${20 - revealed.size} 格迷雾，解锁一键通关`;
    $('board').classList.toggle('auto-solving', !!autoMode);
    $('pause-btn').disabled = !started || paused || won;
    updateTime();
  }
  function select(index) {
    if (paused || won || autoMode) return;
    selected = index;
    const available = Object.keys(engine.directions).filter(d => engine.canMove(state, index, d));
    message(available.length ? `可向${available.map(d => directionNames[d]).join('、')}移动。拖动棋子或使用方向键。` : '此处暂时无路。试着挪开周围的棋子。');
    render();
  }
  function stopWorker() {
    if (worker) { worker.terminate(); worker = null; }
    $('hint-btn').innerHTML = '<span class="control-icon hint-icon">✧</span>求一策';
  }
  function movePiece(index, direction, automatic = false) {
    if (paused || won || (autoMode && !automatic)) return false;
    const result = engine.move(state, index, direction);
    if (!result) {
      pieceElements[index].classList.remove('shake'); void pieceElements[index].offsetWidth;
      pieceElements[index].classList.add('shake'); message('前路有阻，换个方向试试。'); return false;
    }
    startClock(); stopWorker(); version++;
    const previous = state[index];
    history.push({ state: state.slice(), revealed: [...revealed], selected: index });
    state = result.state; selected = index; steps++;
    if (hintPath && hintPath[0]?.index === index && hintPath[0]?.direction === direction) hintPath.shift();
    else hintPath = null;
    pieceElements.forEach(el => el.classList.remove('hint-target'));
    revealOne(index, previous);
    message(revealed.size < 20 ? `落子有定，迷雾又散一格。已揭开 ${revealed.size} / 20 格。` : '迷雾已散，一键通关已解锁。也可继续自行解局。');
    if (result.won) complete();
    render(); moveSound.play(!automatic); return true;
  }
  function undo() {
    if (!history.length || paused || won || autoMode) return;
    stopWorker(); version++; hintPath = null;
    const previous = history.pop(); state = previous.state; revealed = new Set(previous.revealed); selected = previous.selected;
    steps--; pieceElements.forEach(el => el.classList.remove('hint-target'));
    message('退一步，重新寻路。棋局与迷雾已恢复，用时继续。'); render();
  }
  function reset() {
    moveSound.stop();
    stopAuto();
    stopWorker(); version++; hintPath = null; state = engine.initial(); revealed = new Set(); history = [];
    selected = null; steps = 0; started = false; paused = false; won = false; elapsed = 0; runningSince = 0;
    $('board').classList.remove('won', 'paused');
    $('session-badge').textContent = '待落子'; $('session-tip').textContent = '首步落定，即刻计时';
    pieceElements.forEach(el => el.classList.remove('hint-target'));
    message('拖动棋子，或选中后按键盘方向键。'); render();
  }
  function pause(showDialog = true) {
    moveSound.stop();
    if (!started || paused || won) return;
    clearTimeout(autoTimer); autoTimer = null;
    if (autoMode === 'planning') stopAuto();
    elapsed += performance.now() - runningSince; paused = true; stopWorker();
    $('board').classList.add('paused'); $('session-badge').textContent = '已暂停'; render();
    if (showDialog && !$('pause-dialog').open) $('pause-dialog').showModal();
  }
  function resume() {
    if (paused) { paused = false; runningSince = performance.now(); }
    if ($('pause-dialog').open) $('pause-dialog').close();
    $('board').classList.remove('paused'); $('session-badge').textContent = started ? '对弈中' : '待落子'; render();
    if (autoMode === 'playing') scheduleAutoStep();
  }
  function showHint(action) {
    if (!action || won || paused) return;
    selected = action.index; render();
    pieceElements.forEach(el => el.classList.remove('hint-target'));
    void pieceElements[action.index].offsetWidth; pieceElements[action.index].classList.add('hint-target');
    message(`一策在此：将高亮棋子向${directionNames[action.direction]}移动一格${engine.canMove(state, action.index, action.direction) === 'exit' ? '，走出华容道' : ''}。`);
  }
  function stopAuto() {
    clearTimeout(autoTimer); autoTimer = null; autoMode = ''; autoPath = [];
  }
  function scheduleAutoStep() {
    clearTimeout(autoTimer);
    if (paused || won || autoMode !== 'playing') return;
    autoTimer = setTimeout(() => {
      autoTimer = null;
      if (paused || won || autoMode !== 'playing') return;
      const action = autoPath.shift();
      if (!action || !movePiece(action.index, action.direction, true)) {
        stopAuto(); render(); message('自动解局已停止，可重新点击一键通关。'); return;
      }
      if (!won) {
        message(`正在自动解局 · 还需 ${autoPath.length} 步。`);
        scheduleAutoStep();
      }
    }, 200);
  }
  function playSolution(path) {
    autoMode = 'playing'; autoPath = path.slice(); drag = null; suppressClick = false;
    render(); scheduleAutoStep();
  }
  function requestHint() { requestSolution(false); }
  function requestSolution(automatic) {
    if (paused || won || worker || autoMode || (automatic && revealed.size !== 20)) return;
    if (hintPath?.length) {
      if (automatic) playSolution(hintPath); else showHint(hintPath[0]);
      return;
    }
    if (automatic) autoMode = 'planning';
    const requestedVersion = version;
    const failed = text => { stopWorker(); if (automatic) stopAuto(); render(); message(text); };
    try {
      const code = `const engine = (${createHuarongEngine.toString()})(); onmessage = event => { try { postMessage({ path: engine.solve(event.data) }); } catch (error) { postMessage({ error: error.message }); } };`;
      const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
      worker = new Worker(url); URL.revokeObjectURL(url);
      if (!automatic) $('hint-btn').innerHTML = '<span class="control-icon">◌</span>寻策中';
      message('正在推演出路，稍候片刻……'); render();
      worker.onmessage = event => {
        stopWorker();
        if (version !== requestedVersion || paused || won) return;
        if (!event.data.path?.length) { failed('此刻未寻得路线，可悔一步重新尝试。'); return; }
        hintPath = event.data.path;
        if (automatic) playSolution(hintPath); else showHint(hintPath[0]);
      };
      worker.onerror = () => failed('自动求解暂不可用，请重试或继续手动解局。');
      worker.postMessage(state.slice());
    } catch (_) { failed('此浏览器暂不支持自动求解，拖动与方向键仍可使用。'); }
  }
  function openInfo(kind) {
    if ($('info-dialog').open) return;
    const resumeAfter = started && !paused && !won;
    if (resumeAfter) pause(false);
    $('info-dialog').dataset.resume = String(resumeAfter);
    const story = `<span class="dialog-eyebrow">关羽祠 · 文化拾遗</span><h2 id="dialog-title">放下的是刀，<br>放不下的是义。</h2><p>《三国演义》第五十回写道：赤壁兵败后，曹操取道华容，遇上关羽。曹操以往日相待之情相求，关羽心念旧恩，最终让开道路，放曹操离去。</p><p class="culture-quote">华容道上，一念见忠义。</p><p>这段文学故事把知恩、守信与军令之间的两难留给了后人。移开棋子、让出归路，也是在方寸之间重温这份取舍。</p><div class="dialog-rule"></div><p class="dialog-footnote">文化说明：「义释曹操」取自《三国演义》的文学叙事，不能直接视为史实。经典滑块游戏以三国人物与华容道故事为题材。</p><button class="primary-button" data-dismiss>回到棋局 →</button>`;
    const rules = `<span class="dialog-eyebrow">方寸之间 · 落子有方</span><h2 id="dialog-title">拨开迷雾，寻一条归路。</h2><h3>如何破局</h3><ul><li>棋盘共 4 列 5 行，10 枚棋子、2 格空位。</li><li>向目标方向拖动棋子，或点击选中后按键盘方向键。</li><li>一次有效操作移动一格、计一步、揭开一格迷雾。棋子不能重叠、旋转或越界。</li><li>将 2×2 的曹操移至底部正中，再向下移动一次即可通关。</li></ul><h3>星评规则</h3><ul><li>★★★：不超过 140 步，且用时不超过 8 分钟。</li><li>★★：不超过 200 步，且用时不超过 15 分钟。</li><li>★：完成棋局。超时或超步不会中断游戏。</li></ul><p class="dialog-footnote">首步有效移动开始计时。迷雾全部散去后解锁一键通关，会从当前棋局自动移动至出口，自动移动照常计步计时，可暂停后继续。求一策不扣星；悔棋会恢复步数与迷雾，用时不回退。暂停、阅读弹窗及切换标签页时停止计时。刷新页面会重新开始。</p><button class="primary-button" data-dismiss>明白了，入局 →</button>`;
    $('dialog-content').innerHTML = kind === 'story' ? story : rules;
    $('info-dialog').showModal();
  }
  function complete() {
    stopAuto();
    elapsed += performance.now() - runningSince; won = true;
    $('board').classList.add('won'); $('session-badge').textContent = '已破局'; $('session-tip').textContent = '一念之义，千古流传';
    message('华容道已开，恭喜破局！文化卡已解锁。');
    const stars = engine.rating(steps, seconds());
    const finishVersion = version;
    window.setTimeout(() => {
      if (!won || version !== finishVersion) return;
      $('info-dialog').dataset.resume = 'false';
      $('dialog-content').innerHTML = `<span class="dialog-eyebrow">文化卡 · 壹 / 已解锁</span><h2 id="dialog-title">义释曹操</h2><div class="win-stars" aria-label="${stars}星">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><div class="win-stats">${steps} 步 · ${formattedTime(seconds())}</div><p class="culture-quote">迷雾散尽，归路已开。<br>这一局，让义字先行。</p><p>《三国演义》中，关羽于华容道念及旧恩，让开一条归路。你也以方寸间的腾挪，完成了这场关于取舍的棋局。</p><p class="dialog-footnote">文化来源：《三国演义》第五十回。此为文学故事，非史实定论。</p><button class="primary-button" id="save-card">收藏文化卡 ↓</button><button class="secondary-button" id="play-again">再赴一局</button>`;
      if (!$('info-dialog').open) $('info-dialog').showModal();
      $('save-card').onclick = downloadCard;
      $('play-again').onclick = () => { $('info-dialog').close(); reset(); };
      window.dispatchEvent(new Event('huarong:complete'));
    }, 750);
  }
  function downloadCard() {
    const stars = engine.rating(steps, seconds());
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1000" viewBox="0 0 720 1000"><rect width="720" height="1000" fill="#eae6dc"/><rect x="30" y="30" width="660" height="940" fill="none" stroke="#a6ab92"/><rect x="49" y="49" width="622" height="902" fill="none" stroke="#c9cbb8"/><text x="360" y="130" text-anchor="middle" fill="#aa563d" font-family="serif" font-size="19" letter-spacing="7">关羽祠 · 文化游园 · 壹</text><text x="360" y="250" text-anchor="middle" fill="#25483c" font-family="serif" font-size="67" letter-spacing="12">义释曹操</text><path d="M110 400 218 313 276 348 343 297 425 363 492 321 612 400" fill="none" stroke="#81967c" stroke-width="2"/><text x="360" y="477" text-anchor="middle" fill="#b79963" font-family="serif" font-size="40" letter-spacing="14">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</text><text x="360" y="535" text-anchor="middle" fill="#6c7b63" font-family="serif" font-size="24">${steps} 步 · ${formattedTime(seconds())}</text><text x="360" y="638" text-anchor="middle" fill="#25483c" font-family="serif" font-size="30">迷雾散尽，归路已开。</text><text x="360" y="688" text-anchor="middle" fill="#25483c" font-family="serif" font-size="30">这一局，让义字先行。</text><text x="360" y="804" text-anchor="middle" fill="#808975" font-family="serif" font-size="17">关羽念及旧恩，于华容道义释曹操。</text><text x="360" y="842" text-anchor="middle" fill="#808975" font-family="serif" font-size="16">故事取自《三国演义》第五十回 · 文学叙事</text><text x="360" y="917" text-anchor="middle" fill="#a1a58e" font-family="serif" font-size="14" letter-spacing="4">寓游于学 · 以义入心</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = '关羽祠-义释曹操文化卡.svg'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('save-card').textContent = '文化卡已下载 ✓';
  }

  document.addEventListener('keydown', event => {
    if ($('info-dialog').open || $('pause-dialog').open || event.altKey || event.ctrlKey || event.metaKey) return;
    const dir = { ArrowLeft: 'left', ArrowUp: 'up', ArrowDown: 'down', ArrowRight: 'right' }[event.key];
    if (dir && selected !== null) { event.preventDefault(); if (!event.repeat) movePiece(selected, dir); }
  });
  $('sound-btn').onclick = () => {
    const muted = $('sound-btn').getAttribute('aria-pressed') !== 'true';
    moveSound.setMuted(muted);
    $('sound-btn').setAttribute('aria-pressed', String(muted));
    $('sound-btn').setAttribute('aria-label', muted ? '开启棋块移动音效' : '静音棋块移动音效');
    $('sound-btn').textContent = muted ? '音效：关' : '音效：开';
  };
  window.WusanUIAudio?.onChange(muted => { moveSound.setMuted(muted); $('sound-btn').setAttribute('aria-pressed',String(muted)); $('sound-btn').textContent=muted?'音效：关':'音效：开'; });
  window.addEventListener('pagehide', () => moveSound.stop());
  $('undo-btn').onclick = undo; $('hint-btn').onclick = requestHint;
  $('pause-btn').onclick = () => pause(); $('resume-btn').onclick = resume;
  $('pause-dialog').addEventListener('cancel', event => { event.preventDefault(); resume(); });
  $('auto-solve-btn').onclick = () => requestSolution(true);
  document.querySelectorAll('[data-open]').forEach(button => button.onclick = () => openInfo(button.dataset.open));
  $('info-dialog').querySelector('.dialog-close').onclick = () => $('info-dialog').close();
  $('dialog-content').addEventListener('click', event => { if (event.target.closest('[data-dismiss]')) $('info-dialog').close(); });
  $('info-dialog').addEventListener('close', () => { if ($('info-dialog').dataset.resume === 'true') { $('info-dialog').dataset.resume = 'false'; resume(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && started && !paused && !won) pause(); });
  setInterval(() => { const current = seconds(); if (current !== lastSeconds) { lastSeconds = current; updateTime(); } }, 250);
  makeBoard(); render();
})();
