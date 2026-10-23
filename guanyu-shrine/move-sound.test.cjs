const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const flush = async () => { for (let i=0;i<5;i++) await Promise.resolve(); };
function soundFixture(play = () => Promise.resolve(), shared) {
  const instances=[];
  class Audio {
    constructor(){instances.push(this);this.readyState=1;this.calls=0;this.pauses=0;}
    play(){this.calls++;return play();} pause(){this.pauses++;}
  }
  const ctx=vm.createContext({Audio,WusanUIAudio:shared}); vm.runInContext(read('move-sound.js'),ctx);
  return {sound:ctx.createHuarongMoveSound(),instances};
}
test('audio is lazy, cached, volume 40%, and rapid moves use one voice', async()=>{
  let resolve;const f=soundFixture(()=>new Promise(r=>resolve=r));
  assert.equal(f.instances.length,0);f.sound.play(false);assert.equal(f.instances.length,0);
  f.sound.play();const a=f.instances[0];assert.equal(a.volume,.4);assert.equal(a.preload,'none');
  assert.equal(a.src,'assets/audio/huarong-move.mp3');
  for(let i=0;i<100;i++)f.sound.play();assert.equal(a.calls,1);
  resolve();await flush();f.sound.play();assert.equal(a.calls,2);assert.equal(a.currentTime,0);assert.equal(f.instances.length,1);
  f.sound.stop();resolve();await flush();
});
test('muting stops playback and suppresses requests; unmute reuses audio',async()=>{
  const f=soundFixture();f.sound.setMuted(true);f.sound.play();assert.equal(f.instances.length,0);
  f.sound.setMuted(false);f.sound.play();await flush();const a=f.instances[0];
  f.sound.setMuted(true);const calls=a.calls;f.sound.play();assert.equal(a.calls,calls);assert.equal(a.currentTime,0);
  f.sound.setMuted(false);f.sound.play();await flush();assert.equal(f.instances.length,1);assert.equal(a.calls,calls+1);
});
test('blocked or broken playback and missing Audio never throw or disable future moves',async()=>{
  for(const play of [()=>Promise.reject(Error('NotAllowedError')),()=>{throw Error('decode');}]){
    const f=soundFixture(play);assert.doesNotThrow(()=>f.sound.play());await flush();assert.doesNotThrow(()=>f.sound.play());await flush();assert.equal(f.instances.length,1);
  }
  const ctx=vm.createContext({});vm.runInContext(read('move-sound.js'),ctx);assert.doesNotThrow(()=>ctx.createHuarongMoveSound().play());
});
test('game plays only after successful engine movement; selection, invalid move and undo stay silent',()=>{
  const elements=new Map(),events=new Map();let plays=0,stops=0,muted=false;
  function element(){const listeners=new Map();return {listeners,dataset:{},style:{},open:false,disabled:false,attrs:{},classList:{add(){},remove(){},toggle(){}},append(){},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},addEventListener(k,v){listeners.set(k,v);},querySelector(){return element();},setPointerCapture(){}};}
  const $=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  const doc={getElementById:$,createElement:element,querySelectorAll:()=>[],addEventListener:(k,v)=>events.set(k,v)};
  const engine=require('./engine.js')();
  const ctx={document:doc,window:{addEventListener:(k,v)=>events.set(k,v)},performance:{now:()=>0},setInterval(){},clearTimeout(){},createHuarongEngine:()=>engine,CloudFog:class{update(){}},createHuarongMoveSound:()=>({play(){plays++;},stop(){stops++;},setMuted(v){muted=v;}})};
  vm.runInNewContext(read('game.js')+'\n',ctx);
  // Capture board buttons through createElement, without exposing game internals.
  assert.equal(plays,0);
  // Re-run with capture to exercise pointer and keyboard entry paths.
  const pieces=[];doc.createElement=()=>{const e=element();pieces.push(e);return e;};
  vm.runInNewContext(read('game.js'),ctx);
  const buttons=pieces.filter(e=>e.dataset.piece);
  const key=key=>events.get('keydown')({key,preventDefault(){}});
  buttons[8].listeners.get('click')();assert.equal(plays,0);
  key('ArrowRight');assert.equal(plays,1);assert.equal($('move-count').textContent,'001');
  buttons[0].listeners.get('click')();key('ArrowUp');assert.equal(plays,1);
  $('undo-btn').onclick();assert.equal(plays,1);assert.equal($('move-count').textContent,'000');
  $('sound-btn').onclick();assert.equal(muted,true);$('sound-btn').onclick();assert.equal(muted,false);
  events.get('pagehide')();assert.ok(stops>0);
});

test('shared mute prevents lazy requests and local toggle updates the same mute state',async()=>{
 const shared={state:{muted:true},setMuted(value){this.state.muted=value;}};
 const f=soundFixture(()=>Promise.resolve(),shared);f.sound.play();assert.equal(f.instances.length,0);
 f.sound.setMuted(false);assert.equal(shared.state.muted,false);f.sound.play();await flush();assert.equal(f.instances.length,1);
 f.sound.setMuted(true);assert.equal(shared.state.muted,true);assert.ok(f.instances[0].pauses>0);const calls=f.instances[0].calls;
 f.sound.play();assert.equal(f.instances[0].calls,calls);assert.equal(f.instances.length,1);
});
