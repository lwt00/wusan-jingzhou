/* 独立文化探索 Demo；仅使用专属演示存档，不加载旧版游戏逻辑。 */
(async () => {
  const host = document.getElementById('stage');
  const status = document.getElementById('status');
  const resetButton=document.getElementById('reset-progress'), skip=document.getElementById('skip');
  const begin=document.getElementById('begin-explore');
  const back=document.getElementById('back-map'), intro=document.getElementById('intro'), video=document.getElementById('prologue');
  let introActive=true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!window.PIXI) { status.textContent = '渲染库未加载，请检查 vendor 目录'; document.getElementById('loading').textContent = status.textContent; return; }
  const { Application, Container, Graphics, Text, Sprite, Texture } = PIXI;
  const app = new Application();
  try { await app.init({width:host.clientWidth,height:host.clientHeight,background:0xf0eee5,antialias:true,resolution:Math.min(devicePixelRatio,2),autoDensity:true,autoStart:false,preference:'webgl'}); }
  catch (_) { status.textContent='浏览器无法初始化图形，请尝试 Chrome 并启用硬件加速'; document.getElementById('loading').textContent = status.textContent; return; }
  host.replaceChildren(app.canvas);
  const world = new Container(); app.stage.addChild(world);
  const stations=[
    {id:'guanyu',name:'关羽祠',x:250,theme:'三国忠义文化',mark:'忠义印记',guide:'沿着迷雾中的祠宇，寻找荆州的三国文化记忆。',focusY:290},
    {id:'binyang',name:'宾阳楼',x:620,theme:'荆州古城文化',mark:'古城印记',guide:'走近城楼与城门，观察古城建筑的轮廓与层次。',focusY:430},
    {id:'zhangjuzheng',name:'张居正故居',x:1000,theme:'历史人物与改革精神',mark:'革新印记',guide:'在庭院间开启一段关于责任与革新的文化探索。',focusY:335},
    {id:'museum',name:'荆州博物馆',x:1360,theme:'荆楚文化与文明传承',mark:'传承印记',guide:'从文化传承出发，思考文物保护与城市记忆。',focusY:460}
  ];
  // u/v 是建筑透明图层内的入口台阶锚点；换建筑素材后仅需校准这里。
  const standPoints={
    guanyu:{u:.5,v:.88,scale:.92,face:1,footSpread:3,stepSlope:0},
    binyang:{u:.452,v:.91,scale:.86,face:1,footSpread:2.8,stepSlope:-.06},
    zhangjuzheng:{u:.49,v:.834,scale:.86,face:-1,footSpread:3,stepSlope:0},
    museum:{u:.58,v:.695,scale:1,face:-1,footSpread:3.2,stepSlope:-.12}
  };
  const W=1600,H=820,START=stations[0].x;
  const SAVE_KEY='wusan-journey-demo-progress-v1';
  let storageNotice='';
  function loadProgress(){
    try {
      const raw=localStorage.getItem(SAVE_KEY);if(!raw)return stations.map(()=>false);
      const data=JSON.parse(raw);
      if(data.version!==1||!data.completed||stations.some(s=>typeof data.completed[s.id]!=='boolean'))throw Error('invalid');
      return stations.map(s=>data.completed[s.id]);
    }catch(error){storageNotice='演示存档不可用或格式异常，本次从空进度开始。';return stations.map(()=>false);}
  }
  const completed=loadProgress();
  // Persist an accepted completion now; completed[] remains the reveal animation state.
  function saveProgress(acceptedIndex=null){
    try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:1,completed:Object.fromEntries(stations.map((s,i)=>[s.id,completed[i]||i===acceptedIndex]))}));}
    catch(error){storageNotice='浏览器无法保存演示进度；本页仍可继续探索。';}
    document.getElementById('storage-note').textContent=storageNotice;
  }
  let stationIndex=0,targetIndex=null,legStart=START,legEnd=START,direction=1;
  const layers=[];
  let seed=211,ambient=0,x=START,mode='idle',stopped=false,elapsed=0,legDuration=0;
  let revealProgress=0,phaseFrom=null,pendingStamp=null;
  const camera={x:W/2,y:H/2,zoom:1};
  let viewScale=1;
  const travelModes=['travel-depart','transforming','traveling','travel-arrive','travel-cancel'];
  let travelReady=false,travelError='',travelSwitchDone=false,travelRequest=0;
  function random(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
  function layer(speed){const c=new Container();world.addChild(c);layers.push({c,speed});return c;}
  function rect(c,x,y,w,h,color,alpha=1){const g=new Graphics().rect(x,y,w,h).fill({color,alpha});c.addChild(g);return g;}
  function polygon(c,pts,color,alpha=1){const g=new Graphics().poly(pts).fill({color,alpha});c.addChild(g);return g;}
  function text(c,label,x,y,size=16){const t=new Text({text:label,style:{fontFamily:'Songti SC, SimSun, serif',fontSize:size,fill:0x485b58,letterSpacing:2}});t.position.set(x,y);c.addChild(t);return t;}
  // 新插画独立于正式地图；静态建筑固定，动态角色和云雾另行渲染。
  const scenery=layer(0);
  try {
    const illustration=new Image();illustration.src='assets/terrain-v3.webp';await illustration.decode();
    const backdrop=new Sprite(Texture.from(illustration));backdrop.width=W;backdrop.height=H;scenery.addChild(backdrop);
  } catch(error) {
    status.textContent='全景插画加载失败，请检查 assets/terrain-v3.webp 后刷新';
    host.insertAdjacentHTML('beforeend','<p id="loading">全景插画未加载，请刷新页面</p>');
    app.destroy(true,{children:true,texture:true,textureSource:true});return;
  }
  const architecture=layer(1);
  const buildingSprites=[];
  const colorFilters=stations.map(()=>{const filter=new PIXI.ColorMatrixFilter();filter.desaturate();return filter;});
  try {
    for(const [i,station] of stations.entries()){
      const mapArt=window.WusanLandmarkConfig.landmarks[station.id].map;
      const image=new Image();image.src=mapArt?.image||`assets/${station.id}-layer.webp`;await image.decode();
      const sprite=new Sprite(Texture.from(image));sprite.anchor.set(.5,1);
      const size=mapArt?.width||[345,315,355,350][i];sprite.width=size;sprite.height=mapArt?.image?size*image.naturalHeight/image.naturalWidth:size;
      if(mapArt?.stand)Object.assign(standPoints[station.id],mapArt.stand);
      sprite.position.set(station.x,[434,580,475,610][i]);
      architecture.addChild(sprite);buildingSprites.push(sprite);
      if(mapArt?.statue){
        try{
          const art=mapArt.statue,source=new Image();source.src=art.image;await source.decode();
          const statue=new Sprite(Texture.from(source));statue.anchor.set(.5,1);
          statue.eventMode='none';sprite.addChild(statue);
          // Sprite children use texture units; compensate parent sprite scale to keep world position/size.
          statue.position.set((art.u-.5)*image.naturalWidth,(art.v-1)*image.naturalHeight);
          statue.scale.set(art.height/source.naturalHeight/sprite.scale.y);
        }catch(error){console.warn('庭院雕像暂未加载，保留原建筑');}
      }
    }
  } catch(error){status.textContent='建筑图层加载失败，请刷新检查素材';app.destroy(true,{children:true,texture:true,textureSource:true});return;}
  // 全场景进度雾共用一个世界坐标羽化遮罩，四个连续文化区域完整覆盖画幅。
  const fogLayer=layer(1);fogLayer.eventMode='none';
  const regionEdges=[0,435,810,1180,W],fogPuffs=[],fogPieces=[];
  const maskWidth=640,maskHeight=328,maskCanvas=document.createElement('canvas');
  maskCanvas.width=maskWidth;maskCanvas.height=maskHeight;
  const maskPaint=maskCanvas.getContext('2d'),maskPixels=maskPaint.createImageData(maskWidth,maskHeight);
  const maskTexture=Texture.from(maskCanvas),fogMask=new Sprite(maskTexture);
  fogMask.width=W;fogMask.height=H;world.addChild(fogMask);fogLayer.mask=fogMask;
  const regionWeights=stations.map(()=>new Float32Array(maskWidth*maskHeight));
  const localOpenings=stations.map(()=>new Float32Array(maskWidth*maskHeight));
  const revealDistances=stations.map(()=>new Float32Array(maskWidth*maskHeight));
  function feather(v){v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);}
  // 只在初始化预计算权重；相邻区域互补，边界沿山水轻微起伏，避免矩形分区。
  for(let py=0;py<maskHeight;py++)for(let px=0;px<maskWidth;px++){
    const wx=(px+.5)*W/maskWidth,wy=(py+.5)*H/maskHeight,n=py*maskWidth+px;
    const bends=[0,...regionEdges.slice(1,4).map((edge,k)=>edge+40*Math.sin(wy*.009+k*1.7)+12*Math.sin(wy*.026+k)),W];
    const ramps=bends.slice(1,4).map(edge=>feather((wx-edge+110)/220));
    const weights=[1-ramps[0],ramps[0]-ramps[1],ramps[1]-ramps[2],ramps[2]];
    stations.forEach((station,i)=>{
      regionWeights[i][n]=weights[i];
      const centerY=[280,420,330,460][i],dx=Math.abs(wx-station.x),dy=Math.abs(wy-centerY);
      // 临时拨云为不规则的柔和矩形云团轮廓，不开圆形透明洞。
      localOpenings[i][n]=Math.exp(-Math.pow(dx/215,4)-Math.pow(dy/260,4))*(.94+.06*Math.sin(wx*.016+wy*.012));
      const maxX=Math.max(station.x-regionEdges[i],regionEdges[i+1]-station.x)+90;
      const maxY=Math.max(centerY,H-centerY);
      revealDistances[i][n]=Math.min(1,Math.max(dx/maxX,dy/maxY)+.04*Math.sin(wx*.019+wy*.015));
      maskPixels.data[n*4]=maskPixels.data[n*4+1]=maskPixels.data[n*4+2]=255;
    });
  }
  for(const [i,station] of stations.entries())fogPuffs.push({base:station.x,seed:i*1.7,openness:completed[i]?1:0,wave:0});
  let maskSignature='',maskClock=0;
  function paintFogMask(force=false){
    const active=['focusing','awaiting-explore','exploring-demo','revealing'].includes(mode)?stationIndex:-1;
    const waves=fogPuffs.map(f=>f.wave);
    const openings=fogPuffs.map(f=>f.openness);
    const signature=completed.join(',')+':'+active+':'+waves.map(v=>Math.round(v*70)).join(',')+':'+openings.map(v=>Math.round(v*70)).join(',');
    if(!force&&(signature===maskSignature||maskClock<.05))return;
    maskSignature=signature;maskClock=0;
    for(let n=0;n<maskWidth*maskHeight;n++){
      let remaining=0;
      for(let i=0;i<4;i++){
        if(completed[i])continue;
        let opening=localOpenings[i][n]*Math.min(.62,openings[i]);
        if(waves[i]>0){
          const wave=feather((waves[i]*1.25-revealDistances[i][n])/.25);
          opening+=wave*(1-opening);
        }
        remaining+=regionWeights[i][n]*(1-opening);
      }
      maskPixels.data[n*4+3]=Math.round(255*Math.max(0,Math.min(1,remaining)));
    }
    maskPaint.putImageData(maskPixels,0,0);maskTexture.source.update();
  }
  try {
    const denseImage=new Image();denseImage.src='assets/fog-dense-1.png';await denseImage.decode();
    const denseTexture=Texture.from(denseImage);
    // 密度底层自带缓慢起伏纹理，上方水墨雾团与横向雾带继续流动；所有层由同一遮罩清除。
    const fieldCanvas=document.createElement('canvas');fieldCanvas.width=512;fieldCanvas.height=256;
    const fieldPaint=fieldCanvas.getContext('2d'),fieldPixels=fieldPaint.createImageData(512,256);
    for(let yy=0;yy<256;yy++)for(let xx=0;xx<512;xx++){
      const n=(yy*512+xx)*4,density=.68+.10*Math.sin(xx*.027+Math.sin(yy*.039)*2)+.06*Math.sin(yy*.045+xx*.013);
      fieldPixels.data[n]=243;fieldPixels.data[n+1]=244;fieldPixels.data[n+2]=235;fieldPixels.data[n+3]=density*255;
    }
    fieldPaint.putImageData(fieldPixels,0,0);
    const field=new Sprite(Texture.from(fieldCanvas));field.width=W+220;field.height=H+120;field.position.set(-110,-60);fogLayer.addChild(field);
    fogPieces.push({g:field,base:-110,baseY:-60,speed:.035,seed:0});
    for(let row=0;row<3;row++)for(let col=0;col<6;col++){
      const puff=new Sprite(denseTexture);puff.anchor.set(.5);puff.width=760;puff.height=640;puff.alpha=.68;
      const bx=col*330-25+(row%2)*70,by=row*340+30;puff.position.set(bx,by);fogLayer.addChild(puff);
      fogPieces.push({g:puff,base:bx,baseY:by,speed:.06+row*.035,seed:col*1.7+row*2});
    }
    const bandImage=new Image();bandImage.src='assets/fog-band-1.png';await bandImage.decode();
    const bandTexture=Texture.from(bandImage);
    for(let i=0;i<3;i++){
      const band=new Sprite(bandTexture);band.width=W+160;band.height=260;band.anchor.set(0,.5);band.position.set(-80,120+i*310);band.alpha=.35;fogLayer.addChild(band);
      fogPieces.push({g:band,base:-80,baseY:band.y,speed:.045,seed:i*2});
    }
  }catch(error){status.textContent='部分雾纹理加载失败，请检查素材并刷新';console.error(error);}
  const ground=layer(1);
  const marker=document.createElement('div');marker.className='traveller-marker';marker.textContent='你在这里';host.appendChild(marker);

  const labels=stations.map((station,i)=>{
    const label=document.createElement('button');label.type='button';label.className='landmark-label';label.dataset.stationId=station.id;label.addEventListener('click',()=>chooseStation(i));
    label.innerHTML=`<span class="chapter">第${['一','二','三','四'][i]}境</span><strong>${station.name}</strong><small>尚未抵达</small><span class="completion-stamp" aria-hidden="true">${station.mark.slice(0,2)}<br>印记</span>`;
    buildingSprites[i].eventMode='static';buildingSprites[i].cursor='pointer';buildingSprites[i].on('pointertap',()=>chooseStation(i));
    host.appendChild(label);return {label,x:station.x,y:[135,290,180,320][i]};
  });
  const personLayer=layer(1);world.setChildIndex(ground,world.getChildIndex(fogLayer));
  const contactShadow=new Graphics().ellipse(0,0,6.5,1.5).fill({color:0x405144,alpha:.18});personLayer.addChild(contactShadow);
  const person=new Container();personLayer.addChild(person);const legs=new Graphics();person.addChild(legs);
  const footClip=new Graphics();person.addChild(footClip);person.mask=footClip;let clippedStation=null;
  const body=new Container();person.addChild(body);polygon(body,[-6,-29,6,-29,8,-12,-7,-12],0x466e65);rect(body,-4,-34,8,8,0xc5b597);body.addChild(new Graphics().circle(0,-36,5).fill(0x566250));const arm=new Graphics().moveTo(4,-27).lineTo(10,-19).stroke({color:0x566250,width:3});body.addChild(arm);rect(body,-11,-27,6,10,0x92764a);
  const travelScene=new WusanTravelScene(PIXI,app,window.WusanTravelConfig);
  const transformExplorer=new WusanTravelScene(PIXI,app,window.WusanTravelConfig);transformExplorer.cache=travelScene.cache;
  let transformEffect=null,transformSpec=null,travelPaused=false;
  const pauseTravel=document.getElementById('pause-travel');
  const landmarkView=new WusanLandmarkView(window.WusanLandmarkConfig,{
onExplore(){
    if(mode !== 'awaiting-explore') return;

    setPhase(
        'exploring-demo',
        window.WusanLandmarkConfig.landmarks[stations[stationIndex].id].game?.mode === 'mock'
            ? '开发模拟探索 · 可验证区域雾散与盖章'
            : `${stations[stationIndex].name} · 完成探索后领取${stations[stationIndex].mark}`
    );

    landmarkView.openGame();
},
    onBack:returnToOverview,
    onDisplay(){landmarkView.displayAgain();setPhase('awaiting-explore','请选择开始探索，或返回长卷');begin.focus({preventScroll:true});},
    onComplete(id){if(mode!=='exploring-demo'||id!==stations[stationIndex].id)return;if(!completed[stationIndex]){globalThis.WusanUIAudio?.confirm();saveProgress(stationIndex);}landmarkView.closeGame();travelSwitchDone=false;setPhase('landmark-reveal-return','探索完成 · 返回长卷揭晓文化印记');if(reduced.matches)endLandmarkTransition();}
  });
  const travelTransition=document.getElementById('travel-transition'),travelNote=document.getElementById('travel-scene-note');
  const travelTiming=window.WusanTravelConfig.travelTiming;
  const travelDuration=travelTiming.travelDuration/1000,arrivalDuration=travelTiming.arrivalDuration/1000;
  const transitionDuration=Math.max(.6,window.WusanTravelConfig?.transition?.duration||1.15);
  if(window.WusanTravelConfig?.transition?.cloudSrc)travelTransition.style.setProperty('--travel-cloud-image',`url("${new URL(window.WusanTravelConfig.transition.cloudSrc,document.baseURI).href}")`);
  function transitionPose(u){
    const opacity=Math.sin(Math.PI*Math.max(0,Math.min(1,u)));
    travelTransition.style.setProperty('--travel-transition-alpha',String(opacity));
    travelTransition.style.setProperty('--travel-cloud-shift',`${u*30-15}%`);
  }
  function stopTravelScene(){travelRequest++;transformEffect?.cancel();transformExplorer.cancel();travelPaused=false;travelScene.cancel();world.visible=true;travelNote.hidden=true;transitionPose(0);}
  const mist=layer(.68), clouds=[];
  // 一张 512×128 透明程序纹理复用于所有云雾，不加载或裁切旧图片。
  const cloudCanvas=document.createElement('canvas');cloudCanvas.width=512;cloudCanvas.height=128;
  const cloudPaint=cloudCanvas.getContext('2d');cloudPaint.scale(1,.25);
  for(let k=0;k<3;k++) {const gradient=cloudPaint.createRadialGradient(125+k*125,256,0,125+k*125,256,150);gradient.addColorStop(0,'rgba(246,247,237,.38)');gradient.addColorStop(.45,'rgba(246,247,237,.18)');gradient.addColorStop(1,'rgba(246,247,237,0)');cloudPaint.fillStyle=gradient;cloudPaint.fillRect(0,0,512,512);}
  const cloudTexture=Texture.from(cloudCanvas);
  for(let i=0;i<5;i++){const g=new Sprite(cloudTexture);g.width=500;g.height=65;g.alpha=.4;g.anchor.set(.5);g.position.set(i*430-100,270+(i%3)*130);mist.addChild(g);clouds.push({g,base:g.x});}
  const light=layer(0);const glow=new Graphics().ellipse(680,80,510,250).fill({color:0xfffdf1,alpha:.07});light.addChild(glow);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth=t=>t*t*(3-2*t);
  let viewportWidth=app.screen.width,viewportHeight=app.screen.height,cameraSignature='',mapRenderPending=false;
  function setDomValue(target,key,value){if(target[key]!==value)target[key]=value;}
  function applyCamera(){
    const signature=[viewportWidth,viewportHeight,viewScale,camera.x,camera.y,camera.zoom,mode,introActive,stationIndex,targetIndex,x,direction,travelSwitchDone,world.visible,landmarkView.active,travelScene.root.visible,transformExplorer.root.visible].join('|');
    if(signature===cameraSignature)return;
    cameraSignature=signature;
    const width=viewportWidth,height=viewportHeight;
    const scale=viewScale*camera.zoom,drawW=W*scale,drawH=H*scale;
    world.scale.set(scale);
    world.x=drawW<=width?(width-drawW)/2:clamp(width*.5-camera.x*scale,width-drawW,0);
    world.y=drawH<=height?(height-drawH)/2:clamp(height*.43-camera.y*scale,height-drawH,0);
    // 真实建筑和地形严格对齐；云雾前景有微量视差，不移动整幅背景冒充景深。
    layers.forEach(({c,speed})=>{c.x=speed===.68?(camera.x-W/2)*.04:0;});
    setDomValue(host.dataset,'view',landmarkView.active?'first-person-landmark':(travelScene.root.visible||transformExplorer.root.visible)?'independent-travel':mode==='idle'?'overview':'landmark');
    setDomValue(host.dataset,'travelPhase',travelModes.includes(mode)?mode:'');
    labels.forEach(({label,x:lx,y:ly},i)=>{
      const px=world.x+lx*scale,py=world.y+ly*scale;
      setDomValue(label.style,'transform',`translate(${px}px,${py}px) translate(-50%,-100%)`);
      setDomValue(label,'hidden',mode!=='idle'||introActive);
    });
    const landing=landmarkLanding();
    setDomValue(marker.style,'transform',`translate(${world.x+landing.x*scale}px,${world.y+(landing.y-42*landing.scale-9)*scale}px) translate(-50%,-100%)`);
    setDomValue(marker,'hidden',introActive||travelModes.includes(mode)||['focusing','awaiting-explore','exploring-demo','revealing'].includes(mode));
    setDomValue(host.dataset,'mode',mode);setDomValue(host.dataset,'station',stations[stationIndex].id);
    setDomValue(host.dataset,'target',targetIndex===null?'':stations[targetIndex].id);
    setDomValue(host.dataset,'character',x.toFixed(2));setDomValue(host.dataset,'direction',String(direction));
    setDomValue(host.dataset,'camera',JSON.stringify(camera));
  }
  function landmarkLanding(){
    const index=mode==='travel-arrive'&&travelSwitchDone&&targetIndex!==null?targetIndex:stationIndex;
    const station=stations[index],sprite=buildingSprites[index],pose=standPoints[station.id];
    return {...pose,id:station.id,x:sprite.x+(pose.u-sprite.anchor.x)*sprite.width,y:sprite.y+(pose.v-sprite.anchor.y)*sprite.height};
  }
  function renderPose(){
    if(!world.visible){applyCamera();return;}
    const landing=landmarkLanding();
    // 地图人物只有入口待机；位置不从路线上插值，左右赶路完全由独立模块承担。
    person.position.set(landing.x,landing.y);person.scale.set(landing.scale*landing.face,landing.scale);
    contactShadow.position.set(landing.x,landing.y);contactShadow.scale.set(landing.scale);contactShadow.rotation=Math.atan(landing.stepSlope);
    if(clippedStation!==landing.id){
      const floor=px=>px*landing.stepSlope*landing.face-Math.abs(landing.footSpread*landing.stepSlope);
      legs.clear();for(let i=0;i<2;i++){const foot=(i?1:-1)*landing.footSpread;legs.moveTo(i?2:-2,-13).lineTo(foot,floor(foot));}legs.stroke({color:0x4e594c,width:3});
      // 台阶前沿截住脚底以下笔画，脚底不会穿入阶面；主体站在中央，避开两侧栏杆。
      footClip.clear().poly([-24,-70,24,-70,24,floor(24),-24,floor(-24)]).fill(0xffffff);clippedStation=landing.id;
    }
    const breath=reduced.matches?0:Math.sin(ambient*1.4);
    body.y=0;body.scale.y=1+breath*.007;arm.rotation=breath*.025;
    setDomValue(marker,'textContent','你在这里');setDomValue(host.dataset,'landing',JSON.stringify({id:landing.id,x:landing.x,y:landing.y,scale:landing.scale}));
    applyCamera();
  }
  function updateFog(dt=0){
    maskClock+=dt;
    fogPuffs.forEach((f,i)=>{
      const arriving=i===stationIndex&&['focusing','awaiting-explore','exploring-demo','revealing'].includes(mode);
      const target=completed[i]?1:arriving?(mode==='exploring-demo'?.76:.62):0;
      if(mode==='revealing'&&i===stationIndex)f.wave=revealProgress;
      else if(reduced.matches)f.wave=0;
      else f.wave*=Math.exp(-dt*4);
      if(f.wave<.001)f.wave=0;
      if(reduced.matches)f.openness=target;
      else f.openness+=(target-f.openness)*(1-Math.exp(-dt*4));
      if(Math.abs(target-f.openness)<.001)f.openness=target;
    });
    // Keep logical fog evolution identical while hidden, without pixels, uploads or sprite work.
    if(!world.visible){mapRenderPending=true;return;}
    fogPuffs.forEach((f,i)=>{
      const color=completed[i]?1:mode==='revealing'&&i===stationIndex?Math.min(1,.55+.45*revealProgress):f.openness*.85;
      if(f.colorAmount!==color){colorFilters[i].saturate(-.85*(1-color),false);buildingSprites[i].filters=color===1?[]:[colorFilters[i]];f.colorAmount=color;}
    });
    paintFogMask(mapRenderPending||dt===0||reduced.matches);mapRenderPending=false;
    const allClear=completed.every(Boolean);fogLayer.visible=!allClear;
    fogPieces.forEach(f=>{f.g.x=f.base+(reduced.matches?0:Math.sin(ambient*f.speed+f.seed)*28);f.g.y=f.baseY+(reduced.matches?0:Math.sin(ambient*f.speed*.7+f.seed)*12);});
    clouds.forEach(({g,base},i)=>{g.alpha=allClear?0:.2;g.x=base+(reduced.matches?0:Math.sin(ambient*.09+i)*32);g.y=270+(i%3)*130;});
    glow.alpha=.8+(reduced.matches?0:Math.sin(ambient*.1)*.12);
  }
  function controls(){
    const selected=stations[stationIndex],active=mode==='idle'&&!introActive;
    document.getElementById('count').textContent=`演示印记 ${completed.filter(Boolean).length} / 4`;
    document.getElementById('storage-note').textContent=storageNotice;
    document.getElementById('completion-message').hidden=!(active&&completed.every(Boolean));
    labels.forEach(({label},i)=>{
      label.disabled=!active;label.classList.toggle('done',completed[i]);label.classList.toggle('current',i===stationIndex);
      label.dataset.state=completed[i]?'completed':'pending';
      label.querySelector('small').textContent=completed[i]?stations[i].mark+' · 可重访':'未探索 · 点击前往';
      label.setAttribute('aria-label',`${stations[i].name}，${completed[i]?'已获'+stations[i].mark:'未探索'}，点击前往`);
    });
    pauseTravel.hidden=!travelModes.includes(mode);pauseTravel.disabled=['travel-cancel'].includes(mode)||introActive;pauseTravel.textContent=travelPaused?'继续':'暂停';
    skip.hidden=!['travel-depart','transforming','traveling','revealing'].includes(mode);skip.disabled=introActive;
    skip.textContent=mode==='revealing'?'跳过雾散演出':mode==='transforming'?'跳过变身':'跳过行进';
    back.hidden=mode==='idle';back.disabled=mode==='returning'||mode==='travel-cancel'||introActive;
    resetButton.disabled=introActive;
    document.getElementById('watch-prologue').disabled=!active;
    if(landmarkView.active)landmarkView.setStage(mode,completed[stationIndex]);
    document.body.dataset.phase=mode;
    renderPose();updateFog();app.render();
  }
  function setPhase(next,message){mode=next;elapsed=0;if(message)status.textContent=message;controls();}
  function cameraBlend(goal,t){for(const key of ['x','y','zoom'])camera[key]=phaseFrom[key]+(goal[key]-phaseFrom[key])*smooth(t);}
  function showLandmark(index){world.visible=false;Object.assign(camera,{x:W/2,y:H/2,zoom:1});landmarkView.show(stations[index].id);}
  function focusStation(){
    stationIndex=targetIndex===null?stationIndex:targetIndex;targetIndex=null;x=stations[stationIndex].x;
    showLandmark(stationIndex);setPhase('awaiting-explore','请选择开始探索，或返回长卷');begin.focus({preventScroll:true});
  }
  function endLandmarkTransition(){
    const phase=mode;transitionPose(0);
    if(phase==='landmark-enter'){focusStation();return;}
    landmarkView.hide();world.visible=true;Object.assign(camera,{x:W/2,y:H/2,zoom:1});
    if(phase==='landmark-reveal-return'){revealProgress=0;setPhase('revealing',`探索完成 · ${stations[stationIndex].mark}即将点亮`);if(reduced.matches){revealProgress=1;completeReveal();}}
    else finishReturn();
  }
  function chooseStation(index){
    if(mode!=='idle'||introActive||!Number.isInteger(index)||index<0||index>=stations.length)return;
    targetIndex=index;
    landmarkView.prepare(stations[index].id);
    if(Math.abs(x-stations[index].x)<.5){travelSwitchDone=false;setPhase('landmark-enter','云雾渐开 · 走入文化地标');if(reduced.matches)endLandmarkTransition();return;}
    legStart=x;legEnd=stations[index].x;direction=Math.sign(legEnd-legStart);legDuration=travelDuration;
    if(reduced.matches){setPhase('traveling');arrive();return;}
    travelReady=false;travelError='';travelSwitchDone=false;const request=++travelRequest;
    setPhase('travel-depart',`云雾启程 · 前往${stations[index].name}`);
    transformEffect?.cancel();travelPaused=false;
    const fromId=stations[stationIndex].id,toId=stations[index].id;
    transformSpec=window.WusanTravelConfig.transforms[fromId]||null;
    Promise.all([
      travelScene.prepare(fromId,toId,direction),
      transformSpec?transformExplorer.prepare('museum',toId,direction):Promise.resolve(),
      transformSpec?travelScene.texture(window.WusanTravelConfig.transformBrush.src).catch(()=>null):Promise.resolve(null)
    ]).then(([ready,,brushTexture])=>{
      if(request!==travelRequest||mode!=='travel-depart')return;
      travelReady=ready;travelError=travelScene.warning;legDuration=travelDuration;
      if(transformSpec&&travelScene.actorFrames?.length&&brushTexture){
        transformEffect?.destroy();
        const duration=(window.WusanTravelConfig.characterTiming[transformSpec.characterId]?.transformDuration??travelTiming.transformDuration)/1000;
        transformEffect=new WusanInkTransform(PIXI,app.stage,{from:transformExplorer,to:travelScene,host,duration,
          brush:window.WusanTravelConfig.transformBrush,brushTexture,text:transformSpec.text,
          onComplete(){if(mode==='transforming')setPhase('traveling',`山水赶路 · 前往${stations[targetIndex].name} · 可跳过`);}
        });
      }else {transformEffect=null;if(transformSpec&&!brushTexture)travelError='毛笔素材暂不可用，使用原角色直接赶路';}
    }).catch(()=>{if(request===travelRequest){travelReady=true;transformEffect=null;travelError='变身素材暂不可用，使用已加载角色直接赶路';}});
  }
  function startTravelArrival(){
    if(!travelModes.includes(mode)||mode==='travel-arrive'||mode==='travel-cancel')return;
    travelSwitchDone=false;setPhase('travel-arrive',`云雾渐开 · 即将抵达${stations[targetIndex].name}`);
  }
  function arrive(){
    if(!travelModes.includes(mode))return;
    stopTravelScene();x=legEnd;focusStation();
  }

  function returnToOverview(){
    if(mode==='idle'||mode==='returning'||introActive)return;
    // 独立赶路不改变地图位置，中途退出通过云雾返回出发地点，不授予印记。
    if(travelModes.includes(mode)){
      if(mode==='travel-cancel')return;travelPaused=false;travelSwitchDone=false;setPhase('travel-cancel','中止赶路 · 返回出发地');
      if(reduced.matches){stopTravelScene();targetIndex=null;finishReturn();}return;
    }
    if(landmarkView.active||mode==='landmark-enter'){landmarkView.closeGame();travelSwitchDone=false;setPhase('landmark-return','云雾归卷 · 返回全景');if(reduced.matches)endLandmarkTransition();return;}
    targetIndex=null;phaseFrom={...camera};legStart=x;legEnd=stations[stationIndex].x;if(Math.abs(legEnd-legStart)>.5)direction=Math.sign(legEnd-legStart);
    setPhase('returning','返回画卷 · 可以继续任选地点');
    if(reduced.matches)finishReturn();
  }
  function finishReturn(){
    x=stations[stationIndex].x;Object.assign(camera,{x:W/2,y:H/2,zoom:1});targetIndex=null;
    setPhase('idle',completed.every(Boolean)?'雾散荆州，文脉重现 · 可自由重访':'任选一处文化地标，开启探索');
    labels[stationIndex].label.focus({preventScroll:true});
    if(pendingStamp!==null){
      if(!reduced.matches){
        const indices=completed.every(Boolean)?[0,1,2,3]:[pendingStamp];
        indices.forEach((index,order)=>labels[index].label.querySelector('.completion-stamp').animate([{opacity:0,transform:'rotate(-12deg) scale(1.5)'},{opacity:1,transform:'rotate(-12deg) scale(1)'}],{duration:650,delay:order*220,easing:'ease-out',fill:'backwards'}));
      }
      pendingStamp=null;
    }
  }
  function completeReveal(){
    if(mode!=='revealing')return;
    const isNew=!completed[stationIndex];completed[stationIndex]=true;
    pendingStamp=isNew?stationIndex:null;
    returnToOverview();
  }
  back.addEventListener('click',()=>{if(mode==='revealing'){revealProgress=1;completeReveal();}else returnToOverview();});
  pauseTravel.addEventListener('click',()=>{if(!travelModes.includes(mode)||mode==='travel-cancel')return;travelPaused=!travelPaused;controls();});
  skip.addEventListener('click',()=>{if(travelModes.includes(mode)){if(mode==='transforming'){travelPaused=false;transformEffect.skip();}else if(reduced.matches)arrive();else{travelPaused=false;startTravelArrival();}}else if(mode==='revealing'){revealProgress=1;completeReveal();}});
  resetButton.addEventListener('click',()=>{
    if(introActive||!confirm('清除四站的模拟探索记录？仅重置本 Demo，不影响旧版游戏存档。'))return;
    try{localStorage.removeItem(SAVE_KEY);storageNotice='';}catch(error){storageNotice='演示存档无法清除，本页已重置；刷新后可能恢复旧记录。';}
    stopTravelScene();landmarkView.hide();completed.fill(false);pendingStamp=null;stationIndex=0;targetIndex=null;x=START;direction=1;
    Object.assign(camera,{x:W/2,y:H/2,zoom:1});setPhase('idle','演示进度已重置 · 四处地标均可探索');
  });
  // 单一背景视频，通过云雾与透明度叠化连接到已渲染的长卷。
  let videoToken=0,introTimer=null,introExiting=false,resumeIntro=false;
  const playIntro=document.getElementById('play-prologue'),enterScroll=document.getElementById('enter-scroll');
  const introNote=document.getElementById('intro-note');
  function finishIntro(){
    if(!introActive)return;
    clearTimeout(introTimer);introTimer=null;videoToken++;video.pause();introActive=false;introExiting=false;intro.hidden=true;
    controls();visibility();labels[stationIndex].label.focus({preventScroll:true});
  }
  function leaveIntro(duration=1150){
    if(!introActive||introExiting)return;
    introExiting=true;videoToken++;playIntro.disabled=true;enterScroll.disabled=true;
    intro.dataset.state='transition';intro.style.setProperty('--intro-exit-time',`${reduced.matches?150:duration}ms`);
    // 长卷已渲染在视频后方，叠化全过程保留它，避免黑屏或闪白。
    updateFog();renderPose();app.render();
    introTimer=setTimeout(finishIntro,reduced.matches?150:duration);
  }
  async function playPrologue(withSound=false){
    if(introExiting||!introActive)return;
    const token=++videoToken;video.muted=!withSound;
    if(withSound||video.ended)video.currentTime=0;
    try{
      await video.play();if(token!==videoToken||!introActive){if(!introExiting)video.pause();return;}
      intro.dataset.state='playing';introNote.textContent=withSound?'待雾散时，再见荆州。':'序幕静音呈现 · 开启旅程可听声音';
      playIntro.hidden=withSound;
    }catch(error){if(token===videoToken&&introActive){introNote.textContent='点击开启旅程播放，或跳过序幕进入画卷。';playIntro.hidden=false;if(video.error)leaveIntro(650);}}
  }
  enterScroll.addEventListener('click',()=>leaveIntro());
  playIntro.addEventListener('click',()=>playPrologue(true));
  document.getElementById('watch-prologue').addEventListener('click',()=>{
    if(mode!=='idle'||introActive)return;
    videoToken++;clearTimeout(introTimer);introTimer=null;introExiting=false;introActive=true;
    intro.hidden=false;intro.dataset.state='waiting';playIntro.hidden=false;playIntro.disabled=false;enterScroll.disabled=false;
    video.currentTime=0;controls();visibility();playPrologue(false);
  });
  video.addEventListener('playing',()=>{if(introActive&&!introExiting)intro.dataset.state='playing';});
  video.addEventListener('timeupdate',()=>{
    if(introActive&&!introExiting&&Number.isFinite(video.duration)&&video.duration-video.currentTime<=2.8&&video.currentTime>0)
      leaveIntro(Math.max(900,(video.duration-video.currentTime)*1000));
  });
  video.addEventListener('ended',()=>leaveIntro(1200));
  video.addEventListener('error',()=>{if(introActive){introNote.textContent='序幕暂不可用，正在进入荆州绘卷…';leaveIntro(650);}});
  app.ticker.maxFPS=60;
  app.ticker.add(ticker=>{
    if(stopped||document.hidden||introActive)return;
    const dt=Math.min(ticker.elapsedMS/1000,.08);if(travelPaused&&travelModes.includes(mode))return;ambient+=dt;elapsed+=dt;
    if(['landmark-enter','landmark-return','landmark-reveal-return'].includes(mode)){
      const u=clamp(elapsed/(mode==='landmark-enter'?arrivalDuration:transitionDuration),0,1);transitionPose(u);
      if(u>=.5&&!travelSwitchDone){travelSwitchDone=true;if(mode==='landmark-enter')showLandmark(targetIndex??stationIndex);else{landmarkView.hide();world.visible=true;}}
      if(u===1)endLandmarkTransition();
    }else if(mode==='travel-depart'||mode==='travel-arrive'||mode==='travel-cancel'){
      if(mode==='travel-depart'&&elapsed>=transitionDuration*.5&&!travelReady){elapsed=transitionDuration*.5;status.textContent='正在准备山水赶路场景 · 可跳过或返回';}
      const u=clamp(elapsed/(mode==='travel-arrive'?arrivalDuration:transitionDuration),0,1);transitionPose(u);
      if(u>=.5&&!travelSwitchDone&&(mode!=='travel-depart'||travelReady)){
        travelSwitchDone=true;
        if(mode==='travel-depart'&&travelScene.actor){
          world.visible=false;travelScene.update(0,0,false);
          if(transformEffect){transformExplorer.update(0,0,false);transformExplorer.show();}else travelScene.show();travelNote.hidden=false;travelNote.textContent=travelScene.scene.title||'独立赶路 · 临时场景';
        }else if(mode==='travel-arrive'){
          transformEffect?.cancel();transformExplorer.hide();travelScene.hide();travelNote.hidden=true;
          if(targetIndex!==null)showLandmark(targetIndex);
        }else if(mode==='travel-cancel'){x=legStart;transformEffect?.cancel();transformExplorer.hide();travelScene.hide();world.visible=true;travelNote.hidden=true;Object.assign(camera,{x:W/2,y:H/2,zoom:1});}
      }
      if(u===1){
        transitionPose(0);
        if(mode==='travel-depart'){
          if(!travelScene.actor){startTravelArrival();}
          else if(transformEffect){setPhase('transforming','一笔绘出 · 化身文化探索者');transformEffect.start();}
          else setPhase('traveling',`${travelError?travelError+' · ':''}山水赶路 · 前往${stations[targetIndex].name} · 可跳过`);
        }else if(mode==='travel-arrive')arrive();
        else{stopTravelScene();targetIndex=null;finishReturn();}
      }
    }else if(mode==='transforming'){
      const p=transformEffect.elapsed/transformEffect.options.duration;
      transformExplorer.update(dt*.1,0,false);travelScene.update(p>=window.WusanTravelConfig.transformBrush.rideStart?dt:0,0,p>=window.WusanTravelConfig.transformBrush.rideStart);
      const zoom=1+.01*transformEffect.smooth(0,.3,p)*(1-transformEffect.smooth(.75,1,p));
      for(const scene of [transformExplorer,travelScene]){const k=Math.max(app.screen.width/scene.scene.width,app.screen.height/scene.scene.height)*zoom;scene.root.scale.set(k);scene.root.position.set((app.screen.width-scene.scene.width*k)/2,(app.screen.height-scene.scene.height*k)/2);}
      transformEffect.update(dt);
    }else if(mode==='traveling'){
      travelScene.resize();const u=clamp(elapsed/legDuration,0,1);travelScene.update(dt,smooth(u),u<1);
      if(u===1)startTravelArrival();
    }else if(mode==='revealing'){
      revealProgress=clamp(elapsed/3.5,0,1);if(revealProgress===1)completeReveal();
    }else if(mode==='returning'){
      const u=clamp(elapsed/1,0,1);cameraBlend({x:W/2,y:H/2,zoom:1},u);if(u===1)finishReturn();
    }
    updateFog(dt);renderPose();
  });
  function resize(){
    viewportWidth=host.clientWidth;viewportHeight=host.clientHeight;
    app.renderer.resize(viewportWidth,viewportHeight);
    viewScale=Math.min(viewportWidth/W,viewportHeight/H);travelScene.resize();transformExplorer.resize();landmarkView.resize();if(transformEffect?.active)transformEffect.draw();
    renderPose();app.render();
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();controls();
  document.getElementById('play-prologue').disabled=false;document.getElementById('enter-scroll').disabled=false;
  function visibility(){
    if(document.hidden||introActive||reduced.matches||stopped){app.stop();if(document.hidden){resumeIntro=introActive&&!video.paused;video.pause();}else if(resumeIntro&&introActive&&!introExiting){resumeIntro=false;video.play().catch(()=>{introNote.textContent='点击开启旅程继续播放，或跳过进入画卷。';playIntro.hidden=false;});}}
    else app.start();
  }
  function reducedChange(){
    if(reduced.matches){
      if(travelModes.includes(mode)){if(mode==='travel-cancel'){stopTravelScene();targetIndex=null;finishReturn();}else arrive();}
      if(['landmark-enter','landmark-return','landmark-reveal-return'].includes(mode))endLandmarkTransition();
      if(mode==='revealing'){revealProgress=1;completeReveal();}
      if(mode==='returning')finishReturn();
      updateFog();renderPose();app.render();
    }
    visibility();
  }
  document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',reducedChange);
  window.addEventListener('pagehide',event=>{app.stop();video.pause();if(!event.persisted){clearTimeout(introTimer);videoToken++;transformEffect?.destroy();transformExplorer.destroy();travelScene.destroy();landmarkView.destroy();stopped=true;resizeObserver.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',reducedChange);app.destroy(true,{children:true,texture:true,textureSource:true});}});
  window.addEventListener('pageshow',event=>{if(event.persisted)visibility();});
  window.journeyTravelDebug=()=>({mode,paused:travelPaused,from:stations[stationIndex].id,target:targetIndex===null?null:stations[targetIndex].id,elapsed,character:transformSpec?.characterId||'explorer',frames:travelScene.actorFrames?.length||0,fps:travelScene.scene?.slots.character.frames?.fps||null,scale:travelScene.actor?.scale.x,transformActive:!!transformEffect?.active,brush:!!transformEffect?.brush,masked:!!travelScene.actor?.mask||!!transformExplorer.actor?.mask,actorRestored:!travelScene.actor||travelScene.actor.parent===travelScene.root,transformTime:transformEffect?.elapsed,transformDuration:transformEffect?.options.duration,travelDuration,arrivalDuration});
  visibility();playPrologue(false);

})();
