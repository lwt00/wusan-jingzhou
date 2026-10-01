(() => {
  const field = document.getElementById('playfield');
  const particleLayer = document.getElementById('particleLayer');
  const core = document.getElementById('core');
  const mistLayer = document.getElementById('mistLayer');
  const pollutionValue = document.getElementById('pollutionValue');
  const pollutionMeter = document.getElementById('pollutionMeter');
  const airStatus = document.getElementById('airStatus');
  const particleCount = document.getElementById('particleCount');
  const phaseLabel = document.getElementById('phaseLabel');
  const fieldHint = document.getElementById('fieldHint');
  const toast = document.getElementById('toast');
  const quizBackdrop = document.getElementById('quizBackdrop');
  const quizTag = document.getElementById('quizTag');
  const quizProgress = document.getElementById('quizProgress');
  const quizTitle = document.getElementById('quizTitle');
  const quizContext = document.getElementById('quizContext');
  const quizOptions = document.getElementById('quizOptions');
  const quizFeedback = document.getElementById('quizFeedback');
  const quizContinue = document.getElementById('quizContinue');
  const dataRevealOverlay = document.getElementById('dataRevealOverlay');
  const dataRevealScore = document.getElementById('dataRevealScore');
  const dataRevealTitle = document.getElementById('dataRevealTitle');
  const dataRevealSubtitle = document.getElementById('dataRevealSubtitle');
  const dataRevealCopy = document.getElementById('dataRevealCopy');
  const dataRevealEffect = document.getElementById('dataRevealEffect');
  const dataRevealHint = document.getElementById('dataRevealHint');
  const rewardCard = document.getElementById('rewardCard');
  const dataRevealContinue = document.getElementById('dataRevealContinue');
  const completionOverlay = document.getElementById('completionOverlay');
  const restartButton = document.getElementById('restartButton');
  const abilityCards = [...document.querySelectorAll('.ability-card')];

  const abilityConfigs = {
    solar: {
      id: 'solar', tag: '清洁能源', title: '太阳能光伏', subtitle: '让阳光替代一部分燃烧，让污染源少一点。',
      context: '完成 4 道清洁能源题，答对 3 题即可获得太阳能光伏。',
      effect: '雾霾生成速度 −15%', hint: '道具已加入净化能力。', mark: '☼',
      data: '按全国火电平均排放水平估算，每替代 1 千瓦时火电，约可减少烟尘 17 毫克、二氧化硫 83 毫克、氮氧化物 133 毫克。游戏中将这份现实关联转化为生成速度减缓。'
    },
    mobility: {
      id: 'mobility', tag: '绿色出行', title: '绿色出行', subtitle: '少一次短途驾车，就是给城市留出一口清气。',
      context: '完成 4 道绿色出行题，答对 3 题即可获得绿色出行。',
      effect: '吸附范围 +35%', hint: '清气核心感知范围扩大。', mark: '↝',
      data: '公交、步行和骑行会减少短途燃油消耗与尾气排放。出行方式的改变不需要等大型工程，每个人都能让污染源少生成一点。游戏中转化为更大的吸附范围。'
    },
    sorting: {
      id: 'sorting', tag: '资源循环', title: '垃圾分类', subtitle: '让可回收的材料回到循环里，少一点焚烧与填埋压力。',
      context: '完成 4 道资源循环题，答对 3 题即可获得垃圾分类。',
      effect: '每次分解净化量 +0.75', hint: '清气核心分解效率提高。', mark: '✦',
      data: '正确分类能让纸张、金属、玻璃和部分塑料进入资源循环，减少混合垃圾处理压力。游戏中这份持续收益体现为每次分解的净化量提升。'
    }
  };

  const makeQuestion = (title, options, answer, explanation) => ({ title, options, answer, explanation });
  const questionBanks = {
    solar: [
      makeQuestion('如果 1 千瓦时太阳能发电替代 1 千瓦时火电，以下哪类污染物会相应减少？', ['烟尘、二氧化硫和氮氧化物', '氧气、氮气和氦气', '水蒸气、氧气和氮气', '只有二氧化碳'], 0, '太阳能发电不需要燃烧煤炭，替代火电会减少多类燃烧排放。'),
      makeQuestion('光伏板把哪一种能量转化为电能？', ['风的动能', '太阳辐射能', '煤炭的化学能', '地热能'], 1, '光伏电池利用半导体把太阳辐射能直接转成电能。'),
      makeQuestion('二氧化碳在环保科普中通常被称为什么？', ['温室气体', '惰性气体', '稀有气体', '放射性气体'], 0, '二氧化碳会增强温室效应，是能源转型中关注的重要温室气体。'),
      makeQuestion('晴天中午，分布式光伏通常会出现什么情况？', ['发电潜力较高', '完全停止发电', '一定会消耗煤炭', '只产生氧气'], 0, '光照增强时，光伏系统通常具有更高的发电潜力。'),
      makeQuestion('安装储能设备可以帮助光伏解决什么问题？', ['让电能跨时段使用', '让太阳夜间升起', '把空气变成燃料', '增加烟囱排放'], 0, '储能可以把发电和用电在时间上错开，提高可再生能源利用率。'),
      makeQuestion('太阳能发电运行时最直接的特点是什么？', ['不需要现场燃烧燃料', '必须焚烧垃圾', '会持续排放烟尘', '只能使用汽油'], 0, '光伏发电运行时没有现场燃烧过程。'),
      makeQuestion('在建筑上安装光伏板，通常属于哪类能源利用？', ['可再生能源利用', '化石能源开采', '一次性资源消耗', '核燃料加工'], 0, '太阳能来自持续的自然辐射，属于可再生能源。'),
      makeQuestion('减少火电发电量，除了减少二氧化碳，还可能减少什么？', ['烟尘和氮氧化物', '氧气和氮气', '雨水和露水', '氦气和氖气'], 0, '燃烧排放中的颗粒物和氮氧化物也会随替代量减少。'),
      makeQuestion('下列哪一种做法更有利于提高光伏自发自用率？', ['白天优先使用光伏电力', '白天关闭所有用电设备', '夜间打开所有灯', '增加燃油车怠速'], 0, '让用电时间与光伏发电时间匹配，可以减少弃光并提高利用率。'),
      makeQuestion('“绿电”通常指什么？', ['来自可再生能源的电力', '颜色是绿色的电线', '只在森林中使用的电', '由绿色燃料燃烧产生的电'], 0, '绿电通常指风电、光伏、水电等可再生能源发出的电力。')
    ],
    mobility: [
      makeQuestion('在短途出行中优先选择公交或骑行，最直接的作用是什么？', ['减少燃油车尾气排放', '增加道路拥堵', '提高煤炭燃烧量', '让空气中的氧气消失'], 0, '少开一段燃油车，就能减少相应的燃油消耗与尾气排放。'),
      makeQuestion('公交车一次搭载多人，相比多人分别驾车，主要能减少什么？', ['单位乘客的道路占用和排放', '城市绿地面积', '太阳光照', '河流流量'], 0, '公共交通通过共享车辆，降低单位出行的资源消耗。'),
      makeQuestion('骑行最适合替代哪一种出行？', ['较近距离的小汽车出行', '跨省长途货运', '海上运输', '航空运输'], 0, '短距离替代驾车是骑行减少排放的典型应用场景。'),
      makeQuestion('车辆怠速时，发动机通常处于什么状态？', ['仍在消耗燃油并排放尾气', '完全不消耗能源', '自动变成电动车', '会吸收所有颗粒物'], 0, '停车等待时长时间怠速仍会消耗燃油并排放尾气。'),
      makeQuestion('规划连续的骑行路线，除了减少排放，还能帮助什么？', ['提高绿色出行的可达性', '增加尾气浓度', '减少道路安全', '关闭公交系统'], 0, '连续、清晰的路线会降低绿色出行的使用门槛。'),
      makeQuestion('电动公交要实现更好的减排效果，还需要什么条件？', ['使用更清洁的电力并合理充电', '一直空载行驶', '增加燃油发动机', '取消所有线路'], 0, '电动化和清洁电力、合理调度结合，才能形成更好的减排效果。'),
      makeQuestion('步行和骑行属于哪类出行方式？', ['主动出行', '化石能源出行', '高空运输', '工业生产'], 0, '步行和骑行依靠人的活动完成移动，通常被称为主动出行。'),
      makeQuestion('减少一次不必要的驾车出行，首先减少了哪项消耗？', ['燃油或电能消耗', '空气中的氧气储量', '城市河流长度', '太阳能辐射'], 0, '出行距离减少，车辆对应的燃料或电能需求也会减少。'),
      makeQuestion('公共交通站点之间合理换乘，可以减少什么？', ['重复绕行和空驶', '城市树木', '水面面积', '光伏发电量'], 0, '合理换乘能让公共交通更高效，减少不必要的绕行。'),
      makeQuestion('绿色出行的核心目标是什么？', ['用更低排放的方式满足出行需求', '让所有车辆停止运行', '增加单人驾车距离', '把污染转移到河流'], 0, '绿色出行不是停止移动，而是用更低排放的方式完成移动。')
    ],
    sorting: [
      makeQuestion('正确进行垃圾分类，最重要的环境价值是什么？', ['促进资源循环，减少焚烧和填埋压力', '让所有垃圾自动消失', '增加一次性用品使用', '把可回收物变成污染物'], 0, '分类让可回收物进入资源循环，也能减少混合垃圾处理压力。'),
      makeQuestion('废纸通常属于哪类垃圾？', ['可回收物', '有害垃圾', '厨余垃圾', '其他垃圾'], 0, '干净的废纸可以回收再利用。'),
      makeQuestion('废电池不应直接丢入普通垃圾桶，主要因为它可能含有？', ['有害物质', '新鲜空气', '可饮用水', '太阳能电池片'], 0, '部分废电池含有需要专门处理的有害物质。'),
      makeQuestion('厨余垃圾经过处理后，可以转化为什么？', ['堆肥或沼气等资源', '金属矿石', '汽油', '玻璃原片'], 0, '厨余垃圾可通过厌氧消化、堆肥等方式资源化利用。'),
      makeQuestion('减少一次性用品使用，首先可以减少什么？', ['源头产生的垃圾量', '城市公交班次', '太阳光照', '空气中的氮气'], 0, '源头减量通常比产生垃圾后再处理更有效。'),
      makeQuestion('可回收物进入回收体系后，最理想的结果是什么？', ['成为再生资源', '必须全部焚烧', '直接进入河流', '变成不可回收物'], 0, '回收可以让材料重新进入生产和消费循环。'),
      makeQuestion('购买商品时选择简约包装，有助于什么？', ['减少包装废弃物', '增加运输空驶', '提高焚烧量', '减少物品使用寿命'], 0, '简约包装能在消费源头减少废弃物。'),
      makeQuestion('垃圾分类投放前，保持纸盒干燥通常有什么好处？', ['提高回收利用质量', '增加有害性', '让纸盒变成厨余垃圾', '阻止所有回收'], 0, '干燥、洁净的纸类更容易被回收利用。'),
      makeQuestion('“减量、重复使用、回收”体现了什么理念？', ['资源循环利用', '一次性消费', '增加填埋', '扩大污染源'], 0, '这三个方向共同强调从源头减量到材料循环。'),
      makeQuestion('外卖自带餐具或选择无需餐具，主要能减少什么？', ['一次性餐具消耗', '公共交通排放', '太阳能发电量', '城市绿地'], 0, '减少不必要的一次性餐具，是日常可执行的源头减量。')
    ]
  };
  const abilitySequence = ['solar', 'mobility', 'sorting'];

  const state = {
    running: true,
    paused: false,
    completed: false,
    lastFrame: performance.now(),
    spawnTimer: 0,
    spawnInterval: 1180,
    pollution: 100,
    cleanCount: 0,
    nextKnowledgeIndex: 0,
    knowledgeActive: false,
    activeQuiz: null,
    selectedOption: null,
    abilityUnlocked: new Set(),
    absorbRange: 1,
    cleanPowerBonus: 0,
    quizResolved: false,
    quizSuccess: false,
    revealActive: false,
    motionFrom: null,
    player: { x: .50, y: .54, speed: .42 },
    keys: new Set(),
    particles: [],
    particleId: 0
  };

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function shuffle(items) {
    return [...items].sort(() => Math.random() - .5);
  }

  function spawnPollution() {
    if (state.particles.filter(p => !p.knowledge).length >= 30) return;
    const side = Math.floor(Math.random() * 4);
    let x; let y;
    if (side === 0) { x = rand(.05, .95); y = rand(.06, .14); }
    if (side === 1) { x = rand(.84, .96); y = rand(.15, .89); }
    if (side === 2) { x = rand(.05, .95); y = rand(.78, .94); }
    if (side === 3) { x = rand(.04, .16); y = rand(.14, .88); }
    const particle = {
      id: ++state.particleId,
      x, y,
      vx: rand(-.018, .018),
      vy: rand(-.018, .018),
      drift: rand(.95, 1.55),
      radius: 5,
      kind: 1,
      knowledge: false,
      el: document.createElement('span')
    };
    particle.el.className = `particle kind-${particle.kind}`;
    particle.el.dataset.id = particle.id;
    particleLayer.appendChild(particle.el);
    state.particles.push(particle);
  }

  function spawnKnowledgeParticle() {
    if (state.knowledgeActive || state.nextKnowledgeIndex >= abilitySequence.length || state.completed) return;
    const particle = {
      id: ++state.particleId,
      x: rand(.25, .75),
      y: rand(.24, .72),
      vx: rand(-.009, .009),
      vy: rand(-.009, .009),
      drift: .7,
      radius: 9,
      knowledge: true,
      el: document.createElement('span')
    };
    particle.el.className = 'particle knowledge-particle';
    particle.el.dataset.id = particle.id;
    particleLayer.appendChild(particle.el);
    state.particles.push(particle);
    state.knowledgeActive = true;
    showToast('环保行动粒子出现了，捕获它来打开知识卡');
  }

  function renderParticle(particle, width, height) {
    particle.el.style.left = `${particle.x * width}px`;
    particle.el.style.top = `${particle.y * height}px`;
  }

  function renderCore(width, height) {
    core.style.left = `${state.player.x * width}px`;
    core.style.top = `${state.player.y * height}px`;
  }

  function setPollution(next) {
    state.pollution = clamp(next, 0, 100);
    pollutionValue.textContent = Math.round(state.pollution);
    pollutionMeter.style.transform = `scaleX(${state.pollution / 100})`;
    if (state.pollution <= 20) {
      pollutionMeter.style.background = '#38a885';
      airStatus.textContent = '空气清新';
      airStatus.style.color = '#2b8d76';
    } else if (state.pollution <= 50) {
      pollutionMeter.style.background = '#d6a23d';
      airStatus.textContent = '轻度污染';
      airStatus.style.color = '#a87825';
    } else {
      pollutionMeter.style.background = '#d26745';
      airStatus.textContent = '重度污染';
      airStatus.style.color = '#d26745';
    }
    const mistOpacity = state.pollution <= 20 ? .08 : .08 + ((state.pollution - 20) / 80) * .8;
    mistLayer.style.opacity = mistOpacity;
    if (state.nextKnowledgeIndex < quizData.length && state.pollution <= [80, 60, 40][state.nextKnowledgeIndex] && !state.knowledgeActive) {
      spawnKnowledgeParticle();
    }
    if (state.pollution <= 20 && !state.completed) finishGame();
  }

  function updateCardState(id, unlocked) {
    const card = abilityCards.find(item => item.dataset.ability === id);
    if (!card) return;
    card.classList.toggle('unlocked', unlocked);
    const stateText = card.querySelector('.card-state');
    if (unlocked) stateText.textContent = '已解锁';
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('visible'), 2100);
  }

  function createCleanBurst(x, y) {
    const width = field.clientWidth;
    const height = field.clientHeight;
    for (let i = 0; i < 10; i += 1) {
      const burst = document.createElement('span');
      const angle = (Math.PI * 2 * i / 10) + rand(-.15, .15);
      const distance = rand(25, 67);
      burst.className = 'clean-burst';
      burst.style.left = `${x * width}px`;
      burst.style.top = `${y * height}px`;
      burst.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      burst.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      particleLayer.appendChild(burst);
      setTimeout(() => burst.remove(), 900);
    }
  }

  function removeParticle(particle) {
    particle.el.remove();
    const index = state.particles.indexOf(particle);
    if (index >= 0) state.particles.splice(index, 1);
  }

  function absorbPollution(particle) {
    particle.el.classList.add('absorbing');
    setTimeout(() => {
      createCleanBurst(particle.x, particle.y);
      removeParticle(particle);
    }, 210);
    const progressivePower = Math.max(.6, 3.15 - (state.cleanCount * .085) + state.cleanPowerBonus);
    state.cleanCount += 1;
    setPollution(state.pollution - progressivePower);
    if (state.cleanCount % 4 === 0) {
      core.classList.toggle('rise-2', state.cleanCount >= 8 && state.abilityUnlocked.size < 2);
      core.classList.toggle('rise-3', state.cleanCount >= 16 || state.abilityUnlocked.size >= 2);
    }
  }

  function captureKnowledge(particle) {
    particle.el.classList.add('absorbing');
    setTimeout(() => removeParticle(particle), 280);
    state.knowledgeActive = false;
    openQuiz(abilityConfigs[abilitySequence[state.nextKnowledgeIndex]]);
  }

  function updatePlayer(delta, width, height) {
    let dx = 0; let dy = 0;
    if (state.keys.has('w') || state.keys.has('arrowup')) dy -= 1;
    if (state.keys.has('s') || state.keys.has('arrowdown')) dy += 1;
    if (state.keys.has('a') || state.keys.has('arrowleft')) dx -= 1;
    if (state.keys.has('d') || state.keys.has('arrowright')) dx += 1;
    if (dx || dy) {
      const length = Math.hypot(dx, dy) || 1;
      state.player.x = clamp(state.player.x + (dx / length) * state.player.speed * delta, .055, .945);
      state.player.y = clamp(state.player.y + (dy / length) * state.player.speed * delta * (width / height), .08, .9);
      fieldHint.classList.add('is-hidden');
    }
  }

  function nudgePlayer(key) {
    const step = .032;
    if (!state.motionFrom) state.motionFrom = { x: state.player.x, y: state.player.y };
    if (key === 'w' || key === 'arrowup') state.player.y = clamp(state.player.y - step, .08, .9);
    if (key === 's' || key === 'arrowdown') state.player.y = clamp(state.player.y + step, .08, .9);
    if (key === 'a' || key === 'arrowleft') state.player.x = clamp(state.player.x - step, .055, .945);
    if (key === 'd' || key === 'arrowright') state.player.x = clamp(state.player.x + step, .055, .945);
    fieldHint.classList.add('is-hidden');
  }

  function distanceToSegment(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const lengthSquared = abx * abx + aby * aby;
    if (lengthSquared === 0) return Math.hypot(px - ax, py - ay);
    const projection = clamp(((px - ax) * abx + (py - ay) * aby) / lengthSquared, 0, 1);
    const closestX = ax + projection * abx;
    const closestY = ay + projection * aby;
    return Math.hypot(px - closestX, py - closestY);
  }

  function updateParticles(delta, width, height, previousPlayer) {
    const absorbRadius = .09 * state.absorbRange;
    const pathRadius = .038 * state.absorbRange;
    for (const particle of [...state.particles]) {
      if (particle.el.classList.contains('absorbing')) continue;
      const dxToCore = state.player.x - particle.x;
      const dyToCore = state.player.y - particle.y;
      const distance = Math.hypot(dxToCore, dyToCore);
      const crossedByCore = distanceToSegment(particle.x, particle.y, previousPlayer.x, previousPlayer.y, state.player.x, state.player.y) < pathRadius;
      if (crossedByCore || distance < absorbRadius) {
        if (crossedByCore && distance > absorbRadius) {
          particle.x = state.player.x;
          particle.y = state.player.y;
        }
        const pull = particle.knowledge ? .09 : .05;
        particle.x += dxToCore * pull;
        particle.y += dyToCore * pull;
        if (crossedByCore || distance < .018) {
          if (particle.knowledge) captureKnowledge(particle);
          else absorbPollution(particle);
          continue;
        }
      } else {
        const wobble = Math.sin(performance.now() / 700 + particle.id) * .00036;
        particle.x += (particle.vx * particle.drift + wobble) * delta;
        particle.y += (particle.vy * particle.drift - wobble) * delta;
        if (particle.x < .04 || particle.x > .96) particle.vx *= -1;
        if (particle.y < .06 || particle.y > .92) particle.vy *= -1;
        particle.x = clamp(particle.x, .03, .97);
        particle.y = clamp(particle.y, .05, .93);
      }
      renderParticle(particle, width, height);
    }
  }

  function openQuiz(config) {
    state.paused = true;
    state.activeQuiz = {
      config,
      questions: shuffle(questionBanks[config.id]).slice(0, 4),
      index: 0,
      correctCount: 0,
      answered: false
    };
    state.selectedOption = null;
    state.quizResolved = false;
    state.quizSuccess = false;
    renderQuestion();
    quizBackdrop.classList.add('visible');
    quizBackdrop.setAttribute('aria-hidden', 'false');
  }

  function renderQuestion() {
    const quiz = state.activeQuiz;
    const question = quiz.questions[quiz.index];
    quizTag.textContent = quiz.config.tag;
    quizProgress.textContent = `${String(quiz.index + 1).padStart(2, '0')} / 04`;
    quizTitle.textContent = question.title;
    quizContext.textContent = quiz.config.context;
    quizFeedback.textContent = '';
    quizFeedback.className = 'quiz-feedback';
    quizContinue.textContent = '确认答案';
    quizContinue.disabled = true;
    quizOptions.innerHTML = '';
    question.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className = 'quiz-option';
      button.innerHTML = `<span class="option-letter">${String.fromCharCode(65 + index)}</span><span>${option}</span>`;
      button.addEventListener('click', () => selectOption(index));
      quizOptions.appendChild(button);
    });
  }

  function selectOption(index) {
    if (!state.activeQuiz || state.activeQuiz.answered) return;
    state.selectedOption = index;
    [...quizOptions.children].forEach((option, optionIndex) => option.classList.toggle('selected', optionIndex === index));
    quizContinue.disabled = false;
    quizContinue.textContent = '确认答案';
  }

  function submitQuiz() {
    if (state.selectedOption === null || !state.activeQuiz || state.activeQuiz.answered) return;
    const quiz = state.activeQuiz;
    const data = quiz.questions[quiz.index];
    const options = [...quizOptions.children];
    quiz.answered = true;
    if (state.selectedOption !== data.answer) {
      options[state.selectedOption].classList.remove('selected');
      options[state.selectedOption].classList.add('wrong');
      options[data.answer].classList.add('correct');
      state.quizResolved = true;
      quizFeedback.className = 'quiz-feedback error';
      quizFeedback.innerHTML = `回答错误。正确答案是 <strong>${String.fromCharCode(65 + data.answer)}. ${data.options[data.answer]}</strong>。<br>${data.explanation}<br><strong>惩罚：雾霾生成速度提高 20%</strong>`;
      state.spawnInterval = Math.max(520, state.spawnInterval * .8);
      quizContinue.textContent = quiz.index === 3 ? '查看结果' : '下一题';
      quizContinue.disabled = false;
      state.selectedOption = null;
      return;
    }
    options[data.answer].classList.remove('selected');
    options[data.answer].classList.add('correct');
    quiz.correctCount += 1;
    quizFeedback.className = 'quiz-feedback success';
    quizFeedback.innerHTML = `回答正确。${data.explanation}`;
    state.quizResolved = true;
    quizContinue.textContent = quiz.index === 3 ? '查看结果' : '下一题';
    quizContinue.disabled = false;
  }

  function advanceQuiz() {
    if (!state.activeQuiz || !state.activeQuiz.answered) return;
    if (state.activeQuiz.index < 3) {
      state.activeQuiz.index += 1;
      state.activeQuiz.answered = false;
      state.selectedOption = null;
      renderQuestion();
      return;
    }
    finishQuizRound();
  }

  function finishQuizRound() {
    const quiz = state.activeQuiz;
    if (!quiz) return;
    if (quiz.correctCount >= 3) {
      state.quizSuccess = true;
      quizBackdrop.classList.remove('visible');
      quizBackdrop.setAttribute('aria-hidden', 'true');
      showDataReveal(quiz.config, quiz.correctCount);
      return;
    }
    quizFeedback.className = 'quiz-feedback error';
    quizFeedback.innerHTML = `本轮答对 <strong>${quiz.correctCount} / 4</strong>，还未达到获得道具所需的 3 题。<br><strong>雾霾生成速度提高 20%，本轮道具未解锁。</strong>`;
    quizContinue.textContent = '继续净化';
    quizContinue.disabled = false;
    state.quizResolved = true;
  }

  function showDataReveal(config, score) {
    state.revealActive = true;
    dataRevealScore.textContent = `答对 ${score} / 4`;
    dataRevealTitle.textContent = config.title;
    dataRevealSubtitle.textContent = config.subtitle;
    dataRevealEffect.textContent = config.effect;
    dataRevealHint.textContent = config.hint;
    rewardCard.innerHTML = `<span class="reward-card-mark">${config.mark}</span><span class="reward-card-word">${config.title}</span>`;
    rewardCard.classList.remove('revealed');
    dataRevealCopy.textContent = '';
    dataRevealContinue.disabled = true;
    dataRevealOverlay.classList.add('visible');
    dataRevealOverlay.setAttribute('aria-hidden', 'false');
    let index = 0;
    const writeNext = () => {
      if (!state.revealActive) return;
      dataRevealCopy.textContent = config.data.slice(0, index);
      index += 1;
      if (index <= config.data.length) {
        setTimeout(writeNext, 25);
      } else {
        unlockAbility(config.id);
        rewardCard.classList.add('revealed');
        dataRevealContinue.disabled = false;
      }
    };
    writeNext();
  }

  function unlockAbility(id) {
    if (state.abilityUnlocked.has(id)) return;
    state.abilityUnlocked.add(id);
    updateCardState(id, true);
    if (id === 'solar') state.spawnInterval = 1480;
    if (id === 'mobility') { state.absorbRange = 1.35; core.classList.add('rise-2'); }
    if (id === 'sorting') { state.cleanPowerBonus = .75; core.classList.add('rise-3'); }
  }

  function closeQuizFailure() {
    quizBackdrop.classList.remove('visible');
    quizBackdrop.setAttribute('aria-hidden', 'true');
    state.nextKnowledgeIndex += 1;
    state.activeQuiz = null;
    state.paused = false;
    phaseLabel.textContent = '净化行动进行中';
    showToast('本轮道具未解锁，惩罚已生效，雾霾生成速度提高 20%');
  }

  function closeDataReveal() {
    dataRevealOverlay.classList.remove('visible');
    dataRevealOverlay.setAttribute('aria-hidden', 'true');
    state.revealActive = false;
    state.nextKnowledgeIndex += 1;
    state.activeQuiz = null;
    state.paused = false;
    phaseLabel.textContent = '净化行动进行中';
    showToast('净化能力已生效，继续追上雾霾');
  }

  function finishGame() {
    if (state.completed) return;
    state.completed = true;
    state.paused = true;
    state.knowledgeActive = false;
    state.activeQuiz = null;
    quizBackdrop.classList.remove('visible');
    quizBackdrop.setAttribute('aria-hidden', 'true');
    phaseLabel.textContent = '荆州已恢复清晰';
    mistLayer.style.opacity = 0;
    state.particles.forEach(particle => particle.el.classList.add('absorbing'));
    setTimeout(() => {
      completionOverlay.classList.add('visible');
    }, 520);
  }

  function resetGame() {
    state.running = true;
    state.paused = false;
    state.completed = false;
    state.lastFrame = performance.now();
    state.spawnTimer = 0;
    state.spawnInterval = 1180;
    state.pollution = 100;
    state.cleanCount = 0;
    state.nextKnowledgeIndex = 0;
    state.knowledgeActive = false;
    state.activeQuiz = null;
    state.selectedOption = null;
    state.abilityUnlocked = new Set();
    state.absorbRange = 1;
    state.cleanPowerBonus = 0;
    state.quizResolved = false;
    state.quizSuccess = false;
    state.motionFrom = null;
    state.player = { x: .50, y: .54, speed: .42 };
    state.particles.forEach(p => p.el.remove());
    state.particles = [];
    core.className = 'core';
    abilityCards.forEach(card => { card.classList.remove('unlocked'); card.querySelector('.card-state').textContent = '待唤起'; });
    completionOverlay.classList.remove('visible');
    mistLayer.style.opacity = .88;
    quizBackdrop.classList.remove('visible');
    quizBackdrop.setAttribute('aria-hidden', 'true');
    phaseLabel.textContent = '净化行动进行中';
    setPollution(100);
    for (let i = 0; i < 9; i += 1) spawnPollution();
    showToast('移动清气核心，追上灰色雾霾颗粒');
  }

  function gameLoop(now) {
    const delta = Math.min((now - state.lastFrame) / 1000, .05);
    state.lastFrame = now;
    const width = field.clientWidth;
    const height = field.clientHeight;
    if (!state.paused && !state.completed) {
      const previousPlayer = state.motionFrom || { x: state.player.x, y: state.player.y };
      state.motionFrom = null;
      updatePlayer(delta, width, height);
      state.spawnTimer += delta * 1000;
      if (state.spawnTimer >= state.spawnInterval) {
        state.spawnTimer = 0;
        spawnPollution();
      }
      updateParticles(delta, width, height, previousPlayer);
    }
    renderCore(width, height);
    const remaining = state.particles.filter(p => !p.knowledge).length;
    particleCount.textContent = `雾霾颗粒 ${remaining}`;
    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      event.preventDefault();
      state.keys.add(key);
      nudgePlayer(key);
      if (state.completed) return;
      field.focus({ preventScroll: true });
    }
  });
  window.addEventListener('keyup', event => state.keys.delete(event.key.toLowerCase()));
  field.addEventListener('pointerdown', () => field.focus({ preventScroll: true }));
  quizContinue.addEventListener('click', () => {
    if (quizContinue.textContent === '继续净化') closeQuiz();
    else submitQuiz();
  });
  restartButton.addEventListener('click', resetGame);

  resetGame();
  requestAnimationFrame(gameLoop);
})();
