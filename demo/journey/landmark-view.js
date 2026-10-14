/* 独立第一人称展示：只消费文化配置和主流程回调，不自行读写存档。 */
(()=>{
  const games=new Map();
  window.WusanLandmarkGames={
    register(id,adapter){if(!id||typeof adapter?.mount!=='function')throw Error('小游戏必须提供 mount(context)');games.set(id,adapter);},
    unregister(id){games.delete(id);}
  };
  window.WusanLandmarkView=class {
    constructor(config,callbacks){
      this.config=config;this.callbacks=callbacks;this.root=document.getElementById('landmark-scene');this.image=document.getElementById('landmark-image');this.gameHost=document.getElementById('landmark-game-host');this.dialog=document.getElementById('landmark-story');this.cache=new Map();this.token=0;this.gameToken=0;this.id=null;this.ready=false;
      this.start=document.getElementById('begin-explore');this.learn=document.getElementById('landmark-learn');
      if(config.visuals?.cloudSrc)this.root.style.setProperty('--landmark-cloud',`url("${new URL(config.visuals.cloudSrc,document.baseURI).href}")`);
      this.root.style.setProperty('--landmark-push',String(Math.min(1.045,Math.max(1,config.visuals?.pushScale||1.025))));
      this.start.addEventListener('click',()=>callbacks.onExplore());
      document.getElementById('landmark-back').addEventListener('click',()=>callbacks.onBack());
      this.learn.addEventListener('click',()=>{const c=this.current();document.getElementById('landmark-story-title').textContent=c.anecdote?.title||'典故资料待补充';document.getElementById('landmark-story-text').textContent=c.anecdote?.text||'资料占位，尚未核实。';this.dialog.showModal();});
      document.getElementById('landmark-story-close').addEventListener('click',()=>this.dialog.close());
    }
    current(){return this.config.landmarks?.[this.id]||{};}
    get active(){return !this.root.hidden;}
    async prepare(id){
      const c=this.config.landmarks?.[id];if(!c)return null;
      if(!this.cache.has(c.image))this.cache.set(c.image,(async()=>{const image=new Image();image.src=new URL(c.image,document.baseURI).href;let timer;try{await Promise.race([image.decode(),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('timeout')),this.config.visuals?.loadTimeout||4000))]);return image;}catch(_){return null;}finally{clearTimeout(timer);}})());
      return this.cache.get(c.image);
    }
    show(id){
      if(this.active&&this.id===id)return;
      this.closeGame();const token=++this.token;this.id=id;this.started=false;this.ready=false;const c=this.current();this.root.hidden=false;this.root.dataset.state='display';this.root.dataset.fullScene=String(!!c.display?.fullScene);document.body.dataset.landmarkActive='true';
      document.getElementById('landmark-name').textContent=c.name||'文化地标';document.getElementById('landmark-title').textContent=c.culturalTitle||'文化主题待补充';
      document.getElementById('landmark-theme').textContent=c.theme||'';document.getElementById('landmark-poem').textContent=c.poem||'诗词与典故资料待补充（占位）';document.getElementById('landmark-credit').textContent=c.imageLabel||'近景素材占位';
      this.image.hidden=true;document.getElementById('landmark-image-fallback').hidden=false;
      this.prepare(id).then(image=>{if(token!==this.token||!this.active)return;this.ready=true;if(image){this.natural=image;this.image.src=image.src;this.image.alt=`${c.name}近景艺术化占位`;this.image.hidden=false;document.getElementById('landmark-image-fallback').hidden=true;this.resize();}else document.getElementById('landmark-image-fallback').textContent='近景素材待补充 · 可继续查看文化主题';});
    }
    resize(){
      if(!this.natural||!this.active)return;
      const push=Math.min(1.045,Math.max(1,this.config.visuals?.pushScale||1.025)),dpr=this.current().display?.fullScene?1:Math.max(1,devicePixelRatio);
      this.root.style.setProperty('--landmark-image-width',`${Math.min(this.current().display?.maxWidth||680,this.natural.naturalWidth/dpr/push)}px`);
      this.root.style.setProperty('--landmark-image-height',`${this.natural.naturalHeight/dpr/push}px`);
    }
    setStage(stage,done=false){
      this.root.dataset.stage=stage;this.root.dataset.fog=done?'complete':this.started?'exploring':'arrived';this.start.disabled=stage!=='awaiting-explore';this.learn.disabled=stage!=='awaiting-explore';this.start.textContent=done?'再次探索':'开始探索';document.getElementById('landmark-back').disabled=!['awaiting-explore','exploring-demo'].includes(stage);
    }
    openGame(){
      this.closeGame();this.started=true;this.root.dataset.fog=this.root.dataset.fog==='complete'?'complete':'exploring';this.root.dataset.state='game';this.gameHost.hidden=false;
      const c=this.current(),adapter=c.game?.enabled&&games.get(c.game.id),session=++this.gameToken,id=this.id;
      const placeholder=message=>{
        this.gameHost.replaceChildren();const h=document.createElement('h2');h.textContent=`${c.name} · 小游戏待接入`;const p=document.createElement('p');p.textContent=message||'迷雾已暂时拨开一部分。当前仅为小游戏入口占位，不包含正式任务，也不会计入通关或发放文化印章；正式探索完成后才会完全散雾并盖章。';
        const returnDisplay=document.createElement('button');returnDisplay.textContent='返回地标展示';returnDisplay.addEventListener('click',()=>this.callbacks.onDisplay());const returnMap=document.createElement('button');returnMap.textContent='返回长卷';returnMap.addEventListener('click',()=>this.callbacks.onBack());this.gameHost.append(h,p,returnDisplay,returnMap);returnDisplay.focus({preventScroll:true});
      };
      if(!adapter){placeholder();return;}
      this.gameHost.replaceChildren();let completedOnce=false;
      const context={container:this.gameHost,levelId:id,
        complete:result=>{if(session!==this.gameToken||!this.active||this.id!==id||completedOnce||result?.completed!==true||result.levelId!==id)return;completedOnce=true;this.callbacks.onComplete(id);},
        cancel:()=>{if(session===this.gameToken)this.callbacks.onDisplay();}};
      Promise.resolve().then(()=>adapter.mount(context)).then(dispose=>{if(session!==this.gameToken){if(typeof dispose==='function')dispose();return;}this.dispose=typeof dispose==='function'?dispose:null;}).catch(()=>{if(session===this.gameToken)placeholder('小游戏暂不可用，请返回地标展示。本次不计入通关。');});
    }
    closeGame(){this.gameToken++;if(this.dispose){try{this.dispose();}catch(_){}this.dispose=null;}this.gameHost.replaceChildren();this.gameHost.hidden=true;}
    displayAgain(){this.closeGame();this.root.dataset.state='display';}
    hide(){this.token++;this.closeGame();if(this.dialog.open)this.dialog.close();this.root.hidden=true;document.body.dataset.landmarkActive='false';}
    destroy(){this.hide();this.cache.clear();}
  };
})();
