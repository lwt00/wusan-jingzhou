/* 独立地标展示配置：建筑近景、文化文案、典故与小游戏插槽。所有诗词/典故当前为占位。 */
window.WusanLandmarkConfig={
  visuals:{cloudSrc:'assets/fog-dense-1.png',loadTimeout:4000,pushScale:1.025},
  landmarks:{
    guanyu:{name:'关羽祠',map:{image:'assets/guanyu-layer.png',width:345,stand:{u:.5,v:.88}},image:'assets/landmarks-v2/originals/guanyu.png',imageLabel:'团队提供水墨建筑插画 · 艺术化展示',display:{maxWidth:1376,fullScene:true,layout:'courtyard',pushScale:1.015,imagePosition:'50% 46%'},
      culturalTitle:'忠义千秋',theme:'在祠宇之前，开启一段关于忠义文化的探索。',
      poem:'诗词与典故资料待核实补充（占位）',
      anecdote:{title:'忠义文化 · 资料占位',text:'此处暂以三国忠义文化作为展示主题。正式诗词、史实与资料来源尚待整理，当前不引用作者、年代或具体历史典故。'},
      game:{id:'guanyu-huarong',enabled:true,mode:'real'}},
    binyang:{name:'宾阳楼',map:{image:'assets/binyang-layer.png',width:315,stand:{u:.452,v:.91}},image:'assets/landmarks-v2/originals/binyang.jpg',imageLabel:'团队提供水墨建筑插画 · 艺术化展示',display:{maxWidth:1280,fullScene:true,layout:'courtyard',pushScale:1.015,imagePosition:'50% 48%'},
      culturalTitle:'古城风华',theme:'观察城楼的轮廓，寻找古城文化的线索。',
      poem:'诗词与典故资料待核实补充（占位）',
      anecdote:{title:'古城文化 · 资料占位',text:'此处暂以荆州古城文化作为展示主题。建筑历史、诗词与典故资料尚待核实，当前只展示主题引导，不作为具体史实介绍。'},
      game:{id:'mock-binyang',enabled:true,mode:'mock'}},
    zhangjuzheng:{name:'张居正故居',map:{statue:{image:'assets/landmarks-v2/zhang-statue.png',u:.49,v:.57,height:76}},image:'assets/landmarks-v2/originals/zhang-courtyard.png',imageLabel:'团队提供完整庭院水墨插画 · 艺术化展示',display:{maxWidth:1376,fullScene:true,layout:'courtyard',pushScale:1.015},
      culturalTitle:'革新之志',theme:'走近庭院，预备一段关于责任与革新的文化探索。',
      poem:'诗词与典故资料待核实补充（占位）',
      anecdote:{title:'责任与革新 · 资料占位',text:'此处暂以历史人物与改革精神作为展示主题。正式人物经历、典故及引用来源尚待整理，当前不编写未经核实的事件或诗词。'},
      game:{id:'mock-zhangjuzheng',enabled:true,mode:'mock'}},
    museum:{name:'荆州博物馆',map:{image:'assets/museum-layer.png',width:350,stand:{u:.58,v:.695}},image:'assets/landmarks-v2/originals/museum.png',imageLabel:'团队提供馆舍水墨插画 · 艺术化展示',display:{maxWidth:1376,fullScene:true,layout:'courtyard',pushScale:1.015,imagePosition:'50% 50%'},
      culturalTitle:'荆楚遗韵',theme:'从城市记忆出发，预备一段关于文化传承的探索。',
      poem:'诗词与典故资料待核实补充（占位）',
      anecdote:{title:'文明传承 · 资料占位',text:'此处暂以荆楚文化与文明传承作为展示主题。具体馆藏、文物介绍和相关典故尚待可靠资料核实，当前不展示虚构馆藏或史实。'},
      game:{id:'mock-museum',enabled:true,mode:'mock'}}
  }
};
