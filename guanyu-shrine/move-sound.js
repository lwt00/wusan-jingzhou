'use strict';
// One lazy media element: no fetch, decoding or playback during game entry.
function createHuarongMoveSound() {
  let audio = null, muted = false, pending = false, generation = 0, activated = false;
  function stop() {
    generation++; pending = false;
    try { if (audio) { audio.pause(); audio.currentTime = 0; } } catch (_) {}
  }
  function play(userMove = true) {
    if (userMove) activated = true;
    if (muted || globalThis.WusanUIAudio?.state.muted || !activated || pending) return;
    try {
      if (!audio) {
        audio = new Audio(); audio.preload = 'none'; audio.volume = 0.4;
        audio.src = 'assets/audio/huarong-move.mp3';
      }
      audio.pause();
      if (audio.readyState > 0) audio.currentTime = 0;
      const current = ++generation;
      pending = true;
      // Called in the move gesture, without awaiting loading or retaining a queue of moves.
      Promise.resolve(audio.play()).catch(() => {}).finally(() => {
        if (current === generation) pending = false;
      });
    } catch (_) { pending = false; }
  }
  return { play, stop, setMuted(value) { muted = !!value; globalThis.WusanUIAudio?.setMuted(muted); if (muted) stop(); } };
}
