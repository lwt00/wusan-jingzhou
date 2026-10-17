import { createJourneyBridge } from './journey-bridge.mjs';
import { createSessionFlow } from './session-flow.mjs';
import { HISTORY_NOTES } from './history-notes.mjs';
import { ENDING_NOTICE } from './ending-evaluation.mjs';
import { getTicketText } from './ticket-texts.mjs';
import { startBrushWriting } from './brush-writing.mjs';
import { MAINLINE_MEMORIALS } from './mainline.mjs';
import {
  createGameState,
  applyChoice,
  continueAfterResult
} from './state.mjs';

const RESOURCE_META = {
  treasury: { label: '国库', value: 'treasury-value', bar: 'treasury-bar' },
  people: { label: '民心', value: 'people-value', bar: 'people-bar' },
  defense: { label: '边防', value: 'defense-value', bar: 'defense-bar' }
};

const MARK_CHARS = ['一', '二', '三'];

const elements = {
  intro: document.querySelector('#intro-view'),
  memorial: document.querySelector('#memorial-view'),
  end: document.querySelector('#end-view'),
  start: document.querySelector('#start-button'),
  restart: document.querySelector('#restart-button'),
  sceneRestart: document.querySelector('#scene-restart-button'),
  continue: document.querySelector('#continue-button'),
  endAction: document.querySelector('#end-action'),
  era: document.querySelector('#memorial-era'),
  count: document.querySelector('#round-count'),
  title: document.querySelector('#memorial-title'),
  scene: document.querySelector('#memorial-scene'),
  choices: document.querySelector('#choice-list'),
  result: document.querySelector('#choice-result'),
  delta: document.querySelector('#delta-line'),
  note: document.querySelector('#history-note'),
  endKicker: document.querySelector('#end-kicker'),
  endTitle: document.querySelector('#end-title'),
  endCopy: document.querySelector('#end-copy'),
  endScore: document.querySelector('#end-score'),
  summaryResources: document.querySelector('.summary-resources'),
  sealAction: document.querySelector('#seal-action'),
  sealButton: document.querySelector('#seal-button'),
  selectedChoice: document.querySelector('#selected-choice'),
  pendingStack: document.querySelector('#pending-stack'),
  pendingStackImg: document.querySelector('#pending-stack-img'),
  pendingLabel: document.querySelector('.pending-stack-label'),
  openScroll: document.querySelector('#open-scroll')
};

let state = createGameState({ totalMemorials: MAINLINE_MEMORIALS.length });
const flow = createSessionFlow(window.self === window.top ? 'standalone' : 'embedded');
document.body.dataset.mode = flow.mode;
const connection = document.querySelector('#journey-connection');
const bridge = createJourneyBridge({ onStatus(text, retry) {
  connection.hidden = !text || (document.body.dataset.introExiting === 'true' && !retry);
  connection.querySelector('p').textContent = text;
  connection.querySelector('button').hidden = !retry;
} });
connection.querySelector('button').addEventListener('click', () => bridge.retry());
if (bridge.enabled) document.querySelector('#end-exit').textContent = '返回主游戏';

const exitView = document.querySelector('#exit-view');
let selectedChoice = null;
const reader = document.querySelector('#reading-stage');
const sceneFrame = document.querySelector('.scene-frame');
const deskParent = elements.openScroll.parentElement;
const deskNext = elements.openScroll.nextElementSibling;
const readButton = document.querySelector('#read-memorial');
const closeButton = document.querySelector('#close-reading');
let reading = false;
let transitioning = false;
let viewToken = 0;
let stackTimer;
let paperAnimation;
let writingRun = null;
let writingLocked = false;
const draftArea = document.querySelector('#draft-writing-area');
function clearDraft() {
  writingRun?.cancel();
  writingRun = null;
  writingLocked = false;
  delete draftArea.dataset.written;
  delete draftArea.dataset.durationMs;
  draftArea.querySelector('.draft-ink').replaceChildren();
  draftArea.querySelector('.draft-ink').setAttribute('aria-label', '尚未票拟');
  draftArea.querySelector('.draft-disclaimer').hidden = true;
  elements.sealButton.disabled = false;
}
function cancelWriting() {
  if (!writingLocked) return;
  clearDraft();
  elements.choices.querySelectorAll('button').forEach(button => { button.disabled = false; });
  elements.sealAction.hidden = !selectedChoice;
  document.body.dataset.phase = selectedChoice ? 'selected' : 'choosing';
}
document.querySelector('#skip-writing').addEventListener('click', () => writingRun?.skip());
document.querySelector('#cancel-writing').addEventListener('click', cancelWriting);
document.querySelector('#restart-writing').addEventListener('click', restart);
window.addEventListener('pagehide', cancelWriting);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) writingRun?.pause(); else writingRun?.resume();
});
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animatePaper(from, to, reverse = false) {
  if (reducedMotion()) return Promise.resolve();
  const transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  paperAnimation = elements.openScroll.animate(
    reverse ? [{ transform: 'none' }, { transform }] : [{ transform }, { transform: 'none' }],
    { duration: 380, easing: 'cubic-bezier(.22,.7,.3,1)', fill: 'both' }
  );
  const animation = paperAnimation;
  return animation.finished.catch(() => {}).then(() => animation.cancel());
}

async function openReading() {
  if (reading || transitioning || document.body.dataset.screen !== 'memorial') return;
  const token = ++viewToken;
  const from = elements.openScroll.getBoundingClientRect();
  reading = true;
  transitioning = true;
  reader.hidden = false;
  reader.dataset.ready = 'false';
  reader.setAttribute('aria-busy', 'true');
  reader.append(elements.openScroll);
  document.body.dataset.reading = 'true';
  sceneFrame.inert = true;
  document.querySelector('#reading-content').scrollTop = 0;
  await animatePaper(from, elements.openScroll.getBoundingClientRect());
  if (token !== viewToken) return;
  transitioning = false;
  reader.dataset.ready = 'true';
  reader.setAttribute('aria-busy', 'false');
  closeButton.focus({ preventScroll: true });
}

function restoreDesk() {
  elements.openScroll.getAnimations().forEach(animation => animation.cancel());
  deskParent.insertBefore(elements.openScroll, deskNext);
  reader.hidden = true;
  delete reader.dataset.ready;
  reader.removeAttribute('aria-busy');
  delete document.body.dataset.reading;
  sceneFrame.inert = false;
  reading = false;
  transitioning = false;
}

async function closeReading() {
  if (!reading || transitioning) return false;
  cancelWriting();
  transitioning = true;
  const token = ++viewToken;
  const from = elements.openScroll.getBoundingClientRect();
  // Measure the unchanged desk position without exposing its content.
  const target = document.createElement('div');
  target.className = 'open-scroll';
  target.style.visibility = 'hidden';
  deskParent.insertBefore(target, deskNext);
  const to = target.getBoundingClientRect();
  target.remove();
  await animatePaper(to, from, true);
  if (token !== viewToken) return false;
  restoreDesk();
  readButton.focus({ preventScroll: true });
  return true;
}

function resetReading() {
  clearDraft();
  viewToken++;
  clearTimeout(stackTimer);
  restoreDesk();
}

readButton.addEventListener('click', openReading);
closeButton.addEventListener('click', closeReading);
reader.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); closeReading(); }
  if (event.key !== 'Tab') return;
  const controls = [...reader.querySelectorAll('button:not(:disabled), a[href], summary')].filter(button => button.getClientRects().length);
  const first = controls[0], last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
});

function renderResources() {
  document.querySelector('#reading-resources').textContent = `国库 ${state.resources.treasury}　民心 ${state.resources.people}　边防 ${state.resources.defense}`;
  for (const [key, meta] of Object.entries(RESOURCE_META)) {
    const value = state.resources[key];
    const number = document.getElementById(meta.value);
    const changed = number.textContent !== String(value);
    number.textContent = value;
    const resource = document.querySelector(`[data-resource="${key}"]`);
    const delta = state.lastDelta?.[key];
    resource.dataset.delta = delta == null ? '' : `${delta > 0 ? '+' : ''}${delta}`;
    resource.dataset.direction = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
    if (changed && document.body.dataset.screen === 'memorial' && !reducedMotion()) {
      number.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' });
    }
    document.getElementById(meta.bar).style.width = `${value}%`;
    document.querySelector(`[data-resource="${key}"]`).dataset.level = value <= 20 ? 'critical' : 'stable';
  }
}

function moveResourcesToScene() {
  if (elements.summaryResources.parentElement.classList.contains('scene-frame')) return;
  document.querySelector('.scene-frame').append(elements.summaryResources);
  elements.summaryResources.hidden = false;
}

function moveResourcesToPanel() {
  if (elements.summaryResources.parentElement.classList.contains('scene-frame')) {
    elements.intro.before(elements.summaryResources);
  }
}

function renderIntro() {
  resetReading();
  moveResourcesToPanel();
  document.body.dataset.screen = 'intro';
  document.body.dataset.phase = 'intro';
  elements.intro.hidden = false;
  elements.memorial.hidden = true;
  elements.end.hidden = true;
  exitView.hidden = true;
  delete document.body.dataset.introExiting;
  elements.start.disabled = false;
  for (const button of elements.intro.querySelectorAll('[data-exit-game]')) button.disabled = false;
  delete elements.end.dataset.evaluation;
  for (const id of ['end-evaluation', 'end-reason', 'end-copy', 'end-status', 'end-notice']) document.getElementById(id).textContent = '';
  elements.endScore.replaceChildren();
  elements.summaryResources.hidden = false;
  selectedChoice = null;
  window.scrollTo(0, 0);
  elements.start.focus({ preventScroll: true });
}

function updateStack(count, instant = false) {
  elements.pendingStack.dataset.count = count;
  const img = elements.pendingStackImg;
  if (count <= 0) {
    img.style.setProperty('--removed', String(MAINLINE_MEMORIALS.length));
    img.style.opacity = '0';
    elements.pendingLabel.style.opacity = '0';
    return;
  }
  const removed = MAINLINE_MEMORIALS.length - count;
  if (instant) {
    img.style.transition = 'none';
    img.style.setProperty('--removed', String(removed));
    img.style.opacity = '1';
    void img.offsetWidth;
    img.style.transition = '';
  } else {
    img.style.setProperty('--removed', String(removed));
    img.style.opacity = '1';
  }
  elements.pendingLabel.style.opacity = '1';
}

function renderHistoryNote(id) {
  const details = document.querySelector('#history-details');
  const note = HISTORY_NOTES[id];
  details.open = false;
  details.hidden = !note;
  document.querySelector('#history-note-text').textContent = note?.text || '';
  const sources = document.querySelector('#history-sources');
  sources.replaceChildren();
  for (const source of note?.sources || []) {
    const link = document.createElement('a');
    link.textContent = source.title;
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    sources.append(link);
  }
}

function renderMemorial() {
  clearDraft();
  clearTimeout(stackTimer);
  document.body.dataset.screen = 'memorial';
  document.body.dataset.phase = 'choosing';
  moveResourcesToScene();
  window.scrollTo(0, 0);
  const memorial = MAINLINE_MEMORIALS[state.memorialIndex];
  elements.sealButton.textContent = getTicketText(memorial.id, 0) ? '提笔票拟' : '确认票拟';
  draftArea.querySelector('span').textContent = getTicketText(memorial.id, 0) ? '阁臣票拟' : '票拟留白';
  elements.intro.hidden = true;
  elements.memorial.hidden = false;
  elements.end.hidden = true;
  elements.summaryResources.hidden = false;
  selectedChoice = null;
  elements.era.textContent = memorial.era;
  elements.count.textContent = `第 ${state.memorialIndex + 1} / ${MAINLINE_MEMORIALS.length} 份`;
  elements.title.textContent = memorial.title;
  elements.scene.textContent = memorial.scene;
  document.querySelector('#memorial-context').textContent = memorial.context;
  renderHistoryNote(memorial.id);
  document.querySelector('#desk-memorial-title').textContent = memorial.title;
  document.querySelector('#desk-memorial-scene').textContent = memorial.scene;
  document.querySelector('#reading-era').textContent = memorial.era;
  readButton.querySelector('small').textContent = '点击章奏，查看奏报';
  if (!reducedMotion()) readButton.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });
  elements.result.hidden = true;
  elements.sealAction.hidden = true;
  elements.selectedChoice.textContent = '';

  // 重启动画
  elements.openScroll.style.animation = 'none';
  void elements.openScroll.offsetWidth;
  elements.openScroll.style.animation = '';

  // 未批奏折摞（此刻尚未批，数量 = 剩余总数）
  const pending = MAINLINE_MEMORIALS.length - state.memorialIndex;
  updateStack(pending, true);

  // 三个选项：竖排于奏折左侧
  elements.choices.replaceChildren();
  memorial.choices.forEach((choice, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scroll-choice';
    button.innerHTML = `<span class="choice-mark">${MARK_CHARS[index]}</span><span class="choice-text"></span>`;
    button.querySelector('.choice-text').textContent = choice.label;
    button.setAttribute('aria-label', `策${MARK_CHARS[index]}：${choice.label}`);
    button.addEventListener('click', () => selectChoice(choice, button));
    elements.choices.append(button);
  });
  readButton.focus({ preventScroll: true });
}

function selectChoice(choice, selectedButton) {
  if (state.phase !== 'choosing' || !reading || transitioning || writingLocked) return;
  selectedChoice = { choice, selectedButton };
  elements.choices.querySelectorAll('button').forEach(button => { button.dataset.selected = 'false'; });
  selectedButton.dataset.selected = 'true';
  elements.selectedChoice.textContent = choice.label;
  elements.sealAction.hidden = false;
  document.body.dataset.phase = 'selected';
  elements.sealButton.focus({ preventScroll: true });
}

function applySeal() {
  if (state.phase !== 'choosing' || !selectedChoice || !reading || transitioning || writingLocked) return;
  const { choice, selectedButton } = selectedChoice;
  const memorial = MAINLINE_MEMORIALS[state.memorialIndex];
  const text = getTicketText(memorial.id, memorial.choices.indexOf(choice));
  if (!text) { settleChoice(choice, selectedButton); return; }
  writingLocked = true;
  elements.choices.querySelectorAll('button').forEach(button => { button.disabled = true; });
  elements.sealButton.disabled = true;
  elements.sealAction.hidden = true;
  document.body.dataset.phase = 'writing';
  draftArea.querySelector('.draft-disclaimer').hidden = false;
  draftArea.scrollIntoView({ block: 'center', behavior: 'instant' });
  const writingToken = viewToken;
  writingRun = startBrushWriting({ area: draftArea, text, reduced: reducedMotion(), onComplete() {
    if (writingToken !== viewToken || flow.phase !== 'playing') return;
    writingRun = null;
    writingLocked = false;
    settleChoice(choice, selectedButton);
  } });
  if (document.hidden) writingRun.pause();
}

function settleChoice(choice, selectedButton) {
  if (state.phase !== 'choosing' || flow.phase !== 'playing') return;
  state = applyChoice(state, choice.delta, choice);
  if (state.phase === 'won') bridge.complete(flow.complete(state));
  elements.choices.querySelectorAll('button').forEach(button => { button.disabled = true; });
  selectedButton.dataset.selected = 'true';
  elements.sealAction.hidden = true;
  document.body.dataset.phase = 'stamped';
  elements.delta.innerHTML = formatDelta(state.lastDelta);
  elements.note.textContent = choice.note;
  elements.result.hidden = false;
  renderResources();
  // 批阅完成：未批摞当场少一册
  const remaining = MAINLINE_MEMORIALS.length - state.memorialIndex;
  stackTimer = window.setTimeout(() => updateStack(remaining), 320);
  readButton.querySelector('small').textContent = '票拟已定 · 点击查看结果';
  const ended = state.phase !== 'result';
  elements.continue.hidden = false;
  elements.continue.innerHTML = ended
    ? '查看结局 <span aria-hidden="true">→</span>'
    : '继续批阅 <span aria-hidden="true">→</span>';
  elements.continue.focus({ preventScroll: true });
}

async function continueGame() {
  if (!reading || transitioning || !['result', 'won', 'failed'].includes(state.phase)) return;
  if (!await closeReading()) return;
  if (state.phase === 'result') {
    state = continueAfterResult(state);
    renderMemorial();
  } else {
    renderEnd();
  }
}

function renderEnd() {
  resetReading();
  moveResourcesToPanel();
  document.body.dataset.screen = 'end';
  document.body.dataset.phase = 'end';
  elements.intro.hidden = true;
  elements.memorial.hidden = true;
  elements.end.hidden = false;
  elements.end.scrollIntoView({ block: 'start' });
  const evaluation = flow.completion?.evaluation || null;
  elements.endKicker.textContent = evaluation ? '张居正故居 · 七折既毕' : '本轮票拟暂告中止';
  elements.endTitle.textContent = evaluation ? '七策治绩卷' : '本轮票拟记录';
  document.getElementById('end-evaluation').textContent = evaluation?.name || '探索未完成';
  document.getElementById('end-reason').textContent = evaluation?.reason || '';
  elements.endCopy.textContent = evaluation?.copy || '至少一项治理资源已经归零。历史中的选择远比数字复杂，你可以重新批阅，尝试另一条路径。';
  document.getElementById('end-status').textContent = evaluation ? '探索完成' : '本轮暂告中止';
  document.getElementById('end-notice').textContent = ENDING_NOTICE;
  if (evaluation) elements.end.dataset.evaluation = evaluation.id;
  else delete elements.end.dataset.evaluation;
  elements.endScore.innerHTML = Object.entries(RESOURCE_META).map(([key, meta]) => `<div><span>${meta.label}</span><strong>${state.resources[key]}</strong></div>`).join('');
  elements.endAction.textContent = '重新挑战';
  elements.endAction.focus({ preventScroll: true });
}

function formatDelta(delta) {
  return Object.entries(RESOURCE_META).map(([key, meta]) => {
    const value = Number(delta[key]) || 0;
    const sign = value > 0 ? '+' : '';
    const className = value > 0 ? 'positive' : value < 0 ? 'negative' : '';
    return `<span class="${className}">${meta.label} ${sign}${value}</span>`;
  }).join('　');
}

function restart() {
  resetReading();
  flow.reset();
  bridge.newRun();
  state = createGameState({ totalMemorials: MAINLINE_MEMORIALS.length });
  renderResources();
  renderIntro();
}

function startGame() {
  if (document.body.dataset.screen !== 'intro') return;
  flow.start();
  state = createGameState({ totalMemorials: MAINLINE_MEMORIALS.length });
  renderResources();
  renderMemorial();
}

function exitGame() {
  if (document.body.dataset.introExiting === 'true') return;
  const preserveIntro = bridge.enabled && document.body.dataset.screen === 'intro';
  const result = flow.exit();
  // Let the host fade the existing intro into the courtyard, without an intermediate exit page.
  if (preserveIntro) {
    document.body.dataset.introExiting = 'true';
    elements.start.disabled = true;
    for (const button of elements.intro.querySelectorAll('[data-exit-game]')) button.disabled = true;
    bridge.exit(result);
    return;
  }
  bridge.exit(result);
  resetReading();
  selectedChoice = null;
  document.querySelector('#history-details').open = false;
  moveResourcesToPanel();
  elements.summaryResources.hidden = true;
  elements.intro.hidden = true;
  elements.memorial.hidden = true;
  elements.end.hidden = true;
  document.body.dataset.screen = 'exit';
  document.body.dataset.phase = 'exited';
  exitView.hidden = false;
  document.querySelector('#exit-status').textContent = result.outcome === 'completed' ? '探索完成' : '探索未完成';
  document.querySelector('#exit-copy').textContent = bridge.enabled
    ? '本次体验已结束，正在返回主游戏。若连接未响应，可重试连接或使用外层返回入口。'
    : result.outcome === 'completed'
    ? '本次体验已结束。你可以返回开始页面，再次体会票拟中的取舍。'
    : '本次体验已结束，未记为通关。你可以返回开始页面，重新开始。';
  window.scrollTo(0, 0);
  document.querySelector('#return-start').focus({ preventScroll: true });
}

for (const button of document.querySelectorAll('[data-exit-game]')) button.addEventListener('click', exitGame);
document.querySelector('#return-start').addEventListener('click', restart);
elements.start.addEventListener('click', startGame);
elements.continue.addEventListener('click', continueGame);
elements.sealButton.addEventListener('click', applySeal);
elements.restart.addEventListener('click', restart);
elements.sceneRestart.addEventListener('click', restart);
elements.endAction.addEventListener('click', restart);

renderResources();
renderIntro();
