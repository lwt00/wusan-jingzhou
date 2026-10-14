/* 正式素材优先在这里替换，路径相对于 journey-demo.html。动画模块不包含图片路径。 */
window.WusanTravelConfig={
  version:1,
  defaultScene:'ink-road',
  routes:{
    // 'guanyu->binyang':'river-road', 'binyang->guanyu':'river-road'
  },
  scenes:{'ink-road':{
    title:'山水驿道 · 临时技术场景',
    width:1600,height:900,groundY:640,travelDistance:1400,duration:8,
    camera:{follow:7,lead:35},
    scenery:window.WusanTravelScenery?.items||[],
    legacyLayerOpacity:window.WusanTravelScenery?.legacyLayerOpacity||{},
    segments:window.WusanTravelScenery?.segments||{},
    slots:{
      sky:{src:window.WusanTravelScenery?.skySrc||'assets/travel-temp/sky.svg',x:0,y:0,width:1600,scale:1,opacity:1,parallax:.08,repeat:true},
      far:{src:'assets/travel-temp/far-ridge.png',x:0,y:40,width:1800,scale:1,opacity:.65,parallax:.24,repeat:true},
      middle:{src:'assets/travel-temp/middle-bank.svg',x:0,y:0,width:1600,scale:1,opacity:.85,parallax:.58,repeat:true},
      road:{src:window.WusanTravelScenery?.roadSrc||'assets/travel-temp/road.svg',x:0,y:0,width:1600,scale:1,opacity:1,parallax:1,repeat:true},
      foreground:{src:'assets/travel-temp/foreground-willow.png',x:0,y:790,width:720,scale:1,opacity:.85,parallax:1.45,repeat:true,spacing:920,anchorY:1},
      character:{src:null,x:0,y:0,scale:2.8,opacity:1,parallax:1,anchorX:.5,anchorY:1,
        // 正式横向序列帧：src:'assets/travel/hero.png', frames:{count:8,columns:8,width:128,height:192,stride:144,idle:0}
        frames:null}
    }
  }},
  transition:{cloudSrc:'assets/travel-temp/transition-cloud.png',duration:1.15},
  loadTimeout:4500
};

window.WusanRidingTuning={fps:8,order:[0,1,2,3,4,5],align:true,
  // 仅小幅平移补偿，源图和缩放不变。保留腾空姿态，不逐帧强拉马蹄。
  offsets:[{x:0,y:0},{x:1,y:1},{x:9,y:0},{x:4,y:6},{x:10,y:3},{x:9,y:7}]};

// 赶路角色由出发地点决定；画卷中的小人和抵达展示不使用本角色。
{
  const config=window.WusanTravelConfig;
  const character={src:null,x:0,y:0,scale:.44,opacity:1,parallax:1,anchorX:.5,anchorY:486/512,
    frames:{count:6,sources:Array.from({length:6},(_,i)=>`assets/guanyu-riding-six/ride_${String(i+1).padStart(2,'0')}.png`),
      fps:8,idle:0,order:window.WusanRidingTuning.order,offsets:window.WusanRidingTuning.offsets,align:true}};
  config.scenes['guanyu-riding']={title:'山水驿道 · 关羽骑马',slots:{character}};
  for(const target of ['binyang','zhangjuzheng','museum'])config.routes[`guanyu->${target}`]='guanyu-riding';
  // 保留诊断入口；仅测试模式显示FPS/补偿控件，配置独立于正常8 FPS。
  if(new URLSearchParams(location.search).get('ridingTest')==='1'){
    config.scenes['guanyu-riding-diagnostic']={
      title:'关羽骑马 · 六帧动作诊断 · 可切换8/10/12 FPS',
      slots:{character:{...character,frames:{...character.frames,diagnostic:true,fps:window.WusanRidingTuning.fps}}}
    };
    for(const target of ['binyang','zhangjuzheng','museum'])config.routes[`guanyu->${target}`]='guanyu-riding-diagnostic';
  }
}

// 最新确认版本：原画小步幅八帧、脚部v2、用户指定往返序列。
{
  const config=window.WusanTravelConfig;
  config.scenes['zhang-walking']={
    title:'山水驿道 · 张居正行走',
    slots:{character:{src:null,x:0,y:0,scale:.5,opacity:1,parallax:1,anchorX:252/400,anchorY:420/448,
      frames:{count:8,sources:Array.from({length:8},(_,i)=>i===3?'assets/zhang-walking-small-eight/walk_04-feet-v2.png':`assets/zhang-walking-small-eight/walk_${String(i+1).padStart(2,'0')}.png`),
        fps:8,idle:0,order:[0,1,2,3,4,5,6,5,4,3,2,1,0],align:true,offsets:Array.from({length:8},()=>({x:0,y:0}))}}}
  };
  for(const target of ['guanyu','binyang','museum'])config.routes[`zhangjuzheng->${target}`]='zhang-walking';
}

// 保留旧素材诊断对比；默认诊断使用同一套正式张居正配置。
if(new URLSearchParams(location.search).get('walkingTest')==='1'){
  const config=window.WusanTravelConfig;
  config.scenes['zhang-walking-diagnostic']={
    title:'张居正行走 · 八帧8 FPS诊断（步态/形变待修复）',
    slots:{character:{src:null,x:0,y:0,scale:.36,opacity:1,parallax:1,anchorX:285/512,anchorY:548/576,
      frames:{count:8,sources:Array.from({length:8},(_,i)=>`assets/zhang-walking-eight/walk_${String(i+1).padStart(2,'0')}.png`),
        fps:8,idle:0,order:[0,1,2,3,4,5,6,7],align:true,offsets:Array.from({length:8},()=>({x:0,y:0}))}}}
  };
  // 保留旧八/十二帧及v2对比，不影响正式默认版本。
  const useOld=new URLSearchParams(location.search).get('walkSet')==='old';
  if(!useOld){
    config.scenes['zhang-walking-twelve-diagnostic']={
      title:'张居正十二帧诊断 · 8 FPS（未验证左右换脚，不用于正式）',
      slots:{character:{src:null,x:0,y:0,scale:.54,opacity:1,parallax:1,anchorX:250/420,anchorY:420/448,
        frames:{count:12,sources:Array.from({length:12},(_,i)=>`assets/zhang-walking-twelve/walk_${String(i+1).padStart(2,'0')}.png`),
          fps:8,idle:0,order:Array.from({length:12},(_,i)=>i),align:true,offsets:Array.from({length:12},()=>({x:0,y:0}))}}}
    };
  }
  const walkSet=new URLSearchParams(location.search).get('walkSet');
  config.scenes['zhang-walking-v2-diagnostic']={
    title:'张居正八帧 v2 · 8 FPS诊断（缺少并拢和明确左右换脚）',
    slots:{character:{src:null,x:0,y:0,scale:.46,opacity:1,parallax:1,anchorX:254.3/392,anchorY:436/442,
      // 现有 PNG 已按头肩轴和脚底对齐，不再次逐帧缩放，也不改写原图。
      frames:{count:8,sources:Array.from({length:8},(_,i)=>`assets/zhang-walking-eight-v2/walk_${String(i+1).padStart(2,'0')}.png`),
        fps:8,idle:0,order:[0,1,2,3,4,5,6,7],align:true,offsets:Array.from({length:8},()=>({x:0,y:0}))}}}
  };
  config.scenes['zhang-walking-small-diagnostic']={...config.scenes['zhang-walking'],title:'张居正小步幅八帧 · 8 FPS诊断'};
  const testScene=useOld?'zhang-walking-diagnostic':walkSet==='twelve'?'zhang-walking-twelve-diagnostic':walkSet==='v2'?'zhang-walking-v2-diagnostic':'zhang-walking-small-diagnostic';
  for(const target of ['guanyu','binyang','museum'])config.routes[`zhangjuzheng->${target}`]=testScene;
}

// 完整守将十二帧：只按宾阳楼出发选择，复用原播放器，不使用拆腿部件。
{
  const config=window.WusanTravelConfig;
  // 与 guard-walk-demo 的 anchors.json 一致；baseline-anchor 等价于预览中的逐帧落脚补偿。
  const footAnchors=[418, 419, 420, 420, 420, 420, 410, 413, 414, 415, 414, 413];
  config.scenes['binyang-guard-walking']={title:'山水驿道 · 荆州守将',slots:{character:{
    src:null,x:0,y:0,scale:.8,opacity:1,parallax:1,anchorX:.5,anchorY:420/440,
    frames:{count:12,sources:Array.from({length:12},(_,i)=>`assets/jingzhou-guard-diagnostic/whole-frames/walk_${String(i+1).padStart(2,'0')}.png`),
      fps:8,idle:0,order:Array.from({length:12},(_,i)=>i),align:true,offsets:footAnchors.map(y=>({x:0,y:420-y}))}
  }}};
  for(const target of ['guanyu','zhangjuzheng','museum'])config.routes[`binyang->${target}`]='binyang-guard-walking';
}
