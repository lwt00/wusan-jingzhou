/* Audio lifecycle only; independent of travel time and sprite frames. */
function createWusanHoofAudio(options = {}) {
  const ui = options.ui || globalThis.WusanUIAudio;
  const url = options.url || 'assets/audio/guanyu-hooves.mp3';
  const makeContext = options.makeContext || (() => new (window.AudioContext || window.webkitAudioContext)());
  // This supplied recording has ~3.54s of near-silence before its first hoof beat.
  const startOffset = options.startOffset ?? 3.54;
  const debug = options.debug || (() => {});
  const report = (event, detail = {}) => debug({event, muted:!!ui?.state.muted, context:context?.state || 'none', ...detail});
  const load = options.fetch || globalThis.fetch;
  const later = options.setTimeout || setTimeout, clear = options.clearTimeout || clearTimeout;
  let context, buffer, loading, source, gain, timer, token = 0, active = false, armed = false, wanted = false;
  const muted = () => !!ui?.state.muted;
  function stop() {
    const wasActive = active || !!source;
    token++; active = false; wanted = false; clear(timer); timer = null;
    try { source?.stop(); } catch (_) {}
    try { source?.disconnect(); gain?.disconnect(); } catch (_) {}
    source = gain = null;
    if (wasActive) report('stopped');
  }
  function prepare() {
    if (buffer) return Promise.resolve(buffer);
    if (!loading) loading = Promise.resolve().then(() => load(url)).then(r => {
      report('response', {status:r.status});
      if (!r.ok) throw Error('hoof audio unavailable: HTTP '+r.status);
      return r.arrayBuffer();
    }).then(data => context.decodeAudioData(data)).then(decoded => {report('decoded',{duration:decoded.duration});return buffer = decoded;}).catch(error => {report('load-error',{reason:error.message});return null;}).finally(() => { loading = null; });
    return loading;
  }
  function arm(characterId) {
    stop(); armed = false;
    if (characterId !== 'guanyu' || muted()) {report('arm-skipped',{characterId});return;}
    if (globalThis.navigator?.userActivation && !navigator.userActivation.isActive) {report('no-user-activation');return;}
    try {
      context ||= makeContext();
      // Unlock only inside the departure gesture. Never await this in travel code.
      Promise.resolve(context.resume()).then(()=>report('unlocked')).catch(error => report('unlock-error',{reason:error.message}));
      armed = true; ui?.exclusive(); prepare();
    } catch (error) {report('arm-error',{reason:error.message});}
  }
  function start(characterId, hasRidingFrames) {
    stop();
    wanted = characterId === 'guanyu' && !!hasRidingFrames;
    if (characterId !== 'guanyu' || !hasRidingFrames || !armed || !context || muted()) {report('start-skipped',{characterId,hasRidingFrames,armed});return;}
    active = true; const current = token;
    ui?.exclusive(); ui?.stop();
    prepare().then(decoded => {
      if (current !== token || !active || muted() || !decoded || context.state !== 'running') {report('play-skipped',{stale:current!==token,decoded:!!decoded});return;}
      try {
        source = context.createBufferSource(); gain = context.createGain();
        source.buffer = decoded; gain.gain.setValueAtTime(.55, context.currentTime);
        source.connect(gain); gain.connect(context.destination);
        source.start(0, startOffset);report('playing',{offset:startOffset,volume:.55});
      } catch (_) { stop(); }
    }).catch(() => {});
  }
  function fade() {
    // Invalidate late decoding before it can start during arrival.
    token++; active = false; wanted = false;
    if (!source || !gain || !context) { stop(); return; }
    report('fading');
    try {
      const now = context.currentTime;
      gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + .25);
      const current = token; clear(timer); timer = later(() => { if (current === token) stop(); }, 250);
    } catch (_) { stop(); }
  }
  ui?.onChange(value => {
    if (value) { const riding = wanted; stop(); wanted = riding; }
    else if (wanted) { arm('guanyu'); start('guanyu', true); }
  });
  return {arm, start, stop, fade};
}
if (typeof window !== 'undefined') {
  const debug = new URLSearchParams(location.search).get('hoofAudioDebug') === '1';
  window.WusanHoofAudio = createWusanHoofAudio({url:new URL('assets/audio/guanyu-hooves.mp3',document.currentScript.src).href,debug:debug?entry=>{document.documentElement.dataset.hoofAudio=JSON.stringify(entry);console.debug('[hoof-audio] '+JSON.stringify(entry));}:undefined});
}
