import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const root=resolve(import.meta.dirname,'../../..');
const source=readFileSync(resolve(root,'binyanglou-game/binyanglou-game.js'),'utf8');
function element(tag='div') {
  const listeners=new Map(),children=[],classes=new Set(),queries=new Map();
  return {tag,dataset:{},style:{setProperty(){}},children,listeners,hidden:false,contentWindow:{},
    classList:{add(...a){a.forEach(x=>classes.add(x));},remove(...a){a.forEach(x=>classes.delete(x));},contains:x=>classes.has(x),toggle(x,on){if(on??!classes.has(x))classes.add(x);else classes.delete(x);}},
    append(...a){children.push(...a);},replaceChildren(...a){children.splice(0,children.length,...a);},
    addEventListener(t,f){listeners.set(t,f);},removeEventListener(t){listeners.delete(t);},
    querySelector(s){if(!queries.has(s))queries.set(s,element());return queries.get(s);},
    focus(){},setAttribute(){},remove(){this.removed=true;},getBoundingClientRect(){return {left:0,top:0,width:1000,height:600};},parentElement:{style:{},hidden:false}};
}
function adapter() {
  let registered;const listeners=new Map(),completed=[],cancelled=[];
  const context={URL,crypto:{randomUUID:()=> 'session-test'},document:{baseURI:'http://localhost/demo/journey/journey-demo.html',createElement:element},window:{WusanLandmarkGames:{register(id,a){assert.equal(id,'binyang-fenghuo');registered=a;}},addEventListener:(t,f)=>listeners.set(t,f),removeEventListener:t=>listeners.delete(t)}};
  vm.runInNewContext(readFileSync(resolve(root,'demo/journey/landmark-binyang-game.js'),'utf8'),context);
  const container=element();container.dataset.game='previous';
  const dispose=registered.mount({container,levelId:'binyang',complete:r=>completed.push(r),cancel:()=>cancelled.push(true)});
  const [toolbar,frame]=container.children;
  const send=(data,extra={})=>listeners.get('message')?.({origin:'http://localhost',source:frame.contentWindow,data:{channel:'wusan-binyang',session:'session-test',source:'binyanglou-game',gameId:'binyanglou',run:1,...data},...extra});
  return {send,dispose,completed,cancelled,container,toolbar,frame,listeners};
}
const start={type:'start',status:'playing'},win={type:'complete',status:'completed',wave:3,totalWaves:3,wall:55};
test('adapter isolates frame; requires exact sender, origin, session and an active started run',()=>{
  const a=adapter();assert.equal(new URL(a.frame.src).pathname,'/binyanglou-game/binyanglou-game.html');
  a.send(win);assert.equal(a.completed.length,0);
  a.send(start);
  for(const patch of [{session:'stale'},{channel:'other'},{source:'other'},{gameId:'museum'},{run:0},{run:2},{status:'failed'},{wall:0},{wave:2}])a.send({...win,...patch});
  a.send(win,{origin:'https://other.example'});a.send(win,{source:{}});assert.equal(a.completed.length,0);
  a.send(win);a.send(win);assert.equal(a.completed.length,1);assert.equal(a.completed[0].levelId,'binyang');assert.equal(a.completed[0].completed,true);
  a.dispose();assert.equal(a.frame.removed,true);assert.equal(a.toolbar.removed,true);assert.equal(a.listeners.size,0);assert.equal(a.container.dataset.game,'previous');
});
test('failure, ordinary messages, exit, replay and restart do not finish',()=>{
  const a=adapter();a.send(start);for(const type of ['ready','state','pause','resume','wave'])a.send({...win,type});
  a.send({type:'fail',status:'failed'});a.send(win);assert.equal(a.completed.length,0);
  a.send({...start,run:2});a.send(win);assert.equal(a.completed.length,0);
  a.toolbar.children[1].listeners.get('click')();a.send({...win,run:2});assert.equal(a.cancelled.length,1);assert.equal(a.completed.length,0);a.dispose();
  const b=adapter();b.send(start);b.send({...start,run:2});b.send({...win,run:2});assert.equal(b.completed.length,1);b.dispose();
});
function child(embedded=true) {
  const nodes=new Map(),listeners=new Map(),sent=[],timers=new Map();let tick=0;
  const document={getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},querySelector:()=>element(),querySelectorAll:s=>s==='[data-hook]'?Array.from({length:3},()=>element()):[],createElement:element,addEventListener(){}};
  const parent={postMessage:(data,origin)=>sent.push({data,origin})};
  const window={addEventListener:(t,f)=>listeners.set(t,f),dispatchEvent(){}};
  const context={window,document,parent:embedded?parent:window,location:{search:embedded?'?embed=1&session=session-test':'',origin:'http://localhost'},URLSearchParams,performance:{now:()=>1000+tick++*150},CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail;}},requestAnimationFrame:()=>1,setTimeout:f=>{timers.set(++tick,f);return tick;},clearTimeout:id=>timers.delete(id)};
  // Test-only closure access in this VM; no testing hooks exist in shipped game code.
  const instrumented=source.replace(/\}\)\(\);\s*$/,`window.testCore={start,spawn,endWave,chooseUpgrade,closeKnowledgeCard,damageWall,fire,finish,getState,state:()=>s,drainCards:()=>{while(!knowledgeCard.hidden)closeKnowledgeCard();}};})();`);
  vm.runInNewContext(instrumented,context);
  return {sent,nodes,listeners,parent,core:window.testCore,timers,window,deliver(data,extra={}){listeners.get('message')({source:parent,origin:'http://localhost',data:{source:'binyanglou-host',channel:'wusan-binyang',session:'session-test',...data},...extra});}};
}
test('real game load/start/fire/pause/reset/failed defense cannot emit completion or touch storage',()=>{
  const c=child();assert.equal(c.sent[0].data.type,'ready');assert.equal(c.sent.some(x=>x.data.type==='complete'),false);
  c.core.start();c.core.fire();assert.equal(c.core.state().bolts.length,1);c.core.damageWall(101,'test siege');
  assert.equal(c.core.getState().status,'failed');assert.equal(c.sent.at(-1).data.type,'fail');assert.equal(c.sent.some(x=>x.data.type==='complete'),false);
  c.core.start();assert.equal(c.sent.at(-1).data.run,2);assert.equal(c.core.getState().status,'playing');
  c.deliver({type:'reset'},{origin:'https://wrong.example'});c.deliver({type:'reset',session:'old'});assert.equal(c.sent.at(-1).data.run,2);
  c.deliver({type:'reset'});assert.equal(c.sent.at(-1).data.run,3);
});
test('real three-wave completion gate waits for final card, sends once and retires old endings on reset',()=>{
  const c=child();c.core.start();
  c.core.finish(true);assert.equal(c.core.getState().status,'playing');
  for(let wave=0;wave<3;wave++) {
    // Supply the actual end-of-wave state; execute production endWave/upgrade/finish/card logic.
    const s=c.core.state();s.spawned=[7,7,6][wave];s.ships=[];c.core.endWave();
    if(wave<2){for(const [id,fn] of [...c.timers]){c.timers.delete(id);fn();}c.core.drainCards();c.core.chooseUpgrade('skip');}
  }
  assert.equal(c.core.getState().status,'completed');assert.equal(c.sent.some(x=>x.data.type==='complete'),false);
  c.core.drainCards();const wins=c.sent.filter(x=>x.data.type==='complete');assert.equal(wins.length,1);assert.equal(wins[0].origin,'http://localhost');assert.equal(wins[0].data.session,'session-test');assert.equal(wins[0].data.run,1);
  c.core.drainCards();c.core.finish(true);assert.equal(c.sent.filter(x=>x.data.type==='complete').length,1);
  const a=adapter();for(const {data} of c.sent)a.send(data);assert.equal(a.completed.length,1);a.dispose();
  c.core.start();const s=c.core.state();s.wave=2;s.spawned=6;s.ships=[];c.core.endWave();c.core.start();c.core.drainCards();assert.equal(c.sent.filter(x=>x.data.type==='complete').length,1);
});
test('standalone stays playable without journey transport; local assets and script ordering resolve',()=>{
  const c=child(false);c.core.start();c.core.fire();assert.equal(c.core.state().bolts.length,1);assert.equal(c.sent.length,0);
  const entry=resolve(root,'binyanglou-game/binyanglou-game.html'),html=readFileSync(entry,'utf8');
  for(const ref of [...html.matchAll(/(?:src|href|poster)="([^"]+)"/g)].map(m=>m[1]))assert.ok(existsSync(resolve(dirname(entry),ref)),ref);
  const main=readFileSync(resolve(root,'demo/journey/journey-demo.html'),'utf8');assert.ok(main.indexOf('landmark-view.js')<main.indexOf('landmark-binyang-game.js'));assert.ok(main.indexOf('landmark-binyang-game.js')<main.indexOf('src="journey-demo.js"'));
  assert.doesNotMatch(source,/localStorage|sessionStorage/);
});
test('Binyang legal callback persists only its stamp, then follows existing reveal; refreshed loader restores it',()=>{
  const main=readFileSync(resolve(root,'demo/journey/journey-demo.js'),'utf8');
  const persistence=main.slice(main.indexOf('  function loadProgress(){'),main.indexOf('  let stationIndex='));
  const handler=main.match(/onComplete\(id\)\{[^\n]+/)[0];
  const reveal=main.slice(main.indexOf('  function completeReveal(){'),main.indexOf("  back.addEventListener('click',"));
  const writes=[],events=[];
  const context=vm.createContext({localStorage:{getItem:()=>writes.at(-1)??null,setItem:(k,v)=>writes.push(v)},document:{getElementById:()=>({textContent:''})},events});
  vm.runInContext(`const SAVE_KEY='wusan-journey-demo-progress-v1',stations=['guanyu','binyang','zhangjuzheng','museum'].map(id=>({id}));let storageNotice='';${persistence}
    let stationIndex=1,mode='exploring-demo',travelSwitchDone=true,pendingStamp=null;
    const landmarkView={closeGame(){events.push('close');}},reduced={matches:false};
    function setPhase(next){mode=next;events.push(next);}function endLandmarkTransition(){}function returnToOverview(){events.push('return');}
    const handler={${handler}};${reveal}`,context);
  vm.runInContext(`handler.onComplete('binyang');`,context);
  assert.deepEqual(JSON.parse(writes[0]).completed,{guanyu:false,binyang:true,zhangjuzheng:false,museum:false});
  assert.equal(vm.runInContext('completed[1]',context),false);assert.equal(vm.runInContext('mode',context),'landmark-reveal-return');
  assert.equal(vm.runInContext('loadProgress()[1]',context),true);
  vm.runInContext(`mode='revealing';completeReveal();`,context);assert.equal(vm.runInContext('completed[1]',context),true);assert.equal(vm.runInContext('pendingStamp',context),1);
});
