/* 文物内容以荆州博物馆发布、馆方图录和荆州出土资料为主。坐标均为照片归一化坐标。 */
window.CHUYUN_CONFIG={schemaVersion:2,museumName:'荆州博物馆',museumLink:'https://jzmsm.org/',museumShortLink:'jzmsm.org',publicGameBaseUrl:'',qrMode:'qr',sisterGameLink:'../binyanglou-game/binyanglou-game.html',seriesName:'数字楚韵 · 荆州文旅系列',poster:{width:1080,height:1920,quote:'路漫漫其修远兮，吾将上下而求索'}};
window.CHUYUN_DATA={
  tools:[
    {id:'brush',icon:'〰',name:'软毛刷',for:'浮尘'},
    {id:'swab',icon:'◦',name:'棉签',for:'氧化斑'},
    {id:'knife',icon:'／',name:'竹刀',for:'泥土硬结'}
  ],
  mapLandmarks:[
    {id:'jinancheng',name:'纪南城',sub:'郢都故址',x:.31,y:.27},
    {id:'tianxingguan',name:'天星观楚墓群',x:.68,y:.35},
    {id:'fenghuangshan',name:'凤凰山汉墓群',x:.56,y:.61},
    {id:'jingzhou-museum',name:'荆州古城',sub:'荆州博物馆',x:.4,y:.77}
  ],
  underground:{id:'jingzhou-underground',title:'荆州地下',chapters:[
    {id:'jinancheng',title:'纪南城 · 郢都故址',body:'楚国曾长期建都于郢。今天的纪南城遗址，让荆州仍保留着楚都的空间记忆。二十代、四百余年的具体口径待馆方最终确认。',source:'荆州地方公开资料 · [待馆方确认]'},
    {id:'tianxingguan',title:'天星观楚墓群 · 地下宴席',body:'天星观2号墓于2000年发掘，出土遗物1430件。猪形酒具盒与虎座鸟架悬鼓，让贵族的宴饮、礼乐与工艺在地下保存至今。',source:'荆州博物馆《荆州天星观二号楚墓》口径'},
    {id:'fenghuangshan',title:'凤凰山168号汉墓 · 遂先生',body:'墓中竹牍记载墓主人名“遂”，爵位五大夫，下葬于汉文帝前元十三年。告地书像一封交给地下官府的通行文书，与五百余件随葬品共同保存了一段完整人生。',source:'荆州博物馆编《荆州凤凰山一六八号汉墓》'}
  ]},
  nineSongs:{title:'九歌 · 楚声',lines:['暾将出兮东方，','照吾槛兮扶桑；','抚余马兮安驱，','夜皎皎兮既明。','青云衣兮白霓裳，','举长矢兮射天狼。'],signature:'楚韵重生 · 云上荆州博物馆'},
  artifacts:[
    {
      id:'cup',order:1,name:'彩绘变形凤鸟纹漆耳杯',short:'凤鸟纹漆耳杯',era:'西汉',category:'漆木器',image:'assets/images/artifact-cup.jpg',ratio:1024/683,origin:'荆州出土',originStatus:'pending',originStory:'它从荆州地下走来，具体出土地点待馆方核实。',mapSpot:null,finaleChime:'porcelain',echoes:[],
      hallPosition:'50% 48%',observeScale:1.14,observePrompt:'先别急着动手。沿着朱红漆面寻找长尾凤鸟，再看看伸出的杯耳。',
      inspection:[
        {id:'cup-crackle',title:'漆层开片',x:.48,y:.58,finding:'侧光掠过漆面时，细小开片形成断续阴影。',action:'记录范围，采用最小干预的局部加固。'},
        {id:'cup-ear-joint',title:'杯耳连接处',x:.82,y:.57,finding:'杯耳与器身连接处是受力和磨损较集中的部位。',action:'检查结构稳定性，不做无依据补配。'},
        {id:'cup-rim-wear',title:'口沿磨损',x:.45,y:.29,finding:'口沿的色层变化记录了长期使用与埋藏痕迹。',action:'保留可辨识的历史磨损，只做保护性记录。'}
      ],
      dirt:[{type:'dust',tool:'brush',label:'浮尘',x:.36,y:.34,rx:.25,ry:.17},{type:'oxidation',tool:'swab',label:'氧化斑',x:.64,y:.54,rx:.19,ry:.16},{type:'soil',tool:'knife',label:'泥土硬结',x:.43,y:.72,rx:.2,ry:.1}],
      hotspots:[
        {id:'cup-birds',title:'变形凤鸟纹',x:.48,y:.48,scale:2.15,body:'杯内的长尾鸟纹以流动曲线展开。凤鸟经过夸张与变形，成为楚汉漆器中极具生命力的装饰母题。',observe:'沿着鸟首、长颈和回旋尾羽，看看线条如何彼此呼应。',chapter:'凤鸟图腾流变'},
        {id:'cup-ear',title:'耳杯 · 羽觞',x:.83,y:.57,scale:2.2,body:'器口两侧伸出的杯耳便于持握，形似鸟翼，因此耳杯也常被称为“羽觞”，是古代常见的饮食器。',observe:'这张照片中右侧杯耳最清晰，另一侧因拍摄角度被遮住。',chapter:'楚人宴饮'},
        {id:'cup-color',title:'朱里墨外',x:.31,y:.72,scale:2.35,body:'器内朱红、器外深黑，红黑对照既醒目又庄重，是楚秦汉漆器极具辨识度的色彩语言。',observe:'观察口沿处红、黑漆层交界，以及岁月留下的细小磨损。',chapter:'黑红漆色'},
        {id:'cup-cloud',title:'卷云边饰',x:.49,y:.29,scale:2.5,body:'口沿内侧的卷曲线纹把视线引向器内，好像云气在凤鸟周围流动。这里称作卷云边饰，不把其含义作过度推断。',observe:'试着辨认重复纹样的节奏和方向。',chapter:'漆器纹样'}
      ],
      puzzle:{cols:2,rows:2,rotationStep:90,reference:'always',crop:{x:.08,y:.16,w:.88,h:.68}},
      memories:['我曾盛起宴席间的一盏清酿','双耳如翼，被人轻轻托起','凤鸟沿着朱漆飞过两千年','今天，你又看见了我的纹样'],
      quiz:[
        {q:'这件器物为什么又被称为“羽觞”？',opts:['两侧杯耳形似鸟翼','专门盛放羽毛','只有祭司可以使用'],a:0,explain:'耳杯两侧的杯耳便于持握，外形又像展开的鸟翼，因此常被称为羽觞。'},
        {q:'照片中最醒目的色彩关系是什么？',opts:['朱红与黑色','青绿与白色','蓝色与金色'],a:0,explain:'朱里墨外、红黑相映，是楚秦汉漆器常见而鲜明的视觉特征。'}
      ],
      choice:{prompt:'口沿的一段凤鸟纹已经漫漶。你会把缺失线条完整画回去吗？',complete:'补全会让图案更连续，但也加入了今天的推测。',retain:'留白保留了原件与缺损的边界，也把判断权交给未来。'},
      verse:{id:'zhao-hun',text:'瑶浆蜜勺，实羽觞些。',source:'《楚辞·招魂》'},ticketQuote:'双耳如翼，一觞越千年。'
    },
    {
      id:'pigbox',order:2,name:'猪形漆酒具盒',short:'猪形漆酒具盒',era:'战国',category:'漆木器',origin:'天星观2号楚墓',originStatus:'verified',originStory:'两千三百年前，这里是楚国贵族礼乐与宴饮被郑重安放的地方。',mapSpot:{id:'tianxingguan',x:.68,y:.35},finaleChime:'wood',echoes:[{id:'pigbox-cup',requires:'cup',text:'还记得那只耳杯吗？它当年可能就盛放在这样的酒具盒中。'}],image:'assets/images/artifact-pigbox.jpg',ratio:1024/722,
      hallPosition:'50% 48%',observeScale:1.48,observePrompt:'绕着它的轮廓看一圈：猪首、器盖、提环和足部共同组成了一件酒具盒。',
      inspection:[
        {id:'pig-seam',title:'盖身接缝',x:.55,y:.5,finding:'侧光使器盖与盒身的接缝更加清楚，可判断结构是否错位。',action:'先记录形变，再决定是否需要支撑加固。'},
        {id:'pig-rings',title:'铜环捉手',x:.61,y:.28,finding:'金属提环与漆木器接触处存在不同材料相互作用。',action:'分别检查金属与漆层，避免牵拉脆弱部位。'},
        {id:'pig-paint-layer',title:'彩绘表层',x:.69,y:.48,finding:'人物与动物漆画边缘可见色层保存差异。',action:'优先稳定原有彩绘，不补画缺失故事。'}
      ],
      dirt:[{type:'dust',tool:'brush',label:'浮尘',x:.46,y:.32,rx:.25,ry:.16},{type:'oxidation',tool:'swab',label:'氧化斑',x:.68,y:.53,rx:.2,ry:.17},{type:'soil',tool:'knife',label:'泥土硬结',x:.5,y:.72,rx:.24,ry:.12}],
      hotspots:[
        {id:'pig-form',title:'双首连体造型',x:.43,y:.49,scale:2.1,body:'原器两端各塑一兽首，合成双首一身的猪形。照片从一端斜拍，远端兽首被透视关系遮挡。',observe:'注意口鼻、圆眼、上盘的角以及四足。',chapter:'楚漆器造型'},
        {id:'pig-lid',title:'器盖与提环',x:.61,y:.28,scale:2.4,body:'器物由盖与身组成，盖部设有铜环捉手。造型奇特，但每一处结构都服务于开启、盛放和搬运。',observe:'沿着器身中部寻找盖与盒身的接缝。',chapter:'酒具结构'},
        {id:'pig-paint',title:'宴乐与狩猎漆画',x:.69,y:.48,scale:2.45,body:'黑漆地上用红、黄、银灰等色绘龙凤、云气以及宴乐狩猎场景，是认识先秦生活与漆画艺术的重要图像。',observe:'照片右侧可见连续的人物与动物形象。',chapter:'先秦漆画'},
        {id:'pig-function',title:'酒具盒的功能',x:.57,y:.66,scale:2.2,body:'它并不是盛酒的壶，而是收纳酒器的盒。考古出土时，盒内仍放置着数件耳杯。',observe:'把它与上一件耳杯联系起来：文物原本属于一整套生活系统。',chapter:'楚人宴饮'}
      ],
      puzzle:{cols:3,rows:2,rotationStep:90,reference:'always',crop:{x:.27,y:.1,w:.58,h:.76}},
      memories:['我守在一场贵族宴饮的席侧','盒盖之下，耳杯彼此相依','漆画记录着狩猎、鼓乐与舞蹈','地下两千年，宴席仍未真正散去'],
      quiz:[
        {q:'猪形漆酒具盒出土时，盒内装有什么？',opts:['数件耳杯','一套青铜编钟','玉璧与玉环'],a:0,explain:'考古发现显示，盒内装有数件耳杯，说明它承担了收纳酒具的功能。'},
        {q:'它的外壁上可以看到哪类图像？',opts:['宴乐、狩猎与龙凤云气纹','山水楼阁画','佛教人物故事'],a:0,explain:'器物以多色漆绘出龙凤、云气以及宴乐狩猎场景，是先秦漆画珍品。'}
      ],
      choice:{prompt:'漆画中一段人物场景只剩轮廓。你会依据相邻图案把人物全部补出吗？',complete:'完整画面更容易阅读，但未经证实的细节也被写进了文物。',retain:'你保留了可确认的轮廓，没有让想象覆盖原始信息。'},
      verse:{id:'jiu-ge',text:'操余弧兮反沦降，援北斗兮酌桂浆。',source:'《楚辞·九歌》'},ticketQuote:'盛放的不只是酒具，也是楚人的宴饮长卷。'
    },
    {
      id:'drum',order:3,name:'虎座鸟架悬鼓',short:'虎座鸟架悬鼓',era:'战国',category:'漆木器与乐器',origin:'天星观2号楚墓',originStatus:'verified',originStory:'2000年，它与成组礼乐器和漆木器从天星观2号墓重见天日。',mapSpot:{id:'tianxingguan',x:.68,y:.35},finaleChime:'drum',echoes:[{id:'drum-pigbox',requires:'pigbox',text:'酒具记录宴席，悬鼓唤起礼乐——楚人的地下世界仍有声有色。'}],image:'assets/images/artifact-drum.png',ratio:880/1000,
      hallPosition:'50% 48%',observeScale:1.1,observePrompt:'先看整体的力与平衡：伏虎承重、凤鸟昂首，一面大鼓悬在双凤之间。',
      inspection:[
        {id:'drum-suspension',title:'悬鼓连接',x:.5,y:.47,finding:'悬鼓与双凤之间的连接决定鼓体是否稳定。',action:'记录连接状态，禁止在结构未确认前敲击原器。'},
        {id:'drum-bird-legs',title:'凤鸟长足',x:.34,y:.65,finding:'细长鸟足承担上部重量，是结构评估的关键部位。',action:'检查裂隙和旧修痕迹，必要时设计隐蔽支撑。'},
        {id:'drum-tiger-base',title:'伏虎底座',x:.5,y:.83,finding:'伏虎和长方形底座共同形成稳定的承重系统。',action:'确认受力路径，让重量回到底座而非彩绘薄弱处。'}
      ],
      dirt:[{type:'dust',tool:'brush',label:'浮尘',x:.5,y:.24,rx:.28,ry:.16},{type:'oxidation',tool:'swab',label:'漆面附着',x:.31,y:.57,rx:.18,ry:.22},{type:'soil',tool:'knife',label:'底座硬结',x:.52,y:.82,rx:.35,ry:.1}],
      hotspots:[
        {id:'drum-birds',title:'双凤昂首',x:.25,y:.43,scale:2.15,body:'两只凤鸟背向而立、引颈高鸣。荆州博物馆的讲解将其与凤鸣清越、声音远闻的想象联系起来。',observe:'比较左右凤鸟的长颈、鸟喙与羽翼彩绘。',chapter:'楚人崇凤'},
        {id:'drum-tigers',title:'伏虎为座',x:.25,y:.78,scale:2.45,body:'细长鸟足难以独自承受击鼓力量，卧虎底座使鼓架更加稳固、平衡。造型想象与工程结构在这里结合。',observe:'注意虎身低伏、四肢前伸形成的稳定三角关系。',chapter:'器物结构'},
        {id:'drum-face',title:'居中悬鼓',x:.5,y:.28,scale:2.15,body:'大鼓悬于双凤之间，是整件器物的声音核心。虎座鸟架悬鼓常见于楚国贵族墓葬，是礼乐文化的重要见证。',observe:'鼓框仍能看到连续彩绘，鼓面则保留了材料老化的真实质感。',chapter:'楚地礼乐'},
        {id:'drum-colors',title:'黑漆与多色彩绘',x:.65,y:.6,scale:2.55,body:'器身以黑漆为主要底色，并用红、黄等色表现羽毛、卷云和动物细节，形成庄重而绚丽的视觉效果。',observe:'顺着凤身羽纹寻找红、黄线条在黑漆上的层次。',chapter:'黑红金美学'}
      ],
      puzzle:{cols:3,rows:2,rotationStep:45,reference:'fade',crop:{x:.04,y:.03,w:.92,h:.94}},
      memories:['我曾在郢都的宴乐上敲响','战火映红过我的凤羽','我在地下沉睡了两千三百年','今夜，请你让我重新歌唱'],
      quiz:[
        {q:'卧虎作为鼓架底座，首先解决了什么问题？',opts:['承重、稳固与平衡','让鼓自动发声','方便把鼓漂在水上'],a:0,explain:'馆方介绍指出，细长鸟足不利于承受击打力量，伏虎底座让鼓架更加稳固和平衡。'},
        {q:'这件器物的结构关系是什么？',opts:['伏虎为座、凤鸟为架、中央悬鼓','神木为柱、玉璧为鼓','单虎负鼓、无凤鸟'],a:0,explain:'两只伏虎构成底座，凤鸟立于虎背，大鼓悬于背向而立的双凤之间。'},
        {q:'照片中主要呈现怎样的色彩关系？',opts:['黑漆地配红黄等彩绘','通体白釉','蓝绿色玻璃'],a:0,explain:'黑漆与红、黄等彩绘形成强烈而庄重的对照。'}
      ],
      choice:{prompt:'鼓框的一段彩绘已经缺失。你会仿照另一侧把纹样完整补上吗？',complete:'画面恢复对称，但新增部分来自推测，需要被明确标识。',retain:'你保留了缺损边界，让原作、岁月和当代修复彼此可辨。'},
      verse:{id:'li-sao',text:'路漫漫其修远兮，吾将上下而求索。',source:'《楚辞·离骚》'},ticketQuote:'凤鸣清越，鼓声宏远。今夜，楚韵重生。'
    }
  ]
};
