(()=>{
 const $=id=>document.getElementById(id),ctx=$('stage').getContext('2d'),frames=Array.from({length:12},(_,i)=>{const img=new Image();img.src=`assets/jingzhou-guard-diagnostic/whole-frames/walk_${String(i+1).padStart(2,'0')}.png`;return img;});
 const ground=382;let anchors=[],frame=0,distance=0,paused=false,ready=false,last=performance.now(),elapsed=0,raf=0;
 function draw(){if(!ready)return;ctx.clearRect(0,0,720,480);ctx.fillStyle='#e6d9bd';ctx.fillRect(0,ground,720,70);ctx.fillStyle='#c5b695';for(let i=-2;i<12;i++){const x=i*80-((distance%80)+80)%80;ctx.fillRect(x,ground+17,26,2);ctx.fillRect(x+30,ground+48,8,3);}ctx.drawImage(frames[frame],220,ground-anchors[frame]*.8,288,352);if($('labels').checked){ctx.fillStyle='#7b4235';ctx.font='16px serif';ctx.fillText(`帧 ${frame+1}`,350,ground+30);}$('status').textContent=`第 ${frame+1}/12 帧 · ${[3,7].includes(frame)?'收拢姿态':'迈步 / 过渡姿态'} · ${$('fps').value} FPS${paused?' · 暂停':''}`;}
 function advance(n){frame=(frame+n+12)%12;distance+=n*8;draw();}
 function control(){$('play').textContent=paused?'继续':'暂停';draw();}
 function tick(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(ready&&!paused&&!document.hidden){elapsed+=dt*Number($('fps').value);while(elapsed>=1){elapsed--;advance(1);}}raf=requestAnimationFrame(tick);}
 $('play').onclick=()=>{paused=!paused;elapsed=0;control();};$('prev').onclick=()=>{paused=true;elapsed=0;advance(-1);control();};$('next').onclick=()=>{paused=true;elapsed=0;advance(1);control();};$('reset').onclick=()=>{frame=0;distance=0;elapsed=0;paused=false;control();};$('labels').onchange=draw;$('fps').onchange=()=>{elapsed=0;draw();};
 document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);last=performance.now();if(!document.hidden)raf=requestAnimationFrame(tick);});window.addEventListener('pagehide',()=>cancelAnimationFrame(raf));window.addEventListener('pageshow',e=>{if(e.persisted){last=performance.now();raf=requestAnimationFrame(tick);}});
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)paused=true;
 Promise.all([Promise.all(frames.map(img=>img.decode())),fetch('assets/jingzhou-guard-diagnostic/whole-frames/anchors.json').then(r=>{if(!r.ok)throw Error('anchors');return r.json();})]).then(([,a])=>{anchors=a;ready=true;control();last=performance.now();raf=requestAnimationFrame(tick);}).catch(()=>{$('status').textContent='人物帧加载失败，请检查素材路径。';});
 window.guardWalkDebug=()=>({frame,distance,paused,ready,fps:Number($('fps').value),wholeFrames:true,loaded:frames.filter(img=>img.complete&&img.naturalWidth).length});
})();
