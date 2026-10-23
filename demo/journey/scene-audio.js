/* Scene sounds only: no animation clock, game state or save writes. */
function createWusanSceneAudio(options = {}) {
  const ui = options.ui || globalThis.WusanUIAudio;
  const load = options.fetch || globalThis.fetch;
  const makeContext = options.makeContext || (() => new (window.AudioContext || window.webkitAudioContext)());
  const later = options.setTimeout || setTimeout, clear = options.clearTimeout || clearTimeout;
  const hidden = options.hidden || (() => !!globalThis.document?.hidden);
  const activated = options.activated || (() => !globalThis.navigator?.userActivation || navigator.userActivation.isActive);
  const urls = {walk: options.walkUrl || 'assets/audio/walking.mp3', text: options.textUrl || 'assets/audio/text-reveal.mp3'};
  const buffers = new Map(), pending = new Map();
  let context, armed = false, walkWanted = null, textEntry = null, textConsumed = false;
  const voices = {walk: {token:0}, text: {token:0}};
  const muted = () => !!ui?.state.muted;
  function unlock() {
    if (muted() || hidden() || !activated()) return false;
    try {
      context ||= makeContext();
      Promise.resolve(context.resume()).catch(() => {});
      armed = true; return true;
    } catch (_) { return false; }
  }
  function prepare(kind) {
    if (buffers.has(kind)) return Promise.resolve(buffers.get(kind));
    if (!pending.has(kind)) {
      const task = Promise.resolve().then(() => load(urls[kind])).then(response => {
        if (!response.ok) throw Error('scene audio unavailable');
        return response.arrayBuffer();
      }).then(data => context.decodeAudioData(data)).then(buffer => { buffers.set(kind,buffer); return buffer; }).catch(() => null).finally(() => pending.delete(kind));
      pending.set(kind,task);
    }
    return pending.get(kind);
  }
  function stopVoice(kind) {
    const voice = voices[kind]; voice.token++; clear(voice.timer); voice.timer = null;
    const source = voice.source; voice.source = null;
    if (source) source.onended = null;
    try { source?.stop(); } catch (_) {}
    try { source?.disconnect(); voice.gain?.disconnect(); } catch (_) {}
    voice.gain = null;
  }
  function stopWalk() { walkWanted = null; stopVoice('walk'); }
  function stopText() { stopVoice('text'); }
  function stopAll() { stopWalk(); stopText(); }
  function start(kind, valid) {
    stopVoice(kind); const voice = voices[kind], token = voice.token;
    if (!armed || !context || muted() || hidden() || !valid()) return;
    prepare(kind).then(buffer => {
      if (!buffer || token !== voice.token || muted() || hidden() || context.state !== 'running' || !valid()) return;
      try {
        const source = context.createBufferSource(), gain = context.createGain();
        voice.source = source; voice.gain = gain; source.buffer = buffer;
        gain.gain.setValueAtTime(kind === 'walk' ? .4 : .35, context.currentTime);
        source.connect(gain); gain.connect(context.destination);
        if (kind === 'walk') {
          // Four footfalls at ~0.5s intervals; both boundaries lie in quiet samples.
          source.loop = true; source.loopStart = .2; source.loopEnd = Math.min(2.2,buffer.duration);
          if (source.loopEnd <= source.loopStart) { stopVoice(kind); return; }
        }
        source.onended = () => { if (voice.source === source) stopVoice(kind); };
        ui?.stop();
        source.start(0,kind === 'walk' ? .2 : Math.min(1.15,Math.max(0,buffer.duration-.01)));
      } catch (_) { stopVoice(kind); }
    }).catch(() => {});
  }
  function startWalk(characterId, hasFrames) {
    stopWalk();
    if (!['zhangjuzheng','jingzhouGuard','explorer'].includes(characterId) || !hasFrames) return;
    walkWanted = characterId;
    start('walk',() => walkWanted === characterId);
  }
  function fadeWalk() {
    walkWanted = null;
    const voice = voices.walk; voice.token++;
    if (!voice.source || !voice.gain || !context) { stopVoice('walk'); return; }
    try {
      const now = context.currentTime, token = voice.token;
      voice.gain.gain.cancelScheduledValues(now); voice.gain.gain.setValueAtTime(voice.gain.gain.value,now);
      voice.gain.gain.linearRampToValueAtTime(0,now+.25);
      clear(voice.timer); voice.timer = later(() => { if (token === voice.token) stopVoice('walk'); },250);
    } catch (_) { stopVoice('walk'); }
  }
  const api = {
    arm() { stopAll(); if (unlock()) ui?.exclusive(); },
    startWalk, stopWalk, fadeWalk, stopText, stopAll,
    beginText(entry) { stopText(); textEntry = entry; textConsumed = false; },
    text(entry, valid = () => true) {
      if (entry !== textEntry || textConsumed || !valid()) return;
      textConsumed = true; start('text',() => entry === textEntry && valid());
    },
    dispose() { stopAll(); textEntry = null; unsubscribe?.(); try { Promise.resolve(context?.close()).catch(() => {}); } catch (_) {} }
  };
  let subscribed = false;
  const unsubscribe = ui?.onChange(value => {
    if (!subscribed) return;
    if (value) { const wanted = walkWanted; stopAll(); walkWanted = wanted; }
    else if (unlock() && walkWanted) startWalk(walkWanted,true);
  });
  subscribed = true;
  return api;
}

/* Observe the existing title reveal; never change its content, style or timing. */
function bindWusanLandmarkAudio(audio, options = {}) {
  const doc = options.document || document;
  const frame = options.requestAnimationFrame || requestAnimationFrame, cancel = options.cancelAnimationFrame || cancelAnimationFrame;
  const style = options.getComputedStyle || getComputedStyle;
  const reduce = options.reduced || (() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const Observe = options.MutationObserver || globalThis.MutationObserver;
  let current = null, serial = 0;
  function endLandmark(view) {
    if (!current || current.view !== view) return;
    cancel(current.frame); current.root.removeEventListener('animationstart',current.animation);
    current.observer?.disconnect(); current = null; audio.stopText();
  }
  function beginLandmark(view) {
    if (current) endLandmark(current.view);
    const root = view.root, title = doc.getElementById('landmark-name'), copy = root.querySelector('.landmark-copy');
    const entry = {view, root, title, copy, id:++serial, seen:false, frame:0, started:false}; current = entry;
    audio.beginText(entry.id);
    const valid = () => current === entry && view.active && view.ready && !!view.natural && !doc.hidden && !view.image.hidden && root.dataset.state === 'display' && root.dataset.stage === 'awaiting-explore';
    const animating = () => reduce() || [title,copy].some(node => node?.getAnimations?.().some(animation => animation.playState === 'running'));
    const visible = () => [title,copy].every(node => {
      if (!node) return false;
      const s = style(node); return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0;
    });
    entry.check = () => {
      if (entry.seen || entry.frame || !valid()) return;
      // Let the unchanged CSS reveal paint beyond opacity 0 before requesting sound.
      entry.frame = frame(() => { entry.frame = frame(() => {
        entry.frame = 0;
        if (!valid() || entry.seen || !animating() || !visible()) return;
        entry.seen = true; audio.text(entry.id,() => valid() && animating() && visible());
      }); });
    };
    entry.animation = event => {
      if (event.animationName === 'landmark-copy-in' && [title,copy].includes(event.target)) { entry.started = true; entry.check(); }
    };
    root.addEventListener('animationstart',entry.animation);
    if (Observe) { entry.observer = new Observe(() => { if (root.dataset.state !== 'display' || root.hidden) audio.stopText(); else entry.check(); }); entry.observer.observe(root,{attributes:true,attributeFilter:['data-stage','data-state','hidden']}); }
    entry.check();
  }
  return {beginLandmark, endLandmark, landmarkReady(view) { if (current?.view === view) current.check(); }};
}
if (typeof window !== 'undefined') {
  const base = document.currentScript.src;
  const audio = createWusanSceneAudio({walkUrl:new URL('assets/audio/walking.mp3',base).href,textUrl:new URL('assets/audio/text-reveal.mp3',base).href});
  Object.assign(audio,bindWusanLandmarkAudio(audio));
  window.WusanSceneAudio = audio;
  document.addEventListener('visibilitychange',() => { if (document.hidden) audio.stopAll(); });
  window.addEventListener('pagehide',() => audio.stopAll());
}
