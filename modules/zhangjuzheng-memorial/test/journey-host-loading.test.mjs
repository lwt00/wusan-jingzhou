import test from 'node:test';
import assert from 'node:assert/strict';
import {mountZhangGame} from '../../../demo/journey/zhangjuzheng-host.mjs';
import {message} from '../journey-protocol.mjs';
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
function fixture(options={}){
 const keys=['window','document','location','setTimeout','clearTimeout','setInterval','clearInterval'];const saved=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
 let now=0,serial=0,completed=0,cancelled=0;const timers=new Map(),listeners=new Map(),frames=[],preparations=[];
 function element(tag){return {tag,dataset:{},children:[],listeners:new Map(),attrs:{},hidden:false,inert:false,contentDocument:tag==='iframe'?{URL:'about:blank',body:{dataset:{screen:'intro'}}}:null,contentWindow:{sent:[],postMessage(data,origin){this.sent.push({data,origin});}},append(...nodes){for(const n of nodes){if(n.parent)n.parent.children.splice(n.parent.children.indexOf(n),1);this.children.push(n);n.parent=this;}},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,v){this.listeners.set(k,v);},removeEventListener(k){this.listeners.delete(k);},remove(){this.removed=true;if(this.parent){this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}}};}
 const schedule=(fn,ms,every=0)=>{const id=++serial;timers.set(id,{at:now+ms,fn,every});return id;};
 globalThis.location={origin:'http://localhost:1234',protocol:'http:'};globalThis.window={addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k),matchMedia:()=>({matches:!!options.reduced})};
 globalThis.document={baseURI:'http://localhost:1234/demo/journey/journey-demo.html',createElement:tag=>{const e=element(tag);if(tag==='iframe')frames.push(e);return e;}};
 globalThis.setTimeout=(fn,ms)=>schedule(fn,ms);globalThis.setInterval=(fn,ms)=>schedule(fn,ms,ms);globalThis.clearTimeout=globalThis.clearInterval=id=>timers.delete(id);
 const container=element('section'),scene=element('section');container.closest=()=>scene;
 const dispose=mountZhangGame({container,levelId:'zhangjuzheng',complete(){completed++;},cancel(){cancelled++;},prepareIntro:(frame,opts)=>{
  const item={frame,...opts};preparations.push(item);return options.prepare?options.prepare(item):Promise.resolve();
 }});
 const notice=container.children[1],text=notice.children[0],retry=notice.children[1],back=notice.children[2];
 const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
 const f={container,scene,notice,text,retry,back,frames,timers,listeners,preparations,flush,dispose,get completed(){return completed;},get cancelled(){return cancelled;},get frame(){return container.children.find(x=>x.tag==='iframe');},
  init(frame=this.frame){return frame.contentWindow.sent.filter(m=>m.data.type==='GAME_INIT').at(-1).data;},
  document(frame=this.frame){if(frame.contentDocument.URL==='about:blank')frame.contentDocument={URL:frame.src,body:{dataset:{screen:'intro'}}};return frame.contentDocument;},
  load(frame=this.frame){this.document(frame);frame.listeners.get('load')?.();},
  send(data,{frame=this.frame,source=frame.contentWindow,origin=location.origin}={}){listeners.get('message')?.({data,source,origin});},
  ready(frame=this.frame,run='run',id='ready'){this.document(frame);this.send(message('GAME_READY',this.init(frame).sessionId,id,{runGeneration:0},run),{frame});},
  async advance(ms){await flush();const end=now+ms;for(let count=0;;count++){assert.ok(count<2000);const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!next)break;now=next[1].at;if(next[1].every)next[1].at+=next[1].every;else timers.delete(next[0]);next[1].fn();await flush();}now=end;await flush();},
  close(){dispose();for(const[k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
 };return f;
}
async function using(options,fn){const f=fixture(options);try{await fn(f);}finally{f.close();}}
test('2s normal load preserves readiness gate and original reveal fallback',()=>using({},async f=>{
 await f.advance(2000);assert.equal(f.frame.inert,true);f.load();f.ready();await f.flush();assert.equal(f.container.dataset.entry,'revealing');await f.advance(649);assert.equal(f.frame.inert,true);await f.advance(1);assert.equal(f.container.dataset.entry,'shown');assert.equal(f.frame.inert,false);assert.equal(f.completed,0);assert.equal(f.timers.size,0);
}));
test('load beyond 10s remains alive and recovers after 25s without retry',()=>using({},async f=>{
 const id=f.init().sessionId;await f.advance(10000);assert.equal(f.container.dataset.entry,'loading');assert.equal(f.container.dataset.entryWait,'document');assert.match(f.text.textContent,/较慢/);assert.equal(f.retry.hidden,false);
 await f.advance(15000);f.load();assert.equal(f.init().sessionId,id);f.ready();await f.flush();await f.advance(650);assert.equal(f.container.dataset.entry,'shown');assert.equal(f.completed,0);
}));
test('legal READY may precede load; late and duplicate same-document loads cannot reset session',()=>using({},async f=>{
 const id=f.init().sessionId;f.ready();await f.flush();await f.advance(650);assert.equal(f.container.dataset.entry,'shown');f.load();f.load();assert.equal(f.init().sessionId,id);assert.equal(f.container.dataset.entry,'shown');assert.equal(f.preparations.length,1);assert.equal(f.timers.size,0);
}));
test('handshake timeout is bounded, offers retry and accepts a delayed valid READY',()=>using({},async f=>{
 f.load();const id=f.init().sessionId;await f.advance(8000);assert.equal(f.container.dataset.entry,'error');assert.equal(f.container.dataset.entryWait,'handshake');const sent=f.frame.contentWindow.sent.length;await f.advance(5000);assert.equal(f.frame.contentWindow.sent.length,sent);
 f.ready();await f.flush();await f.advance(650);assert.equal(f.init().sessionId,id);assert.equal(f.container.dataset.entry,'shown');assert.equal(f.completed,0);
}));
test('slow visual decode beyond 8s is not aborted and eventually reveals',()=>{
 const gate=deferred();return using({prepare:()=>gate.promise},async f=>{f.load();f.ready();await f.advance(16000);assert.equal(f.container.dataset.entry,'loading');assert.equal(f.container.dataset.entryWait,'visual');assert.equal(f.preparations[0].signal.aborted,false);assert.equal(f.frame.inert,true);gate.resolve();await f.flush();await f.advance(650);assert.equal(f.container.dataset.entry,'shown');assert.equal(f.preparations.length,1);});
});
test('real iframe error and damaged intro fail; fresh iframe/bootstrap/session retries safely',()=>{
 let bad=true;return using({prepare:()=>bad?Promise.reject(Error('broken image')):Promise.resolve()},async f=>{
 const first=f.frame,old=f.init();first.listeners.get('error')();assert.equal(f.container.dataset.entry,'error');assert.equal(f.container.dataset.entryFailure,'network');assert.equal(f.completed,0);
 f.retry.listeners.get('click')();const second=f.frame;assert.notEqual(second,first);assert.notEqual(new URL(second.src).searchParams.get('bootstrap'),old.payload.bootstrap);assert.equal(first.listeners.size,0);f.ready();await f.flush();assert.equal(f.container.dataset.entryFailure,'visual');
 bad=false;f.retry.listeners.get('click')();assert.notEqual(f.init().sessionId,old.sessionId);f.ready();await f.flush();await f.advance(650);assert.equal(f.container.dataset.entry,'shown');assert.equal(f.completed,0);
 });
});
test('exit during document or visual wait clears work, never completes and rejects late resolution',async()=>{
 for(const visual of [false,true]){const gate=deferred();await using({prepare:()=>gate.promise},async f=>{if(visual)f.ready();const stale=f.init();await f.advance(11000);f.back.listeners.get('click')();assert.equal(f.cancelled,1);if(visual)assert.equal(f.preparations[0].signal.aborted,true);gate.resolve();await f.flush();f.ready();assert.equal(f.cancelled,1);assert.equal(f.completed,0);assert.notEqual(f.container.dataset.entry,'shown');assert.equal(f.timers.size,0);});}
});
test('rapid retries isolate old windows, sessions, callbacks and queued timers',()=>{
 const gates=[];return using({prepare:()=>{const gate=deferred();gates.push(gate);return gate.promise;}},async f=>{
 const first=f.frame,load=first.listeners.get('load'),error=first.listeners.get('error'),old=f.init(),queued=[...f.timers.values()].map(t=>t.fn);f.ready();
 for(let i=0;i<5;i++)f.retry.listeners.get('click')();const latest=f.frame,id=f.init().sessionId;assert.notEqual(latest,first);load();error();for(const fn of queued)fn();
 f.send(message('GAME_READY',old.sessionId,'old-ready',{runGeneration:0},'old-run'),{frame:first});gates[0].resolve();await f.flush();assert.equal(f.preparations.length,1);assert.equal(f.frame,latest);assert.equal(f.init().sessionId,id);assert.equal(f.container.dataset.entry,'loading');
 f.ready();gates[1].resolve();await f.flush();await f.advance(650);assert.equal(f.container.dataset.entry,'shown');assert.equal(f.completed,0);assert.ok(f.frames.slice(0,-1).every(frame=>frame.removed&&frame.listeners.size===0));
 });
});
test('about:blank load ignored; actual document reload retires the old session',()=>using({},async f=>{
 const first=f.init().sessionId;f.frame.listeners.get('load')();await f.advance(9000);assert.equal(f.container.dataset.entry,'loading');f.load();f.ready();await f.flush();await f.advance(650);
 f.frame.contentDocument={URL:f.frame.src,body:{dataset:{screen:'intro'}}};f.load();const second=f.init().sessionId;assert.notEqual(first,second);f.send(message('GAME_READY',first,'old',{runGeneration:0},'old'));assert.equal(f.preparations.length,1);f.ready(f.frame,'new-run','new-ready');await f.flush();await f.advance(650);assert.equal(f.container.dataset.entry,'shown');
}));
test('origin/source/run checks and explicit legal complete plus exit remain mandatory',()=>using({},async f=>{
 f.ready();await f.flush();await f.advance(650);const id=f.init().sessionId;
 const payload={completed:true,completedCount:7,totalMemorials:7,resources:{treasury:66,people:76,defense:60},evaluationId:'good'};
 const done=message('GAME_COMPLETE',id,'done',payload,'run'),exit=message('GAME_EXIT',id,'exit',{outcome:'completed',completionMessageId:'done'},'run');
 f.send(done,{origin:'http://evil'});f.send(done,{source:{}});f.send({...done,runId:'stale'});f.send({...done,payload:{...payload,completedCount:6}});f.send(exit);assert.equal(f.completed,0);
 f.send(done);f.send(done);assert.equal(f.completed,0);f.send(exit);f.send(exit);assert.equal(f.completed,1);assert.equal(f.cancelled,0);
}));
test('valid unfinished exit remains cancellation, including reduced motion',()=>using({reduced:true},async f=>{
 f.ready();await f.flush();assert.equal(f.container.dataset.entry,'shown');const id=f.init().sessionId;f.send(message('GAME_EXIT',id,'exit',{outcome:'cancelled'},'run'));assert.equal(f.completed,0);assert.equal(f.cancelled,1);
}));
test('queued old document warning cannot overwrite the visual preparation phase',()=>{
 const gate=deferred();return using({prepare:()=>gate.promise},async f=>{
  const warning=[...f.timers.values()].find(t=>!t.every).fn;f.ready();warning();assert.equal(f.container.dataset.entryWait,undefined);assert.equal(f.retry.hidden,true);await f.advance(8000);assert.equal(f.container.dataset.entryWait,'visual');gate.resolve();await f.flush();await f.advance(650);assert.equal(f.container.dataset.entry,'shown');
 });
});
