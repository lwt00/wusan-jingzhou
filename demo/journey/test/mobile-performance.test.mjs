import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {referenceDraw,updateFog as referenceFog} from './fixtures/ink-mask-reference.mjs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const inkSource=read('ink-transform.js'),main=read('journey-demo.js'),viewSource=read('landmark-view.js');
const w={};new Function('window',inkSource)(w);
const brush={tip:{x:150/1536,y:970/1024},scale:.18,feather:22,enterEnd:2/15,sweepEnd:2/3,exitEnd:13/15,rideStart:13/15,enterDistance:90,exitDistance:220};
export function maskEffect(box={left:-17.2,top:29.75,width:319.8,height:359.4}){
  const effect=new w.WusanInkTransform({},null,{duration:1.5,brush}),commands=[];
  Object.assign(effect,{root:{destroy(){}},box:{...box,right:box.left+box.width,bottom:box.top+box.height},caption:{style:{},remove(){}},masks:[0,1].map(()=>({canvas:{width:384,height:320},pixels:{data:new Uint8ClampedArray(384*320*4)},ctx:{putImageData(){}},texture:{source:{update(){}},destroy(){}}})),brush:{position:{set(x,y){this.x=x;this.y=y;}}},trace:{clear(){commands.length=0;},moveTo(...a){commands.push(['move',...a]);return this},lineTo(...a){commands.push(['line',...a]);return this},stroke(a){commands.push(['stroke',a]);return this}},commands});
  return effect;
}
for(const box of [{left:-17.2,top:29.75,width:319.8,height:359.4},{left:660.3,top:165.25,width:300.75,height:245.5},{left:-1100,top:-420,width:731,height:593}])
 test(`both full-resolution masks, brush and traces match old pixels at fixed times (${box.left})`,()=>{
  const actual=maskEffect(box),expected=maskEffect(box);actual.prepareMaskData();
  const points=[0,.04,2/15-1e-8,2/15,2/15+1e-8,.25,.4,.5,2/3-1e-8,2/3,2/3+1e-8,13/15,.93,.999999,1];
  for(const t of points){actual.elapsed=expected.elapsed=t*1.5;actual.draw();referenceDraw.call(expected);
    for(let i=0;i<2;i++)assert.deepEqual(actual.masks[i].pixels.data,expected.masks[i].pixels.data,`mask ${i}, t=${t}`);
    assert.equal(actual.revealed,expected.revealed);assert.equal(actual.boundary,expected.boundary);assert.equal(actual.tipX,expected.tipX);assert.equal(actual.tipY,expected.tipY);
    assert.equal(actual.brush.rotation,expected.brush.rotation);assert.equal(actual.brush.alpha,expected.brush.alpha);assert.equal(actual.caption.style.opacity,expected.caption.style.opacity);assert.deepEqual(actual.commands,expected.commands);
  }
 });
test('static cache is reused by draws and released with all mask textures',()=>{
 const e=maskEffect();let destroyed=0;e.masks.forEach(m=>m.texture.destroy=()=>destroyed++);e.prepareMaskData();const cache=e.maskStatic;
 for(const t of [.1,.3,.7]){e.elapsed=t;e.draw();assert.equal(e.maskStatic,cache);}
 assert.equal(cache.fiber.byteLength,384*320*8);e.dispose();assert.equal(e.maskStatic,null);assert.equal(e.masks,null);assert.equal(destroyed,2);e.dispose();assert.equal(destroyed,2);
});
function fogFixture(reference=false,fullSize=false){
 const size=fullSize?640*328:32,calls={paint:0,upload:0,color:0},context={Math,world:{visible:false},mode:'awaiting-explore',stationIndex:0,completed:[false,false,false,false],reduced:{matches:false},revealProgress:0,ambient:0,maskClock:0,maskSignature:'',mapRenderPending:false,maskWidth:fullSize?640:8,maskHeight:fullSize?328:4,
 fogPuffs:Array.from({length:4},(_,i)=>({openness:i*.11,wave:i*.03})),colorFilters:Array.from({length:4},()=>({saturate(){calls.color++;}})),buildingSprites:Array.from({length:4},()=>({})),fogLayer:{},fogPieces:[{g:{},base:4,baseY:7,speed:.06,seed:2}],clouds:[{g:{},base:9}],glow:{},maskPixels:{data:new Uint8ClampedArray(size*4)},regionWeights:Array.from({length:4},(_,i)=>new Float32Array(size).fill((i+1)/10)),localOpenings:Array.from({length:4},(_,i)=>new Float32Array(size).fill(.5+i*.1)),revealDistances:Array.from({length:4},(_,i)=>new Float32Array(size).fill(.1+i*.1)),maskPaint:{putImageData(){calls.paint++;}},maskTexture:{source:{update(){calls.upload++;}}}};
 vm.createContext(context);const paint=main.slice(main.indexOf('  function paintFogMask('),main.indexOf('\n  try {',main.indexOf('  function paintFogMask(')));
 const fog=reference?referenceFog.toString():main.slice(main.indexOf('  function updateFog('),main.indexOf('  function controls('));
 vm.runInContext(`function feather(v){v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);}${paint}\n${fog}`,context);
 return {c:context,calls,step(dt){context.ambient+=dt;vm.runInContext(`updateFog(${dt})`,context);}};
}
for(const index of [0,1,2,3])test(`hidden station ${index}: preserve fog evolution, no uploads, flush before first visible frame`,()=>{
 const a=fogFixture(),b=fogFixture(true);a.c.stationIndex=b.c.stationIndex=index;
 for(const phase of ['awaiting-explore','exploring-demo','landmark-return']){a.c.mode=b.c.mode=phase;for(const dt of [.016,.08,.033,.016]){a.step(dt);b.step(dt);}}
 assert.equal(a.calls.paint,0);assert.equal(a.calls.color,0);assert.equal(a.calls.upload,0);
 for(let i=0;i<4;i++){assert.equal(a.c.fogPuffs[i].openness,b.c.fogPuffs[i].openness);assert.equal(a.c.fogPuffs[i].wave,b.c.fogPuffs[i].wave);}
 a.c.world.visible=b.c.world.visible=true;a.step(.016);b.step(.016);
 assert.equal(a.calls.paint,1);assert.deepEqual(a.c.maskPixels.data,b.c.maskPixels.data);assert.deepEqual(a.c.fogPieces,b.c.fogPieces);assert.deepEqual(a.c.clouds,b.c.clouds);assert.equal(a.c.mapRenderPending,false);
});
test('full-size fog return, completion reveal and reduced motion retain old output',()=>{
 const a=fogFixture(false,true),b=fogFixture(true,true);
 for(const f of [a,b]){f.c.stationIndex=2;f.step(.08);f.c.world.visible=true;f.c.mode='revealing';f.c.revealProgress=.47;f.step(0);}
 assert.deepEqual(a.c.maskPixels.data,b.c.maskPixels.data);
 for(const f of [a,b]){f.c.completed[2]=true;f.c.mode='idle';f.step(0);f.c.reduced.matches=true;f.step(.016);}
 assert.deepEqual(a.c.maskPixels.data,b.c.maskPixels.data);assert.equal(a.c.fogPuffs[2].openness,1);
});
test('camera cache avoids repeated layout reads/writes and invalidates for resize, phases and station changes',()=>{
 let writes=0;const tracked=()=>new Proxy({}, {set(o,k,v){writes++;o[k]=v;return true;}}),point=()=>({set(){}});
 const c={viewportWidth:390,viewportHeight:844,viewScale:390/1600,cameraSignature:'',camera:{x:800,y:410,zoom:1},W:1600,H:820,mode:'idle',introActive:false,stationIndex:0,targetIndex:null,x:250,direction:1,travelSwitchDone:false,world:{visible:true,scale:point()},landmarkView:{active:false},travelScene:{root:{visible:false}},transformExplorer:{root:{visible:false}},travelModes:['traveling'],host:{dataset:tracked()},labels:Array.from({length:4},(_,i)=>({label:new Proxy({style:tracked()}, {set(o,k,v){writes++;o[k]=v;return true}}),x:250+i*370,y:200})),marker:{style:tracked()},layers:[],stations:[{id:'guanyu'},{id:'binyang'},{id:'zhangjuzheng'},{id:'museum'}],clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),landmarkLanding:()=>({x:250,y:400,scale:1})};
 Object.defineProperty(c.host,'clientWidth',{get(){throw Error('layout read in frame')}});Object.defineProperty(c.host,'clientHeight',{get(){throw Error('layout read in frame')}});
 vm.createContext(c);vm.runInContext(main.slice(main.indexOf('  function setDomValue('),main.indexOf('  function landmarkLanding(')),c);vm.runInContext('applyCamera()',c);const first=writes;assert.ok(first>0);
 for(let i=0;i<60;i++)vm.runInContext('applyCamera()',c);assert.equal(writes,first);
 c.viewportWidth=844;c.viewportHeight=390;c.viewScale=390/820;vm.runInContext('applyCamera()',c);assert.ok(writes>first);
 c.mode='awaiting-explore';c.landmarkView.active=true;c.world.visible=false;c.stationIndex=3;vm.runInContext('applyCamera()',c);assert.equal(c.host.dataset.view,'first-person-landmark');assert.equal(c.host.dataset.station,'museum');
 c.mode='idle';c.landmarkView.active=false;c.world.visible=true;vm.runInContext('applyCamera()',c);assert.equal(c.host.dataset.view,'overview');assert.equal(c.labels[0].label.hidden,false);
});
function viewFixture(){
 let now=0,next=0,writes=0,reads=0;const raf=new Map(),timers=new Map(),docListeners=new Map(),nodes=new Map();
 function node(){const attrs={},listeners=new Map(),style=new Proxy({setProperty(k,v){this[k]=v;}},{set(o,k,v){writes++;o[k]=v;return true}});return {hidden:false,dataset:{},style,children:[],listeners,textContent:'',append(...a){this.children.push(...a);},replaceChildren(...a){this.children=a;},setAttribute(k,v){writes++;attrs[k]=v;},getAttribute:k=>attrs[k]??null,addEventListener(k,fn){listeners.set(k,fn);},removeEventListener(k){listeners.delete(k);},querySelector(){return null;},remove(){},focus(){},getBoundingClientRect(){reads++;return this.rect;},rect:{left:10,top:20,width:600,height:400}};}
 const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};get('landmark-scene').hidden=true;get('landmark-story').open=false;
 const config={visuals:{},landmarks:Object.fromEntries(['guanyu','binyang','zhangjuzheng','museum'].map(id=>[id,{name:id,image:id+'.webp',display:{fullScene:true},...(id==='binyang'?{poetryCycle:{anchor:{u:.5,v:.66},groups:[{lines:['a'],credit:'x'},{lines:['b'],credit:'y'}],holdSeconds:6,fadeSeconds:1,initialDelay:.6,opacity:.94,floatAmplitude:6,floatSeconds:8}}:{})}]))};
 const context={window:{},URL,devicePixelRatio:3,document:{baseURI:'http://local/demo/journey/journey-demo.html',body:node(),hidden:false,getElementById:get,createElement:node,createTextNode:text=>({textContent:text}),addEventListener:(k,fn)=>docListeners.set(k,fn),removeEventListener:k=>docListeners.delete(k)},Image:class{constructor(){this.naturalWidth=1200;this.naturalHeight=800;}async decode(){}},matchMedia:()=>({matches:false}),performance:{now:()=>now},setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>{raf.set(++next,fn);return next;},cancelAnimationFrame:id=>raf.delete(id)};
 vm.createContext(context);vm.runInContext(viewSource,context);const view=new context.window.WusanLandmarkView(config,{onExplore(){},onBack(){},onDisplay(){}});
 return {view,get,raf,timers,docListeners,counts:()=>({writes,reads}),async flush(){for(let i=0;i<12;i++)await Promise.resolve();},frame(ms=16){now+=ms;const tasks=[...raf.values()];raf.clear();for(const fn of tasks)fn(now);},emit(type){get('landmark-image').listeners.get(type)({type,animationName:'landmark-push'});}};
}
test('poem anchor follows image push exactly, caches after end, invalidates on resize',async()=>{
 const f=viewFixture();f.view.show('binyang');await f.flush();const image=f.get('landmark-image'),poem=f.view.floatingPoem;
 for(const rect of [{left:10,top:20,width:600,height:400},{left:5.5,top:17,width:609,height:406}]){image.rect=rect;f.frame();assert.equal(poem.style.left,`${rect.left+rect.width*.5}px`);assert.equal(poem.style.top,`${rect.top+rect.height*.66}px`);}
 f.emit('animationend');f.frame();const cached=f.counts().reads;f.frame();f.frame();assert.equal(f.counts().reads,cached);
 image.rect={left:0,top:0,width:300,height:200};f.view.resize();f.frame();assert.equal(poem.style.top,'132px');assert.equal(poem.style.left,'150px');assert.equal(f.counts().reads,cached+1);
 f.view.poemTime=2;f.frame();const group=f.view.poemGroups[0],opacity=group.style.opacity,filter=group.style.filter;let writes=0;const old=group.style;group.style=new Proxy(old,{set(o,k,v){writes++;o[k]=v;return true;}});f.frame();assert.equal(writes,0);assert.equal(group.style.opacity,opacity);assert.equal(group.style.filter,filter);assert.equal(f.raf.size,1);
 f.view.destroy();assert.equal(f.raf.size,0);assert.equal(f.docListeners.size,0);assert.equal(image.listeners.size,0);
});
test('all four views, quick re-entry and cancellation retain a single poem loop and clear listeners',async()=>{
 const f=viewFixture();for(let round=0;round<3;round++)for(const id of ['binyang','guanyu','zhangjuzheng','museum']){f.view.show(id);await f.flush();f.view.setStage('awaiting-explore');assert.equal(f.view.start.disabled,false);assert.equal(f.view.active,true);assert.equal(f.raf.size,id==='binyang'?1:0);f.view.hide();assert.equal(f.raf.size,0);assert.equal(f.timers.size,0);}
 f.view.show('binyang');f.view.hide();f.view.show('museum');await f.flush();assert.equal(f.view.id,'museum');assert.equal(f.raf.size,0);f.view.destroy();assert.equal(f.docListeners.size,0);
});
test('travel timing, role routes, frame rates and loop ownership stay unchanged',()=>{
 const c={window:{},location:{search:''},URLSearchParams};vm.createContext(c);for(const name of ['travel-scenery-config.js','travel-config.js'])vm.runInContext(read(name),c);
 const config=c.window.WusanTravelConfig;assert.equal(config.travelTiming.travelDuration,3500);assert.equal(config.travelTiming.arrivalDuration,900);assert.equal(config.travelTiming.transformDuration,1500);
 for(const [from,scene,count] of [['guanyu','guanyu-riding',6],['binyang','binyang-guard-walking',12],['zhangjuzheng','zhang-walking',8]]){for(const to of ['guanyu','binyang','zhangjuzheng','museum'].filter(id=>id!==from))assert.equal(config.routes[`${from}->${to}`],scene);assert.equal(config.scenes[scene].slots.character.frames.fps,8);assert.equal(config.scenes[scene].slots.character.frames.sources.length,count);}
 assert.equal((main.match(/app\.ticker\.add\(/g)||[]).length,1);assert.doesNotMatch(inkSource,/requestAnimationFrame\(/);assert.equal((viewSource.match(/requestAnimationFrame\(tick\)/g)||[]).length,2);
});
test('real transform start/finish/cancel/skip restores actors and releases each cache and mask',()=>{
 let textures=0,completions=0,cancellations=0;
 class Container {
  constructor(){this.children=[];this.scale={x:1,y:1,set(x,y=x){this.x=x;this.y=y;}};this.position={set:(x,y)=>{this.x=x;this.y=y;}};this.x=800;this.y=640;}
  addChild(child){return this.addChildAt(child,this.children.length);}
  addChildAt(child,index){if(child.parent){const n=child.parent.children.indexOf(child);if(n>=0)child.parent.children.splice(n,1);}this.children.splice(index,0,child);child.parent=this;return child;}
  getChildIndex(child){return this.children.indexOf(child);}
  getLocalBounds(){return {minX:-150,minY:-250,maxX:150,maxY:0};}
  destroy(){this.children=[];}
 }
 class Sprite extends Container {constructor(){super();this.anchor={set(){}};}}
 class Graphics extends Container {clear(){return this}moveTo(){return this}lineTo(){return this}stroke(){return this}}
 const P={Container,Sprite,Graphics,Texture:{from:()=>({source:{update(){}},destroy(){textures++;}})}};
 const doc={createElement(){return {width:0,height:0,getContext(){return {createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}};}};}};
 const scope={};new Function('window','document',inkSource)(scope,doc);
 const scene=()=>{const root=new Container(),actor=new Container();root.addChild(actor);return {root,actor,show(){root.visible=true;},hide(){root.visible=false;}};};
 const from=scene(),to=scene(),effect=new scope.WusanInkTransform(P,null,{from,to,brush,duration:1.5,onComplete(){completions++;},onCancel(){cancellations++;}});
 assert.equal(effect.start(),true);const first=effect.maskStatic;assert.ok(first);assert.equal(effect.start(),false);effect.update(.75);assert.equal(effect.active,true);effect.update(.75);assert.equal(completions,1);assert.equal(effect.maskStatic,null);assert.equal(to.actor.parent,to.root);assert.equal(from.actor.mask,null);assert.equal(to.actor.mask,null);assert.equal(textures,2);
 effect.start();assert.notEqual(effect.maskStatic,first);effect.cancel();assert.equal(effect.maskStatic,null);assert.equal(cancellations,1);assert.equal(textures,4);assert.equal(to.actor.parent,to.root);
 effect.start();effect.skip();assert.equal(completions,2);assert.equal(effect.maskStatic,null);assert.equal(textures,6);effect.destroy();assert.equal(textures,6);assert.equal(to.actor.parent,to.root);
});
test('hidden map skips person rendering; first visible pose uses current station and clock',()=>{
 let positions=0,cameraUpdates=0;const point=()=>({set(...args){this.values=args;positions++;}}),chain=()=>({clear(){return this},moveTo(){return this},lineTo(){return this},stroke(){return this},poly(){return this},fill(){return this}});
 const c={world:{visible:false},applyCamera(){cameraUpdates++;},landmarkLanding(){throw Error('hidden pose evaluated');},person:{position:point(),scale:point()},contactShadow:{position:point(),scale:point()},legs:chain(),footClip:chain(),clippedStation:null,body:{scale:{}},arm:{},reduced:{matches:false},ambient:8,marker:{textContent:''},host:{dataset:{}}};vm.createContext(c);
 vm.runInContext(main.slice(main.indexOf('  function setDomValue('),main.indexOf('  function applyCamera('))+'\n'+main.slice(main.indexOf('  function renderPose('),main.indexOf('  function updateFog(')),c);
 vm.runInContext('renderPose()',c);assert.equal(positions,0);assert.equal(cameraUpdates,1);
 c.world.visible=true;for(const [i,id] of ['guanyu','binyang','zhangjuzheng','museum'].entries()){
  c.landmarkLanding=()=>({id,x:250+i*370,y:400+i*20,scale:.9,face:-1,stepSlope:0,footSpread:3});vm.runInContext('renderPose()',c);
  assert.deepEqual(c.person.position.values,[250+i*370,400+i*20]);assert.equal(c.clippedStation,id);assert.equal(c.body.scale.y,1+Math.sin(8*1.4)*.007);assert.equal(JSON.parse(c.host.dataset.landing).id,id);
 }
});
