window.MuseumAudio=(()=>{
  let ctx,master,ambientNodes=[],ambientTimer=null,level=2,lastStep=0;
  const levels=[0,.58,.95];
  const get=()=>{if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=levels[level];master.connect(ctx.destination)}return ctx};
  const env=(gain,t,peak,d,a=.01)=>{gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+a);gain.gain.exponentialRampToValueAtTime(.0001,t+d)};
  function tone(freq,d=.2,type='sine',vol=.08,slide=0,delay=0){if(level===0)return;const c=get(),t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(24,freq+slide),t+d);env(g,t,vol,d);o.connect(g).connect(master);o.start(t);o.stop(t+d+.05)}
  function noise(d=.1,freq=900,vol=.03,q=.7,delay=0){if(level===0)return;const c=get(),t=c.currentTime+delay,len=Math.max(1,d*c.sampleRate|0),b=c.createBuffer(1,len,c.sampleRate),ch=b.getChannelData(0);for(let i=0;i<len;i++)ch[i]=Math.random()*2-1;const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;f.type='bandpass';f.frequency.value=freq;f.Q.value=q;env(g,t,vol,d);s.connect(f).connect(g).connect(master);s.start(t)}
  function scheduleDistantChime(){clearTimeout(ambientTimer);ambientTimer=setTimeout(()=>{if(level>0&&ambientNodes.length){tone(392,1.7,'sine',.022);tone(784,2.1,'sine',.008,0,.18);scheduleDistantChime()}},9000+Math.random()*7000)}
  function startAmbient(){if(level===0||ambientNodes.length||document.hidden)return;const c=get(),o1=c.createOscillator(),o2=c.createOscillator(),toneFilter=c.createBiquadFilter(),toneGain=c.createGain();o1.type='sine';o1.frequency.value=174;o2.type='sine';o2.frequency.value=261;toneFilter.type='lowpass';toneFilter.frequency.value=420;toneGain.gain.value=.008;o1.connect(toneFilter);o2.connect(toneFilter);toneFilter.connect(toneGain).connect(master);o1.start();o2.start();ambientNodes=[o1,o2,toneGain];scheduleDistantChime()}
  function stopAmbient(){clearTimeout(ambientTimer);ambientTimer=null;ambientNodes.forEach(n=>{try{n.stop?n.stop():n.disconnect()}catch(_){}});ambientNodes=[]}
  document.addEventListener('visibilitychange',()=>{document.hidden?stopAmbient():(level>0&&ctx&&startAmbient())});
  return{
    unlock(){const c=get();if(c.state==='suspended')c.resume();master.gain.setTargetAtTime(levels[level],c.currentTime,.06);startAmbient()},
    cycleLevel(){level=(level+1)%3;const c=get();if(c.state==='suspended')c.resume();master.gain.setTargetAtTime(levels[level],c.currentTime,.06);level===0?stopAmbient():startAmbient();return level},
    toggle(){return this.cycleLevel()>0},
    isOn(){return level>0},
    door(){noise(.9,180,.075,.5);tone(116,.8,'sine',.07,-32)},
    step(){const n=performance.now();if(n-lastStep<350)return;lastStep=n;noise(.12,165,.07,.55);tone(86,.1,'sine',.035,-12)},
    light(){tone(190,.08,'sine',.035);tone(720,.45,'sine',.035,60,.06)},
    brush(){noise(.085,2600,.018,.6)},swab(){noise(.06,950,.014,1.7)},scrape(){noise(.055,3800,.02,2.2)},
    wrong(){tone(150,.18,'sawtooth',.045,-45)},
    snap(){tone(523,.12,'triangle',.07);tone(784,.25,'sine',.045,0,.05)},
    page(){noise(.14,1550,.022,.8)},
    hotspot(){tone(660,.25,'sine',.045);tone(990,.55,'sine',.035,0,.1)},
    chime(i=0){const scale=[392,440,523,587,659];tone(scale[i%scale.length],1.1,'sine',.075);tone(scale[i%scale.length]*2,1.25,'sine',.025)},
    playFinaleChime(type){if(type==='porcelain'){tone(1320,.22,'sine',.08);tone(1760,.35,'triangle',.035,0,.04)}else if(type==='wood'){tone(145,.18,'triangle',.12,-35);noise(.1,320,.055,.8)}else if(type==='jade'){[784,1046,1318].forEach((f,i)=>tone(f,.9+i*.18,'sine',.055,0,i*.07))}else{this.drum()}},
    drum(){tone(74,.85,'sine',.35,-36);tone(112,.42,'triangle',.12,-25);noise(.22,270,.17,.55);noise(.05,2300,.05,1.2)},
    finale(){[392,523,587,659,784].forEach((f,i)=>{tone(f,1.25,'sine',.06,0,i*.18);tone(f*2,1.1,'sine',.018,0,i*.18)})}
  };
})();
