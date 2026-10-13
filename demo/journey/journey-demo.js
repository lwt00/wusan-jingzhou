/* 原创开发示意：不引用正式游戏模块，不访问 localStorage。 */
(async () => {
  const host = document.getElementById('stage');
  const status = document.getElementById('status');
  const go = document.getElementById('go'), replay = document.getElementById('replay'), skip = document.getElementById('skip');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!window.PIXI) { status.textContent = '渲染库未加载，请检查 vendor 目录'; document.getElementById('loading').textContent = status.textContent; return; }
  const { Application, Container, Graphics, Text, Sprite, Texture } = PIXI;
  const app = new Application();
  try { await app.init({width:host.clientWidth,height:host.clientHeight,background:0xf0eee5,antialias:true,resolution:Math.min(devicePixelRatio,2),autoDensity:true,autoStart:false,preference:'webgl'}); }
  catch (_) { status.textContent='浏览器无法初始化图形，请尝试 Chrome 并启用硬件加速'; document.getElementById('loading').textContent = status.textContent; return; }
  host.replaceChildren(app.canvas);
  const world = new Container(); app.stage.addChild(world);
  const stations=[
    {id:'guanyu',name:'关羽祠',x:250}, {id:'binyang',name:'宾阳楼',x:620},
    {id:'zhangjuzheng',name:'张居正故居',x:1000}, {id:'museum',name:'荆州博物馆',x:1360}
  ];
  const W=1600,H=820,START=stations[0].x,DURATION=9,RIGHT=1900;
  const completed=stations.map(()=>false);
  let stationIndex=0,targetIndex=null,legStart=START,legEnd=START;
  const route=document.getElementById('route');
  route.innerHTML=stations.map((s,i)=>`<li data-station="${s.id}"><span class="route-seal">${i+1}</span><strong>${s.name}</strong><small>尚未抵达</small></li>`).join('');
  const layers=[];
  const palette={mountain:0x99b0ab,ink:0x344c47,roof:0x485b58,wood:0x886f56,red:0x956258,paper:0xf0eee5};
  let seed=211, camera=0, viewWidth=1200, elapsed=0, ambient=0, x=START, mode='waiting', stopped=false;
  function random(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
  function layer(speed){const c=new Container();world.addChild(c);layers.push({c,speed});return c;}
  function rect(c,x,y,w,h,color,alpha=1){const g=new Graphics().rect(x,y,w,h).fill({color,alpha});c.addChild(g);return g;}
  function polygon(c,pts,color,alpha=1){const g=new Graphics().poly(pts).fill({color,alpha});c.addChild(g);return g;}
  function text(c,label,x,y,size=16){const t=new Text({text:label,style:{fontFamily:'Songti SC, SimSun, serif',fontSize:size,fill:0x485b58,letterSpacing:2}});t.position.set(x,y);c.addChild(t);return t;}
  // 新插画独立于正式地图；静态建筑固定，动态角色和云雾另行渲染。
  const scenery=layer(0);
  try {
    const illustration=new Image();illustration.src='assets/terrain-v3.png';await illustration.decode();
    const backdrop=new Sprite(Texture.from(illustration));backdrop.width=W;backdrop.height=H;scenery.addChild(backdrop);
  } catch(error) {
    status.textContent='全景插画加载失败，请检查 assets/terrain-v3.png 后刷新';
    host.insertAdjacentHTML('beforeend','<p id="loading">全景插画未加载，请刷新页面</p>');
    app.destroy(true,{children:true,texture:true,textureSource:true});return;
  }
  const architecture=layer(0);
  const buildingSprites=[];
  const pendingFilter=new PIXI.ColorMatrixFilter();pendingFilter.desaturate();
  try {
    for(const [i,station] of stations.entries()){
      const image=new Image();image.src=`assets/${station.id}-layer.png`;await image.decode();
      const sprite=new Sprite(Texture.from(image));sprite.anchor.set(.5,1);
      const size=[345,315,355,350][i];sprite.width=size;sprite.height=size;
      sprite.position.set(station.x,[434,580,475,610][i]);
      architecture.addChild(sprite);buildingSprites.push(sprite);
    }
  } catch(error){status.textContent='建筑图层加载失败，请刷新检查素材';app.destroy(true,{children:true,texture:true,textureSource:true});return;}
  const ground=layer(1);
  const trail=new Graphics();ground.addChild(trail);
  let lastTrailX=-1;
  const marker=document.createElement('div');marker.className='traveller-marker';marker.textContent='你在这里';host.appendChild(marker);

  // 按插画道路校准的行走中心线，避免人物穿过建筑。
  const roadPoints=[[250,414],[340,444],[440,505],[540,548],[620,560],[710,550],[805,498],[900,461],[1000,455],[1100,480],[1200,540],[1280,570],[1360,590]];
  function roadY(px){
    for(let i=1;i<roadPoints.length;i++)if(px<=roadPoints[i][0]){
      const [ax,ay]=roadPoints[i-1],[bx,by]=roadPoints[i];const u=Math.max(0,(px-ax)/(bx-ax));
      return ay+(by-ay)*(u*u*(3-2*u));
    }
    return roadPoints[roadPoints.length-1][1];
  }
  const seals=stations.map(station=>{
    const seal=new Graphics().circle(0,0,15).fill({color:0xf0eee5,alpha:.9}).stroke({color:0x92764a,width:1});
    seal.position.set(station.x,roadY(station.x));ground.addChild(seal);return seal;
  });
  const labels=stations.map((station,i)=>{
    const label=document.createElement('div');label.className='landmark-label';
    label.innerHTML=`<span class="chapter">第${['一','二','三','四'][i]}境</span><strong>${station.name}</strong><small>尚未抵达</small><span class="completion-stamp" aria-hidden="true">探索<br>完成</span>`;
    host.appendChild(label);return {label,x:station.x,y:[135,290,180,320][i]};
  });
  const person=new Container();person.scale.set(1.35);ground.addChild(person);const legs=new Graphics();person.addChild(legs);
  const body=new Container();person.addChild(body);polygon(body,[-6,-29,6,-29,8,-12,-7,-12],0x466e65);rect(body,-4,-34,8,8,0xc5b597);body.addChild(new Graphics().circle(0,-36,5).fill(0x566250));const arm=new Graphics().moveTo(4,-27).lineTo(10,-19).stroke({color:0x566250,width:3});body.addChild(arm);rect(body,-11,-27,6,10,0x92764a);
  // 当前美术为完整插画，不假装整图缩放就是分层动画。
  const branches=[];
  const mist=layer(.68), clouds=[];
  // 一张 512×128 透明程序纹理复用于所有云雾，不加载或裁切旧图片。
  const cloudCanvas=document.createElement('canvas');cloudCanvas.width=512;cloudCanvas.height=128;
  const cloudPaint=cloudCanvas.getContext('2d');cloudPaint.scale(1,.25);
  for(let k=0;k<3;k++) {const gradient=cloudPaint.createRadialGradient(125+k*125,256,0,125+k*125,256,150);gradient.addColorStop(0,'rgba(246,247,237,.38)');gradient.addColorStop(.45,'rgba(246,247,237,.18)');gradient.addColorStop(1,'rgba(246,247,237,0)');cloudPaint.fillStyle=gradient;cloudPaint.fillRect(0,0,512,512);}
  const cloudTexture=Texture.from(cloudCanvas);
  for(let i=0;i<5;i++){const g=new Sprite(cloudTexture);g.width=500;g.height=65;g.alpha=.4;g.anchor.set(.5);g.position.set(i*430-100,270+(i%3)*130);mist.addChild(g);clouds.push({g,base:g.x});}
  const light=layer(0);const glow=new Graphics().ellipse(680,80,510,250).fill({color:0xfffdf1,alpha:.07});light.addChild(glow);
  function cameraTarget(){return 0;}
  function renderPose(){person.position.set(x,roadY(x));
    marker.style.left=`${world.x+x*world.scale.x}px`;marker.style.top=`${world.y+(roadY(x)-66)*world.scale.y}px`;
    marker.textContent=mode==='walking'?'前往下一境':'你在这里';
    if(lastTrailX!==x){
      trail.clear();
      // 底线保持清晰，已经走过的部分叠加古铜金。
      for(const [end,color,width,alpha] of [[stations[3].x,0xfaf1d9,8,.8],[x,0xb47e30,6,1]]){
        if(end<=START)continue;
        trail.moveTo(START,roadY(START));for(let q=START+5;q<end;q+=5)trail.lineTo(q,roadY(q));trail.lineTo(end,roadY(end));trail.stroke({color,width,alpha});
      }lastTrailX=x;
    }
let walking=mode==='walking';const phase=(x-START)/32;legs.clear();for(let i=0;i<2;i++){let p=(phase+i*.5)%1,foot=walking?(p<.5?8-32*p:-8+(p-.5)*32):(i?3:-3),lift=walking&&p>=.5?-Math.sin((p-.5)*Math.PI*2)*4:0;legs.moveTo(i?2:-2,-13).lineTo(foot,lift);}legs.stroke({color:0x4e594c,width:3});body.y=walking?-Math.abs(Math.sin(phase*Math.PI*2))*.7:0;arm.rotation=walking?Math.sin(phase*Math.PI*2)*.13:0;layers.forEach(({c,speed})=>c.x=-camera*speed);}
  function controls(){
    go.disabled=mode!=='waiting';skip.disabled=mode!=='walking'&&mode!=='settling';replay.disabled=false;
    go.textContent=mode==='complete'?'四站探索已完成':stationIndex===1&&!completed[1]?'挑战关卡：烽火守城':`模拟通关：${stations[stationIndex].name}`;
    host.dataset.mode=mode;host.dataset.station=stations[stationIndex].id;
    document.getElementById('count').textContent=`已模拟通关 ${completed.filter(Boolean).length}/4`;
    labels.forEach(({label},i)=>{
      label.classList.toggle('done',completed[i]);label.classList.toggle('current',i===stationIndex);
      label.querySelector('small').textContent=completed[i]?'文化印记已获得':i===targetIndex?'正在前往':i===stationIndex?'当前挑战':'待探索';
      seals[i].tint=completed[i]?0xba6750:i===stationIndex?0xe1b663:0xffffff;
      buildingSprites[i].alpha=1;
      buildingSprites[i].filters=completed[i]||i===stationIndex?[]:[pendingFilter];
      label.dataset.state=completed[i]?'completed':i===stationIndex?'current':'pending';
    });
    [...route.children].forEach((node,i)=>{
      node.className=completed[i]?'done':i===stationIndex?'current':i===targetIndex?'travelling':'';
      node.querySelector('small').textContent=completed[i]?'已通关':i===targetIndex?'正在前往':i===stationIndex?'等待通关':'尚未抵达';
      if(i===stationIndex)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');
    });
  }
  function recordPosition(){
    host.dataset.camera=camera.toFixed(2);host.dataset.character=x.toFixed(2);
    document.getElementById('route-fill').style.transform=`scaleX(${(x-START)/(stations[3].x-START)})`;
  }
  function arrive(){
    if(targetIndex===null)return;
    x=stations[targetIndex].x;stationIndex=targetIndex;targetIndex=null;camera=cameraTarget();mode='waiting';
    status.textContent=`已抵达${stations[stationIndex].name} · 等待本关通关`;
    renderPose();controls();recordPosition();if(reduced.matches)app.stop();app.render();
  }
  const defenseGame=(()=>{
    const shell=document.getElementById('defense-game'),boats=document.getElementById('boats'),beacons=document.getElementById('beacon-zone');
    const startButton=document.getElementById('game-start'),retryButton=document.getElementById('game-retry'),closeButton=document.getElementById('game-close');
    const waveValue=document.getElementById('wave-value'),wallValue=document.getElementById('wall-value'),scoreValue=document.getElementById('score-value');
    const instruction=document.getElementById('game-instruction'),message=document.getElementById('battle-message');
    const waves=[{boats:4,gap:900,duration:5.4,signal:[0,1,2]},{boats:5,gap:760,duration:4.8,signal:[1,3,0,2]},{boats:6,gap:620,duration:4.2,signal:[2,0,3,1]}];
    const beaconPositions=[[8,26],[35,10],[61,26],[82,8]];
    let wave=0,wall=3,score=0,spawned=0,resolved=0,signalStep=0,spawnTimer=null,running=false,won=false,lastFocus=null;
    function announce(copy,hold=900){message.textContent=copy;message.classList.add('show');clearTimeout(announce.timer);announce.timer=setTimeout(()=>message.classList.remove('show'),hold);}
    function update(){waveValue.textContent=`${Math.min(wave+1,3)}/3`;wallValue.textContent=wall;scoreValue.textContent=score;}
    function clearRound(){clearInterval(spawnTimer);spawnTimer=null;boats.replaceChildren();beacons.replaceChildren();}
    function fail(){running=false;clearRound();instruction.textContent='城防已破，重新整备后再战。';retryButton.hidden=false;startButton.hidden=true;announce('城门告急 · 守城失败',1600);}
    function boatResolved(hit){resolved++;if(hit){score+=100;update();}if(spawned===waves[wave].boats&&resolved===spawned&&running){clearInterval(spawnTimer);spawnTimer=null;setTimeout(beginSignal,350);}}
    function spawnBoat(){
      if(!running)return;if(spawned>=waves[wave].boats){clearInterval(spawnTimer);spawnTimer=null;return;}
      const boat=document.createElement('button');const lane=spawned%3;boat.className='enemy-boat';boat.type='button';boat.setAttribute('aria-label',`第 ${spawned+1} 艘敌船，点击拦截`);boat.style.cssText=`top:${8+lane*28}%;--duration:${waves[wave].duration}s`;spawned++;boats.appendChild(boat);
      let done=false;boat.addEventListener('click',()=>{if(done||!running)return;done=true;boat.classList.add('hit');boat.disabled=true;setTimeout(()=>boat.remove(),300);boatResolved(true);});
      boat.addEventListener('animationend',()=>{if(done||!running)return;done=true;boat.remove();wall--;update();announce('敌船逼近，城防 -1');if(wall<=0)fail();else boatResolved(false);},{once:true});
    }
    function beginSignal(){
      if(!running)return;boats.replaceChildren();signalStep=0;instruction.textContent='敌船已退，按数字顺序点燃烽火传讯。';announce('水路已守住 · 立即传递烽火',1200);
      const sequence=waves[wave].signal;sequence.forEach((positionIndex,order)=>{const beacon=document.createElement('button');const [left,top]=beaconPositions[positionIndex];beacon.type='button';beacon.className='beacon';beacon.dataset.order=String(order+1);beacon.style.left=`${left}%`;beacon.style.top=`${top}%`;beacon.setAttribute('aria-label',`第 ${order+1} 座烽火台`);beacon.addEventListener('click',()=>lightBeacon(beacon,order,sequence.length));beacons.appendChild(beacon);});
    }
    function lightBeacon(beacon,order,total){
      if(!running||beacon.classList.contains('active'))return;
      if(order!==signalStep){beacon.classList.remove('wrong');void beacon.offsetWidth;beacon.classList.add('wrong');announce(`传讯顺序有误，请点燃第 ${signalStep+1} 座`);return;}
      beacon.classList.add('active');beacon.disabled=true;signalStep++;score+=50;update();
      if(signalStep===total)setTimeout(finishWave,650);
    }
    function finishWave(){
      if(!running)return;if(wave===waves.length-1){won=true;running=false;shell.classList.add('victory');instruction.textContent='三道烽火传讯完成，宾阳楼守城成功。';announce('烽火连城 · 宾阳楼守卫成功',2200);startButton.hidden=false;startButton.textContent='领取印记，继续旅程';startButton.focus();return;}
      wave++;spawned=0;resolved=0;beacons.replaceChildren();update();instruction.textContent=`第 ${wave+1} 波敌船来袭，拦截速度将加快。`;announce(`第 ${wave+1} 波来袭`,1000);setTimeout(startWave,800);
    }
    function startWave(){if(!running)return;spawned=0;resolved=0;spawnBoat();spawnTimer=setInterval(spawnBoat,waves[wave].gap);}
    function resetGame(){clearRound();wave=0;wall=3;score=0;spawned=0;resolved=0;signalStep=0;won=false;running=true;shell.classList.remove('victory');startButton.hidden=true;retryButton.hidden=true;instruction.textContent='拦截护城河上的敌船，别让它们抵达城门。';update();announce('第 1 波来袭',900);setTimeout(startWave,500);}
    function open(){lastFocus=document.activeElement;shell.classList.add('open');shell.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';startButton.hidden=false;startButton.textContent='开始守城';retryButton.hidden=true;instruction.textContent='拦截护城河上的敌船，别让它们抵达城门。';clearRound();wave=0;wall=3;score=0;won=false;running=false;update();setTimeout(()=>startButton.focus(),50);}
    function close(){running=false;clearRound();clearTimeout(announce.timer);shell.classList.remove('open','victory');shell.setAttribute('aria-hidden','true');document.body.style.overflow='';if(lastFocus)lastFocus.focus();}
    startButton.addEventListener('click',()=>{if(won){close();completeCurrentStation();}else resetGame();});retryButton.addEventListener('click',resetGame);closeButton.addEventListener('click',close);
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&shell.classList.contains('open'))close();});
    return {open,reset:()=>{running=false;won=false;clearRound();shell.classList.remove('open','victory');shell.setAttribute('aria-hidden','true');document.body.style.overflow='';}};
  })();
  function finishStation(){
    if(mode!=='waiting'||completed[stationIndex])return;
    if(stationIndex===1){defenseGame.open();return;}
    completeCurrentStation();
  }
  function completeCurrentStation(){
    if(mode!=='waiting'||completed[stationIndex])return;
    completed[stationIndex]=true;
    if(!reduced.matches)labels[stationIndex].label.querySelector('.completion-stamp').animate([{opacity:0,transform:'rotate(-12deg) scale(1.7)'},{opacity:1,transform:'rotate(-12deg) scale(1)'}],{duration:500,easing:'ease-out'});
    if(stationIndex===stations.length-1){
      mode='complete';status.textContent='四站旅程完成！四枚文化印记已点亮。';controls();renderPose();app.render();return;
    }
    targetIndex=stationIndex+1;legStart=x;legEnd=stations[targetIndex].x;elapsed=0;mode='walking';
    status.textContent=`${stations[stationIndex].name}已通关 · 正在前往${stations[targetIndex].name}`;
    controls();renderPose();recordPosition();if(reduced.matches)arrive();else if(!document.hidden)app.start();
  }
  function reset(){
    defenseGame.reset();
    completed.fill(false);stationIndex=0;targetIndex=null;elapsed=0;x=START;mode='waiting';camera=cameraTarget();
    status.textContent='关羽祠 · 等待本关通关';controls();renderPose();recordPosition();app.render();
  }
  go.addEventListener('click',finishStation);replay.addEventListener('click',reset);skip.addEventListener('click',arrive);
  app.ticker.maxFPS=60;
  app.ticker.add(ticker=>{if(stopped||document.hidden)return;const dt=Math.min(ticker.elapsedMS/1000,.08);ambient+=dt;
    if(mode==='walking'){elapsed=Math.min(DURATION,elapsed+dt);const u=elapsed/DURATION,e=u*u*(3-2*u);x=legStart+(legEnd-legStart)*e;camera+=(cameraTarget()-camera)*(1-Math.exp(-7*dt));if(u===1){mode='settling';status.textContent=`正在停靠${stations[targetIndex].name}`;controls();}}
    else if(mode==='settling'){camera+=(cameraTarget()-camera)*(1-Math.exp(-7*dt));if(Math.abs(camera-cameraTarget())<.3)arrive();}
    clouds.forEach(({g,base},i)=>{g.x=base+Math.sin(ambient*.09+i)*50;g.y=270+(i%3)*130+Math.sin(ambient*.12+i)*3;});branches.forEach((branch,i)=>branch.rotation=Math.sin(ambient*.35+i)*.009);glow.alpha=.8+Math.sin(ambient*.1)*.12;
    renderPose();if(mode==='walking'||mode==='settling')recordPosition();});
  function resize(){
    const width=host.clientWidth,height=host.clientHeight;
    app.renderer.resize(width,height);
    // 横屏全幅铺开；竖屏保留完整建筑比例，避免裁掉任何关卡。
    const landscape=width/height>=1.15;
    const fit=Math.min(width/W,height/H);
    const sx=landscape?width/W:fit,sy=landscape?height/H:fit;
    world.scale.set(sx,sy);world.position.set((width-W*sx)/2,(height-H*sy)/2);
    viewWidth=W;camera=0;
    labels.forEach(({label,x,y})=>{label.style.left=`${world.x+x*sx}px`;label.style.top=`${world.y+y*sy}px`;});
    renderPose();recordPosition();app.render();
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();status.textContent='关羽祠 · 等待本关通关';controls();
  function visibility(){if(document.hidden)app.stop();else if(!reduced.matches&&!stopped)app.start();}
  document.addEventListener('visibilitychange',visibility);
  reduced.addEventListener('change',()=>{if(reduced.matches){if(mode==='walking'||mode==='settling')arrive();app.stop();app.render();}else visibility();});
  window.addEventListener('pagehide',event=>{app.stop();if(!event.persisted){stopped=true;resizeObserver.disconnect();document.removeEventListener('visibilitychange',visibility);app.destroy(true,{children:true,texture:true,textureSource:true});}});
  window.addEventListener('pageshow',event=>{if(event.persisted)visibility();});
  visibility();
})();
