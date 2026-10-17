import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../../../demo/journey/journey-demo.js', import.meta.url), 'utf8');
const save = source.slice(source.indexOf('  function saveProgress('), source.indexOf('  let stationIndex='));
const handler = source.match(/onComplete\(id\)\{[^\n]+/)[0];
const reveal = source.slice(source.indexOf('  function completeReveal(){'), source.indexOf("  back.addEventListener('click',"));
function fixture() {
  const writes=[], events=[];
  const context=vm.createContext({writes,events,localStorage:{setItem(key,text){events.push('save');writes.push({key,data:JSON.parse(text)});}},document:{getElementById(){return {textContent:''};}}});
  vm.runInContext(`
    const SAVE_KEY='wusan-journey-demo-progress-v1';
    const stations=['guanyu','binyang','zhangjuzheng','museum'].map(id=>({id}));
    const completed=[false,false,false,false]; let storageNotice='',stationIndex=0,mode='exploring-demo',travelSwitchDone=true,pendingStamp=null;
    const reduced={matches:false},landmarkView={closeGame(){events.push('close');}};
    function setPhase(next){events.push(next);mode=next;} function endLandmarkTransition(){}
    function returnToOverview(){events.push('return');mode='returning';}
    ${save}
    const handler={${handler}};
    ${reveal}
    function accept(index){stationIndex=index;mode='exploring-demo';handler.onComplete(stations[index].id);}
    function finish(){mode='revealing';completeReveal();}
    function snapshot(){return completed.slice();}
    let backAction=null,revealProgress=0;
    const back={addEventListener(type,fn){backAction=fn;}};
    ${source.match(/back\.addEventListener\('click',[^\n]+/)[0]}
    function clickBack(){backAction();}
  `,context);
  return { context,writes,events,run:code=>vm.runInContext(code,context) };
}
test('legal completion is durably saved before visual return without skipping reveal',()=>{
  const f=fixture();f.run('accept(2)');
  assert.equal(f.events[0],'save');assert.equal(f.events[1],'close');
  assert.equal(f.writes[0].key,'wusan-journey-demo-progress-v1');
  assert.deepEqual(f.writes[0].data,{version:1,completed:{guanyu:false,binyang:false,zhangjuzheng:true,museum:false}});
  assert.equal(f.run('snapshot()[2]'),false);
  assert.equal(f.run('mode'),'landmark-reveal-return');
  f.run('finish()');assert.equal(f.run('snapshot()[2]'),true);assert.equal(f.writes.length,1);assert.equal(f.run('pendingStamp'),2);
  f.run('accept(2);finish()');assert.equal(f.writes.length,1);assert.equal(f.run('pendingStamp'),null);
});
test('both two-landmark orders survive refresh before second reveal',()=>{
  for(const order of [[0,2],[2,0]]){
    const f=fixture();f.run(`accept(${order[0]});finish();accept(${order[1]});`);
    const persisted=f.writes.at(-1).data;
    assert.equal(Object.values(persisted.completed).filter(Boolean).length,2);
    assert.equal(persisted.completed.guanyu,true);assert.equal(persisted.completed.zhangjuzheng,true);
  }
});
test('wrong active stage or level cannot save; storage errors remain visible',()=>{
  const f=fixture();f.run(`mode='idle';handler.onComplete('guanyu');mode='exploring-demo';handler.onComplete('museum');`);
  assert.equal(f.writes.length,0);
  f.context.localStorage.setItem=()=>{throw Error('quota');};f.run('accept(0)');
  assert.match(f.run('storageNotice'),/无法保存/);
});

test('return during reveal finishes the accepted visual state rather than abandoning it',()=>{
  const f=fixture();f.run("accept(0);mode='revealing';clickBack();");
  assert.equal(f.run('snapshot()[0]'),true);assert.equal(f.run('mode'),'returning');assert.equal(f.writes.length,1);
  f.run('accept(2)');assert.equal(f.writes.at(-1).data.completed.guanyu,true);assert.equal(f.writes.at(-1).data.completed.zhangjuzheng,true);
});
