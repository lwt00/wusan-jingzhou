/* Shared UI sounds. No audio element or media request is created before a user action. */
(() => {
  'use strict';
  const base = new URL('audio/', document.currentScript.src);
  let owner = window;
  try { if (parent !== window && parent.location.origin === location.origin && parent.WusanUIAudio) owner = parent; } catch (_) {}
  const state = owner === window ? {muted:false,serial:0} : owner.WusanUIAudio.state;
  const voices = new Map(); let exclusive = false, gesture = false;
  function stop() { for (const v of voices.values()) { v.token++; v.pending=false; try { v.audio.pause(); v.audio.currentTime=0; } catch (_) {} } }
  function allowed() { return !document.hidden && (navigator.userActivation ? navigator.userActivation.isActive : gesture); }
  function play(kind) {
    if (state.muted || !allowed()) return false;
    try {
      let v=voices.get(kind);
      if (!v) { const audio=new Audio();audio.preload='none';audio.volume=kind==='confirm'?.4:.28;audio.src=new URL(kind==='confirm'?'confirm.wav':'button.mp3',base).href;v={audio,pending:false,token:0};voices.set(kind,v); }
      state.serial++;
      if(v.pending)return true;
      for(const other of voices.values())if(other!==v){other.token++;other.pending=false;other.audio.pause();}
      v.audio.pause();if(v.audio.readyState>0)v.audio.currentTime=0;
      const token=++v.token;v.pending=true;
      Promise.resolve(v.audio.play()).catch(()=>{}).finally(()=>{if(token===v.token)v.pending=false;});return true;
    } catch (_) { const v=voices.get(kind);if(v)v.pending=false;return false; }
  }
  const listeners = new Set();
  function update(){if(state.muted)stop();for(const fn of listeners)fn(state.muted);}
  function setMuted(value){value=!!value;if(state.muted===value)return;state.muted=value;owner.dispatchEvent(new Event('wusan-audio-change'));if(owner!==window)update();}
  function onChange(fn){listeners.add(fn);fn(state.muted);return()=>listeners.delete(fn);}
  const change=()=>update();owner.addEventListener('wusan-audio-change',change);
  const api={state,play,stop,setMuted,onChange,exclusive(){exclusive=true;},confirm(){exclusive=true;return play('confirm');}};
  window.WusanUIAudio=api;
  // Capture only records a real gesture; playback waits until gameplay handlers can claim a dedicated sound.
  document.addEventListener('click',event=>{
    if(!event.isTrusted)return;gesture=true;exclusive=false;
    const button=event.target.closest?.('button,a'), serial=state.serial;
    queueMicrotask(()=>{
      if(!exclusive&&state.serial===serial&&button&&!button.disabled&&!button.closest('[data-ui-sound="off"]')&&!button.matches('.piece,[data-weapon],[data-move],[data-hook],[data-parry],[data-signal],#fire-touch,#skill-touch,#start,#sound-toggle,#sound-btn,#soundBtn,#artifactSoundBtn,#ui-sound-toggle,#seal-button,.quiz-option,#drumHit')){
        if(/印记/.test(button.textContent))api.confirm();else play('button');
      }
      gesture=false;exclusive=false;
    });
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',()=>{stop();owner.removeEventListener('wusan-audio-change',change);});
  window.addEventListener('pageshow',()=>{owner.addEventListener('wusan-audio-change',change);update();});
  // Embedded games reuse existing controls. Only the main page (or standalone Zhang) needs a new one.
  if(owner===window&&!document.querySelector('#sound-btn,#sound-toggle,#soundBtn')){
    const target=document.querySelector('footer nav,.topbar,.site-header nav');
    if(target){const b=document.createElement('button');b.id='ui-sound-toggle';b.type='button';b.onclick=()=>setMuted(!state.muted);target.append(b);onChange(m=>{b.textContent=m?'音效：关':'音效：开';b.setAttribute('aria-pressed',String(m));});}
  }
})();
