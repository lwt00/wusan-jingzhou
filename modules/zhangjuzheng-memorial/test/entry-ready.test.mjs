import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForZhangIntro } from '../../../demo/journey/zhang-entry-ready.mjs';

const deferred = () => { let resolve, reject; const promise = new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject}; };
function fixture() {
  const portrait = deferred(), background = deferred(), fonts = deferred();
  const stages = [], queued = new Map(); let id = 0, decoded = 0;
  const box = {getBoundingClientRect:()=>({x:10,y:20,width:120,height:40})};
  const image = {...box,naturalWidth:400,naturalHeight:500,decode:()=>{decoded++;return portrait.promise;}};
  const doc = {body:{dataset:{screen:'intro'}},baseURI:'http://localhost/game/',fonts:{ready:fonts.promise},querySelector:s=>s==='.intro-character img'?image:box};
  const frame = {contentDocument:doc,contentWindow:{getComputedStyle:()=>({backgroundImage:'linear-gradient(red, blue), url("http://localhost/courtyard.png")'}),Image:class {naturalWidth=1600;naturalHeight=900;decode(){decoded++;return background.promise;}}}};
  return {frame,portrait,background,fonts,stages,queued,get decoded(){return decoded;},raf:fn=>{queued.set(++id,fn);return id;},cancel:id=>queued.delete(id),tick(){for(const[id,fn]of [...queued]){queued.delete(id);fn();}}};
}

test('intro waits for both image decodes, fonts and consecutive stable layouts', async()=>{
  const f=fixture(),old=[globalThis.requestAnimationFrame,globalThis.cancelAnimationFrame];
  globalThis.requestAnimationFrame=f.raf;globalThis.cancelAnimationFrame=f.cancel;
  try {
    let shown=false;const done=waitForZhangIntro(f.frame,{onStage:s=>f.stages.push(s)}).then(()=>shown=true);
    f.portrait.resolve();await new Promise(resolve=>setImmediate(resolve));assert.equal(shown,false);assert.deepEqual(f.stages,[]);
    f.background.resolve();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(f.stages,['imagesDecoded']);assert.equal(f.decoded,2);
    f.fonts.resolve();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(f.stages,['imagesDecoded','fontsReady']);
    f.tick();assert.equal(shown,false);f.tick();await done;assert.equal(shown,true);assert.deepEqual(f.stages,['imagesDecoded','fontsReady','layoutReady']);assert.equal(f.queued.size,0);
  } finally {[globalThis.requestAnimationFrame,globalThis.cancelAnimationFrame]=old;}
});

test('cancel and damaged images never announce a display-ready intro',async()=>{
  const f=fixture(),controller=new AbortController(),old=globalThis.cancelAnimationFrame;
  globalThis.cancelAnimationFrame=f.cancel;
  try {
    const done=waitForZhangIntro(f.frame,{signal:controller.signal,onStage:s=>f.stages.push(s)});
    controller.abort();await assert.rejects(done,{name:'AbortError'});assert.deepEqual(f.stages,[]);
    const broken=fixture();broken.portrait.reject(new Error('broken image'));
    await assert.rejects(waitForZhangIntro(broken.frame),/broken image/);
  } finally {globalThis.cancelAnimationFrame=old;}
});
