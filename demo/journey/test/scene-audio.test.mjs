import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const source=read('scene-audio.js'),main=read('journey-demo.js'),viewSource=read('landmark-view.js');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({slow=false,slowDecode=false,fail=false,blocked=false,missing=false}={}) {
 const requests=[],sources=[],gains=[],timers=new Map();let change,contexts=0,resolveLoad,resolveDecode,hidden=false;
 const ui={state:{muted:false},exclusiveCalls:0,stopCalls:0,exclusive(){this.exclusiveCalls++;},stop(){this.stopCalls++;},onChange(fn){change=fn;fn(false);return()=>{change=null;};}};
 const ctx={state:blocked?'suspended':'running',currentTime:3,destination:{},resume(){if(blocked)return Promise.reject(Error('blocked'));this.state='running';return Promise.resolve();},close(){this.closed=true;},decodeAudioData:()=>slowDecode?new Promise(resolve=>resolveDecode=resolve):Promise.resolve({duration:3.245}),
 createBufferSource(){const s={connect(){},disconnect(){this.disconnected=true;},start(...args){this.args=args;this.started=true;},stop(){this.stopped=true;}};sources.push(s);return s;},
 createGain(){const g={gain:{value:0,setValueAtTime(v){this.value=v;},cancelScheduledValues(){},linearRampToValueAtTime(v,t){g.ramp=[v,t];}},connect(){},disconnect(){this.disconnected=true;}};gains.push(g);return g;}};
 const realm=vm.createContext({navigator:{userActivation:{isActive:true}},Promise,setTimeout,clearTimeout});vm.runInContext(source,realm);
 const response=()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)});
 const audio=realm.createWusanSceneAudio({ui,hidden:()=>hidden,makeContext(){contexts++;if(missing)throw Error('no WebAudio');return ctx;},fetch(url){requests.push(url);return fail?Promise.reject(Error('network')):slow?new Promise(resolve=>resolveLoad=resolve):Promise.resolve(response());},setTimeout(fn,ms){timers.set(fn,ms);return fn;},clearTimeout(fn){timers.delete(fn);}});
 return {audio,realm,ui,ctx,requests,sources,gains,timers,get contexts(){return contexts;},resolve(){resolveLoad(response());},decode(){resolveDecode({duration:3.245});},hide(){hidden=true;audio.stopAll();},mute(value=true){ui.state.muted=value;change?.(value);}};
}
test('no eager context/download; arm only unlocks inside the current user gesture',async()=>{
 const f=fixture();assert.equal(f.contexts,0);assert.equal(f.requests.length,0);f.realm.navigator.userActivation.isActive=false;f.audio.arm();f.audio.startWalk('zhangjuzheng',true);await flush();assert.equal(f.contexts,0);
 f.realm.navigator.userActivation.isActive=true;f.audio.arm();assert.equal(f.contexts,1);assert.equal(f.requests.length,0);assert.equal(f.ui.exclusiveCalls,1);
});
test('Zhang and guard use a cached 40% seamless 2-second loop; Guan Yu and missing explorer frames are silent',async()=>{
 const f=fixture();f.audio.arm();f.audio.startWalk('guanyu',true);f.audio.startWalk('explorer',false);await flush();assert.equal(f.requests.length,0);
 for(const id of ['zhangjuzheng','jingzhouGuard']){f.audio.startWalk(id,true);await flush();const s=f.sources.at(-1);assert.equal(s.loop,true);assert.equal(s.loopStart,.2);assert.equal(s.loopEnd,2.2);assert.deepEqual(s.args,[0,.2]);assert.equal(f.gains.at(-1).gain.value,.4);f.audio.stopWalk();}
 assert.equal(f.requests.length,1);assert.equal(f.sources.filter(s=>s.started&&!s.stopped).length,0);
 // Future explorer animation is opt-in through a real frames flag.
 f.audio.startWalk('explorer',true);await flush();assert.equal(f.sources.at(-1).started,true);
});
test('arrival fades for 250ms; stale fade cannot stop the next walk',async()=>{
 const f=fixture();f.audio.arm();f.audio.startWalk('zhangjuzheng',true);await flush();f.audio.fadeWalk();assert.deepEqual(f.gains[0].ramp,[0,3.25]);assert.equal([...f.timers.values()][0],250);const stale=[...f.timers.keys()][0];stale();assert.equal(f.sources[0].stopped,true);
 f.audio.startWalk('jingzhouGuard',true);await flush();stale();assert.equal(f.sources[1].stopped,undefined);assert.equal(f.timers.size,0);
});
for(const reason of ['cancel','skip','pause','pagehide'])test(`${reason} prevents late fetching/decoding from resurrecting footsteps`,async()=>{
 const f=fixture({slow:true});f.audio.arm();f.audio.startWalk('zhangjuzheng',true);await flush();f.audio.stopAll();f.resolve();await flush();assert.equal(f.sources.length,0);
 const g=fixture({slowDecode:true});g.audio.arm();g.audio.startWalk('jingzhouGuard',true);await flush();g.audio.fadeWalk();g.decode();await flush();assert.equal(g.sources.length,0);
});
test('text is 35%, skips its quiet prefix, and is consumed once per entrance',async()=>{
 const f=fixture();f.audio.arm();f.audio.beginText('a');f.audio.text('a',()=>false);assert.equal(f.requests.length,0);f.audio.text('a');f.audio.text('a');await flush();assert.equal(f.sources.length,1);assert.equal(f.sources[0].loop,undefined);assert.deepEqual(f.sources[0].args,[0,1.15]);assert.equal(f.gains[0].gain.value,.35);
 f.audio.beginText('b');assert.equal(f.sources[0].stopped,true);f.audio.text('a');f.audio.text('b');await flush();assert.equal(f.sources.length,2);assert.equal(f.requests.length,1);
});
test('rapid re-entry isolates old text request; all sounds stop on hiding',async()=>{
 const f=fixture({slow:true});f.audio.arm();f.audio.beginText('old');f.audio.text('old');await flush();f.audio.beginText('new');f.audio.text('new');f.resolve();await flush();assert.equal(f.sources.length,1);f.hide();assert.equal(f.sources[0].stopped,true);assert.equal(f.gains[0].disconnected,true);
});
test('text whose visibility window expired while loading is omitted rather than played late',async()=>{
 let valid=true;const f=fixture({slow:true});f.audio.arm();f.audio.beginText(1);f.audio.text(1,()=>valid);await flush();valid=false;f.resolve();await flush();assert.equal(f.sources.length,0);
});
test('mute suppresses downloads and one-shot replay, unmute resumes only an actual walking phase',async()=>{
 const f=fixture();f.mute();f.audio.arm();f.audio.startWalk('zhangjuzheng',true);f.audio.beginText('a');f.audio.text('a');await flush();assert.equal(f.requests.length,0);f.mute(false);await flush();assert.equal(f.sources.length,1);assert.equal(f.sources[0].loop,true);assert.equal(f.requests.length,1);
 f.mute();assert.equal(f.sources[0].stopped,true);f.audio.stopAll();f.mute(false);f.audio.text('a');await flush();assert.equal(f.sources.length,1);
});
test('network/decode permissions and missing API never throw or block the next entrance',async()=>{
 for(const config of [{fail:true},{blocked:true},{missing:true}]){const f=fixture(config);assert.doesNotThrow(()=>{f.audio.arm();f.audio.startWalk('zhangjuzheng',true);f.audio.beginText(1);f.audio.text(1);});await flush();assert.equal(f.sources.length,0);f.audio.stopAll();}
 const f=fixture({fail:true});f.audio.arm();f.audio.startWalk('zhangjuzheng',true);await flush();f.audio.startWalk('zhangjuzheng',true);await flush();assert.equal(f.requests.length,2);
});
function landmarkFixture(reduced=false) {
 const realm=vm.createContext({});vm.runInContext(source,realm);
 let serial=0;const raf=new Map(),calls=[],listeners=new Map();let observer;
 const title={getAnimations:()=>[{playState:title.state}],state:'running',opacity:1},copy={getAnimations:()=>[],opacity:1};
 const root={hidden:false,dataset:{state:'display',stage:'landmark-enter'},querySelector:()=>copy,addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type)};
 const doc={hidden:false,getElementById:()=>title};
 const view={root,active:true,ready:false,natural:null,image:{hidden:true}};
 const audio={beginText:id=>calls.push(['begin',id]),stopText:()=>calls.push(['stop']),text:(id,valid)=>{if(valid())calls.push(['play',id]);}};
 const bind=realm.bindWusanLandmarkAudio(audio,{document:doc,reduced:()=>reduced,getComputedStyle:node=>({opacity:String(node.opacity),display:'block',visibility:'visible'}),requestAnimationFrame:fn=>{raf.set(++serial,fn);return serial;},cancelAnimationFrame:id=>raf.delete(id),MutationObserver:class {constructor(fn){observer=fn;}observe(){}disconnect(){}}});
 const frames=()=>{for(let i=0;i<2;i++)for(const[id,fn]of [...raf]){raf.delete(id);fn();}};
 return {bind,view,root,title,copy,doc,calls,raf,frames,mutate:()=>observer(),animate:()=>listeners.get('animationstart')?.({animationName:'landmark-copy-in',target:title}),ready(){view.ready=true;view.natural={};view.image.hidden=false;root.dataset.stage='awaiting-explore';bind.landmarkReady(view);}};
}
for(const id of ['guanyu','binyang','zhangjuzheng','museum'])test(`${id}: real readiness plus visible title, once per entry; no per-letter/per-frame replay`,()=>{
 const f=landmarkFixture();f.root.dataset.landmark=id;f.bind.beginLandmark(f.view);f.animate();f.frames();assert.equal(f.calls.filter(x=>x[0]==='play').length,0);f.ready();f.frames();assert.equal(f.calls.filter(x=>x[0]==='play').length,1);f.animate();f.mutate();f.frames();assert.equal(f.calls.filter(x=>x[0]==='play').length,1);
 f.bind.endLandmark(f.view);f.bind.beginLandmark(f.view);f.animate();f.frames();assert.equal(f.calls.filter(x=>x[0]==='play').length,2);
});
test('repeated stage writes cannot starve the two-frame reveal cue',()=>{
 const f=landmarkFixture();f.bind.beginLandmark(f.view);f.ready();
 for(let frame=0;frame<6;frame++){
   f.mutate();for(const[id,fn]of [...f.raf]){f.raf.delete(id);fn();}
 }
 assert.equal(f.calls.filter(x=>x[0]==='play').length,1);
});
test('opacity zero, hidden page, unloaded image, expired animation and obsolete view cannot cue text',()=>{
 for(const problem of ['opacity','hidden','image','finished','cancel']){const f=landmarkFixture();f.bind.beginLandmark(f.view);f.ready();if(problem==='opacity')f.title.opacity=0;if(problem==='hidden')f.doc.hidden=true;if(problem==='image')f.view.image.hidden=true;if(problem==='finished')f.title.state='finished';if(problem==='cancel')f.bind.endLandmark(f.view);f.frames();assert.equal(f.calls.filter(x=>x[0]==='play').length,0,problem);}
});
test('reduce-motion appearance still cues once; opening a game stops and cannot re-cue the same entrance',()=>{
 const f=landmarkFixture(true);f.title.state='finished';f.bind.beginLandmark(f.view);f.ready();f.frames();assert.equal(f.calls.filter(x=>x[0]==='play').length,1);f.root.dataset.state='game';f.mutate();assert.equal(f.calls.at(-1)[0],'stop');f.root.dataset.state='display';f.mutate();f.frames();assert.equal(f.calls.filter(x=>x[0]==='play').length,1);
});
test('actual phase hook uses departure role and real frames, with Guanyu horse routing left unchanged',()=>{
 for(const role of ['guanyu','zhangjuzheng','jingzhouGuard',null]){const calls=[];const c=vm.createContext({WusanSceneAudio:{startWalk:(...args)=>calls.push(['walk',...args]),fadeWalk:()=>calls.push(['fade']),stopWalk:()=>calls.push(['stop'])},reduced:{matches:false},transformSpec:role?{characterId:role}:null,travelScene:{actorFrames:role?[{}]:null},status:{},controls(){}});
 vm.runInContext(main.slice(main.indexOf('  function setPhase('),main.indexOf('  function cameraBlend(')),c);c.setPhase('travel-depart');c.setPhase('transforming');c.setPhase('traveling');c.setPhase('travel-arrive');c.setPhase('travel-cancel');assert.deepEqual(calls,[['stop'],['stop'],['walk',role||'explorer',!!role],['fade'],['stop']]);}
});
test('entry hooks do not modify CSS/poem timers, lazy sources resolve, and epilogue remains absent',()=>{
 const html=read('journey-demo.html');assert.ok(html.indexOf('shared/interaction-audio.js')<html.indexOf('scene-audio.js'));assert.ok(html.indexOf('scene-audio.js')<html.indexOf('journey-demo.js'));
 for(const file of ['walking.mp3','text-reveal.mp3']){assert.ok(existsSync(new URL('../assets/audio/'+file,import.meta.url)));assert.ok(!html.includes(file));}
 assert.match(viewSource,/beginLandmark\(this\)/);assert.match(viewSource,/landmarkReady\(this\)/);assert.match(viewSource,/hide\(\)\{globalThis.WusanSceneAudio\?\.endLandmark/);assert.doesNotMatch(main+html,/epilogue/i);
 assert.match(main,/skip.addEventListener[^\n]+WusanSceneAudio\?\.stopAll/);assert.match(main,/if\(document.hidden\)globalThis.WusanSceneAudio\?\.stopAll/);assert.match(main,/pagehide[^\n]+WusanSceneAudio\?\.stopAll/);
});
