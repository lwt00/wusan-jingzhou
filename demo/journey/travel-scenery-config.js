/* 所有角色共用的艺术化山水驿道；不是实际地理路线或真实文化地标。 */
window.WusanTravelScenery=(()=>{
  const scenery='assets/travel/scenery/';
  const item=(id,asset,layer,x,y,width,parallax,segment,more={})=>({id,src:scenery+asset+'.png',layer,x,y,width,scale:1,opacity:1,parallax,anchorX:.5,anchorY:1,segment,...more});
  return {
    roadSrc:'assets/travel-temp/road.svg',
    skySrc:scenery+'ink-sky.svg',
    legacyLayerOpacity:{middle:0,foreground:0},
    segments:{forest:{name:'林间古道',start:0,end:.5,fadeOut:.16},water:{name:'溪桥飞瀑',start:.18,end:.86,fadeIn:.15,fadeOut:.16},town:{name:'古亭远城',start:.58,end:1,fadeIn:.18}},
    items:[
      {id:'ridge-mist',src:'assets/fog-band-1.png',layer:'far',x:910,y:520,width:1450,opacity:.11,parallax:.12,anchorX:.5,anchorY:1,motion:{kind:'drift',x:30,y:4,speed:.14,seed:1}},
      item('distant-building','distant-pavilion','far',1650,488,240,.2,'town',{opacity:.3}),
      item('forest-pine','pine','near',480,600,350,.88,'forest',{opacity:.92}),
      item('forest-bamboo','bamboo','near',1020,600,230,1.08,'forest',{opacity:.93,motion:{kind:'sway',angle:.006,speed:.65,seed:1}}),
      item('forest-willow','willow','near',520,748,330,1.18,'forest',{opacity:.93,motion:{kind:'sway',angle:.005,speed:.7,seed:2}}),
      item('forest-rocks','rocks','near',1040,740,150,1.12,'forest'),
      item('forest-bank','rocks','near',380,750,125,1.03,'forest',{opacity:.9}),
      item('waterfall','waterfall','middle',1300,587,540,.58,'water',{opacity:.9}),
      item('stone-bridge','stone-bridge','middle',1720,606,560,.8,'water'),
      item('fall-water-light','waterfall-flow-detail','middle',0,0,132,.58,'water',{opacity:.12,parent:'waterfall',sourceRegion:{x:208,y:79,width:132},motion:{kind:'ripple',y:.9,speed:2.1,seed:1}}),
      item('creek-water-light','creek-flow-detail','middle',0,0,194,.8,'water',{opacity:.1,parent:'stone-bridge',sourceRegion:{x:152,y:157,width:194},motion:{kind:'ripple',x:1.2,speed:1.6,seed:2}}),
      {id:'river-mist',src:'assets/fog-band-1.png',layer:'middle',x:1550,y:625,width:900,opacity:.08,parallax:.62,anchorX:.5,anchorY:1,segment:'water',motion:{kind:'drift',x:25,y:3,speed:.2,seed:4}},
      item('water-bank-reeds','grass','middle',1660,599,160,1.1,'water',{opacity:.95,motion:{kind:'sway',angle:.009,speed:.75,seed:3}}),
      item('water-bank-rocks','rocks','near',1780,765,185,1.22,'water'),
      item('pavilion','pavilion','middle',1780,594,330,.76,'town'),
      item('garden-steps','stone-steps','middle',2200,606,240,.86,'town',{opacity:.93}),
      item('garden-peach','peach-tree','near',1490,600,250,.95,'town',{opacity:.95}),
      item('garden-railing','wood-railing','near',1590,596,380,1.02,'town',{opacity:.93}),
      item('garden-front-grass','dry-grass','near',2230,754,170,1.25,'town',{opacity:.95}),
      item('garden-front-rocks','rocks','near',2750,740,140,1.3,'town'),
      item('willow-edge','willow-fringe','foreground',340,-110,210,1.68,'forest',{opacity:.6,anchorY:0,motion:{kind:'sway',angle:.009,speed:.6,seed:1}}),
      item('bamboo-edge','bamboo-fringe','foreground',1790,-155,320,1.75,'water',{opacity:.57,anchorY:0,motion:{kind:'sway',angle:.013,speed:.8,seed:2}}),
      item('willow-edge-late','willow-fringe','foreground',2830,-110,215,1.85,'town',{opacity:.58,anchorY:0,motion:{kind:'sway',angle:.008,speed:.65,seed:4}})
    ]
  };
})();
