const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,p),'utf8');
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
test('lazy cached voices cap overlap; mute, stop and rejected playback are safe',async()=>{
 const instances=[];let resolve;class Audio{constructor(){instances.push(this);this.readyState=1;this.calls=0;}pause(){this.paused=true;}play(){this.calls++;return new Promise(r=>resolve=r);}}
 const ctx=vm.createContext({Audio});vm.runInContext(read('interaction-sounds.js'),ctx);const sound=ctx.createBinyangSounds();assert.equal(instances.length,0);
 sound.arrow();for(let i=0;i<100;i++)sound.arrow();assert.equal(instances.length,1);assert.equal(instances[0].calls,1);assert.equal(instances[0].volume,.4);
 resolve();await flush();sound.arrow();assert.equal(instances[0].calls,2);assert.equal(instances[0].currentTime,0);resolve();await flush();
 sound.drum();assert.equal(instances.length,2);assert.equal(instances[1].volume,.5);resolve();await flush();sound.setMuted(true);sound.arrow();sound.drum();assert.equal(instances[1].calls,1);assert.ok(instances.every(a=>a.paused&&a.currentTime===0));
 sound.setMuted(false);instances[0].play=()=>Promise.reject(Error('blocked'));sound.arrow();await flush();sound.arrow();await flush();sound.stop();assert.equal(instances.length,2);
});
test('missing audio API cannot block game',()=>{const ctx=vm.createContext({});vm.runInContext(read('interaction-sounds.js'),ctx);const sound=ctx.createBinyangSounds();assert.doesNotThrow(()=>{sound.arrow();sound.drum();sound.stop();});});
test('real fire function sounds only created player arrows; cooldown, no supplies and stones silent',()=>{
 const source=read('binyanglou-game.js'),code=source.match(/function fire\(\)\{[^\n]+/)[0];let sounds=0;
 const s={status:'playing',paused:false,phase:'combat',fireCd:0,supplies:20,weapon:'bolt',fireRate:.3,damage:1,aim:{x:.5,y:.5},bolts:[]};
 const ctx=vm.createContext({s,sounds:{arrow(){sounds++;}},ballista:{classList:{remove(){},add(){}}},document:{createElement:()=>({})},objects:{append(){}},updateHud(){},showBanner(){}});vm.runInContext(code,ctx);
 ctx.fire();assert.equal(sounds,1);assert.equal(s.bolts.length,1);ctx.fire();assert.equal(sounds,1);
 s.fireCd=0;s.weapon='stone';ctx.fire();assert.equal(sounds,1);assert.equal(s.bolts.length,2);
 s.fireCd=0;s.weapon='fire';s.supplies=0;ctx.fire();assert.equal(sounds,1);s.supplies=10;ctx.fire();assert.equal(sounds,2);
 s.paused=true;s.fireCd=0;ctx.fire();assert.equal(sounds,2);
});
test('actual start button handler drums only on initial player click, never pause/replay/host',()=>{
 const source=read('binyanglou-game.js');const body=source.match(/startBtn.addEventListener\('click',\(\)=>\{(.*?)\}\);knowledgeContinue/)[1];
 let starts=0,drums=0,resumes=0;const ctx=vm.createContext({overlayMode:'intro',startBtn:{textContent:'击鼓开战'},start(){starts++;},togglePause(){resumes++;},sounds:{drum(){drums++;}}});
 vm.runInContext(body,ctx);assert.equal(drums,1);assert.equal(starts,1);ctx.overlayMode='pause';vm.runInContext(body,ctx);assert.equal(drums,1);assert.equal(resumes,1);
 ctx.overlayMode='failed';ctx.startBtn.textContent='重整城防';vm.runInContext(body,ctx);assert.equal(drums,1);assert.equal(starts,2);ctx.start();assert.equal(drums,1);
 assert.match(source,/function clearScene\(\)\{sounds.stop\(\)/);assert.match(source,/pagehide.*sounds.stop/);assert.match(source,/if\(s.paused\)\{sounds.stop/);
});
