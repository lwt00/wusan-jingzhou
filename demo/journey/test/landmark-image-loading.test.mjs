import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function fixture(plans) {
  let now=0, seq=0;
  const timers=new Map(), images=[];
  const node=()=>({hidden:false,dataset:{},style:{setProperty(){}},children:[],textContent:'',attrs:{},
    setAttribute(k,v){this.attrs[k]=v;},append(...items){this.children.push(...items);},
    replaceChildren(...items){this.children=items;},querySelector(){return null;},
    addEventListener(type,fn){this[type]=fn;}});
  const nodes=new Map();
  const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
  const schedule=(fn,ms)=>{const id=++seq;timers.set(id,{at:now+ms,fn});return id;};
  const context={window:{},URL,performance:{now:()=>now},setTimeout:schedule,clearTimeout:id=>timers.delete(id),
    document:{baseURI:'http://localhost/demo/journey/journey-demo.html',body:node(),getElementById:get,createElement:node,createTextNode:text=>({textContent:text})},
    Image:class{constructor(){this.plan=plans.shift();assert.ok(this.plan,'unexpected image request');images.push(this);}
      decode(){return new Promise((resolve,reject)=>schedule(()=>this.plan.fail?reject(new Error('decode/network failure')):resolve(),this.plan.delay));}}};
  vm.runInNewContext(readFileSync(new URL('../landmark-view.js',import.meta.url),'utf8'),context);
  const view=Object.create(context.window.WusanLandmarkView.prototype);
  Object.assign(view,{config:{visuals:{loadTimeout:4000},landmarks:{guanyu:{name:'关羽祠',image:'assets/guanyu.png'},zhangjuzheng:{name:'张居正',image:'assets/zhang.png'}}},cache:new Map(),token:0,root:get('landmark-scene'),image:get('landmark-image'),dialog:{open:false},poetry:node(),ready:false,
    stopFloatingPoem(){},closeGame(){},resize(){this.resizeCount=(this.resizeCount||0)+1;}});
  view.root.hidden=true;
  const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
  async function advance(ms){await flush();const end=now+ms;for(;;){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn();await flush();}now=end;await flush();}
  const fallback=get('landmark-image-fallback');
  const text=()=>fallback.children.map(x=>x.textContent).join('');
  return {view,images,get,fallback,text,advance,flush,timers};
}

for(const delay of [2000,6000,20000])test(`${delay/1000}s success; slow notice never terminates decode`,async()=>{
  const f=fixture([{delay}]);f.view.show('guanyu');await f.flush();assert.equal(f.view.image.hidden,true);
  if(delay>4000){await f.advance(4000);assert.equal(f.text(),'画卷正在徐徐展开……');assert.equal(f.view.image.hidden,true);await f.advance(delay-4000);}
  else await f.advance(delay);
  assert.equal(f.view.image.hidden,false);assert.equal(f.fallback.hidden,true);assert.equal(f.view.natural,f.images[0]);assert.equal(f.view.cache.size,1);assert.equal(f.timers.size,0);
});

test('prefetch age determines slow notice; displayed scene uses the same task',async()=>{
  const f=fixture([{delay:20000}]);const prefetch=f.view.prepare('guanyu');await f.advance(6000);f.view.show('guanyu');await f.advance(0);
  assert.equal(f.text(),'画卷正在徐徐展开……');assert.equal(f.images.length,1);await f.advance(14000);assert.equal(await prefetch,f.view.natural);assert.equal(f.fallback.hidden,true);
});

test('failed load evicted; retry clears error, succeeds and reuses result',async()=>{
  const f=fixture([{delay:1000,fail:true},{delay:2000}]);f.view.show('guanyu');await f.advance(1000);
  assert.equal(f.view.cache.size,0);assert.match(f.text(),/画卷加载失败/);
  const retry=f.fallback.children.find(x=>x.textContent==='重新加载');assert.ok(retry);retry.click();assert.equal(f.text(),'正在展开地标近景…');assert.equal(f.view.ready,false);
  await f.advance(2000);assert.equal(f.view.image.hidden,false);assert.equal(f.images.length,2);
  f.view.hide();f.view.show('guanyu');await f.flush();assert.equal(f.images.length,2);assert.equal(f.fallback.hidden,true);
});

for(const fail of [false,true])test(`old scene ${fail?'failure':'success'} cannot overwrite new scene`,async()=>{
  const f=fixture([{delay:6000,fail},{delay:2000}]);f.view.show('guanyu');await f.advance(500);f.view.show('zhangjuzheng');await f.advance(2000);
  const src=f.view.image.src;assert.match(src,/zhang\.png$/);await f.advance(5000);assert.equal(f.view.image.src,src);assert.equal(f.fallback.hidden,true);assert.equal(f.timers.size,0);
});

test('new scene clears previous error and natural dimensions',async()=>{
  const f=fixture([{delay:100,fail:true},{delay:6000}]);f.view.show('guanyu');await f.advance(100);assert.match(f.text(),/失败/);
  f.view.natural={naturalWidth:9999};f.view.show('zhangjuzheng');assert.equal(f.text(),'正在展开地标近景…');assert.equal(f.view.natural,null);assert.equal(f.fallback.children.length,1);
  await f.advance(6000);assert.equal(f.fallback.hidden,true);
});

for(const fail of [false,true])test(`return to scroll while pending ${fail?'failure':'success'} does not mutate hidden scene`,async()=>{
  const f=fixture([{delay:20000,fail}]);f.view.show('guanyu');await f.advance(1000);f.view.hide();const before=f.text();assert.equal(f.view.root.hidden,true);
  await f.advance(20000);assert.equal(f.view.root.hidden,true);assert.equal(f.view.image.hidden,true);assert.equal(f.text(),before);assert.equal(f.timers.size,0);
});

test('return while loading then revisit joins pending request, later reuses success',async()=>{
  const f=fixture([{delay:6000}]);f.view.show('guanyu');await f.advance(1000);f.view.hide();f.view.show('guanyu');await f.advance(5000);
  assert.equal(f.images.length,1);assert.equal(f.fallback.hidden,true);f.view.hide();f.view.show('guanyu');await f.flush();assert.equal(f.images.length,1);assert.equal(f.view.image.hidden,false);
});

test('failed prefetch automatically retries on later entry',async()=>{
  const f=fixture([{delay:500,fail:true},{delay:2000}]);const task=f.view.prepare('guanyu');await f.advance(500);assert.equal(await task,null);assert.equal(f.view.cache.size,0);
  f.view.show('guanyu');await f.advance(2000);assert.equal(f.images.length,2);assert.equal(f.fallback.hidden,true);
});
