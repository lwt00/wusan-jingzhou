/* 独立赶路渲染模块。只消费配置与时间差，不读取地图坐标、印章或 localStorage。 */
window.WusanTravelScene=class {
  constructor(PIXI,app,config){
    this.P=PIXI;this.app=app;this.config=config||{};this.reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');this.root=new PIXI.Container();this.root.visible=false;this.root.eventMode='none';app.stage.addChild(this.root);
    this.cache=new Map();this.token=0;this.groups=[];this.scenery=[];this.ownedFrames=[];this.cameraX=0;this.walkDistance=0;this.previousDistance=0;this.warning='';
  }
  async texture(src){
    if(!src)return null;
    if(!this.cache.has(src)){
      const task=(async()=>{
        const image=new Image();image.src=new URL(src,document.baseURI).href;
        let timer;try{await Promise.race([image.decode(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),this.config.loadTimeout||4500);})]);return this.P.Texture.from(image);}finally{clearTimeout(timer);}
      })().catch(error=>{if(this.cache.get(src)===task)this.cache.delete(src);throw error;});
      this.cache.set(src,task);
    }
    return this.cache.get(src);
  }
  async prepare(from,to,direction){
    const token=++this.token;this.root.visible=false;this.actor=null;this.warning='';
    const id=this.config.routes?.[`${from}->${to}`]||this.config.defaultScene;
    const basic=this.config.scenes?.[this.config.defaultScene]||{},specific=this.config.scenes?.[id]||basic;
    const slotNames=['sky','far','middle','road','foreground','character'];
    const scene={...basic,...specific,slots:Object.fromEntries(slotNames.map(name=>[name,{...(basic.slots?.[name]||{}),...(specific.slots?.[name]||{})}]))};
    scene.width=scene.width||1600;scene.height=scene.height||900;scene.groundY=scene.groundY??640;
    let slotFailed=false;
    const loadSlot=async name=>{try{return await this.texture(scene.slots[name].src);}catch(_){slotFailed=true;return null;}};
    const sceneryLoading=Promise.all((scene.scenery||[]).map(async item=>{try{return {item,texture:await this.texture(item.src)};}catch(_){return {item,texture:null};}}));
    // Start independent animation frames now, rather than after the environment wait.
    const frameConfig=scene.slots.character.frames;
    const framesLoading=frameConfig?.sources?Promise.all(frameConfig.sources.map(async src=>{try{return await this.texture(src);}catch(_){return null;}})):Promise.resolve(null);
    // Legacy foreground becomes invisible only when at least one scenery texture succeeds.
    // Keep its existing fallback when all scenery fails or a configuration makes it visible.
    const foregroundLoading=scene.legacyLayerOpacity?.foreground===0?
      sceneryLoading.then(items=>token!==this.token||items.some(s=>s.texture)?null:loadSlot('foreground')):loadSlot('foreground');
    const slotsLoading=Promise.all(slotNames.map(name=>name==='foreground'?foregroundLoading:loadSlot(name)));
    const [loaded,sceneryLoaded,frames]=await Promise.all([slotsLoading,sceneryLoading,framesLoading]);
    if(token!==this.token)return false;
    this.scene=scene;this.warning=slotFailed?'部分赶路素材未加载，已使用开发占位图层':'';
    this.direction=direction;this.cameraX=0;this.walkDistance=0;this.previousDistance=0;this.frameElapsed=0;this.framePosition=0;this.environmentTime=0;
    if(sceneryLoaded.some(s=>!s.texture))this.warning='部分沿途景物未加载，已保留基础赶路场景';
    // 独立PNG序列缓存加载；缺帧则整体回退普通探索者，不能用半套动作。
    let sourceFrames=frames;
    if(frameConfig?.sources){
      if(sourceFrames.length!==frameConfig.count||sourceFrames.some(t=>!t)){
        sourceFrames=null;loaded[5]=null;this.warning='骑马动作素材未齐，暂用普通探索者';
      }else loaded[5]=sourceFrames[0];
    }
    if(token!==this.token)return false;
    this.root.removeChildren().forEach(c=>c.destroy({children:true}));this.ownedFrames.forEach(t=>t.destroy());this.ownedFrames=[];this.groups=[];this.scenery=[];
    slotNames.filter(n=>n!=='character').forEach((name,i)=>{
      const slot=this.scene.slots[name],texture=loaded[i],group=new this.P.Container();this.root.addChild(group);
      const width=(slot.width||this.scene.width)*(slot.scale??1),span=Math.max(1,(slot.spacing||slot.width||this.scene.width)*(slot.scale??1));
      const pieces=[];
      for(let j=-3;j<=3;j++){
        if(!slot.repeat&&j!==0)continue;
        const image=texture?new this.P.Sprite(texture):this.fallback(name,width);
        if(texture){image.width=width;image.height=slot.height?slot.height*(slot.scale??1):width*texture.height/texture.width;image.anchor.set(slot.anchorX??0,slot.anchorY??0);}
        image.alpha=slot.opacity??1;group.addChild(image);pieces.push({image,j});
      }
      this.groups.push({name,group,slot,pieces,span});
      const layerName=name==='road'?'near':name;
      const available=name==='foreground'?[]:sceneryLoaded.filter(s=>s.texture&&s.item.layer===layerName);
      if(sceneryLoaded.some(s=>s.texture))group.alpha=this.scene.legacyLayerOpacity?.[name]??1;
      this.addScenery(available);
    });
    // 角色在前景之上，避免临时重复树石遮住探索者。
    this.actor=new this.P.Container();this.root.addChild(this.actor);const slot=this.scene.slots.character;
    this.actor.scale.set((slot.scale??2.8)*direction,slot.scale??2.8);this.actor.alpha=slot.opacity??1;
    this.actor.addChild(new this.P.Graphics().ellipse(0,2,8,2).fill({color:0x586653,alpha:.15}));
    this.actorFrames=null;
    if(loaded[5]){
      const texture=loaded[5],frames=slot.frames;
      if(sourceFrames)this.actorFrames=sourceFrames;
      else if(frames?.count&&frames.width>0&&frames.height>0&&frames.width*(frames.columns||frames.count)<=texture.width&&Math.ceil(frames.count/(frames.columns||frames.count))*frames.height<=texture.height){
        this.actorFrames=Array.from({length:frames.count},(_,i)=>new this.P.Texture({source:texture.source,frame:new this.P.Rectangle(i%(frames.columns||frames.count)*frames.width,Math.floor(i/(frames.columns||frames.count))*frames.height,frames.width,frames.height)}));this.ownedFrames=this.actorFrames;
      }else if(frames)this.warning='人物帧配置超出图片尺寸，已使用静态角色';
      this.actorSprite=new this.P.Sprite(this.actorFrames?.[0]||texture);this.actorSprite.anchor.set(slot.anchorX??.5,slot.anchorY??1);this.actor.addChild(this.actorSprite);this.legs=null;
    }else this.createExplorer();
    this.addScenery(sceneryLoaded.filter(s=>s.texture&&s.item.layer==='foreground'));
    this.sceneryById=new Map(this.scenery.map(s=>[s.item.id,s]));
    this.configureDiagnostics();this.resize();this.update(0,0,false);return true;
  }
  addScenery(loaded){
    if(!loaded.length)return;
    const decor=new this.P.Container();this.root.addChild(decor);
    for(const {item,texture} of loaded){
      const image=new this.P.Sprite(texture),width=(item.width||texture.width)*(item.scale??1);
      image.width=width;image.height=width*texture.height/texture.width;image.anchor.set(item.anchorX??.5,item.anchorY??1);image.alpha=item.opacity??1;decor.addChild(image);this.scenery.push({item,image});
    }
  }
  segmentWeight(){
    // 段落仅作布局标签；不按旅程百分比隐藏仍在镜头内的景物。
    // 固定世界位置与同一 cameraX 驱动所有图层，景物自然从画面边缘进出。
    return 1;
  }
  fallback(name,width){
    const g=new this.P.Graphics(),h=this.scene.height,y=this.scene.groundY;
    if(name==='sky')g.rect(0,0,width,h).fill(0xefeee2);
    if(name==='far')g.poly([0,370,width*.15,220,width*.33,350,width*.55,130,width*.77,320,width,370,width,500,0,500]).fill({color:0x9db4af,alpha:.45});
    if(name==='middle')g.poly([0,540,width*.25,470,width*.5,525,width*.75,480,width,540,width,650,0,650]).fill({color:0xa5b7a0,alpha:.65});
    if(name==='road'){g.rect(0,y-50,width,h-y+50).fill(0x9fae91);g.rect(0,y-35,width,90).fill(0xe2d5b9);}
    if(name==='foreground'){g.ellipse(width*.2,-45,60,35).fill({color:0x7d947b,alpha:.6});g.poly([0,0,width*.2,-25,width*.4,0]).fill(0x99a38b);}
    return g;
  }
  createExplorer(){
    const P=this.P;this.actorSprite=null;this.legs=new P.Graphics();this.actor.addChild(this.legs);this.body=new P.Container();this.actor.addChild(this.body);
    this.body.addChild(new P.Graphics().poly([-6,-29,6,-29,8,-12,-7,-12]).fill(0x466e65));
    this.body.addChild(new P.Graphics().rect(-4,-34,8,8).fill(0xc5b597));this.body.addChild(new P.Graphics().circle(0,-36,5).fill(0x566250));
    this.arm=new P.Graphics().moveTo(4,-27).lineTo(10,-19).stroke({color:0x566250,width:3});this.body.addChild(this.arm);this.body.addChild(new P.Graphics().rect(-11,-27,6,10).fill(0x92764a));
  }
  resize(){
    if(!this.scene)return;
    const width=this.app.screen.width,height=this.app.screen.height,scale=Math.max(width/this.scene.width,height/this.scene.height);
    this.root.scale.set(scale);this.root.x=(width-this.scene.width*scale)/2;this.root.y=(height-this.scene.height*scale)/2;
  }
  update(dt,progress,walking=true){
    if(!this.actor)return;
    const scene=this.scene,slot=scene.slots.character,distance=progress*(scene.travelDistance||2200);
    const movement=Math.abs(distance-this.previousDistance);this.walkDistance+=movement;this.previousDistance=distance;
    const goal=distance*this.direction,follow=scene.camera?.follow||7;
    this.cameraX+=(goal-this.cameraX)*(dt?1-Math.exp(-follow*dt):1);
    for(const layer of this.groups){
      const shift=this.cameraX*(layer.slot.parallax??1),offset=((shift%layer.span)+layer.span)%layer.span;
      for(const {image,j} of layer.pieces){
        image.x=(layer.slot.x||0)+j*layer.span-(layer.slot.repeat?offset:shift);image.y=layer.slot.y||0;
        if(layer.name==='foreground'){const actorX=scene.width/2+(slot.x||0)+(goal-this.cameraX)*(slot.parallax??1)-(scene.camera?.lead||0)*this.direction;const distanceToActor=Math.max(0,Math.abs(image.x+image.width*.5-actorX)-image.width*.5);image.alpha=(layer.slot.opacity??1)*(.18+.82*Math.min(1,distanceToActor/120));}
      }
    }
    // 所有角色共用同一环境；四层景物只依据配置与世界镜头位移。
    this.environmentTime+=dt;
    const sceneryById=this.sceneryById;
    const reduced=this.reducedMotion.matches;
    const actorX=scene.width/2+(slot.x||0)+(goal-this.cameraX)*(slot.parallax??1)-(scene.camera?.lead||0)*this.direction;
    const actorBounds=this.actor.getLocalBounds(),actorHalfWidth=actorBounds.width*Math.abs(this.actor.scale.x)*.5;
    const actorTop=scene.groundY+(slot.y||0)+(actorBounds.minY??actorBounds.y??0)*Math.abs(this.actor.scale.y);
    for(const {item,image} of this.scenery){
      const parent=sceneryById.get(item.parent);
      if(item.parent&&!parent){image.alpha=0;image.visible=false;continue;}
      if(parent){
        const region=item.sourceRegion,k=parent.image.width/parent.image.texture.width;
        image.width=region.width*k;image.height=image.width*image.texture.height/image.texture.width;
        image.anchor.set(0,0);image.x=parent.image.x-parent.image.width*(parent.item.anchorX??.5)+region.x*k;image.y=parent.image.y-parent.image.height*(parent.item.anchorY??1)+region.y*k;
      }else{image.x=scene.width/2+(item.x-scene.width/2)*this.direction-this.cameraX*(item.parallax??1);image.y=item.y??scene.groundY;}
      const motion=item.motion,t=this.environmentTime*(motion?.speed||1)+(motion?.seed||0);
      image.rotation=0;
      let alpha=(item.opacity??1)*this.segmentWeight(item,progress);
      if(!reduced&&motion){
        if(motion.kind==='sway')image.rotation=Math.sin(t)*(motion.angle||.006);
        else{image.x+=Math.sin(t)*(motion.x||0);image.y+=Math.sin(t*.87)*(motion.y||0);if(motion.kind==='ripple')alpha*=.65+.35*Math.sin(t*.7);}
      }
      if(item.layer==='foreground'&&image.y+image.height*(1-(item.anchorY??1))>actorTop){
        // 前景可掠过局部，但在角色附近减淡；按实际角色宽度计算，不绑定某个角色。
        const horizontal=Math.max(0,Math.abs(image.x-actorX)-image.width*.5-actorHalfWidth);
        alpha*=.22+.78*Math.min(1,horizontal/160);
      }
      image.alpha=alpha;image.visible=alpha>.001;
    }
    this.actor.x=scene.width/2+(slot.x||0)+(goal-this.cameraX)*(slot.parallax??1)-(scene.camera?.lead||0)*this.direction;
    this.actor.y=scene.groundY+(slot.y||0);
    if(this.legs){
      const phase=this.walkDistance/(32*(slot.scale??2.8));this.legs.clear();
      for(let i=0;i<2;i++){const p=(phase+i*.5)%1,foot=walking?(p<.5?8-32*p:-8+(p-.5)*32):(i?3:-3);const lift=walking&&p>=.5?-Math.sin((p-.5)*Math.PI*2)*4:0;this.legs.moveTo(i?2:-2,-13).lineTo(foot,lift);}
      this.legs.stroke({color:0x4e594c,width:3});this.body.y=walking?-Math.abs(Math.sin(phase*Math.PI*2))*.7:0;this.arm.rotation=walking?Math.sin(phase*Math.PI*2)*.13:0;
    }else if(this.actorFrames){
      const frames=slot.frames,order=frames.order||this.actorFrames.map((_,i)=>i);
      if(walking){this.frameElapsed+=dt;if(frames.fps>0)this.framePosition=(this.framePosition+dt*frames.fps)%order.length;}
      const step=frames.fps>0?this.framePosition:this.walkDistance/(frames.stride||144)*order.length;
      const index=walking?order[Math.floor(step)%order.length]:(frames.idle||0)%this.actorFrames.length;
      this.actorSprite.texture=this.actorFrames[index];
      const offset=frames.align?frames.offsets?.[index]:null;
      this.actorSprite.position.set(offset?.x||0,offset?.y||0);
      if(this.diagnosticStatus&&frames.diagnostic)this.diagnosticStatus.textContent=`帧 ${index+1}/6 · ${frames.fps} FPS · ${frames.align?'稳定补偿开启':'原始位置'} · 素材形变仍存在`;
    }
  }
  configureDiagnostics(){
    if(this.diagnosticControls)this.diagnosticControls.hidden=true;
    const frames=this.scene.slots.character.frames;if(!frames?.diagnostic)return;
    if(!this.diagnosticControls){
      const panel=document.createElement('aside');panel.id='riding-diagnostic-controls';panel.hidden=true;panel.setAttribute('aria-label','骑马动作测试控制');panel.style.cssText='position:fixed;right:16px;top:90px;z-index:14;max-width:310px;padding:12px;background:#f0eee5ed;border:1px solid #92764a;font-size:12px;line-height:1.8';
      const label=document.createElement('label');label.textContent='播放速度 ';const select=document.createElement('select');select.setAttribute('aria-label','骑马FPS');for(const fps of [8,10,12]){const o=document.createElement('option');o.value=fps;o.textContent=fps+' FPS';select.append(o);}label.append(select);
      const alignLabel=document.createElement('label');alignLabel.style.marginLeft='10px';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.setAttribute('aria-label','稳定基准补偿');alignLabel.append(checkbox,'稳定补偿');
      const status=document.createElement('p');status.style.margin='4px 0';const compare=document.createElement('a');compare.href='riding-compare.html';compare.target='_blank';compare.rel='noopener noreferrer';compare.textContent='打开 8 / 10 / 12 FPS 并排对比';
      panel.append(label,alignLabel,status,compare);document.body.append(panel);this.diagnosticControls=panel;this.diagnosticSelect=select;this.diagnosticCheckbox=checkbox;this.diagnosticStatus=status;
      select.addEventListener('change',()=>{const fps=Number(select.value);if(![8,10,12].includes(fps))return;this.scene.slots.character.frames.fps=fps;this.config.scenes['guanyu-riding-diagnostic'].slots.character.frames.fps=fps;});
      checkbox.addEventListener('change',()=>{this.scene.slots.character.frames.align=checkbox.checked;this.config.scenes['guanyu-riding-diagnostic'].slots.character.frames.align=checkbox.checked;});
    }
    this.diagnosticSelect.value=frames.fps;this.diagnosticCheckbox.checked=frames.align;
  }
  show(){this.root.visible=true;if(this.diagnosticControls)this.diagnosticControls.hidden=!this.scene.slots.character.frames?.diagnostic;}
  hide(){this.root.visible=false;if(this.diagnosticControls)this.diagnosticControls.hidden=true;}
  cancel(){this.token++;this.hide();}
  destroy(){this.cancel();this.diagnosticControls?.remove();this.root.destroy({children:true});this.ownedFrames.forEach(t=>t.destroy());this.cache.clear();}
};
