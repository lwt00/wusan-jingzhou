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
      this.start.addEventListener('click',()=>{if(this.id==='zhangjuzheng')this.gameHost.dataset.entryClick=String(performance.now());this.root.dataset.poemSkipped='true';if(this.dialog.open)this.dialog.close();if(this.id==='binyang')this.stopFloatingPoem(true);callbacks.onExplore();});
      document.getElementById('landmark-back').addEventListener('click',()=>callbacks.onBack());
      this.learn.addEventListener('click',()=>{const c=this.current();
        document.getElementById('landmark-story-title').textContent=c.culture?c.culturalTitle:c.anecdote?.title||'典故资料待补充';
        document.getElementById('landmark-story-text').textContent=c.culture?c.culture.entries.map(entry=>[entry.lines.join(''),entry.author,entry.title,entry.kind==='诗词节选'?'（节选）':'',`释义：${entry.interpretation}`,entry.background?`${entry.backgroundLabel||'文化背景'}：${entry.background}`:''].filter(Boolean).join('\n\n')).join('\n\n────────\n\n'):c.anecdote?.text||'典故资料待补充。';this.dialog.dataset.landmark=this.id;
        for(const entry of c.culture?.entries||[]){if(!entry.source)continue;const source=document.createElement('a');source.textContent=entry.kind==='楹联'?'查看楹联资料':`查看${entry.title}出处`;source.href=entry.source;source.target='_blank';source.rel='noopener noreferrer';document.getElementById('landmark-story-text').append(document.createElement('br'),source);}
        if(this.id==='museum'&&c.artifacts){
          document.getElementById('landmark-story-title').textContent='荆楚遗珍 · 四件馆藏';
          const content=document.getElementById('landmark-story-text');content.replaceChildren();
          for(const artifact of c.artifacts){
            const section=document.createElement('span');section.className='museum-story-entry';
            const title=document.createElement('strong');title.textContent=artifact.name;
            const period=document.createElement('small');period.textContent=artifact.period;
            const description=document.createElement('span');description.textContent=artifact.text;
            const source=document.createElement('a');source.textContent='查看文物资料';source.href=artifact.source;source.target='_blank';source.rel='noopener noreferrer';
            section.append(title,period,description,source);content.append(section);
          }
        }
        if(!this.dialog.open)this.dialog.show();document.getElementById('landmark-story-close').focus({preventScroll:true});});
      document.getElementById('landmark-story-close').addEventListener('click',()=>{this.dialog.close();this.learn.focus({preventScroll:true});});
      this.storyEscape=e=>{if(e.key==='Escape'&&this.dialog.open){this.dialog.close();this.learn.focus({preventScroll:true});}};document.addEventListener('keydown',this.storyEscape);
      this.poetry=document.createElement('div');this.poetry.id='guanyu-poetry';this.poetry.hidden=true;this.root.append(this.poetry);
      this.floatingPoem=document.createElement('div');this.floatingPoem.id='binyang-floating-poem';this.floatingPoem.hidden=true;this.root.append(this.floatingPoem);this.poemFrame=0;this.poemTime=0;
      this.poemVisibility=()=>{if(this.id!=='binyang'||this.floatingPoem.hidden)return;if(document.hidden){cancelAnimationFrame(this.poemFrame);this.poemFrame=0;}else if(!this.poemStopped)this.playFloatingPoem();};document.addEventListener('visibilitychange',this.poemVisibility);

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
      this.stopFloatingPoem(true);this.closeGame();const token=++this.token;this.id=id;this.started=false;this.ready=false;const c=this.current();this.root.hidden=false;this.root.dataset.landmark=id;delete this.root.dataset.poemSkipped;if(this.dialog.open)this.dialog.close();this.root.dataset.state='display';this.root.dataset.fullScene=String(!!c.display?.fullScene);this.root.dataset.layout=c.display?.layout||'';this.root.style.setProperty('--landmark-push',String(Math.min(1.045,Math.max(1,c.display?.pushScale||this.config.visuals?.pushScale||1.025))));document.body.dataset.landmarkActive='true';
      document.getElementById('landmark-name').textContent=c.name||'文化地标';document.getElementById('landmark-title').textContent=c.culturalTitle||'文化主题待补充';
      document.getElementById('landmark-theme').textContent=c.theme||'';document.getElementById('landmark-poem').textContent=c.poem||'诗词与典故资料待补充（占位）';document.getElementById('landmark-credit').textContent=c.imageLabel||'近景素材占位';
      this.poetry.replaceChildren();this.poetry.hidden=!['guanyu','zhangjuzheng','museum'].includes(id);
      if(['guanyu','zhangjuzheng'].includes(id)&&c.poetry){
        const verses=document.createElement('div');verses.className='guanyu-verses';
        c.poetry.lines.forEach((text,i)=>{const line=document.createElement('span');line.textContent=text;line.style.setProperty('--verse-delay',`${.6+i*.9}s`);verses.append(line);});
        const credit=document.createElement('p');credit.className='guanyu-poetry-credit';credit.textContent=`${c.poetry.author}\n${c.poetry.title}`;this.poetry.append(verses,credit);
      }
      if(id==='museum'&&c.inscription){
        const verses=document.createElement('div');verses.className='guanyu-verses museum-inscription';
        c.inscription.lines.forEach(text=>{const line=document.createElement('span');line.textContent=text;line.style.setProperty('--verse-delay','.6s');verses.append(line);});
        const credit=document.createElement('p');credit.className='guanyu-poetry-credit';credit.textContent=`${c.inscription.title} · ${c.inscription.kind}`;
        const seal=document.createElement('span');seal.className='museum-inscription-seal';seal.textContent='楚韵';seal.setAttribute('aria-hidden','true');credit.append(seal);this.poetry.append(verses,credit);
      }
      this.root.querySelector('.museum-artifacts')?.remove();
      if(id==='museum'&&c.artifacts){
        const gallery=document.createElement('div');gallery.className='museum-artifacts';gallery.setAttribute('role','list');gallery.setAttribute('aria-label','荆州博物馆馆藏，自右向左');
        for(const artifact of c.artifacts){
          const item=document.createElement('figure');item.className='museum-artifact';item.setAttribute('role','listitem');
          const image=document.createElement('img');image.src=`assets/museum-artifacts/${artifact.id}.svg`;image.alt=`${artifact.name}形制示意`;image.draggable=false;
          const caption=document.createElement('figcaption');caption.textContent=artifact.name;
          item.append(image,caption);gallery.append(item);
        }
        this.root.append(gallery);
      }
      this.image.style.objectPosition=c.display?.imagePosition||'50% 50%';this.image.hidden=true;document.getElementById('landmark-image-fallback').hidden=false;
      this.prepare(id).then(image=>{if(token!==this.token||!this.active)return;this.ready=true;if(image){this.natural=image;this.image.src=image.src;this.image.alt=`${c.name}近景艺术化占位`;this.image.hidden=false;document.getElementById('landmark-image-fallback').hidden=true;this.resize();if(id==='binyang')this.startFloatingPoem();}else document.getElementById('landmark-image-fallback').textContent='近景素材待补充 · 可继续查看文化主题';});
    }
    positionFloatingPoem(){
      if(this.id!=='binyang'||!this.natural)return;
      const r=this.image.getBoundingClientRect(),scale=Math.min(r.width/this.natural.naturalWidth,r.height/this.natural.naturalHeight),w=this.natural.naturalWidth*scale,h=this.natural.naturalHeight*scale,a=this.current().poetryCycle.anchor;
      this.floatingPoem.style.left=`${r.left+(r.width-w)/2+w*a.u}px`;this.floatingPoem.style.top=`${r.top+(r.height-h)/2+h*a.v}px`;
    }
    startFloatingPoem(){
      if(this.id!=='binyang'||!this.current().poetryCycle)return;
      this.stopFloatingPoem(true);this.poemTime=0;this.poemStopped=false;this.floatingPoem.hidden=false;this.floatingPoem.replaceChildren();const c=this.current().poetryCycle;
      this.poemGroups=c.groups.map(group=>{const panel=document.createElement('div');panel.className='binyang-poem-group';panel.style.opacity='0';group.lines.forEach(text=>{const line=document.createElement('p');line.textContent=text;panel.append(line);});const credit=document.createElement('small');credit.textContent=group.credit;panel.append(credit);this.floatingPoem.append(panel);return panel;});
      const skip=document.createElement('button');skip.type='button';skip.className='binyang-poem-skip';skip.textContent='跳过题诗';skip.addEventListener('click',()=>this.stopFloatingPoem(true));this.floatingPoem.append(skip);this.positionFloatingPoem();
      if(matchMedia('(prefers-reduced-motion: reduce)').matches){this.poemStopped=true;this.poemGroups.forEach((p,i)=>{p.hidden=i!==0;p.style.opacity=String(c.opacity);});skip.textContent='切换诗词';skip.replaceWith(skip.cloneNode(true));const next=this.floatingPoem.querySelector('button');let current=0;next.addEventListener('click',()=>{current=(current+1)%this.poemGroups.length;this.poemGroups.forEach((p,i)=>p.hidden=i!==current);});return;}
      this.playFloatingPoem();
    }
    playFloatingPoem(){
      cancelAnimationFrame(this.poemFrame);let last=performance.now();
      const tick=now=>{if(this.poemStopped||this.id!=='binyang'||!this.active||this.root.dataset.state!=='display'||document.hidden){this.poemFrame=0;return;}this.poemTime+=Math.min(.1,(now-last)/1000);last=now;const c=this.current().poetryCycle,t=Math.max(0,this.poemTime-c.initialDelay),span=c.holdSeconds+c.fadeSeconds,index=Math.floor(t/span)%c.groups.length,phase=t%span,blend=Math.max(0,(phase-c.holdSeconds)/c.fadeSeconds),enter=Math.min(1,t/c.fadeSeconds);
        this.poemGroups.forEach((p,i)=>{const alpha=i===index?(1-blend)*enter:i===(index+1)%c.groups.length?blend:0;p.style.opacity=String(alpha*c.opacity);p.style.filter=`blur(${(1-alpha)*1.1}px)`;p.setAttribute('aria-hidden',String(alpha<.5));});
        this.floatingPoem.style.setProperty('--poem-float',`${Math.sin(t/c.floatSeconds*Math.PI*2)*c.floatAmplitude}px`);this.positionFloatingPoem();this.poemFrame=requestAnimationFrame(tick);
      };this.poemFrame=requestAnimationFrame(tick);
    }
    stopFloatingPoem(hide=false){cancelAnimationFrame(this.poemFrame);this.poemFrame=0;this.poemStopped=true;if(hide)this.floatingPoem.hidden=true;}
    resize(){
      if(!this.natural||!this.active)return;
      const push=Math.min(1.045,Math.max(1,this.current().display?.pushScale||this.config.visuals?.pushScale||1.025)),dpr=this.current().display?.fullScene?1:Math.max(1,devicePixelRatio);
      this.root.style.setProperty('--landmark-image-width',`${Math.min(this.current().display?.maxWidth||680,this.natural.naturalWidth/dpr/push)}px`);
      this.root.style.setProperty('--landmark-image-height',`${this.natural.naturalHeight/dpr/push}px`);
    }
    setStage(stage,done=false){
      this.root.dataset.stage=stage;this.root.dataset.fog=done?'complete':this.started?'exploring':'arrived';this.start.disabled=stage!=='awaiting-explore';this.learn.disabled=stage!=='awaiting-explore';this.start.textContent=done?'再次探索':'开始探索';document.getElementById('landmark-back').disabled=!['awaiting-explore','exploring-demo'].includes(stage);
    }
    openGame(){
      this.closeGame();if(this.id==='zhangjuzheng'){this.gameHost.dataset.game='zhangjuzheng-memorial';this.gameHost.dataset.entry='loading';this.root.dataset.zhangEntry='loading';}this.started=true;this.root.dataset.fog=this.root.dataset.fog==='complete'?'complete':'exploring';this.root.dataset.state='game';this.gameHost.hidden=false;
      const c=this.current(),adapter=c.game?.enabled&&games.get(c.game.id),session=++this.gameToken,id=this.id;
      const placeholder=message=>{
        if(id==='zhangjuzheng'){delete this.gameHost.dataset.entry;delete this.gameHost.dataset.game;delete this.root.dataset.zhangEntry;}
        this.gameHost.replaceChildren();const h=document.createElement('h2');h.textContent=`${c.name} · 小游戏待接入`;const p=document.createElement('p');p.textContent=message||'迷雾已暂时拨开一部分。当前仅为小游戏入口占位，不包含正式任务，也不会计入通关或发放文化印章；正式探索完成后才会完全散雾并盖章。';
        const returnDisplay=document.createElement('button');returnDisplay.textContent='返回地标展示';returnDisplay.addEventListener('click',()=>this.callbacks.onDisplay());const returnMap=document.createElement('button');returnMap.textContent='返回长卷';returnMap.addEventListener('click',()=>this.callbacks.onBack());this.gameHost.append(h,p,returnDisplay,returnMap);returnDisplay.focus({preventScroll:true});
      };
      if(!adapter){placeholder();return;}
      this.gameHost.replaceChildren();let completedOnce=false;
      const context={container:this.gameHost,levelId:id,isActive:()=>session===this.gameToken&&this.active&&this.id===id,
        complete:result=>{if(session!==this.gameToken||!this.active||this.id!==id||completedOnce||result?.completed!==true||result.levelId!==id)return;completedOnce=true;this.callbacks.onComplete(id);},
        cancel:()=>{if(session===this.gameToken)this.callbacks.onDisplay();}};
      Promise.resolve().then(()=>adapter.mount(context)).then(dispose=>{if(session!==this.gameToken){if(typeof dispose==='function')dispose();return;}this.dispose=typeof dispose==='function'?dispose:null;}).catch(()=>{if(session===this.gameToken)placeholder('小游戏暂不可用，请返回地标展示。本次不计入通关。');});
    }
    closeGame(){this.gameToken++;if(this.dispose){try{this.dispose();}catch(_){}this.dispose=null;}this.gameHost.replaceChildren();this.gameHost.hidden=true;delete this.gameHost.dataset.entry;delete this.root.dataset.zhangEntry;if(this.gameHost.dataset.game==='zhangjuzheng-memorial')delete this.gameHost.dataset.game;}
    displayAgain(){this.closeGame();this.root.dataset.state='display';if(this.id==='binyang')this.startFloatingPoem();}
    hide(){this.stopFloatingPoem(true);this.token++;this.closeGame();if(this.dialog.open)this.dialog.close();this.root.hidden=true;document.body.dataset.landmarkActive='false';}
    destroy(){this.hide();document.removeEventListener('keydown',this.storyEscape);this.poetry.remove();document.removeEventListener('visibilitychange',this.poemVisibility);this.floatingPoem.remove();this.cache.clear();}
  };
})();
