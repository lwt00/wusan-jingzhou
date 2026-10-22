import test from 'node:test';
import assert from 'node:assert/strict';
import { mountZhangGame } from '../../../demo/journey/zhangjuzheng-host.mjs';
import { message } from '../journey-protocol.mjs';

test('iframe adapter validates window/origin, reloads sessions, handles timeout and disposes cleanly', async () => {
  const saved = Object.fromEntries(['window','document','location','setInterval','clearInterval','setTimeout','clearTimeout'].map(k=>[k,globalThis[k]]));
  const intervals=new Map(),timeouts=new Map(),listeners=new Map();let serial=0,finished=0,cancelled=0;
  function element(tag) { return {tag,dataset:{},children:[],listeners:new Map(),hidden:false,contentWindow:{postMessage(data,origin){this.sent??=[];this.sent.push({data,origin});}},
    append(...items){this.children.push(...items);},setAttribute(){},addEventListener(t,f){this.listeners.set(t,f);},removeEventListener(t){this.listeners.delete(t);},remove(){this.removed=true;} }; }
  try {
    globalThis.location={origin:'http://localhost:1234',protocol:'http:'};
    globalThis.window={addEventListener:(t,f)=>listeners.set(t,f),removeEventListener:t=>listeners.delete(t)};
    globalThis.document={baseURI:'http://localhost:1234/demo/journey/journey-demo.html',createElement:element};
    globalThis.setInterval=fn=>{const id=++serial;intervals.set(id,fn);return id;};globalThis.clearInterval=id=>intervals.delete(id);
    globalThis.setTimeout=fn=>{const id=++serial;timeouts.set(id,fn);return id;};globalThis.clearTimeout=id=>timeouts.delete(id);
    const container=element('section');container.dataset.game='old';
    const dispose=mountZhangGame({container,levelId:'zhangjuzheng',complete(){finished++;},cancel(){cancelled++;},prepareIntro:async()=>{}});
    let [frame,notice]=container.children;
    frame.listeners.get('load')();const first=frame.contentWindow.sent.at(-1).data;
    const receive=(data,extra={})=>listeners.get('message')?.({data,source:frame.contentWindow,origin:location.origin,...extra});
    const ready=message('GAME_READY',first.sessionId,'rdy',{runGeneration:0},'run');
    const before=frame.contentWindow.sent.length;
    receive(ready,{origin:'http://evil.example'});receive(ready,{source:{}});
    assert.equal(frame.contentWindow.sent.length,before);
    receive(ready);await Promise.resolve();assert.equal(container.dataset.entry,'revealing');assert.equal(frame.inert,true);
    frame.listeners.get('transitionend')({target:frame,propertyName:'opacity'});assert.equal(notice.hidden,true);assert.equal(frame.inert,false);assert.equal(intervals.size,0);
    const complete=message('GAME_COMPLETE',first.sessionId,'done',{completed:true,completedCount:7,totalMemorials:7,resources:{treasury:66,people:76,defense:60},evaluationId:'good'},'run');
    receive(complete);receive(complete);assert.equal(finished,0);
    frame.listeners.get('load')();const second=frame.contentWindow.sent.at(-1).data;
    assert.notEqual(second.sessionId,first.sessionId);
    receive(message('GAME_EXIT',first.sessionId,'old-exit',{outcome:'completed',completionMessageId:'done'},'run'));
    assert.equal(finished,0);
    for(const fn of [...timeouts.values()])fn();assert.equal(notice.hidden,false);assert.equal(notice.children[1].hidden,false);
    notice.children[1].listeners.get('click')();frame=container.children.at(-2);frame.listeners.get('load')();const third=frame.contentWindow.sent.at(-1).data;
    receive(message('GAME_READY',third.sessionId,'rdy2',{runGeneration:0},'run2'));
    receive({...complete,sessionId:third.sessionId,runId:'run2'});
    const exit=message('GAME_EXIT',third.sessionId,'exit',{outcome:'completed',completionMessageId:'done'},'run2');
    receive(exit);receive(exit);assert.equal(finished,1);assert.equal(cancelled,0);
    dispose();assert.equal(listeners.size,0);assert.equal(intervals.size,0);assert.equal(timeouts.size,0);
    assert.equal(frame.removed,true);assert.equal(notice.removed,true);assert.equal(container.dataset.game,'old');
    const other=element('section');const leave=mountZhangGame({container:other,levelId:'zhangjuzheng',complete(){finished++;},cancel(){cancelled++;},prepareIntro:async()=>{}});
    other.children[0].listeners.get('error')();assert.equal(other.children[1].hidden,false);
    other.children[1].children[2].listeners.get('click')();assert.equal(cancelled,1);assert.equal(finished,1);leave();
  } finally {for(const[k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});

test('readiness duplicates, retry, cancellation and reduced motion cannot reveal a stale frame', async () => {
  const saved=Object.fromEntries(['window','document','location','setInterval','clearInterval','setTimeout','clearTimeout'].map(k=>[k,globalThis[k]]));
  const timers=new Map(),listeners=new Map(),preparations=[];let serial=0,cancelled=0;
  function element(){return {dataset:{},children:[],listeners:new Map(),contentWindow:{sent:[],postMessage(data){this.sent.push(data);}},append(...nodes){this.children.push(...nodes);},setAttribute(){},addEventListener(t,f){this.listeners.set(t,f);},removeEventListener(t){this.listeners.delete(t);},remove(){this.removed=true;}};}
  try {
    globalThis.window={addEventListener:(t,f)=>listeners.set(t,f),removeEventListener:t=>listeners.delete(t),matchMedia:()=>({matches:true})};
    globalThis.document={baseURI:'http://localhost:1234/demo/journey/journey-demo.html',createElement:element};globalThis.location={origin:'http://localhost:1234',protocol:'http:'};
    globalThis.setInterval=globalThis.setTimeout=fn=>{timers.set(++serial,fn);return serial;};globalThis.clearInterval=globalThis.clearTimeout=id=>timers.delete(id);
    const container=element();const dispose=mountZhangGame({container,levelId:'zhangjuzheng',complete(){assert.fail('entry cannot complete the game');},cancel(){cancelled++;},prepareIntro:(_frame,options)=>new Promise(resolve=>preparations.push({resolve,...options}))});
    let[frame,notice]=container.children;const load=()=>frame.listeners.get('load')();
    const ready=(id,run='run')=>listeners.get('message')({origin:location.origin,source:frame.contentWindow,data:message('GAME_READY',id,'ready-'+run,{runGeneration:0},run)});
    load();const first=frame.contentWindow.sent.at(-1).sessionId;ready(first);ready(first);
    assert.equal(preparations.length,1);assert.equal(frame.inert,true);assert.equal(container.dataset.entry,'loading');
    notice.children[1].listeners.get('click')();frame=container.children.at(-2);assert.equal(preparations[0].signal.aborted,true);
    preparations[0].resolve();await Promise.resolve();assert.equal(container.dataset.entry,'loading');
    load();const second=frame.contentWindow.sent.at(-1).sessionId;ready(second,'run2');preparations[1].resolve();await Promise.resolve();
    assert.equal(container.dataset.entry,'shown');assert.equal(frame.inert,false);assert.equal(notice.hidden,true);
    load();const third=frame.contentWindow.sent.at(-1).sessionId;ready(third,'run3');
    notice.children[2].listeners.get('click')();assert.equal(cancelled,1);assert.equal(preparations[2].signal.aborted,true);
    preparations[2].resolve();await Promise.resolve();assert.notEqual(container.dataset.entry,'shown');
    dispose();assert.equal(timers.size,0);assert.equal(listeners.size,0);assert.equal(frame.removed,true);
  } finally {for(const[k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});

test('only a valid intro cancellation fades out before one host cancel; dispose cancels delayed work', async () => {
  const saved=Object.fromEntries(['window','document','location','setInterval','clearInterval','setTimeout','clearTimeout'].map(k=>[k,globalThis[k]]));
  const timers=new Map(),listeners=new Map();let serial=0,cancelled=0;
  const element=()=>({dataset:{},children:[],listeners:new Map(),contentDocument:{body:{dataset:{screen:'intro'}}},contentWindow:{sent:[],postMessage(data){this.sent.push(data);}},append(...nodes){this.children.push(...nodes);},setAttribute(){},addEventListener(t,f){this.listeners.set(t,f);},removeEventListener(t){this.listeners.delete(t);},remove(){this.removed=true;}});
  try {
    globalThis.window={addEventListener:(t,f)=>listeners.set(t,f),removeEventListener:t=>listeners.delete(t),matchMedia:()=>({matches:false})};globalThis.document={baseURI:'http://localhost:1234/demo/journey/journey-demo.html',createElement:element};globalThis.location={origin:'http://localhost:1234',protocol:'http:'};
    globalThis.setInterval=globalThis.setTimeout=fn=>{timers.set(++serial,fn);return serial;};globalThis.clearInterval=globalThis.clearTimeout=id=>timers.delete(id);
    const mount=async()=>{
      const container=element(),dispose=mountZhangGame({container,levelId:'zhangjuzheng',complete(){assert.fail('intro exit must never reward');},cancel(){cancelled++;},prepareIntro:async()=>{}}),frame=container.children[0];
      frame.listeners.get('load')();const id=frame.contentWindow.sent.at(-1).sessionId;
      const send=data=>listeners.get('message')({data,origin:location.origin,source:frame.contentWindow});
      send(message('GAME_READY',id,'ready',{runGeneration:0},'run'));await Promise.resolve();
      const transition=()=>frame.listeners.get('transitionend')({target:frame,propertyName:'opacity'});transition();
      const exit=()=>send(message('GAME_EXIT',id,'exit',{outcome:'cancelled'},'run'));
      return {container,frame,dispose,transition,exit};
    };
    const first=await mount();first.exit();first.exit();assert.equal(cancelled,0);assert.equal(first.container.dataset.entry,'returning');assert.equal(first.frame.removed,undefined);
    first.transition();first.transition();assert.equal(cancelled,1);first.dispose();assert.equal(timers.size,0);
    const second=await mount();second.exit();const stale=[...timers.values()];second.dispose();for(const fn of stale)fn();assert.equal(cancelled,1);assert.equal(timers.size,0);assert.equal(listeners.size,0);
    window.matchMedia=()=>({matches:true});const reduced=await mount();reduced.exit();assert.equal(cancelled,2);reduced.dispose();assert.equal(timers.size,0);assert.equal(listeners.size,0);
  } finally {for(const[k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
