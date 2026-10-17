(()=>{
  // 唯一文字来源：展示与典故共同读取，动画参数独立保留。
  const culture={
    guanyu:{entries:[{kind:'诗词节选',lines:['将军禀天姿，','义勇冠今昔。','走马百战场，','一剑万人敌。'],author:'唐·郎士元',title:'《关羽祠送高员外还荆州》',source:'https://zh.wikisource.org/zh-hans/關羽祠送高員外還荆州',interpretation:'诗句赞颂关羽的勇武与忠义形象，体现后世文人对关羽的敬仰。'}]},
    binyang:{entries:[{kind:'诗词节选',lines:['欲问兴亡意，','重城自古坚。'],author:'宋·苏轼',title:'《荆州十首·其一》',source:'https://zh.wikisource.org/zh-hans/荊州十首',interpretation:'借荆州古城的坚固城垣，引出对历史兴亡的思考。'},
      {kind:'诗词节选',lines:['海上生明月，','天涯共此时。'],author:'唐·张九龄',title:'《望月怀远》',source:'https://cd.edb.gov.hk/chi/resource/ncs/download/js_list/JS_wangyuehuaiyuan.pdf',interpretation:'以共望明月寄托对远方亲友的思念。',background:'张九龄曾任荆州长史。有观点认为《望月怀远》可能作于其荆州任职时期，写作时间与地点并无定论；这不是专门描写宾阳楼的诗作。',backgroundSource:'https://www.gdwsw.gov.cn/wsbl/content/post_40476.html'}]},
    zhangjuzheng:{entries:[{kind:'楹联',lines:['一人而为帝王师，','双肩能担天下事。'],author:'',title:'张居正故居·太岳堂楹联',source:'https://news.hubeidaily.net/mobile/c_3088588.html',interpretation:'楹联赞颂张居正身为帝王之师，辅佐君王，以一身担当起治理天下的重任。',backgroundLabel:'典故背景',background:'张居正，号太岳，荆州江陵人，明代内阁首辅、著名改革家。出身江陵，年少苦读，入朝堂主持万历新政，推行考成法、一条鞭法，整顿吏治、改革税制，是明代影响深远的改革名臣。本联陈列于故居太岳堂，为后人题写，用以纪念他为国革新、勇担重任的一生。'}]}
  };
  for(const c of Object.values(culture))for(const entry of c.entries)Object.defineProperty(entry,'credit',{enumerable:true,get(){return `——${this.author.replace(/^(唐|宋)·/,'')}${this.title}`;}});
/* 独立地标展示配置：建筑近景、文化文案、典故与小游戏插槽。前三站共享正式文化文字；博物馆资料待补充。 */
window.WusanLandmarkConfig={
  visuals:{cloudSrc:'assets/fog-dense-1.png',loadTimeout:4000,pushScale:1.025},
  landmarks:{
    guanyu:{name:'关羽祠',map:{image:'assets/guanyu-layer.png',width:345,stand:{u:.5,v:.88}},image:'assets/landmarks-v2/originals/guanyu.png',imageLabel:'团队提供水墨建筑插画 · 艺术化展示',display:{maxWidth:1376,fullScene:true,layout:'courtyard',pushScale:1.015,imagePosition:'50% 46%'},
      culturalTitle:'忠义千秋',theme:'在祠宇之前，开启一段关于忠义文化的探索。',

      game:{id:'guanyu-huarong',enabled:true,mode:'real'}},
    binyang:{name:'宾阳楼',map:{image:'assets/binyang-layer.png',width:315,stand:{u:.452,v:.91}},image:'assets/landmarks-v2/originals/binyang.jpg',imageLabel:'团队提供水墨建筑插画 · 艺术化展示',display:{maxWidth:1280,fullScene:true,layout:'courtyard',pushScale:1.015,imagePosition:'50% 48%'},
      culturalTitle:'古城风华',theme:'观察城楼的轮廓，寻找古城文化的线索。',
      poetryCycle:{holdSeconds:6,fadeSeconds:1,initialDelay:.6,opacity:.94,floatAmplitude:6,floatSeconds:8,anchor:{u:.5,v:.66},
        groups:culture.binyang.entries},
      game:{id:'mock-binyang',enabled:true,mode:'mock'}},
    zhangjuzheng:{name:'张居正故居',map:{statue:{image:'assets/landmarks-v2/zhang-statue.png',u:.49,v:.57,height:76}},image:'assets/landmarks-v2/originals/zhang-courtyard.png',imageLabel:'团队提供完整庭院水墨插画 · 艺术化展示',display:{maxWidth:1376,fullScene:true,layout:'courtyard',pushScale:1.015},
      culturalTitle:'革新之志',theme:'走近庭院，预备一段关于责任与革新的文化探索。',
      game:{id:'zhangjuzheng-memorial',enabled:true,mode:'real'}},
    museum:{name:'荆州博物馆',map:{image:'assets/museum-layer.png',width:350,stand:{u:.58,v:.695}},image:'assets/landmarks-v2/originals/museum.png',imageLabel:'团队提供馆舍水墨插画 · 艺术化展示',display:{maxWidth:1376,fullScene:true,layout:'courtyard',pushScale:1.015,imagePosition:'50% 50%'},
      culturalTitle:'荆楚遗韵',theme:'从城市记忆出发，预备一段关于文化传承的探索。',
      inscription:{title:'楚韵千秋',kind:'原创文化题词',lines:['千年楚韵藏珍器','一脉文华续古今']},
      anecdote:{title:'荆楚遗珍 · 文明传承',text:'江汉之间，楚风绵延。\n\n青铜凝铸古人的智慧，\n丝帛织就楚地的华彩，\n漆器承载浪漫的想象。\n\n一件件历史文物，\n诉说着荆楚大地的千年故事。\n\n走进荆州博物馆，\n循着文物留下的印记，\n探寻楚文化的独特魅力。'},
      game:{id:'mock-museum',enabled:true,mode:'mock'}}
  }
};

  for(const [id,data]of Object.entries(culture)){
    const c=window.WusanLandmarkConfig.landmarks[id];c.culture=data;c.poetry=data.entries[0];c.poem=data.entries[0].lines.join('');
  }
})();
