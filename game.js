(() => {
  const field = document.getElementById('playfield');
  const mapScene = document.getElementById('mapScene');
  const levelScene = document.getElementById('levelScene');
  const museumPlaceholder = document.getElementById('museumPlaceholder');
  const museumVideoPlaceholder = document.getElementById('museumVideoPlaceholder');
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

  const STORAGE_KEY = 'wusan-jingzhou:exploration';
  const SAVE_VERSION = 1;
  const albumDialog = document.getElementById('albumDialog');
  const discoveryDialog = document.getElementById('discoveryDialog');
  const saveNotice = document.getElementById('saveNotice');
  let runToken = 0;
  let completionTimer = null;
  let discoveryLevel = null;
  const levelConfigs = [
    { id: 'guanyu', taskType: 'free-clean', taskName: '清雾守护', taskSummary: '忠义文化发现：忠诚、信义与责任。', title: '关羽祠', theme: '三国忠义文化', mark: '忠义印记',
      description: '关羽与荆州有着深厚的历史文化联系，忠义精神也是当地三国文化记忆的一部分。走近关羽祠，以忠诚、信义与责任为线索，思考传统文化如何走入今天的生活。这一页荆州记忆，留给愿意守护承诺的探索者。',
      source: 'https://wlt.hubei.gov.cn/bmdt/ztzl/mzyj/202309/t20230920_4860952.shtml',
      image: '关羽祠-关卡背景.png', video: '关羽祠.mp4' },
    { id: 'binyang', taskType: 'area-explore', taskName: '古城寻迹', taskSummary: '建筑观察主题：城门、城墙、楼阁。区域划分为游戏观察任务。', title: '宾阳楼', theme: '荆州古城文化', mark: '古城印记',
      description: '宾阳楼坐落于荆州古城东门，是古城的标志性建筑之一。城楼采用重檐歇山式屋顶，与城墙共同勾勒古城轮廓。观察屋顶、城门与城墙的关系，在建筑细节中发现历史留下的印记，也认识保护城市文化景观的意义。',
      source: 'https://wlt.hubei.gov.cn/bmdt/ztzl/mzyj/202309/t20230920_4860952.shtml',
      image: '宾阳楼-关卡背景.png', video: '宾阳楼.mp4' },
    { id: 'zhangjuzheng', taskType: 'clue-collect', taskName: '文化寻踪', taskSummary: '文化线索：张居正、明代改革、责任与革新。线索图标为游戏叙事道具。', title: '张居正故居', theme: '历史人物与改革精神', mark: '革新印记',
      description: '张居正是明代著名政治家、改革家，与荆州有着深厚联系。张居正故居为了解这位历史人物提供了文化窗口。沿着人物与改革的线索，关注面对问题时的思考、担当与求变，让历史中的改革精神成为这一页探索的主题。',
      source: 'https://wlt.hubei.gov.cn/bmdt/ztzl/mzyj/202309/t20230920_4860952.shtml',
      image: '张居正故居-关卡背景.png', video: '张居正故居.mp4' },
    // 正式素材到位后填写 image 和 video；空路径使用开发占位。
    { id: 'museum', taskType: 'artifact-observe', taskName: '文物探秘', taskSummary: '观察主题：轮廓、纹样与保护记录。本轮使用开发示意卡，非真实馆藏。', title: '荆州博物馆', theme: '荆楚文明与文化传承', mark: '传承印记',
      description: '荆州博物馆是认识荆楚文化的窗口。文物让人们得以接近过去，也连接着今天的文化生活。以文明传承为线索，思考收藏、展示与保护文物的意义：让文化记忆被看见，也让更多人有机会理解并珍惜它。',
      source: 'https://wlt.hubei.gov.cn/bmdt/szyw/jz/202509/t20250924_5778292.shtml',
      image: '', video: '' }
  ];
  let completedLevels = Object.fromEntries(levelConfigs.map(level => [level.id, false]));

  function completedCount() { return levelConfigs.filter(level => completedLevels[level.id]).length; }
  function storageMessage(text) { saveNotice.textContent = text; saveNotice.hidden = !text; }
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const save = JSON.parse(raw);
      if (!save || save.version !== SAVE_VERSION || !save.completed || typeof save.completed !== 'object' || Array.isArray(save.completed)) throw new Error('invalid save');
      for (const level of levelConfigs) {
        if (typeof save.completed[level.id] !== 'boolean') throw new Error('invalid level');
      }
      completedLevels = Object.fromEntries(levelConfigs.map(level => [level.id, save.completed[level.id]]));
    } catch (_) { storageMessage('存档无法读取，已安全初始化。本次探索仍可进行；重新完成关卡后将尝试保存。'); }
  }
  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SAVE_VERSION, completed: completedLevels }));
      storageMessage('');
    } catch (_) { storageMessage('浏览器暂时无法保存进度，本次页面内的印记仍保留；关闭页面后可能丢失。'); }
  }

  const state = {
    mode: 'map', paused: false, currentLevel: -1,
    levelPollution: 100, cleanCount: 0, lastFrame: performance.now(), spawnTimer: 0,
    spawnInterval: 760, absorbRange: 1, escapeRadius: .16, escapeSpeed: .055,
    player: { x: .5, y: .54, speed: .42 }, keys: new Set(), joystick: { x: 0, y: 0, active: false },
    particles: [], particleId: 0, videoPurpose: 'level'
  };


  // 任务只保存本次挑战的临时状态；通关成果仍使用原来的四个稳定 ID。
  const taskLayer = document.getElementById('taskLayer');
  const taskPanel = document.getElementById('taskPanel');
  const taskProgress = document.getElementById('taskProgress');
  const taskHelp = document.getElementById('taskHelp');
  const taskFeedback = document.getElementById('taskFeedback');
  const artifactDialog = document.getElementById('artifactDialog');
  const artifactOpen = document.getElementById('artifactOpen');
  const visitedTutorials = new Set();
  let task = null;
  const targetPositions = [{x:.24,y:.42}, {x:.76,y:.44}, {x:.50,y:.73}];
  const areaTexts = [
    ['城门', '城门是观察古城出入口与城市空间的线索。这里的区域划分是游戏任务，不代表建筑实测位置。'],
    ['城墙', '城墙与城楼共同构成古城轮廓。观察它们的关系，也思考文化景观为何值得保护。'],
    ['楼阁', '宾阳楼采用重檐歇山式屋顶。可结合文化发现中的官方资料，继续观察建筑特色。']
  ];
  const clueTexts = [
    ['人物线索：张居正', '张居正是明代著名政治家、改革家，与荆州有着深厚联系。'],
    ['历史线索：明代改革', '以张居正的改革活动为阅读线索，了解历史人物如何回应时代问题。'],
    ['文化线索：责任与革新', '责任与求变是本次文化探索的主题。这枚图标是游戏叙事道具，并非真实文物。']
  ];
  function blockingDialog() { return artifactDialog.open || albumDialog.open || discoveryDialog.open; }
  function initTask(config) {
    task = {type:config.taskType, targets:[], inspected:new Set(), answerPassed:false, artifactOpened:false};
    taskLayer.replaceChildren(); taskPanel.hidden = false; taskFeedback.textContent = '';
    document.getElementById('taskName').textContent = config.taskName;
    artifactOpen.hidden = true;
    if (task.type === 'free-clean') {
      taskHelp.textContent = visitedTutorials.has(config.id) || completedLevels[config.id]
        ? '自由移动，迷雾浓度降至 20 即可完成。'
        : '使用 WASD、方向键或虚拟摇杆移动，靠近迷雾粒子即可驱散。';
      visitedTutorials.add(config.id);
    } else if (task.type === 'artifact-observe') {
      taskHelp.textContent = '使用 WASD、方向键或摇杆清雾至 20，再观察示意卡并完成一道判断题。';
      document.querySelectorAll('[data-inspect]').forEach(b=>{ b.disabled=false; b.classList.remove('inspected'); });
      document.querySelectorAll('[data-answer]').forEach(b=>b.disabled=true);
      document.getElementById('artifactDetail').textContent = '请选择三个观察点，阅读轮廓、纹样和保护记录。';
      document.getElementById('artifactFeedback').textContent = '';
    } else {
      const texts = task.type === 'area-explore' ? areaTexts : clueTexts;
      taskHelp.textContent = task.type === 'area-explore'
        ? '移动到任一标记附近，驱散局部粒子。三个区域可任意顺序探索（游戏化划分）。'
        : '移动到线索雾区清雾；揭示后靠近收集，或点击／触摸／Tab + Enter 收集。图标为虚构道具。';
      targetPositions.forEach((position,i)=>{
        const el=document.createElement('button'); el.type='button'; el.className='task-target';
        el.style.left=`${position.x*100}%`; el.style.top=`${position.y*100}%`;
        const label=document.createElement('span'); const progress=document.createElement('span');
        el.append(label,progress); taskLayer.append(el);
        const target={...position, index:i, count:0, revealed:false, done:false, el,label,progress, name:texts[i][0], text:texts[i][1]};
        task.targets.push(target);
        // 区域按钮仅显示提示；线索只有实际清雾揭示后才能收集。
        el.addEventListener('click',()=>{ if(task?.targets[i] !== target || state.paused) return;
          if(target.done) taskFeedback.textContent=`${target.name}：${target.text}`;
          else if(task.type==='clue-collect' && target.revealed) collectClue(target);
          else taskFeedback.textContent=`${target.name}：请移动到雾区，靠近粒子驱散迷雾。`;
        });
        for(let n=0;n<8;n++) {
          const angle=2*Math.PI*n/8;
          const particle={id:++state.particleId,x:position.x+Math.cos(angle)*.065,y:position.y+Math.sin(angle)*.075,
            vx:0,vy:0,drift:0,taskTarget:target,el:document.createElement('span')};
          particle.el.className='particle kind-1 local-task-particle'; particle.el.dataset.id=particle.id;
          particleLayer.append(particle.el); state.particles.push(particle);
        }
      });
    }
    renderTask();
  }
  function creditLocalMist(particle) {
    const target=particle.taskTarget;
    if(!task || !target || !task.targets.includes(target) || target.revealed || target.done) return;
    target.count=Math.min(6,target.count+1);
    if(target.count===6) {
      target.revealed=true;
      if(task.type==='area-explore') {target.done=true; taskFeedback.textContent=`${target.name}已探索：${target.text}`;}
      else taskFeedback.textContent=`已发现${target.name}。靠近图标或点击收集。`;
    }
    renderTask();
  }
  function collectClue(target) {
    if(!task || task.type!=='clue-collect' || !task.targets.includes(target) || !target.revealed || target.done || state.mode!=='level' || state.paused || blockingDialog()) return;
    target.done=true; taskFeedback.textContent=`已收集${target.name}：${target.text}`;
    renderTask(); checkTaskCompletion();
  }
  function renderTask() {
    if(!task) return;
    const count=task.targets.filter(t=>t.done).length;
    if(task.type==='free-clean') taskProgress.textContent=`迷雾浓度：${Math.round(state.levelPollution)} / 目标 ≤ 20`;
    else if(task.type==='artifact-observe') taskProgress.textContent=state.levelPollution<=20 ? '清雾完成 · 待完成观察挑战' : '清雾至 20，解锁观察卡';
    else {
      taskProgress.textContent=`${task.type==='area-explore'?'古城探索':'文化线索'}：${count}/3`;
      for(const target of task.targets) {
        target.el.classList.toggle('done',target.done); target.el.classList.toggle('revealed',target.revealed);
        target.label.textContent=task.type==='clue-collect' && !target.revealed ? `线索雾区 ${target.index+1}` : target.name;
        target.progress.textContent=target.done ? (task.type==='area-explore'?'已探索':'已收集') : target.revealed ? '已发现 · 收集' : `清雾 ${Math.round(target.count/6*100)}%`;
        target.el.setAttribute('aria-label',`${target.label.textContent}，${target.progress.textContent}`);
      }
      // 在原有迷雾层上开渐进式观察窗口，图片本身不作修改。
      mistLayer.style.maskImage=task.targets.map(t=>`radial-gradient(ellipse 16% 20% at ${t.x*100}% ${t.y*100}%, rgba(0,0,0,${1-t.count/6}) 60%, #000 100%)`).join(',');
      mistLayer.style.maskComposite='intersect';
    }
  }
  function taskSatisfied() {
    if(!task) return false;
    if(task.type==='free-clean') return state.levelPollution<=20;
    if(task.type==='area-explore' || task.type==='clue-collect') return task.targets.length===3 && task.targets.every(t=>t.done);
    return state.levelPollution<=20 && task.answerPassed;
  }
  function checkTaskCompletion() {
    if(state.mode!=='level' || state.paused || !task) return;
    if(taskSatisfied()) {completeLevel(); return;}
    if(task.type==='artifact-observe' && state.levelPollution<=20) {
      artifactOpen.hidden=false;
      if(!task.artifactOpened) {task.artifactOpened=true; openArtifact();}
    }
  }
  function updateTask() {
    if(!task || state.paused || blockingDialog()) return;
    if(task.type==='clue-collect') for(const target of task.targets) {
      if(target.revealed && !target.done && Math.hypot(state.player.x-target.x,state.player.y-target.y)<.04) collectClue(target);
    }
    checkTaskCompletion();
  }
  function openArtifact() {
    if(!task || task.type!=='artifact-observe' || state.mode!=='level' || state.paused || state.levelPollution>20 || artifactDialog.open) return;
    state.keys.clear(); resetJoystick(); artifactDialog.showModal();
  }
  const observationDetails={
    silhouette:'轮廓观察：图中的轮廓是开发示意图，不对应真实文物。正式名称、年代和图片待核实后补充。',
    pattern:'纹样观察：示意图用线条表示观察点，不代表真实馆藏纹饰。观察应与可靠的展品说明结合。',
    record:'保护记录：这张开发卡建议“记录观察信息，保持原状，不随意触摸”。记录与保护让文化记忆得以传递。'
  };
  document.querySelectorAll('[data-inspect]').forEach(button=>button.addEventListener('click',()=>{
    if(!task || !artifactDialog.open || task.type!=='artifact-observe') return;
    task.inspected.add(button.dataset.inspect); button.classList.add('inspected');
    document.getElementById('artifactDetail').textContent=observationDetails[button.dataset.inspect];
    document.getElementById('artifactFeedback').textContent=`已观察：${task.inspected.size}/3`;
    if(task.inspected.size===3) document.querySelectorAll('[data-answer]').forEach(b=>b.disabled=false);
  }));
  document.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
    if(!task || !artifactDialog.open || task.inspected.size!==3 || task.answerPassed) return;
    if(button.dataset.answer!=='record') {document.getElementById('artifactFeedback').textContent='再查看“保护记录”观察点，答案就在刚才的信息中。可以继续尝试。'; return;}
    task.answerPassed=true; artifactDialog.close(); checkTaskCompletion();
  }));
  artifactOpen.addEventListener('click',openArtifact);
  document.getElementById('artifactResume').addEventListener('click',()=>artifactDialog.close());
  document.getElementById('artifactExit').addEventListener('click',returnToMap);
  [artifactDialog,albumDialog,discoveryDialog].forEach(dialog=>dialog.addEventListener('close',()=>{state.keys.clear(); resetJoystick();}));

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
    phaseLabel.textContent = '自由选择文化地标';
    setMode('map');
    startMusic();
  }

  function updateRouteUi() {
    const done = index => Boolean(completedLevels[levelConfigs[index].id]);
    clearedZones.forEach((zone, index) => zone.classList.toggle('visible', done(index)));
    clearedSeams.forEach(seam => seam.classList.toggle('visible', done(Number(seam.dataset.levelA)) && done(Number(seam.dataset.levelB))));
    mapScene.classList.toggle('final-clear', completedCount() === 4);
    mapMarkers.forEach((marker, index) => {
      marker.classList.add('available'); marker.classList.remove('locked');
      marker.classList.toggle('complete', done(index)); marker.disabled = false;
      marker.querySelector('.marker-status').textContent = done(index) ? '探索完成 · 可重访' : '可探索';
      marker.setAttribute('aria-label', `${levelConfigs[index].title}，${done(index) ? '探索完成，可重访' : '可探索'}`);
    });
    document.getElementById('explorationProgress').textContent = `文化探索进度：${completedCount()}/4`;
    document.getElementById('albumOpen').textContent = `荆州印象册 · ${completedCount()}/4`;
    document.getElementById('collectionMessage').hidden = completedCount() !== 4;
  }
  function renderAlbum() {
    document.getElementById('journeyReview').hidden = completedCount() !== 4;
    document.getElementById('albumProgress').textContent = `已收集：${completedCount()}/4`;
    const cards = document.getElementById('albumCards'); cards.replaceChildren();
    for (const level of levelConfigs) {
      const done = completedLevels[level.id];
      const card = document.createElement('article'); card.className = `album-card ${done ? 'unlocked' : 'unexplored'}`; card.dataset.levelId = level.id;
      const title = document.createElement('h3'); title.textContent = level.title; card.append(title);
      if (done) {
        const badge = document.createElement('p'); badge.className = 'culture-mark'; badge.textContent = level.mark; card.append(badge);
        const theme = document.createElement('p'); theme.textContent = level.theme; card.append(theme);
        if (level.image) { const img = document.createElement('img'); img.src = level.image; img.alt = `${level.title}艺术化游戏场景，非实景照片`; card.append(img); }
        else { const placeholder = document.createElement('div'); placeholder.className = 'album-image-placeholder'; placeholder.textContent = '荆州博物馆素材待补充'; card.append(placeholder); }
        const description = document.createElement('p'); description.textContent = level.description; card.append(description);
        const taskNote = document.createElement('p'); taskNote.textContent = level.taskSummary; card.append(taskNote);
        const note = document.createElement('small'); note.textContent = '探索完成 · 图片为艺术化游戏场景'; card.append(note);
        const source = document.createElement('a'); source.href = level.source; source.target = '_blank'; source.rel = 'noopener noreferrer'; source.textContent = level.id === 'museum' ? '了解更多楚文化（官方报道）' : '了解更多文化（官方景区介绍）'; card.append(source);
      } else { const locked = document.createElement('p'); locked.textContent = '尚未探索 · 文化页面未解锁'; card.append(locked); }
      cards.append(card);
    }
  }
  function openAlbum() { state.keys.clear(); resetJoystick(); renderAlbum(); albumDialog.showModal(); }
  function showDiscovery(index, firstCompletion = false) {
    const level = levelConfigs[index]; discoveryLevel = index;
    document.getElementById('discoveryTitle').textContent = `${level.title} · 文化发现`;
    document.getElementById('discoveryMark').textContent = `${firstCompletion ? '获得' : '已拥有'}${level.mark}`;
    document.getElementById('discoveryTheme').textContent = level.theme;
    document.getElementById('discoveryDescription').textContent = level.description;
    document.getElementById('discoveryTask').textContent = level.taskSummary;
    const more = document.getElementById('discoveryMore');
    more.href = level.source;
    more.textContent = level.id === 'museum' ? '了解更多文化 · 楚文化官方报道 ↗' : `了解更多文化 · ${level.title} ↗`;
    document.getElementById('discoverySourceNote').textContent = level.id === 'museum' ? '资料范围：楚文化专题报道，非博物馆专属介绍。' : '资料范围：官方古城介绍，含宾阳楼、张居正故居等景点。';
    document.getElementById('discoveryAll').hidden = completedCount() !== 4;
    document.getElementById('discoveryVideo').textContent = level.video ? '观看现有艺术化视频（可跳过）' : '查看素材占位';
    discoveryDialog.showModal();
  }

  function setMode(mode) {
    state.mode = mode;
    const inLevel = mode === 'level';
    mapScene.classList.toggle('inactive', inLevel);
    levelScene.classList.toggle('active', inLevel);
    mapScene.setAttribute('aria-hidden', String(inLevel));
    levelScene.setAttribute('aria-hidden', String(!inLevel));
    joystick.classList.toggle('visible', inLevel);
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
      pollutionMeter.style.background = '#38a885'; airStatus.textContent = '迷雾消散'; airStatus.style.color = '#2b8d76';
    } else if (state.levelPollution <= 50) {
      pollutionMeter.style.background = '#d6a23d'; airStatus.textContent = '薄雾状态'; airStatus.style.color = '#a87825';
    } else {
      pollutionMeter.style.background = '#d26745'; airStatus.textContent = '浓雾状态'; airStatus.style.color = '#d26745';
    }
    mistLayer.style.opacity = state.levelPollution <= 20 ? .08 : .08 + ((state.levelPollution - 20) / 80) * .92;
    renderTask(); checkTaskCompletion();
  }

  function absorbPollution(particle) {
    particle.el.classList.add('absorbing');
    const token = runToken;
    setTimeout(() => { if (token !== runToken) return; createCleanBurst(particle.x, particle.y); removeParticle(particle); }, 210);
    creditLocalMist(particle);
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
      if (state.paused || blockingDialog()) break;
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
        if (!particle.taskTarget && distance < state.escapeRadius) {
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
    if (!levelConfigs[index] || state.mode !== 'map') return;
    clearTimeout(completionTimer); runToken += 1; state.keys.clear(); resetJoystick(); fieldHint.classList.remove('is-hidden');
    const config = levelConfigs[index];
    state.currentLevel = index; state.paused = false; state.levelPollution = 100; state.cleanCount = 0;
    state.spawnTimer = 0; state.player = { x: .5, y: .54, speed: .42 };
    clearParticles(); levelScene.classList.remove('complete-view'); levelBackground.style.backgroundImage = config.image ? `url("${config.image}")` : 'none';
    museumPlaceholder.hidden = Boolean(config.image);
    levelBackground.classList.toggle('museum-development-background', !config.image);
    levelNumber.textContent = `${String(index + 1).padStart(2, '0')} / 04`; levelTitle.textContent = config.title; levelObjective.textContent = config.taskType === 'area-explore' ? '探索三个区域' : config.taskType === 'clue-collect' ? '收集三条线索' : config.taskType === 'artifact-observe' ? '清雾 + 观察挑战' : '迷雾浓度降至 20';
    document.getElementById('mistGoal').textContent = ['area-explore','clue-collect'].includes(config.taskType) ? '通关条件见文化任务' : '清雾目标 ≤ 20';
    phaseLabel.textContent = `${config.title} · ${config.taskName}`; setMode('level'); initTask(config); setPollution(100);
    for (let count = 0; count < 18; count += 1) spawnPollution();
    updateRouteUi(); showToast(`进入${config.title} · ${config.taskName}`); field.focus({ preventScroll: true });
  }

  function completeLevel() {
    if (state.paused || state.mode !== 'level' || !taskSatisfied()) return;
    state.keys.clear(); resetJoystick();
    const index = state.currentLevel;
    const firstCompletion = !completedLevels[levelConfigs[index].id];
    state.paused = true;
    if (firstCompletion) { completedLevels[levelConfigs[index].id] = true; saveProgress(); }
    const token = runToken;
    completionTimer = setTimeout(() => {
      if (token !== runToken) return;
      returnToMap();
      showDiscovery(index, firstCompletion);
    }, 520);
    phaseLabel.textContent = `${levelConfigs[index].title}探索完成`;
    mistLayer.style.opacity = 0;
    state.particles.forEach(particle => particle.el.classList.add('absorbing'));
    updateRouteUi();
  }

  function showVideoOverlay() {
    const config = levelConfigs[discoveryLevel];
    state.videoPurpose = 'level';
    pauseMusic();
    promoVideo.pause();
    museumVideoPlaceholder.hidden = Boolean(config.video);
    promoVideo.hidden = !config.video;
    if (config.video) promoVideo.src = config.video;
    else { promoVideo.removeAttribute('src'); promoVideo.load(); }
    promoVideo.muted = false;
    promoVideo.volume = 1;
    promoVideo.controls = true;
    promoVideo.currentTime = 0;
    promoVideo.setAttribute('aria-label', `${config.title}宣传视频`);
    videoKicker.textContent = `${config.title} · 艺术化视频`;
    videoContinue.textContent = '跳过视频，返回文化发现';
    videoEndState.classList.remove('final-video-end');
    videoEndState.classList.add('visible');
    videoEndState.setAttribute('aria-hidden', 'false');
    videoOverlay.classList.add('visible'); videoOverlay.setAttribute('aria-hidden', 'false');
    if (!config.video) {
      videoKicker.textContent = `${config.title} · 开发占位`;
      videoContinue.textContent = '返回文化发现';
      videoEndState.classList.add('visible');
      videoEndState.setAttribute('aria-hidden', 'false');
      return;
    }
    const playPromise = promoVideo.play();
    if (playPromise) playPromise.catch(() => showToast('请点击视频开始播放'));
  }

  promoVideo.addEventListener('ended', () => {
    promoVideo.controls = false;
    videoEndState.classList.add('visible');
    videoEndState.setAttribute('aria-hidden', 'false');
  });

  promoVideo.addEventListener('error', () => showToast('宣传视频加载失败，请检查文件路径'));

  introVideo.addEventListener('ended', () => showIntroEnd(false));
  introVideo.addEventListener('error', () => showToast('开场视频加载失败，请检查文件路径'));

  function returnToMap() {
    clearTimeout(completionTimer); completionTimer = null; runToken += 1;
    if (artifactDialog.open) artifactDialog.close();
    task = null; taskLayer.replaceChildren(); taskPanel.hidden = true;
    mistLayer.style.maskImage = ''; mistLayer.style.maskComposite = '';
    state.paused = false; state.currentLevel = -1; state.keys.clear(); resetJoystick();
    state.player = { x: .5, y: .54, speed: .42 }; state.spawnTimer = 0; state.cleanCount = 0; state.lastFrame = performance.now();
    clearParticles(); clearTimeout(showToast.timer); toast.classList.remove('visible');
    fieldHint.classList.remove('is-hidden'); levelScene.classList.remove('complete-view');
    promoVideo.pause(); videoOverlay.classList.remove('visible'); videoOverlay.setAttribute('aria-hidden', 'true');
    setMode('map'); phaseLabel.textContent = '自由选择文化地标';
    pollutionValue.textContent = '—'; pollutionMeter.style.transform = 'scaleX(0)'; airStatus.textContent = '等待探索'; airStatus.style.color = 'var(--ink-soft)';
    updateRouteUi(); startMusic();
  }
  function resetCampaign() {
    if (!window.confirm('确定重置探索进度吗？四枚文化印记与印象册解锁记录将被清除。')) return;
    try { localStorage.removeItem(STORAGE_KEY); storageMessage(''); }
    catch (_) { storageMessage('无法清除浏览器存档，进度未重置。请检查浏览器存储权限后重试。'); return; }
    completedLevels = Object.fromEntries(levelConfigs.map(level => [level.id, false]));
    if (albumDialog.open) albumDialog.close(); if (discoveryDialog.open) discoveryDialog.close();
    discoveryLevel = null; returnToMap(); renderAlbum();
  }

  function gameLoop(now) {
    const delta = Math.min((now - state.lastFrame) / 1000, .05); state.lastFrame = now;
    const width = field.clientWidth; const height = field.clientHeight;
    if (state.mode === 'level' && !state.paused && !blockingDialog()) {
      const previousPlayer = { x: state.player.x, y: state.player.y };
      updatePlayer(delta, width, height); state.spawnTimer += delta * 1000;
      if (state.spawnTimer >= state.spawnInterval) { state.spawnTimer = 0; spawnPollution(); }
      updateParticles(delta, width, height, previousPlayer);
      updateTask();
    }
    renderCore(width, height); requestAnimationFrame(gameLoop);
  }

  mapMarkers.forEach((marker, index) => marker.addEventListener('click', () => { startMusic(); startLevel(index); }));
  videoContinue.addEventListener('click', () => { promoVideo.pause(); videoOverlay.classList.remove('visible'); videoOverlay.setAttribute('aria-hidden', 'true'); showDiscovery(discoveryLevel); });
  document.getElementById('levelExit').addEventListener('click', returnToMap);
  document.getElementById('albumOpen').addEventListener('click', openAlbum);
  document.getElementById('albumClose').addEventListener('click', () => { albumDialog.close(); if (state.mode === 'level') returnToMap(); });
  document.getElementById('discoveryMap').addEventListener('click', () => discoveryDialog.close());
  document.getElementById('discoveryAlbum').addEventListener('click', () => { discoveryDialog.close(); openAlbum(); });
  document.getElementById('discoveryVideo').addEventListener('click', () => { discoveryDialog.close(); showVideoOverlay(); });
  document.getElementById('resetProgress').addEventListener('click', resetCampaign);
  window.addEventListener('blur', () => { state.keys.clear(); resetJoystick(); });
  introSkip.addEventListener('click', () => showIntroEnd(true));
  beginClean.addEventListener('click', enterGameFromIntro);
  document.addEventListener('pointerdown', () => {
    if (introOverlay.classList.contains('visible') && introVideoState.classList.contains('visible') && introVideo.muted) {
      introVideo.muted = false;
    }
    if (!videoOverlay.classList.contains('visible') && !introOverlay.classList.contains('visible')) startMusic();
  }, { passive: true });
  joystick.addEventListener('pointerdown', event => {
    if (state.mode !== 'level' || state.paused || blockingDialog()) return;
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
    if (state.mode !== 'level' || state.paused || blockingDialog()) return;
    event.preventDefault();
    state.keys.add(key); field.focus({ preventScroll: true });
  });
  window.addEventListener('keyup', event => state.keys.delete(event.key.toLowerCase()));
  field.addEventListener('pointerdown', event => { if (!event.target.closest('button, a')) field.focus({ preventScroll: true }); });
  loadProgress();
  returnToMap();
  if (completedCount() === 0) startIntro(); else { introOverlay.classList.remove('visible'); introOverlay.setAttribute('aria-hidden', 'true'); }
  requestAnimationFrame(gameLoop);
})();
