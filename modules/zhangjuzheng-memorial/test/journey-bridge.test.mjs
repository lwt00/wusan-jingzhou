import test from 'node:test';
import assert from 'node:assert/strict';
import { createHostSession, message, validMessage, validCompletion } from '../journey-protocol.mjs';
import { createJourneyBridge } from '../journey-bridge.mjs';
const payload = { completed: true, completedCount: 7, totalMemorials: 7, resources: { treasury: 66, people: 76, defense: 60 }, evaluationId: 'good' };
const ready = (runId='r1', n=0, id='ready') => message('GAME_READY', 'session', id, { runGeneration: n }, runId);
const completed = (runId='r1', id='complete') => message('GAME_COMPLETE', 'session', id, payload, runId);
const exit = (runId='r1', id='exit', outcome='completed') => message('GAME_EXIT', 'session', id, { outcome, completionMessageId: 'complete' }, runId);

test('host caches completion without finishing; only matched explicit exit finishes', () => {
  const host = createHostSession('session');
  assert.equal(host.receive(completed()).accepted, false);
  assert.equal(host.receive(ready()).accepted, true);
  assert.equal(host.receive(exit()).accepted, false);
  const receipt = host.receive(completed());
  assert.equal(receipt.accepted, true); assert.equal(receipt.outcome, undefined);
  assert.equal(host.receive(completed()).duplicate, true);
  assert.equal(host.receive(exit('r1','cancel','cancelled')).accepted, false);
  assert.equal(host.receive(exit()).outcome, 'completed');
  assert.equal(host.receive(exit()).accepted, false);
});
test('new runs retire old results and reject late and replayed messages', () => {
  const host = createHostSession('session'); host.receive(ready()); host.receive(completed());
  assert.equal(host.receive(ready('r2',1,'ready2')).accepted, true);
  for (const msg of [ready(), completed(), exit(), ready('r1',2,'late-ready'), ready('r3',0,'rollback')]) assert.equal(host.receive(msg).accepted, false);
  assert.equal(host.receive(exit('r2','no-result')).accepted, false);
  assert.equal(host.receive(exit('r2','cancel','cancelled')).outcome, 'cancelled');
});
test('session and field checks reject false completion, invalid scores and stale documents', () => {
  const host = createHostSession('session'); host.receive(ready());
  for (const change of [{sessionId:'old'},{gameId:'guanyu'},{levelId:'museum'},{version:2},{channel:'other'},{messageId:''},{runId:'other'}]) assert.equal(host.receive({...completed(),...change}).accepted,false);
  for (const bad of [{...payload, completedCount:6},{...payload,evaluationId:'people'},{...payload,resources:{treasury:NaN,people:76,defense:60}},{completed:true}]) assert.equal(validCompletion(bad),false);
  assert.equal(validMessage(null), null);
  host.dispose(); assert.equal(host.receive(completed()).accepted,false);
  const fresh = createHostSession('new-session'); assert.equal(fresh.receive(completed()).accepted,false);
});
function fakeWindow(embed=true) {
  const listeners = new Map(), timers = new Map(), sent=[]; let serial=0;
  const win = { location: { search: embed?'?embed=1&bootstrap=boot':'', origin:'http://localhost:9999', protocol:'http:' }, crypto:{randomUUID:()=>`id-${++serial}`},
    addEventListener:(type, fn)=>listeners.set(type,fn), removeEventListener:(type)=>listeners.delete(type),
    setInterval:fn=>{const id=++serial;timers.set(id,fn);return id;}, clearInterval:id=>timers.delete(id) };
  const parent = {postMessage:(data, origin)=>sent.push({data,origin})}; win.parent = embed?parent:win;
  return {win,parent,sent,timers,listeners,deliver(data,extra={}){listeners.get('message')?.({data,source:parent,origin:win.location.origin,...extra});}};
}
function init(f) {f.deliver(message('GAME_INIT','session','init',{bootstrap:'boot'}));}
function ack(f,msg,accepted=true) {f.deliver(message('GAME_ACK','session','ack-'+msg.messageId,{ackMessageId:msg.messageId,accepted},msg.runId));}
test('standalone never registers transport, waits, or sends any message', () => {
  const f=fakeWindow(false), bridge=createJourneyBridge({window:f.win});
  bridge.complete({});bridge.exit({});bridge.newRun();bridge.retry();
  assert.equal(bridge.enabled,false);assert.equal(f.sent.length,0);assert.equal(f.timers.size,0);assert.equal(f.listeners.size,0);
});
test('child validates source, origin and bootstrap; waits for ready ACK and completed ACK before exit', () => {
  const f=fakeWindow(), bridge=createJourneyBridge({window:f.win});
  const input=message('GAME_INIT','session','init',{bootstrap:'boot'});
  f.deliver(input,{source:{}}); f.deliver(input,{origin:'https://wrong.example'});f.deliver({...input,payload:{bootstrap:'wrong'}});
  assert.equal(f.sent.length,0);
  init(f);const r=f.sent.at(-1).data; assert.equal(r.type,'GAME_READY');assert.equal(bridge.ready,false);ack(f,r);assert.equal(bridge.ready,true);
  const snapshot={totalMemorials:7,resources:payload.resources,evaluation:{id:'good'}};
  bridge.complete(snapshot);bridge.complete(snapshot);const c=f.sent.at(-1).data;assert.equal(c.type,'GAME_COMPLETE');
  bridge.exit({outcome:'completed',completion:snapshot});assert.equal(f.sent.at(-1).data.type,'GAME_COMPLETE');
  ack(f,c);const e=f.sent.at(-1).data;assert.equal(e.type,'GAME_EXIT');assert.equal(e.payload.completionMessageId,c.messageId);
  assert.ok(f.sent.every(item=>item.origin==='http://localhost:9999'));
  ack(f,e);bridge.dispose();assert.equal(f.timers.size,0);assert.equal(f.listeners.size,0);
});
test('child restart changes run ID, clears pending results, ignores stale ACK and retries finitely', () => {
  const f=fakeWindow();let failed=0;const bridge=createJourneyBridge({window:f.win,onStatus:(_,retry)=>failed+=Number(retry)});
  init(f);const old=f.sent.at(-1).data;ack(f,old);bridge.newRun();const current=f.sent.at(-1).data;
  assert.notEqual(current.runId,old.runId);assert.equal(current.payload.runGeneration,1);ack(f,old);assert.equal(bridge.ready,false);
  for(let i=0;i<7;i++)for(const fn of [...f.timers.values()])fn();assert.equal(failed,1);assert.equal(f.timers.size,0);
  bridge.retry();assert.equal(f.sent.at(-1).data.messageId,current.messageId);
  f.listeners.get('pagehide')();assert.equal(f.timers.size,0);
});
