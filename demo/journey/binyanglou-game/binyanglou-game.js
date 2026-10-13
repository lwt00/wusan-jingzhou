(()=>{
  'use strict';
  const boats=document.getElementById('boats');
  const beacons=document.getElementById('beacons');
  const startButton=document.getElementById('start-button');
  const retryButton=document.getElementById('retry-button');
  const waveValue=document.getElementById('wave-value');
  const wallValue=document.getElementById('wall-value');
  const scoreValue=document.getElementById('score-value');
  const instruction=document.getElementById('instruction');
  const message=document.getElementById('message');
  const waves=[
    {count:4,gap:950,duration:5.6,signal:[0,1,2]},
    {count:5,gap:790,duration:4.9,signal:[1,3,0,2]},
    {count:6,gap:650,duration:4.25,signal:[2,0,3,1]}
  ];
  const positions=[[7,24],[33,9],[59,25],[80,8]];
  let wave=0,wall=3,score=0,spawned=0,resolved=0,signalStep=0,timer=null,running=false,won=false;

  function getState(){return {gameId:'binyanglou',status:won?'completed':running?'playing':wall<=0?'failed':'ready',wave:wave+1,totalWaves:waves.length,wall,score};}
  function emit(type,detail={}){
    const payload={source:'binyanglou-game',type,...getState(),...detail};
    window.dispatchEvent(new CustomEvent(`binyanglou-game:${type}`,{detail:payload}));
    if(window.parent!==window)window.parent.postMessage(payload,'*');
  }

  function announce(text,hold=950){
    message.textContent=text;message.classList.add('show');clearTimeout(announce.timer);
    announce.timer=setTimeout(()=>message.classList.remove('show'),hold);
  }
  function update(){waveValue.textContent=`${wave+1}/3`;wallValue.textContent=wall;scoreValue.textContent=score;}
  function clearRound(){clearInterval(timer);timer=null;boats.replaceChildren();beacons.replaceChildren();}
  function resolveBoat(hit){
    resolved++;if(hit){score+=100;update();}
    if(spawned===waves[wave].count&&resolved===spawned&&running){clearInterval(timer);timer=null;setTimeout(beginSignal,350);}
  }
  function spawnBoat(){
    if(!running)return;
    if(spawned>=waves[wave].count){clearInterval(timer);timer=null;return;}
    const boat=document.createElement('button');const lane=spawned%3;let done=false;
    boat.type='button';boat.className='enemy-boat';boat.style.cssText=`top:${7+lane*30}%;--duration:${waves[wave].duration}s`;
    boat.setAttribute('aria-label',`第 ${spawned+1} 艘敌船，点击拦截`);spawned++;boats.appendChild(boat);
    boat.addEventListener('click',()=>{if(done||!running)return;done=true;boat.classList.add('hit');boat.disabled=true;setTimeout(()=>boat.remove(),300);resolveBoat(true);});
    boat.addEventListener('animationend',()=>{if(done||!running)return;done=true;boat.remove();wall--;update();announce('敌船逼近，城防 -1');if(wall<=0)fail();else resolveBoat(false);},{once:true});
  }
  function beginSignal(){
    if(!running)return;boats.replaceChildren();signalStep=0;
    instruction.textContent='敌船已退，请按数字顺序点燃烽火传讯。';announce('水路已守住 · 立即传递烽火',1250);
    const sequence=waves[wave].signal;
    sequence.forEach((positionIndex,order)=>{
      const beacon=document.createElement('button');const [left,top]=positions[positionIndex];
      beacon.type='button';beacon.className='beacon';beacon.dataset.order=String(order+1);beacon.style.left=`${left}%`;beacon.style.top=`${top}%`;
      beacon.setAttribute('aria-label',`第 ${order+1} 座烽火台`);
      beacon.addEventListener('click',()=>lightBeacon(beacon,order,sequence.length));beacons.appendChild(beacon);
    });
  }
  function lightBeacon(beacon,order,total){
    if(!running||beacon.classList.contains('active'))return;
    if(order!==signalStep){beacon.classList.remove('wrong');void beacon.offsetWidth;beacon.classList.add('wrong');announce(`顺序有误，请先点燃第 ${signalStep+1} 座`);return;}
    beacon.classList.add('active');beacon.disabled=true;signalStep++;score+=50;update();if(signalStep===total)setTimeout(finishWave,650);
  }
  function finishWave(){
    if(!running)return;
    if(wave===waves.length-1){running=false;won=true;instruction.textContent='三道烽火传讯完成，宾阳楼守城成功。';announce('烽火连城 · 宾阳楼守卫成功',2600);startButton.hidden=false;startButton.textContent='再玩一次';startButton.focus();emit('complete');return;}
    wave++;spawned=0;resolved=0;beacons.replaceChildren();update();instruction.textContent=`第 ${wave+1} 波敌船来袭，拦截速度将加快。`;announce(`第 ${wave+1} 波来袭`,1000);emit('wave');setTimeout(startWave,800);
  }
  function fail(){running=false;clearRound();instruction.textContent='城防已破，重新整备后再战。';retryButton.hidden=false;startButton.hidden=true;announce('城门告急 · 守城失败',1800);retryButton.focus();emit('fail');}
  function startWave(){if(!running)return;spawnBoat();timer=setInterval(spawnBoat,waves[wave].gap);}
  function resetGame(){
    clearRound();wave=0;wall=3;score=0;spawned=0;resolved=0;signalStep=0;won=false;running=true;
    startButton.hidden=true;retryButton.hidden=true;instruction.textContent='点击护城河上的敌船进行拦截，别让它们抵达城门。';update();announce('第 1 波来袭',900);emit('start');setTimeout(startWave,450);
  }
  function handleHostMessage(event){
    if(event.source!==window.parent||!event.data||event.data.source!=='binyanglou-host')return;
    if(event.data.type==='start'||event.data.type==='reset')resetGame();
    if(event.data.type==='get-state'&&window.parent!==window)window.parent.postMessage({source:'binyanglou-game',type:'state',...getState()},'*');
  }
  window.BinyanglouGame=Object.freeze({version:'1.0.0',start:resetGame,reset:resetGame,getState});
  window.addEventListener('message',handleHostMessage);
  startButton.addEventListener('click',resetGame);retryButton.addEventListener('click',resetGame);update();emit('ready');
})();
