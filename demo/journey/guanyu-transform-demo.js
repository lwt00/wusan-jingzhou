(async()=>{
  const host=document.getElementById('transform-stage'),status=document.getElementById('transform-status'),$=id=>document.getElementById(id);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),P=window.PIXI;
  const timing=window.WusanTravelConfig.travelTiming,transformDuration=(window.WusanTravelConfig.characterTiming?.guanyu?.transformDuration??timing.transformDuration)/1000,travelDuration=timing.travelDuration/1000,arrivalDuration=timing.arrivalDuration/1000;
  $('timing-summary').textContent=`变身${Math.round(transformDuration*1000)}ms、赶路${timing.travelDuration}ms、抵达${timing.arrivalDuration}ms，合计约${(transformDuration+travelDuration+arrivalDuration).toFixed(1)}秒。`;
  // 仅供独立 Demo 使用；阶段使用总时长比例，时间仍来自 travelTiming。
  const brushConfig=window.WusanTravelConfig.transformBrush;
  const app=new P.Application();let explorer,rider,effect,state='loading',paused=false,raf=0,last=0,travelTime=0,destroyed=false,autoPaused=false,swapCoverage=null,arrivalTime=0,arrivalVeil=null;
  const buttons=['play-transform','replay-transform','pause-transform','skip-transform','cancel-transform'];
  function controls(){const running=['transform','travel','arrival'].includes(state);$('play-transform').disabled=state!=='idle'&&state!=='finished';$('replay-transform').disabled=state==='loading';$('pause-transform').disabled=!running;$('pause-transform').textContent=paused?'继续':'暂停';$('skip-transform').disabled=state!=='transform';$('cancel-transform').disabled=!running;}
  function stopLoop(){if(raf)cancelAnimationFrame(raf);raf=0;}
  function resetScenes(){for(const s of [explorer,rider]){s.cameraX=0;s.walkDistance=0;s.previousDistance=0;s.frameElapsed=0;s.framePosition=0;s.environmentTime=0;s.update(0,0,false);}travelTime=0;arrivalTime=0;if(arrivalVeil)arrivalVeil.alpha=0;swapCoverage=null;}
  function sizeScene(s,zoom=1){const k=Math.max(app.screen.width/s.scene.width,app.screen.height/s.scene.height)*zoom;s.root.scale.set(k);s.root.position.set((app.screen.width-s.scene.width*k)/2,(app.screen.height-s.scene.height*k)/2);}
  function captionState(){
    if(state==='transform')status.textContent=`毛笔擦画变身 ${effect.elapsed.toFixed(2)} / ${transformDuration.toFixed(2)} 秒${paused?' · 暂停':''}`;
    else if(state==='travel')status.textContent=`关羽骑马 · 原六帧8 FPS · 赶路 ${travelTime.toFixed(1)} / ${travelDuration.toFixed(1)} 秒${paused?' · 暂停':''}`;
    else if(state==='arrival')status.textContent=`抵达云雾 ${arrivalTime.toFixed(2)} / ${arrivalDuration.toFixed(2)} 秒${paused?' · 暂停':''}`;
  }
  function frame(now){raf=0;if(destroyed||paused||document.hidden)return;const dt=Math.min(.08,(now-last)/1000)*($('slow-transform').checked?.25:1);last=now;
    if(state==='transform'){
      const progress=effect.elapsed/transformDuration,zoom=1+.01*effect.smooth(0,.3,progress)*(1-effect.smooth(.75,1,progress));
      explorer.update(dt*.1,0,false);rider.update(progress>=brushConfig.rideStart?dt:0,0,progress>=brushConfig.rideStart);
      sizeScene(explorer,zoom);sizeScene(rider,zoom);effect.update(dt);
    }else if(state==='travel'){
      travelTime=Math.min(travelDuration,travelTime+dt);const u=travelTime/travelDuration;
      rider.update(dt,u*u*(3-2*u),true);sizeScene(rider);
      if(travelTime>=travelDuration){state='arrival';arrivalTime=0;rider.update(0,1,false);controls();}
    }else if(state==='arrival'){
      arrivalTime=Math.min(arrivalDuration,arrivalTime+dt);arrivalVeil.alpha=Math.sin(Math.PI*arrivalTime/arrivalDuration)*.8;
      if(arrivalTime>=arrivalDuration){arrivalVeil.alpha=0;state='finished';status.textContent='抵达演示完成 · 可重新播放';controls();}
    }
    captionState();app.render();if(['transform','travel','arrival'].includes(state))raf=requestAnimationFrame(frame);
  }
  function loop(){stopLoop();last=performance.now();if(!paused&&!document.hidden)raf=requestAnimationFrame(frame);}
  function start(){if(state==='loading'||['transform','travel','arrival'].includes(state))return;stopLoop();resetScenes();state='transform';paused=false;effect.start();controls();if(reduced.matches){effect.skip();}else loop();app.render();}
  function cancel(){stopLoop();effect.cancel();paused=false;resetScenes();rider.hide();explorer.show();sizeScene(explorer);state='idle';status.textContent='普通探索者 · 等待水墨变身';controls();app.render();}
  try{
    await app.init({width:host.clientWidth,height:host.clientHeight,background:0xf0eee5,antialias:true,resolution:Math.min(devicePixelRatio,2),autoDensity:true,autoStart:false,preference:'webgl'});host.appendChild(app.canvas);
    explorer=new WusanTravelScene(P,app,window.WusanTravelConfig);rider=new WusanTravelScene(P,app,window.WusanTravelConfig);rider.cache=explorer.cache;
    await explorer.prepare('museum','guanyu',1);await rider.prepare('guanyu','binyang',1);
    if(rider.actorFrames?.length!==6)throw Error('关羽六帧素材未齐，未启用变身测试');
    arrivalVeil=new P.Sprite(await explorer.texture(window.WusanTravelConfig.transition.cloudSrc));arrivalVeil.alpha=0;arrivalVeil.width=app.screen.width;arrivalVeil.height=app.screen.height;app.stage.addChild(arrivalVeil);
    const brushTexture=await explorer.texture(brushConfig.src);
    effect=new WusanInkTransform(P,app.stage,{from:explorer,to:rider,host,duration:transformDuration,text:'承忠义之志，策马赴新程。',brush:brushConfig,brushTexture,
      onSwitch(){swapCoverage=effect.revealed;},
      onComplete(){state=reduced.matches?'finished':'travel';if(reduced.matches){rider.update(0,0,false);status.textContent='减少动态模式 · 已切换为关羽';stopLoop();}controls();},onCancel(){}
    });cancel();
    $('play-transform').addEventListener('click',start);$('replay-transform').addEventListener('click',()=>{cancel();start();});
    $('pause-transform').addEventListener('click',()=>{if(!['transform','travel','arrival'].includes(state))return;paused=!paused;controls();captionState();if(paused)stopLoop();else loop();});
    $('skip-transform').addEventListener('click',()=>{if(state!=='transform')return;effect.skip();controls();if(!paused&&!reduced.matches)loop();app.render();});$('cancel-transform').addEventListener('click',cancel);
    const observer=new ResizeObserver(()=>{app.renderer.resize(host.clientWidth,host.clientHeight);arrivalVeil.width=app.screen.width;arrivalVeil.height=app.screen.height;for(const s of [explorer,rider])sizeScene(s);if(effect.active)effect.draw();app.render();});observer.observe(host);
    function visibility(){if(document.hidden){autoPaused=!paused&&['transform','travel','arrival'].includes(state);if(autoPaused){paused=true;stopLoop();controls();}}else if(autoPaused){autoPaused=false;paused=false;controls();loop();}}
    document.addEventListener('visibilitychange',visibility);
    window.addEventListener('pagehide',e=>{stopLoop();if(!e.persisted){destroyed=true;observer.disconnect();document.removeEventListener('visibilitychange',visibility);effect.destroy();explorer.destroy();rider.destroy();app.destroy(true,{children:true,texture:true,textureSource:true});}});
    window.addEventListener('pageshow',e=>{if(e.persisted){last=performance.now();visibility();if(['transform','travel','arrival'].includes(state)&&!paused)loop();}});
    window.guanyuTransformDebug=()=>({state,paused,elapsed:effect.elapsed,travelTime,switched:effect.switched,coverage:swapCoverage,fromVisible:explorer.root.visible,toVisible:rider.root.visible,frames:rider.actorFrames?.length,fps:rider.scene.slots.character.frames.fps,frame:rider.framePosition,scale:rider.actor.scale.x,effectChildren:effect.root?.children.length||0,captions:host.querySelectorAll('.ink-transform-caption').length,raf:!!raf,angle:0,turning:false,vortex:false,arrivalTime,transformDuration,travelDuration,arrivalDuration,brushTipX:effect.tipX,brushTipY:effect.tipY,wipeDirection:'bottom-up',maskBoundary:effect.boundary,revealed:effect.revealed,brushVisible:!!effect.brush,masked:!!explorer.actor.mask||!!rider.actor.mask,actorParentRestored:rider.actor.parent===rider.root,audioCount:document.querySelectorAll("audio,video").length});
  }catch(error){stopLoop();state='error';status.textContent='预览加载失败：'+error.message;buttons.forEach(id=>$(id).disabled=true);}
})();
