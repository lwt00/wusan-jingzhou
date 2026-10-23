import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../travel-hoof-audio.js',import.meta.url),'utf8');
const main=readFileSync(new URL('../journey-demo.js',import.meta.url),'utf8');
const flush=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};
function fixture({slow=false,fail=false,blocked=false}={}){
 const sources=[],gains=[],timers=new Map(),state={muted:false};let requests=0,contexts=0,resolve,change;
 const ui={state,onChange(fn){change=fn;},exclusive(){},stop(){}};
 const ctx={state:blocked?'suspended':'running',currentTime:2,destination:{},resume(){return Promise.resolve();},decodeAudioData:async()=>({}),createBufferSource(){const s={connect(){},disconnect(){},start(...args){this.started=true;this.startArgs=args;},stop(){this.stopped=true;}};sources.push(s);return s;},createGain(){const g={gain:{value:.35,setValueAtTime(v){this.value=v;},cancelScheduledValues(){},linearRampToValueAtTime(v,t){g.ramp=[v,t];}},connect(){},disconnect(){}};gains.push(g);return g;}};
 const realm=vm.createContext({Promise,setTimeout,clearTimeout,navigator:{userActivation:{isActive:true}}});vm.runInContext(source,realm);
 const audio=realm.createWusanHoofAudio({ui,makeContext(){contexts++;return ctx;},fetch(){requests++;return fail?Promise.reject(Error('network')):slow?new Promise(r=>resolve=r):Promise.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)});},setTimeout(fn,ms){timers.set(fn,ms);return fn;},clearTimeout(fn){timers.delete(fn);}});
 return {audio,ctx,sources,gains,timers,ui,realm,resolve(){resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)});},mute(){state.muted=true;change(true);},unmute(){state.muted=false;change(false);},get requests(){return requests;},get contexts(){return contexts;}};
}
test('no eager context or request; non-riding departure characters stay silent',async()=>{
 const f=fixture();assert.equal(f.requests,0);assert.equal(f.contexts,0);
 for(const who of ['zhangjuzheng','jingzhouGuard','explorer',undefined]){f.audio.arm(who);f.audio.start(who,true);}await flush();assert.equal(f.requests,0);assert.equal(f.sources.length,0);
});
test('Guan Yu departure plays for different destinations only after formal riding begins, at 55%',async()=>{
 const f=fixture();for(const destination of ['binyang','zhangjuzheng','museum']){f.audio.arm('guanyu');await flush();assert.equal(f.sources.filter(s=>s.started&&!s.stopped).length,0);f.audio.start('guanyu',true);await flush();assert.equal(f.gains.at(-1).gain.value,.55);assert.equal(f.sources.at(-1).started,true);f.audio.stop();}
 assert.equal(f.requests,1);assert.equal(f.contexts,1);
});
test('missing riding frames remain silent even with Guan Yu origin',async()=>{const f=fixture();f.audio.arm('guanyu');f.audio.start('guanyu',false);await flush();assert.equal(f.sources.length,0);});
test('normal arrival ramps for 250ms then stops and disconnects',async()=>{const f=fixture();f.audio.arm('guanyu');f.audio.start('guanyu',true);await flush();f.audio.fade();assert.deepEqual(f.gains[0].ramp,[0,2.25]);assert.equal([...f.timers.values()][0],250);assert.equal(f.sources[0].stopped,undefined);[...f.timers.keys()][0]();assert.equal(f.sources[0].stopped,true);assert.equal(f.timers.size,0);});
test('skip, cancel and pause stop immediately; a pending load cannot resurrect old sound',async()=>{for(const reason of ['skip','cancel','pause']){const f=fixture({slow:true});f.audio.arm('guanyu');f.audio.start('guanyu',true);await flush();f.audio.stop();f.resolve();await flush();assert.equal(f.sources.length,0);}});
test('decode finishing after arrival must not start playback',async()=>{const f=fixture({slow:true});f.audio.arm('guanyu');f.audio.start('guanyu',true);await flush();f.audio.fade();f.resolve();await flush();assert.equal(f.sources.length,0);});
test('shared mute blocks loading and immediately stops active playback',async()=>{const f=fixture();f.mute();f.audio.arm('guanyu');f.audio.start('guanyu',true);await flush();assert.equal(f.requests,0);const g=fixture();g.audio.arm('guanyu');g.audio.start('guanyu',true);await flush();g.mute();assert.equal(g.sources[0].stopped,true);});
test('a cancelled fade cannot stop a new riding session',async()=>{const f=fixture();f.audio.arm('guanyu');f.audio.start('guanyu',true);await flush();f.audio.fade();const stale=[...f.timers.keys()][0];f.audio.arm('guanyu');f.audio.start('guanyu',true);await flush();stale();assert.equal(f.timers.size,0);assert.equal(f.sources[0].stopped,true);assert.equal(f.sources[1].stopped,undefined);});
test('network failure and blocked autoplay stay isolated and allow later retry',async()=>{const f=fixture({fail:true});f.audio.arm('guanyu');f.audio.start('guanyu',true);await flush();f.audio.arm('guanyu');f.audio.start('guanyu',true);await flush();assert.equal(f.requests,2);assert.equal(f.sources.length,0);const g=fixture({blocked:true});g.audio.arm('guanyu');g.audio.start('guanyu',true);await flush();assert.equal(g.sources.length,0);});
test('context unlocking is refused without current user activation',async()=>{const f=fixture();f.realm.navigator.userActivation.isActive=false;f.audio.arm('guanyu');f.audio.start('guanyu',true);await flush();assert.equal(f.contexts,0);assert.equal(f.requests,0);});
test('actual phase hook chooses the origin character and real frames, never the destination',()=>{
 const code=main.slice(main.indexOf('  function setPhase('),main.indexOf('  function cameraBlend('));const calls=[];
 const c=vm.createContext({WusanHoofAudio:{start(...args){calls.push(['start',...args]);},stop(){calls.push(['stop']);},fade(){calls.push(['fade']);}},reduced:{matches:false},transformSpec:{characterId:'guanyu'},travelScene:{actorFrames:[{}]},status:{},controls(){}});vm.runInContext(code,c);
 c.setPhase('transforming');c.setPhase('traveling');c.setPhase('travel-arrive');c.setPhase('travel-cancel');assert.deepEqual(calls,[['stop'],['start','guanyu',true],['fade'],['stop']]);c.reduced.matches=true;c.setPhase('traveling');assert.deepEqual(calls.at(-1),['stop']);
});
test('skip/cancel/page lifecycle stop hooks are independent of sprite frame updates',()=>{assert.match(main,/function stopTravelScene\(\)\{globalThis.WusanHoofAudio\?\.stop/);assert.match(main,/skip.addEventListener[^\n]+WusanHoofAudio\?\.stop/);assert.match(main,/pagehide[^\n]+WusanHoofAudio\?\.stop/);assert.match(main,/if\(document.hidden\)globalThis.WusanHoofAudio\?\.stop/);assert.doesNotMatch(source,/actorFrames|requestAnimationFrame|setInterval/);});

test('supplied audio begins at its first audible hoof beat instead of its silent 3.54s prefix',async()=>{const f=fixture();f.audio.arm('guanyu');f.audio.start('guanyu',true);await flush();assert.deepEqual(f.sources[0].startArgs,[0,3.54]);});
test('unmuting during actual riding unlocks and restores sound, but cannot restart after arrival or cancellation',async()=>{const f=fixture();f.mute();f.audio.arm('guanyu');f.audio.start('guanyu',true);assert.equal(f.contexts,0);f.unmute();await flush();assert.equal(f.sources[0].started,true);f.mute();f.audio.stop();f.unmute();await flush();assert.equal(f.sources.length,1);const g=fixture();g.audio.arm('guanyu');g.audio.start('guanyu',true);await flush();g.mute();g.audio.fade();g.unmute();await flush();assert.equal(g.sources.length,1);});
