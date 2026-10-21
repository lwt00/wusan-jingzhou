import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../..'),read=p=>readFileSync(resolve(root,p),'utf8');
function element(){const listeners=new Map(),classes=new Set(),q=new Map();return {dataset:{},style:{setProperty(){}},children:[],contentWindow:{},hidden:false,clientWidth:1000,scrollWidth:1800,
 classList:{add(...a){a.forEach(x=>classes.add(x));},remove(...a){a.forEach(x=>classes.delete(x));},contains:x=>classes.has(x),toggle(x,on){if(on??!classes.has(x))classes.add(x);else classes.delete(x);}},
 append(...a){this.children.push(...a);},addEventListener:(t,f)=>listeners.set(t,f),removeEventListener:t=>listeners.delete(t),listeners,
 querySelector(s){if(!q.has(s))q.set(s,element());return q.get(s);},querySelectorAll:()=>[],remove(){this.removed=true;},setAttribute(){},getBoundingClientRect:()=>({left:0,top:0,width:1000,height:700})};}
function fixture(embed=true){const sent=[],nodes=new Map(),listeners=new Map(),timers=new Map(),writes=[];let serial=0;const parent={postMessage:(data,origin)=>sent.push({data,origin})};
 const document={body:element(),getElementById:id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element,querySelectorAll:()=>[]};
 const audio=new Proxy({},{get:()=>()=>{}});const window={addEventListener:(t,f)=>listeners.set(t,f),MuseumAudio:audio};
 const c=vm.createContext({window,parent:embed?parent:window,document,URLSearchParams,location:{search:embed?'?embed=1&session=s':'',origin:'http://localhost'},localStorage:{getItem:()=>null,setItem:(k,v)=>writes.push({k,v})},sessionStorage:{getItem:()=>JSON.stringify({done:{cup:{stars:3},pigbox:{stars:3},drum:{stars:3}}}),setItem:(k,v)=>writes.push({k,v})},setTimeout:f=>{timers.set(++serial,f);return serial;},clearTimeout:id=>timers.delete(id),setInterval:()=>1,clearInterval(){},requestAnimationFrame:()=>1,navigator:{},confirm:()=>true,performance:{now:()=>1}});
 vm.runInContext(read('chuyun-reborn-game/scripts/data.js'),c);vm.runInContext(read('chuyun-reborn-game/scripts/journey-bridge.js'),c);
 const source=read('chuyun-reborn-game/scripts/app.js').replace(/\}\)\(\);\s*$/,`window.testCore={S,startArtifact,showResult,startDrum,chooseConservation,returnToLitHall,attempt:()=>restorationAttempt};})();`);
 vm.runInContext(source,c);
 return {c,window,document,nodes,sent,writes,timers,core:window.testCore,flush(){for(const[id,f]of [...timers]){timers.delete(id);f();}}};}
function host(){const listeners=new Map(),calls=[];let adapter;const container=element();container.dataset.game='old';const c={window:{WusanLandmarkGames:{register(id,a){assert.equal(id,'chuyun-reborn');adapter=a;}},addEventListener:(t,f)=>listeners.set(t,f),removeEventListener:t=>listeners.delete(t)},document:{baseURI:'http://localhost/demo/journey/journey-demo.html',createElement:element},URL,crypto:{randomUUID:()=> 's'}};
 vm.runInNewContext(read('demo/journey/landmark-museum-game.js'),c);const dispose=adapter.mount({container,levelId:'museum',complete:r=>calls.push(r),cancel:()=>calls.push('cancel')});const frame=container.children[0];
 return {calls,container,frame,dispose,listeners,send(data,extra={}){listeners.get('message')?.({source:frame.contentWindow,origin:'http://localhost',data:{channel:'wusan-museum',gameId:'chuyun-reborn',session:'s',...data},...extra});}};}
const win={action:'complete',completed:true,total:3,artifacts:['cup','pigbox','drum']};
test('museum host validates origin/source/session, exact artifacts and start; completes once and cleans up',()=>{
 const h=host();assert.equal(new URL(h.frame.src).pathname,'/chuyun-reborn-game/index.html');h.send(win);assert.equal(h.calls.length,0);h.send({action:'start'});
 for(const patch of [{session:'stale'},{channel:'other'},{gameId:'other'},{completed:false},{total:2},{artifacts:['cup','cup','drum']}])h.send({...win,...patch});
 h.send(win,{source:{}});h.send(win,{origin:'https://wrong.example'});h.send({action:'fail'});h.send({action:'restart'});assert.equal(h.calls.length,0);
 h.send(win);h.send(win);assert.equal(h.calls.length,1);assert.equal(h.calls[0].completed,true);assert.equal(h.calls[0].levelId,'museum');h.dispose();assert.equal(h.listeners.size,0);assert.equal(h.frame.removed,true);assert.equal(h.container.dataset.game,'old');
});
test('cancel before or during play never awards a stamp; late completion is ignored',()=>{for(const started of [false,true]){const h=host();if(started)h.send({action:'start'});h.send({action:'cancel'});h.send(win);assert.deepEqual(h.calls,['cancel']);h.dispose();}});
test('embedded game starts with fresh repair progress; archive writes never touch main save or standalone session',()=>{
 const f=fixture();assert.deepEqual(Object.keys(f.core.S.done),[]);assert.ok(f.writes.every(w=>w.k==='chuyun-reborn-v2-full'));assert.equal(f.sent.length,0);
 f.window.ChuyunJourney.completeHall();assert.equal(f.sent.length,0);f.nodes.get('hallScene').children.find(el=>el.className==='journey-museum-exit').listeners.get('click')();assert.equal(f.sent.at(-1).data.action,'cancel');assert.equal(f.sent.at(-1).origin,'http://localhost');
});
test('real result and triple-drum nodes notify only after all three current-session artifacts and final hall',()=>{
 const f=fixture(),j=f.window.ChuyunJourney,h=host();j.begin();const artifacts=f.window.CHUYUN_DATA.artifacts;
 for(const a of artifacts){f.core.startArtifact(a);f.core.S.choice='retain';f.core.S.metrics.quizRight=a.quiz.length;
  if(a.id==='drum'){f.core.startDrum();const hit=f.nodes.get('drumHit');hit.onclick();hit.onclick();assert.equal(f.core.S.done.drum,undefined);hit.onclick();f.flush();}else f.core.showResult();
  if(a.id!=='drum'){f.core.returnToLitHall();f.flush();assert.equal(f.sent.filter(m=>m.data.action==='complete').length,0);}
 }
 assert.equal(f.sent.filter(m=>m.data.action==='complete').length,0);f.core.returnToLitHall();f.flush();j.completeHall();
 const msgs=f.sent.filter(m=>m.data.action==='complete');assert.equal(msgs.length,1);assert.equal(msgs[0].data.total,3);
 for(const {data}of f.sent)h.send(data);assert.equal(h.calls.length,1);h.dispose();
});
test('abandoning/restarting a repair invalidates delayed conservation and drum results',()=>{
 const f=fixture();f.window.ChuyunJourney.begin();const [cup,,drum]=f.window.CHUYUN_DATA.artifacts;
 f.core.startArtifact(cup);f.core.chooseConservation('retain');f.core.startArtifact(cup);f.flush();assert.equal(f.core.S.done.cup,undefined);
 f.core.startArtifact(drum);f.core.S.choice='retain';f.core.startDrum();for(let i=0;i<3;i++)f.nodes.get('drumHit').onclick();f.nodes.get('backHallBtn').onclick();f.flush();assert.equal(f.core.S.done.drum,undefined);assert.equal(f.sent.some(m=>m.data.action==='complete'),false);
});
test('standalone keeps its session and archive behavior, has no journey UI/transport',()=>{const f=fixture(false);assert.equal(f.window.ChuyunJourney.enabled,false);assert.equal(Object.keys(f.core.S.done).length,3);assert.equal(f.document.body.children.length,0);assert.ok(f.writes.some(w=>w.k==='chuyun-reborn-session-v1'));f.window.ChuyunJourney.begin();f.window.ChuyunJourney.cancel();assert.equal(f.sent.length,0);});
test('museum completion reuses legal save/reveal/stamp sequence and restores on reload',()=>{
 const main=read('demo/journey/journey-demo.js'),writes=[];
 const persistence=main.slice(main.indexOf('  function loadProgress(){'),main.indexOf('  let stationIndex='));
 const handler=main.match(/onComplete\(id\)\{[^\n]+/)[0],reveal=main.slice(main.indexOf('  function completeReveal(){'),main.indexOf("  back.addEventListener('click',"));
 const c=vm.createContext({localStorage:{getItem:()=>writes.at(-1)??null,setItem:(k,v)=>writes.push(v)},document:{getElementById:()=>({textContent:''})}});
 vm.runInContext(`const SAVE_KEY='wusan-journey-demo-progress-v1',stations=['guanyu','binyang','zhangjuzheng','museum'].map(id=>({id}));let storageNotice='';${persistence}
 let stationIndex=3,mode='exploring-demo',travelSwitchDone=true,pendingStamp=null;const landmarkView={closeGame(){}},reduced={matches:false};function setPhase(next){mode=next;}function endLandmarkTransition(){}function returnToOverview(){}const handler={${handler}};${reveal}handler.onComplete('museum');`,c);
 assert.deepEqual(JSON.parse(writes[0]).completed,{guanyu:false,binyang:false,zhangjuzheng:false,museum:true});assert.equal(vm.runInContext('completed[3]',c),false);assert.equal(vm.runInContext('mode',c),'landmark-reveal-return');assert.equal(vm.runInContext('loadProgress()[3]',c),true);vm.runInContext("mode='revealing';completeReveal();",c);assert.equal(vm.runInContext('completed[3]',c),true);assert.equal(vm.runInContext('pendingStamp',c),3);
});
test('entry dependencies and host script order resolve',()=>{
 const html=read('chuyun-reborn-game/index.html');for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g))assert.ok(existsSync(resolve(root,'chuyun-reborn-game',m[1].split('?')[0])),m[1]);
 const compatible=read('chuyun-reborn-game/chuyun-reborn-game.html');for(const path of ['styles/game.css','scripts/journey-bridge.js']){const escaped=path.replaceAll('.','\\.');const pattern=new RegExp(escaped+'\\?v=([^\"]+)');assert.equal(html.match(pattern)?.[1],'20261021-nav1');assert.equal(compatible.match(pattern)?.[1],'20261021-nav1');}
 const c={window:{}};vm.runInNewContext(read('chuyun-reborn-game/scripts/data.js'),c);for(const a of c.window.CHUYUN_DATA.artifacts)assert.ok(existsSync(resolve(root,'chuyun-reborn-game',a.image)));
 const host=read('demo/journey/journey-demo.html');assert.ok(host.indexOf('landmark-view.js')<host.indexOf('landmark-museum-game.js'));assert.ok(host.indexOf('landmark-museum-game.js')<host.indexOf('src="journey-demo.js"'));
});

test('single hall-scoped exit cannot cover repair actions and preserves both return paths',()=>{
 const f=fixture();f.window.ChuyunJourney.begin();const hall=f.nodes.get('hallScene');
 const exits=hall.children.filter(el=>el.className==='journey-museum-exit');assert.equal(exits.length,1);assert.equal(f.document.body.children.length,0);assert.equal(exits[0].style.cssText,undefined);
 const [cup,pig]=f.window.CHUYUN_DATA.artifacts;f.core.startArtifact(cup);f.core.S.choice='retain';f.core.showResult();const record=f.core.S.done.cup;
 f.core.startArtifact(pig);assert.equal(hall.hidden,true);const attempt=f.core.attempt();f.c.confirm=()=>false;f.nodes.get('backHallBtn').onclick();assert.equal(f.core.attempt(),attempt);assert.equal(hall.hidden,true);
 f.c.confirm=()=>true;f.nodes.get('backHallBtn').onclick();assert.equal(hall.hidden,false);assert.equal(f.core.S.done.cup,record);assert.equal(f.core.S.done.pigbox,undefined);assert.equal(f.sent.some(x=>x.data.action==='complete'||x.data.action==='cancel'),false);
 exits[0].listeners.get('click')();exits[0].listeners.get('click')();const h=host();for(const {data}of f.sent)h.send(data);assert.deepEqual(h.calls,['cancel']);assert.equal(f.sent.filter(x=>x.data.action==='cancel').length,1);h.dispose();
});
