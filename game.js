(() => {
  const field = document.getElementById('playfield');
  const mapScene = document.getElementById('mapScene');
  const levelScene = document.getElementById('levelScene');
  const levelBackground = document.getElementById('levelBackground');
  const mistLayer = document.getElementById('mistLayer');
  const particleLayer = document.getElementById('particleLayer');
  const core = document.getElementById('core');
  const pollutionValue = document.getElementById('pollutionValue');
  const pollutionMeter = document.getElementById('pollutionMeter');
  const airStatus = document.getElementById('airStatus');
  const phaseLabel = document.getElementById('phaseLabel');
  const levelNumber = document.getElementById('levelNumber');
  const levelTitle = document.getElementById('levelTitle');
  const levelObjective = document.getElementById('levelObjective');
  const mapMarkers = [...document.querySelectorAll('.map-marker')];
  const clearedZones = [...document.querySelectorAll('.cleared-zone')];
  const clearedSeams = [...document.querySelectorAll('.cleared-seam')];
  const fieldHint = document.getElementById('fieldHint');
  const toast = document.getElementById('toast');
  const joystick = document.getElementById('joystick');
  const joystickKnob = document.getElementById('joystickKnob');
  const videoOverlay = document.getElementById('videoOverlay');
  const videoKicker = document.getElementById('videoKicker');
  const promoVideo = document.getElementById('promoVideo');
  const videoEndState = document.getElementById('videoEndState');
  const videoContinue = document.getElementById('videoContinue');
  const backgroundMusic = document.getElementById('backgroundMusic');
  const introOverlay = document.getElementById('introOverlay');
  const introLead = document.getElementById('introLead');
  const introVideoState = document.getElementById('introVideoState');
  const introVideo = document.getElementById('introVideo');
  const introSkip = document.getElementById('introSkip');
  const introVideoHint = document.getElementById('introVideoHint');
  const introEndState = document.getElementById('introEndState');
  const beginClean = document.getElementById('beginClean');
  backgroundMusic.volume = .3;

  let introTimer = null;

  const levelConfigs = [
    { title: '关羽祠', image: '关羽祠-关卡背景.png', video: '关羽祠.mp4', caption: '关羽祠 · 第一站清风路线' },
    { title: '宾阳楼', image: '宾阳楼-关卡背景.png', video: '宾阳楼.mp4', caption: '宾阳楼 · 第二站清风路线' },
    { title: '张居正故居', image: '张居正故居-关卡背景.png', video: '张居正故居.mp4', caption: '张居正故居 · 第三站清风路线' },
    { title: '荆州大学城', image: '荆州大学城-关卡背景.png', video: '大学城.mp4', caption: '荆州大学城 · 第四站清风路线' }
  ];

  const state = {
    mode: 'map', paused: false, completed: false, currentLevel: -1, nextLevel: 0,
    levelPollution: 100, cleanCount: 0, lastFrame: performance.now(), spawnTimer: 0,
    spawnInterval: 760, absorbRange: 1, escapeRadius: .16, escapeSpeed: .055,
    player: { x: .5, y: .54, speed: .42 }, keys: new Set(), joystick: { x: 0, y: 0, active: false },
    particles: [], particleId: 0, videoPurpose: 'level'
  };

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('visible'), 2200);
  }

  function startMusic() {
    backgroundMusic.volume = .3;
    const playPromise = backgroundMusic.play();
    if (playPromise) playPromise.catch(() => {});
  }

  function pauseMusic() {
    backgroundMusic.pause();
  }

  function playIntroVideo() {
    introVideo.muted = true;
    introVideo.volume = 1;
    const playPromise = introVideo.play();
    if (playPromise) {
      playPromise.then(() => {
        introVideoHint.classList.remove('visible');
        introVideoHint.setAttribute('aria-hidden', 'true');
      }).catch(() => {
        showToast('开场视频暂时无法播放，请检查视频文件');
      });
    }
  }

  function showIntroEnd(skipped = false) {
    if (!introOverlay.classList.contains('visible')) return;
    introVideo.pause();
    introVideo.controls = false;
    introVideoHint.classList.remove('visible');
    introVideoHint.setAttribute('aria-hidden', 'true');
    introEndState.classList.toggle('from-video', !skipped);
    introEndState.classList.toggle('from-skip', skipped);
    introEndState.classList.add('visible');
    introEndState.setAttribute('aria-hidden', 'false');
    introSkip.classList.remove('visible');
    introSkip.setAttribute('aria-hidden', 'true');
  }

  function beginIntroVideo() {
    if (!introOverlay.classList.contains('visible')) return;
    introLead.classList.remove('visible');
    introLead.setAttribute('aria-hidden', 'true');
    introVideoState.classList.add('visible');
    introVideoState.setAttribute('aria-hidden', 'false');
    introVideo.controls = false;
    introSkip.classList.add('visible');
    introSkip.setAttribute('aria-hidden', 'false');
    introVideo.src = '荆州序幕.mp4';
    introVideo.load();
    introVideo.currentTime = 0;
    playIntroVideo();
  }

  function startIntro() {
    clearTimeout(introTimer);
    pauseMusic();
    introOverlay.classList.add('visible');
    introOverlay.setAttribute('aria-hidden', 'false');
    introLead.classList.add('visible');
    introLead.setAttribute('aria-hidden', 'false');
    introVideoState.classList.remove('visible');
    introVideoState.setAttribute('aria-hidden', 'true');
    introEndState.classList.remove('visible', 'from-video', 'from-skip');
    introEndState.setAttribute('aria-hidden', 'true');
    introSkip.classList.remove('visible');
    introSkip.setAttribute('aria-hidden', 'true');
    introVideoHint.classList.remove('visible');
    introVideoHint.setAttribute('aria-hidden', 'true');
    introVideo.removeAttribute('src');
    introVideo.load();
    introVideo.muted = true;
    introVideo.volume = 1;
    introVideo.currentTime = 0;
    introTimer = window.setTimeout(beginIntroVideo, 1100);
  }

  function enterGameFromIntro() {
    clearTimeout(introTimer);
    introVideo.pause();
    introOverlay.classList.remove('visible');
    introOverlay.setAttribute('aria-hidden', 'true');
    introEndState.classList.remove('visible', 'from-video', 'from-skip');
    introEndState.setAttribute('aria-hidden', 'true');
    introVideoState.classList.remove('visible');
    introVideoState.setAttribute('aria-hidden', 'true');
    introVideo.removeAttribute('src');
    phaseLabel.textContent = '请选择第一站';
    setMode('map');
    startMusic();
  }

  function updateRouteUi() {
    clearedZones.forEach((zone, index) => zone.classList.toggle('visible', index < state.nextLevel));
    clearedSeams.forEach((seam) => {
      const firstLevel = Number(seam.dataset.levelA);
      const secondLevel = Number(seam.dataset.levelB);
      seam.classList.toggle('visible', firstLevel < state.nextLevel && secondLevel < state.nextLevel);
    });
    mapMarkers.forEach((marker, index) => {
      const available = index === state.nextLevel && !state.completed;
      marker.classList.toggle('available', available);
      marker.classList.toggle('complete', index < state.nextLevel);
      marker.classList.toggle('locked', index > state.nextLevel);
      const status = marker.querySelector('.marker-status');
      status.textContent = index < state.nextLevel ? '已完成' : available ? '当前关卡' : '未解锁';
      marker.disabled = !available;
      marker.setAttribute('aria-label', `${levelConfigs[index].title}，${status.textContent}`);
    });
  }

  function setMode(mode) {
    state.mode = mode;
    const inLevel = mode === 'level';
    mapScene.classList.toggle('inactive', inLevel);
    levelScene.classList.toggle('active', inLevel);
    mapScene.setAttribute('aria-hidden', String(inLevel));
    levelScene.setAttribute('aria-hidden', String(!inLevel));
    joystick.classList.toggle('visible', inLevel && !state.completed);
  }

  function renderParticle(particle, width, height) {
    particle.el.style.left = `${particle.x * width}px`;
    particle.el.style.top = `${particle.y * height}px`;
  }

  function renderCore(width, height) {
    core.style.left = `${state.player.x * width}px`;
    core.style.top = `${state.player.y * height}px`;
  }

  function spawnPollution() {
    if (state.particles.length >= 30) return;
    const side = Math.floor(Math.random() * 4);
    let x; let y;
    if (side === 0) { x = rand(.05, .95); y = rand(.08, .16); }
    if (side === 1) { x = rand(.84, .96); y = rand(.16, .88); }
    if (side === 2) { x = rand(.05, .95); y = rand(.78, .92); }
    if (side === 3) { x = rand(.04, .16); y = rand(.16, .88); }
    const particle = { id: ++state.particleId, x, y, vx: rand(-.025, .025), vy: rand(-.025, .025), drift: rand(1.25, 2.0), el: document.createElement('span') };
    particle.el.className = 'particle kind-1';
    particle.el.dataset.id = particle.id;
    particleLayer.appendChild(particle.el);
    state.particles.push(particle);
  }

  function removeParticle(particle) {
    particle.el.remove();
    const index = state.particles.indexOf(particle);
    if (index >= 0) state.particles.splice(index, 1);
  }

  function createCleanBurst(x, y) {
    const width = field.clientWidth; const height = field.clientHeight;
    for (let index = 0; index < 10; index += 1) {
      const burst = document.createElement('span');
      const angle = (Math.PI * 2 * index / 10) + rand(-.15, .15);
      const distance = rand(25, 67);
      burst.className = 'clean-burst';
      burst.style.left = `${x * width}px`; burst.style.top = `${y * height}px`;
      burst.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      burst.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      particleLayer.appendChild(burst);
      setTimeout(() => burst.remove(), 900);
    }
  }

  function setPollution(next) {
    state.levelPollution = clamp(next, 0, 100);
    pollutionValue.textContent = Math.round(state.levelPollution);
    pollutionMeter.style.transform = `scaleX(${state.levelPollution / 100})`;
    if (state.levelPollution <= 20) {
      pollutionMeter.style.background = '#38a885'; airStatus.textContent = '空气清新'; airStatus.style.color = '#2b8d76';
    } else if (state.levelPollution <= 50) {
      pollutionMeter.style.background = '#d6a23d'; airStatus.textContent = '轻度污染'; airStatus.style.color = '#a87825';
    } else {
      pollutionMeter.style.background = '#d26745'; airStatus.textContent = '重度污染'; airStatus.style.color = '#d26745';
    }
    mistLayer.style.opacity = state.levelPollution <= 20 ? .08 : .08 + ((state.levelPollution - 20) / 80) * .92;
    if (state.levelPollution <= 20 && !state.paused) completeLevel();
  }

  function absorbPollution(particle) {
    particle.el.classList.add('absorbing');
    setTimeout(() => { createCleanBurst(particle.x, particle.y); removeParticle(particle); }, 210);
    const progressivePower = Math.max(.6, 3.15 - (state.cleanCount * .085));
    state.cleanCount += 1;
    setPollution(state.levelPollution - progressivePower);
  }

  function distanceToSegment(px, py, ax, ay, bx, by) {
    const abx = bx - ax; const aby = by - ay; const lengthSquared = abx * abx + aby * aby;
    if (lengthSquared === 0) return Math.hypot(px - ax, py - ay);
    const projection = clamp(((px - ax) * abx + (py - ay) * aby) / lengthSquared, 0, 1);
    return Math.hypot(px - (ax + projection * abx), py - (ay + projection * aby));
  }

  function updateParticles(delta, width, height, previousPlayer) {
    const absorbRadius = .065 * state.absorbRange; const pathRadius = .024 * state.absorbRange;
    for (const particle of [...state.particles]) {
      if (particle.el.classList.contains('absorbing')) continue;
      const dxToCore = state.player.x - particle.x; const dyToCore = state.player.y - particle.y;
      const distance = Math.hypot(dxToCore, dyToCore);
      const crossedByCore = distanceToSegment(particle.x, particle.y, previousPlayer.x, previousPlayer.y, state.player.x, state.player.y) < pathRadius;
      if (crossedByCore || distance < absorbRadius) {
        if (crossedByCore && distance > absorbRadius) { particle.x = state.player.x; particle.y = state.player.y; }
        particle.x += dxToCore * .05; particle.y += dyToCore * .05;
        if (crossedByCore || distance < .018) { absorbPollution(particle); continue; }
      } else {
        const wobble = Math.sin(performance.now() / 700 + particle.id) * .00036;
        particle.x += (particle.vx * particle.drift + wobble) * delta;
        particle.y += (particle.vy * particle.drift - wobble) * delta;
        if (distance < state.escapeRadius) {
          const factor = 1 - (distance / state.escapeRadius); const safeDistance = Math.max(distance, .001);
          particle.x += ((particle.x - state.player.x) / safeDistance) * state.escapeSpeed * factor * delta;
          particle.y += ((particle.y - state.player.y) / safeDistance) * state.escapeSpeed * factor * delta;
        }
        if (particle.x < .04 || particle.x > .96) particle.vx *= -1;
        if (particle.y < .06 || particle.y > .92) particle.vy *= -1;
        particle.x = clamp(particle.x, .03, .97); particle.y = clamp(particle.y, .05, .93);
      }
      renderParticle(particle, width, height);
    }
  }

  function updatePlayer(delta, width, height) {
    let dx = 0; let dy = 0;
    if (state.keys.has('w') || state.keys.has('arrowup')) dy -= 1;
    if (state.keys.has('s') || state.keys.has('arrowdown')) dy += 1;
    if (state.keys.has('a') || state.keys.has('arrowleft')) dx -= 1;
    if (state.keys.has('d') || state.keys.has('arrowright')) dx += 1;
    if (state.joystick.active) { dx += state.joystick.x; dy += state.joystick.y; }
    if (!dx && !dy) return;
    const length = Math.hypot(dx, dy) || 1;
    state.player.x = clamp(state.player.x + (dx / length) * state.player.speed * delta, .055, .945);
    state.player.y = clamp(state.player.y + (dy / length) * state.player.speed * delta * (width / height), .08, .9);
    fieldHint.classList.add('is-hidden');
  }

  function setJoystickVector(event) {
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxDistance = rect.width * .31;
    const offsetX = event.clientX - centerX;
    const offsetY = event.clientY - centerY;
    const distance = Math.hypot(offsetX, offsetY) || 1;
    const scale = Math.min(1, maxDistance / distance);
    const knobX = offsetX * scale;
    const knobY = offsetY * scale;
    state.joystick.x = knobX / maxDistance;
    state.joystick.y = knobY / maxDistance;
    joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
  }

  function resetJoystick() {
    state.joystick.x = 0;
    state.joystick.y = 0;
    state.joystick.active = false;
    joystickKnob.style.transform = 'translate(0, 0)';
  }

  function clearParticles() {
    state.particles.forEach(particle => particle.el.remove()); state.particles = [];
    particleLayer.querySelectorAll('.clean-burst').forEach(burst => burst.remove());
  }

  function startLevel(index) {
    if (index !== state.nextLevel || state.completed) return;
    const config = levelConfigs[index];
    state.currentLevel = index; state.paused = false; state.levelPollution = 100; state.cleanCount = 0;
    state.spawnTimer = 0; state.player = { x: .5, y: .54, speed: .42 };
    clearParticles(); levelScene.classList.remove('complete-view'); levelBackground.style.backgroundImage = `url("${config.image}")`;
    levelNumber.textContent = `${String(index + 1).padStart(2, '0')} / 04`; levelTitle.textContent = config.title; levelObjective.textContent = '清除雾霾至 20';
    phaseLabel.textContent = `${config.title}清雾中`; setMode('level'); setPollution(100);
    for (let count = 0; count < 18; count += 1) spawnPollution();
    updateRouteUi(); showToast(`进入${config.title}，开始清除雾霾`); field.focus({ preventScroll: true });
  }

  function completeLevel() {
    if (state.paused || state.mode !== 'level') return;
    state.paused = true; phaseLabel.textContent = `${levelConfigs[state.currentLevel].title}已恢复清晰`; mistLayer.style.opacity = 0;
    state.particles.forEach(particle => particle.el.classList.add('absorbing')); setTimeout(showVideoOverlay, 520);
  }

  function showVideoOverlay() {
    const config = levelConfigs[state.currentLevel]; const isFinal = state.currentLevel === levelConfigs.length - 1;
    state.videoPurpose = 'level';
    pauseMusic();
    promoVideo.pause();
    promoVideo.src = config.video;
    promoVideo.muted = false;
    promoVideo.volume = 1;
    promoVideo.controls = true;
    promoVideo.currentTime = 0;
    promoVideo.setAttribute('aria-label', `${config.title}宣传视频`);
    videoKicker.textContent = isFinal ? '荆州全局宣传视频' : `${config.title}宣传视频`;
    videoContinue.textContent = isFinal ? '雾已散，荆州见' : '回到总地图，开始下一步探索';
    videoEndState.classList.remove('final-video-end');
    videoEndState.classList.remove('visible');
    videoEndState.setAttribute('aria-hidden', 'true');
    videoOverlay.classList.add('visible'); videoOverlay.setAttribute('aria-hidden', 'false');
    const playPromise = promoVideo.play();
    if (playPromise) playPromise.catch(() => showToast('请点击视频开始播放'));
  }

  promoVideo.addEventListener('ended', () => {
    promoVideo.controls = false;
    videoEndState.classList.add('visible');
    videoEndState.setAttribute('aria-hidden', 'false');
  });

  promoVideo.addEventListener('error', () => showToast('宣传视频加载失败，请检查文件路径'));

  function showFinalVideo() {
    state.videoPurpose = 'campaign-end';
    pauseMusic();
    promoVideo.pause();
    promoVideo.src = '荆州终章.mp4';
    promoVideo.muted = false;
    promoVideo.volume = 1;
    promoVideo.controls = true;
    promoVideo.currentTime = 0;
    promoVideo.setAttribute('aria-label', '荆州全局结尾视频');
    videoKicker.textContent = '荆州全局结尾视频';
    videoContinue.textContent = '再次探索';
    videoEndState.classList.add('final-video-end');
    videoEndState.classList.remove('visible');
    videoEndState.setAttribute('aria-hidden', 'true');
    videoOverlay.classList.add('visible');
    videoOverlay.setAttribute('aria-hidden', 'false');
    const playPromise = promoVideo.play();
    if (playPromise) playPromise.catch(() => showToast('请点击视频开始播放'));
  }

  introVideo.addEventListener('ended', () => showIntroEnd(false));
  introVideo.addEventListener('error', () => showToast('开场视频加载失败，请检查文件路径'));

  function returnToMap() {
    if (state.videoPurpose === 'campaign-end') {
      promoVideo.pause();
      pauseMusic();
      videoOverlay.classList.remove('visible');
      videoOverlay.setAttribute('aria-hidden', 'true');
      videoEndState.classList.remove('visible', 'final-video-end');
      videoEndState.setAttribute('aria-hidden', 'true');
      resetCampaign();
      startIntro();
      return;
    }
    promoVideo.pause();
    videoEndState.classList.remove('visible');
    videoEndState.setAttribute('aria-hidden', 'true');
    state.nextLevel = state.currentLevel + 1;
    if (state.nextLevel >= levelConfigs.length) {
      videoOverlay.classList.remove('visible'); videoOverlay.setAttribute('aria-hidden', 'true');
      finishCampaign();
      showFinalVideo();
      return;
    }
    startMusic();
    state.paused = false; state.currentLevel = -1; clearParticles(); setMode('map'); phaseLabel.textContent = '请选择下一站';
    pollutionValue.textContent = '—'; pollutionMeter.style.transform = 'scaleX(0)'; airStatus.textContent = '等待进入'; airStatus.style.color = 'var(--ink-soft)';
    updateRouteUi(); videoOverlay.classList.remove('visible'); videoOverlay.setAttribute('aria-hidden', 'true');
    showToast(`下一站已解锁：${levelConfigs[state.nextLevel].title}`);
  }

  function finishCampaign() {
    state.completed = true; state.paused = true; state.currentLevel = -1; state.nextLevel = levelConfigs.length;
    clearParticles(); mapScene.classList.add('final-clear'); setMode('map'); phaseLabel.textContent = '荆州全城已恢复清晰';
    pollutionValue.textContent = '0'; pollutionMeter.style.transform = 'scaleX(0)'; airStatus.textContent = '全城清晰'; airStatus.style.color = '#2b8d76';
    updateRouteUi();
  }

  function resetCampaign() {
    state.mode = 'map'; state.paused = false; state.completed = false; state.currentLevel = -1; state.nextLevel = 0;
    state.levelPollution = 100; state.cleanCount = 0; state.lastFrame = performance.now(); state.spawnTimer = 0;
    state.player = { x: .5, y: .54, speed: .42 }; state.joystick = { x: 0, y: 0, active: false }; clearParticles(); levelScene.classList.remove('complete-view'); mapScene.classList.remove('final-clear'); mistLayer.style.opacity = 1;
    promoVideo.pause(); pauseMusic(); videoOverlay.classList.remove('visible'); videoOverlay.setAttribute('aria-hidden', 'true'); videoEndState.classList.remove('visible', 'final-video-end'); state.videoPurpose = 'level'; setMode('map');
    pollutionValue.textContent = '—'; pollutionMeter.style.transform = 'scaleX(0)'; airStatus.textContent = '等待进入'; airStatus.style.color = 'var(--ink-soft)'; phaseLabel.textContent = '请选择第一站'; updateRouteUi();
  }

  function gameLoop(now) {
    const delta = Math.min((now - state.lastFrame) / 1000, .05); state.lastFrame = now;
    const width = field.clientWidth; const height = field.clientHeight;
    if (state.mode === 'level' && !state.paused) {
      const previousPlayer = { x: state.player.x, y: state.player.y };
      updatePlayer(delta, width, height); state.spawnTimer += delta * 1000;
      if (state.spawnTimer >= state.spawnInterval) { state.spawnTimer = 0; spawnPollution(); }
      updateParticles(delta, width, height, previousPlayer);
    }
    renderCore(width, height); requestAnimationFrame(gameLoop);
  }

  mapMarkers.forEach((marker, index) => marker.addEventListener('click', () => { startMusic(); startLevel(index); }));
  videoContinue.addEventListener('click', returnToMap);
  introSkip.addEventListener('click', () => showIntroEnd(true));
  beginClean.addEventListener('click', enterGameFromIntro);
  document.addEventListener('pointerdown', () => {
    if (introOverlay.classList.contains('visible') && introVideoState.classList.contains('visible') && introVideo.muted) {
      introVideo.muted = false;
    }
    if (!videoOverlay.classList.contains('visible') && !introOverlay.classList.contains('visible')) startMusic();
  }, { passive: true });
  joystick.addEventListener('pointerdown', event => {
    if (state.mode !== 'level' || state.paused || state.completed) return;
    startMusic();
    state.joystick.active = true;
    joystick.setPointerCapture(event.pointerId);
    setJoystickVector(event);
    fieldHint.classList.add('is-hidden');
  });
  joystick.addEventListener('pointermove', event => {
    if (state.joystick.active) setJoystickVector(event);
  });
  joystick.addEventListener('pointerup', resetJoystick);
  joystick.addEventListener('pointercancel', resetJoystick);
  window.addEventListener('keydown', event => {
    if (!videoOverlay.classList.contains('visible') && !introOverlay.classList.contains('visible')) startMusic();
    const key = event.key.toLowerCase();
    if (!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) return;
    event.preventDefault(); if (state.mode !== 'level' || state.paused || state.completed) return;
    state.keys.add(key); field.focus({ preventScroll: true });
  });
  window.addEventListener('keyup', event => state.keys.delete(event.key.toLowerCase()));
  field.addEventListener('pointerdown', () => field.focus({ preventScroll: true }));
  resetCampaign();
  startIntro();
  requestAnimationFrame(gameLoop);
})();
