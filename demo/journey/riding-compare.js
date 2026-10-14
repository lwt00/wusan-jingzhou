(()=>{
  const config=window.WusanRidingTuning,host=document.getElementById('samples'),align=document.getElementById('align');
  const images=Array.from({length:6},(_,i)=>{const img=new Image();img.src=`assets/guanyu-riding-six/ride_${String(i+1).padStart(2,'0')}.png`;return img;});
  const samples=[8,10,12].map(fps=>{const card=document.createElement('div');card.className='sample';const img=document.createElement('img');img.alt='关羽骑马测试';const label=document.createElement('span');card.append(img,label);host.append(card);return{fps,img,label,position:0,index:-1};});
  let paused=false,last=performance.now(),raf;
  function render(){for(const s of samples){const index=config.order[Math.floor(s.position)%6];if(s.index!==index){s.img.src=images[index].src;s.index=index;}const o=align.checked?config.offsets[index]:{x:0,y:0};s.img.style.transform=`translate(${o.x/640*100}%,${o.y/512*100}%)`;s.label.textContent=`${s.fps} FPS · 帧 ${index+1}/6`;}}
  function tick(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(!paused&&!document.hidden)for(const s of samples)s.position=(s.position+dt*s.fps)%6;render();raf=requestAnimationFrame(tick);}
  document.getElementById('pause').onclick=()=>{paused=!paused;document.getElementById('pause').textContent=paused?'继续动作':'暂停动作';};document.getElementById('restart').onclick=()=>{for(const s of samples)s.position=0;last=performance.now();render();};align.onchange=render;
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);last=performance.now();if(!document.hidden)raf=requestAnimationFrame(tick);});window.addEventListener('pagehide',()=>cancelAnimationFrame(raf));window.addEventListener('pageshow',e=>{if(e.persisted){last=performance.now();raf=requestAnimationFrame(tick);}});
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){paused=true;document.getElementById('pause').textContent='播放动作';}
  Promise.all(images.map(img=>img.decode())).then(()=>{render();raf=requestAnimationFrame(tick);}).catch(()=>{document.getElementById('note').textContent='动作素材未加载，请检查六张 PNG 是否齐全。';});
})();
