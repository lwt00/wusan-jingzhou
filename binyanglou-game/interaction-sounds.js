'use strict';
function createBinyangSounds() {
  let muted = false;
  const voices = new Map();
  function stop() {
    for (const voice of voices.values()) {
      voice.generation++; voice.pending = false;
      try { voice.audio.pause(); voice.audio.currentTime = 0; } catch (_) {}
    }
  }
  function play(name, volume) {
    if (muted) return;
    try {
      let voice = voices.get(name);
      if (!voice) {
        const audio = new Audio(); audio.preload = 'none'; audio.volume = volume;
        audio.src = `assets/audio/${name}.mp3`;
        voice = {audio, pending: false, generation: 0}; voices.set(name, voice);
      }
      if (voice.pending) return;
      voice.audio.pause();
      if (voice.audio.readyState > 0) voice.audio.currentTime = 0;
      const generation = ++voice.generation;
      voice.pending = true;
      // Invoke within the user gesture; loading is asynchronous and never awaited by gameplay.
      Promise.resolve(voice.audio.play()).catch(() => {}).finally(() => {
        if (generation === voice.generation) voice.pending = false;
      });
    } catch (_) { const voice = voices.get(name); if (voice) voice.pending = false; }
  }
  return {arrow: () => play('arrow', 0.4), drum: () => play('battle-drum', 0.5), stop,
    setMuted(value) { muted = !!value; if (muted) stop(); }};
}
