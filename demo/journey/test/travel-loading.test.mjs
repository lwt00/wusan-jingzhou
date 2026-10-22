import test from 'node:test';
import assert from 'node:assert/strict';
import {travelFixture,visibleState} from './fixtures/travel-loading-fixture.mjs';
const foreground='assets/travel-temp/foreground-willow.png';
const roleFrames=path=>/guanyu-riding-six|jingzhou-guard-diagnostic\/whole-frames|zhang-walking-small-eight/.test(path);
for(const [from,to,count] of [['guanyu','binyang',6],['binyang','zhangjuzheng',12],['zhangjuzheng','museum',8],['museum','guanyu',0]])test(`${from}: parallel cold preparation, all frames ready, no extra request on revisit`,async()=>{
 const f=travelFixture({plan:p=>({delay:roleFrames(p)?1500:2000})});const p=f.scene.prepare(from,to,1);await f.flush();
 assert.equal(f.requests.filter(r=>roleFrames(r.path)).length,count);assert.ok(f.requests.every(r=>r.at===0));assert.equal(f.scene.actor,null);assert.equal(f.requests.some(r=>r.path===foreground),false);
 await f.advance(1999);assert.equal(f.scene.actor,null);await f.advance(1);assert.equal(await p,true);assert.equal(f.scene.actorFrames?.length||0,count);assert.equal(f.scene.root.visible,false);
 const n=f.requests.length;assert.equal(await f.finish(f.scene.prepare(from,to,-1)),true);assert.equal(f.requests.length,n);assert.equal(f.scene.direction,-1);assert.equal(f.now(),2000);
});
for(const [from,to] of [['guanyu','binyang'],['binyang','museum'],['zhangjuzheng','guanyu'],['museum','zhangjuzheng']])test(`${from}: visible scene and playback match frozen original at fixed progress`,async()=>{
 const a=travelFixture(),b=travelFixture({old:true});await a.finish(a.scene.prepare(from,to,-1));await b.finish(b.scene.prepare(from,to,-1));
 assert.deepEqual(visibleState(a.scene),visibleState(b.scene));
 for(const [dt,p,walking] of [[.016,.05,true],[.08,.36,true],[.033,.76,true],[.016,1,false]]){a.scene.update(dt,p,walking);b.scene.update(dt,p,walking);assert.deepEqual(visibleState(a.scene),visibleState(b.scene));}
});
test('single failed character frame falls back as a whole; retry only requests that frame',async()=>{
 const bad='assets/guanyu-riding-six/ride_03.png';const f=travelFixture({plan:(p,n)=>({delay:100,fail:p===bad&&n===1})});await f.finish(f.scene.prepare('guanyu','binyang',1));assert.equal(f.scene.actorFrames,null);assert.equal(f.scene.actorSprite,null);assert.match(f.scene.warning,/普通探索者/);assert.equal(f.scene.cache.has(bad),false);
 const n=f.requests.length;await f.finish(f.scene.prepare('guanyu','binyang',1));assert.equal(f.scene.actorFrames.length,6);assert.equal(f.requests.length,n+1);assert.equal(f.requests.at(-1).path,bad);assert.equal(f.scene.warning,'');
});
test('4500 ms timeout evicts failure; retry succeeds and late decode cannot replace it',async()=>{
 const path='assets/guanyu-riding-six/ride_01.png',f=travelFixture({plan:(p,n)=>({delay:n===1?6000:20})});const first=f.scene.texture(path);await assert.rejects(f.finish(first),/timeout/);assert.equal(f.now(),4500);assert.equal(f.scene.cache.has(path),false);
 const replacement=f.scene.texture(path),texture=await f.finish(replacement);assert.equal(f.created(),1);await f.advance(2000);assert.equal(await f.scene.texture(path),texture);assert.equal(f.created(),1);assert.equal(f.requests.length,2);assert.equal(f.timers.size,0);
});
test('failure may only delete its own cache task, never a newer replacement',async()=>{
 const path='assets/travel/scenery/pine.png',f=travelFixture({plan:()=>({delay:100,fail:true})});const p=f.scene.texture(path);const replacement=Promise.resolve({newer:true});f.scene.cache.set(path,replacement);await assert.rejects(f.finish(p),/simulated/);assert.equal(f.scene.cache.get(path),replacement);
});
test('concurrent scene consumers share in-flight decodes and completed textures',async()=>{
 const f=travelFixture(),other=f.newScene();other.cache=f.scene.cache;const a=f.scene.prepare('guanyu','binyang',1),b=other.prepare('museum','binyang',1);await f.finish(Promise.all([a,b]));
 assert.equal(new Set(f.requests.map(r=>r.path)).size,f.requests.length);const n=f.requests.length;await f.finish(other.prepare('guanyu','museum',-1));assert.equal(f.requests.length,n);assert.equal(other.actorFrames[0],f.scene.actorFrames[0]);
});
test('return during loading never builds or shows an obsolete scene',async()=>{
 const f=travelFixture();const p=f.scene.prepare('guanyu','binyang',1);f.scene.cancel();assert.equal(await f.finish(p),false);assert.equal(f.scene.actor,null);assert.equal(f.scene.root.visible,false);assert.equal(f.scene.root.children.length,0);
 await f.finish(f.scene.prepare('guanyu','binyang',1));assert.equal(f.scene.actorFrames.length,6);assert.equal(f.requests.length,new Set(f.requests.map(r=>r.path)).size);
});
test('slow obsolete frames and failure cannot overwrite a newer prepared scene or warning',async()=>{
 const f=travelFixture({plan:p=>({delay:p.includes('guanyu-riding-six')?2000:100,fail:p.endsWith('ride_03.png')})});const old=f.scene.prepare('guanyu','binyang',1);await f.advance(10);const fresh=f.scene.prepare('zhangjuzheng','museum',-1);assert.equal(await f.finish(fresh),true);const actor=f.scene.actor,snapshot=visibleState(f.scene);assert.equal(f.scene.actorFrames.length,8);
 assert.equal(await f.finish(old),false);assert.equal(f.scene.actor,actor);assert.equal(f.scene.warning,'');assert.deepEqual(visibleState(f.scene),snapshot);
});
test('visible legacy foreground in a special configuration still loads with original layout',async()=>{
 const configure=c=>c.scenes['ink-road'].legacyLayerOpacity.foreground=.35;const a=travelFixture({configure}),b=travelFixture({old:true,configure});await a.finish(a.scene.prepare('museum','guanyu',1));await b.finish(b.scene.prepare('museum','guanyu',1));assert.ok(a.requests.some(r=>r.path===foreground));assert.deepEqual(visibleState(a.scene),visibleState(b.scene));
});
test('all scenery failure restores original foreground fallback; partial success keeps it invisible',async()=>{
 const a=travelFixture(),b=travelFixture({old:true});const scenery=new Set(a.config.scenes['ink-road'].scenery.map(i=>i.src));
 const plan=p=>({delay:100,fail:scenery.has(p)});const x=travelFixture({plan}),y=travelFixture({old:true,plan});await x.finish(x.scene.prepare('museum','guanyu',1));await y.finish(y.scene.prepare('museum','guanyu',1));assert.equal(x.requests.find(r=>r.path===foreground).at,100);assert.deepEqual(visibleState(x.scene),visibleState(y.scene));
 const partial=travelFixture({plan:p=>({delay:100,fail:p.endsWith('bamboo-fringe.png')})});await partial.finish(partial.scene.prepare('museum','guanyu',1));assert.equal(partial.requests.some(r=>r.path===foreground),false);assert.ok(partial.scene.scenery.some(s=>s.item.id==='willow-edge'));assert.match(partial.scene.warning,/沿途景物/);
});
test('no scenery configuration still gets the legacy foreground; cancel skips deferred fallback',async()=>{
 const f=travelFixture({configure:c=>c.scenes['ink-road'].scenery=[]});await f.finish(f.scene.prepare('museum','guanyu',1));assert.ok(f.requests.some(r=>r.path===foreground));assert.equal(f.scene.groups.find(g=>g.name==='foreground').group.alpha,1);
 const scenery=new Set(travelFixture().config.scenes['ink-road'].scenery.map(i=>i.src)),g=travelFixture({plan:p=>({delay:100,fail:scenery.has(p)})});const p=g.scene.prepare('museum','guanyu',1);g.scene.cancel();assert.equal(await g.finish(p),false);assert.equal(g.requests.some(r=>r.path===foreground),false);
});
test('environment failure retries on revisit without reloading successful neighbors',async()=>{
 const bad='assets/travel/scenery/pine.png',f=travelFixture({plan:(p,n)=>({delay:100,fail:p===bad&&n===1})});await f.finish(f.scene.prepare('museum','guanyu',1));assert.match(f.scene.warning,/沿途景物/);assert.equal(f.scene.cache.has(bad),false);
 const n=f.requests.length;await f.finish(f.scene.prepare('museum','guanyu',1));assert.equal(f.requests.length,n+1);assert.equal(f.requests.at(-1).path,bad);assert.equal(f.scene.warning,'');assert.ok(f.scene.scenery.some(s=>s.item.id==='forest-pine'));assert.equal(f.timers.size,0);
});
test('controlled cold wait shrinks from serial sum to parallel maximum and omits exactly one original asset',async()=>{
 for(const [from,to,count] of [['guanyu','binyang',29],['binyang','museum',35],['zhangjuzheng','guanyu',31],['museum','binyang',23]]){
  const plan=p=>({delay:roleFrames(p)?1500:2000}),a=travelFixture({plan}),b=travelFixture({old:true,plan});await a.finish(a.scene.prepare(from,to,1));await b.finish(b.scene.prepare(from,to,1));
  assert.equal(a.now(),2000);assert.equal(b.now(),from==='museum'?2000:3500);assert.equal(b.requests.length,count);assert.equal(a.requests.length,count-1);
  const newPaths=new Set(a.requests.map(r=>r.path));assert.deepEqual(b.requests.filter(r=>!newPaths.has(r.path)).map(r=>r.path),[foreground]);assert.equal(b.requests.reduce((n,r)=>n+r.bytes,0)-a.requests.reduce((n,r)=>n+r.bytes,0),2426477);
  const children=a.scene.root.children.length,n=a.requests.length;await a.finish(a.scene.prepare(from,to,1));assert.equal(a.requests.length,n);assert.equal(a.scene.root.children.length,children);assert.equal(a.timers.size,0);
 }
});
