export const MEMORIALS = [
  {
    id: 'assessment-law',
    era: '万历元年 · 考成法',
    title: '百官考成',
    scene: '考成章程呈至案前，如何拟议，待你权衡。',
    context: '考成章程呈至案前。有人主张严核期限，以整饬积弊；也有人担心官员只顾期限，忽略实效。你将拟定意见，呈请裁定。',
    choices: [
      { label: '按期核验，层层追责', delta: { treasury: 4, people: -3, defense: 5 }, note: '考成法以考核政绩、追究稽迟为要点。这里将“按期”转化为游戏中的执行力。' },
      { label: '先试行于要害衙门', delta: { treasury: 1, people: 3, defense: 1 }, note: '先行试点能降低改革阻力，但见效较慢。这是本关的游戏化权衡。' },
      { label: '暂缓考核，安抚群臣', delta: { treasury: -5, people: 2, defense: -2 }, note: '缓和眼前冲突，却可能让积弊继续累积。' }
    ]
  },
  {
    id: 'land-survey',
    era: '万历年间 · 清丈田亩',
    title: '田亩清丈',
    scene: '清丈奏议摆在案上，如何推进，待你拟议。',
    context: '各地隐漏田亩的奏报送到内阁。核实田亩有助于厘清赋税基础，也涉及地方利益与执行负担。你将权衡推进方式，拟呈御览。',
    choices: [
      { label: '全国一体清丈', delta: { treasury: 8, people: -7, defense: 0 }, note: '清丈田亩旨在厘清赋役基础。全面推进会带来短期摩擦，这是游戏化结果。' },
      { label: '先从赋役最重处着手', delta: { treasury: 4, people: 2, defense: -1 }, note: '优先处理矛盾集中的地方，可以减少骤然冲击。' },
      { label: '听任地方自行核报', delta: { treasury: -4, people: 1, defense: 0 }, note: '给地方更大余地，也可能让隐漏继续存在。' }
    ]
  },
  {
    id: 'single-whip',
    era: '万历年间 · 一条鞭法',
    title: '税役合一',
    scene: '赋役改革奏议送到，推行快慢，待你拟议。',
    context: '一条鞭法已有地方实践，张居正主政期间推进相关改革。奏议拟合并赋役征收名目，采用折银等办法，并非所有税粮一律改征银两。如何推进，待你拟议。',
    choices: [
      { label: '立即全面推行', delta: { treasury: 8, people: -8, defense: 0 }, note: '一条鞭法常被概括为赋役合一、折银征收。不同地区的执行条件并不相同。' },
      { label: '分省试行，留出缓冲', delta: { treasury: 4, people: 3, defense: -1 }, note: '试点是本关设计的稳健选项，不等同于历史中的唯一答案。' },
      { label: '维持旧制不变', delta: { treasury: -5, people: 2, defense: 0 }, note: '旧制减少改革冲突，却难以解决名目繁多、征收不一的问题。' }
    ]
  },
  {
    id: 'relief',
    era: '万历年间 · 灾年奏报',
    title: '灾年缓征',
    scene: '地方报灾，请求开仓赈济与缓征赋税。',
    context: '地方报灾，请求开仓赈济与缓征赋税。本题为综合情境：救灾所需与朝廷财用相互牵连，如何拟办，待你权衡。',
    choices: [
      { label: '开仓赈济，灾区缓征', delta: { treasury: -7, people: 10, defense: -2 }, note: '赈济能缓解灾民压力，但会压缩当年可用财力。' },
      { label: '核实灾情后分级处理', delta: { treasury: -2, people: 5, defense: 0 }, note: '核实与分级是治理灾情的折中方案，游戏中表现为较小的财政代价。' },
      { label: '照常征解，确保国用', delta: { treasury: 6, people: -10, defense: 1 }, note: '保持收入却会加重灾区负担，民心因此下降。' }
    ]
  },
  {
    id: 'grain-transport',
    era: '万历三年 · 漕运',
    title: '漕运整饬',
    scene: '漕粮屡有损耗，户部请你重整仓运。',
    context: '漕粮转运屡有损耗，户部请整顿仓储和船运。军饷、京师供应与地方负担彼此牵连。',
    choices: [
      { label: '严查损耗，重整仓运', delta: { treasury: 5, people: -3, defense: 4 }, note: '整饬漕运可减少中间损耗，但执行过程会增加地方压力。' },
      { label: '拨款修缮，逐年改善', delta: { treasury: -4, people: 1, defense: 5 }, note: '先投入基础维护，再换取较稳定的运输能力。' },
      { label: '维持旧章，避免扰动', delta: { treasury: -4, people: 2, defense: -4 }, note: '不改革会保留眼前平静，却让损耗和军需风险继续存在。' }
    ]
  },
  {
    id: 'jilong',
    era: '万历年间 · 边防',
    title: '蓟镇练兵',
    scene: '边镇请增军饷、整训营伍，户部请核支出。',
    context: '本题综合蓟镇军政议题：边镇请增拨军饷、整训营伍，户部请核支出。你需权衡军备与财用，拟定意见，呈请裁定。',
    choices: [
      { label: '优先保障练兵军饷', delta: { treasury: -8, people: -1, defense: 12 }, note: '边防投入可提升军备，但财政支出会即时增加。' },
      { label: '核定军额，分批整训', delta: { treasury: -3, people: 0, defense: 7 }, note: '分批整训降低一次性支出，是本关的平衡选项。' },
      { label: '暂缓增饷，先稳内政', delta: { treasury: 4, people: 1, defense: -10 }, note: '节省当前支出，却会让边防承受更大风险。' }
    ]
  },
  {
    id: 'qi-jiguang',
    era: '万历三年 · 将才',
    title: '任用戚继光',
    scene: '边臣举荐戚继光，整训北军的奏折已到。',
    context: '边臣举荐戚继光整训北军。任用名将需要制度、军饷，也会引起部分旧将的疑虑。',
    choices: [
      { label: '授以整训之权', delta: { treasury: -4, people: 0, defense: 10 }, note: '戚继光以练兵、治军见长。这里将任用与投入绑定，属于游戏化推演。' },
      { label: '与旧将共同整训', delta: { treasury: -2, people: 3, defense: 6 }, note: '兼顾协作与改革，推进速度会比单独授权慢。' },
      { label: '不改旧制，以免失和', delta: { treasury: 2, people: 1, defense: -7 }, note: '维持旧有关系，却放弃了调整军政的机会。' }
    ]
  },
  {
    id: 'court-pressure',
    era: '万历四年 · 朝议',
    title: '改革与群议',
    scene: '朝中一半主张宜宽，一半主张宜严。',
    context: '改革触及旧有利益，朝中出现“宜宽”和“宜严”两种声音。你需要决定如何守住改革的节奏。',
    choices: [
      { label: '据考成结果推进', delta: { treasury: 4, people: -5, defense: 3 }, note: '以考核结果作为推进依据，能保持政策连续性，也会加剧部分反弹。' },
      { label: '公开解释，调整细则', delta: { treasury: 1, people: 6, defense: 0 }, note: '解释与调整有助于提高接受度，但改革收益会放慢。' },
      { label: '全面收紧，不留余地', delta: { treasury: 7, people: -10, defense: 2 }, note: '强力推进可能见效快，也可能造成更大社会压力。' }
    ]
  },
  {
    id: 'mourning',
    era: '万历五年 · 夺情',
    title: '夺情与守制',
    scene: '国事与守制相交，如何陈请，待你拟议。',
    context: '张居正父亲去世，依礼面临归籍守制。皇帝欲留其继续理政，朝中产生礼制与政治争议。是否夺情由皇帝决定；以下三策为拟议安排的情境推演，并非首辅自行裁决。',
    choices: [
      { label: '以国事为重，暂留任上', delta: { treasury: 4, people: -7, defense: 5 }, note: '夺情是重要历史议题。游戏只呈现冲突，不替历史人物作简单评判。' },
      { label: '守制为先，交由群臣协理', delta: { treasury: -4, people: 8, defense: -5 }, note: '遵守礼制可以缓解部分舆论压力，但政策连续性会受影响。' },
      { label: '限定期限，公开交代安排', delta: { treasury: 1, people: 3, defense: 1 }, note: '在责任与礼制之间设置边界，是本关的平衡型选择。' }
    ]
  },
  {
    id: 'legacy',
    era: '本局终折 · 新政取舍',
    title: '新政取舍',
    scene: '最后一折展开，改革要留下怎样的章法？',
    context: '本局奏报来到最后一页。改革留下了成效，也留下了争议。你要以最后一道票拟表达怎样的治理原则？这是游戏的收束，并非历史上改革的终结。',
    choices: [
      { label: '保住制度，稳步延续', delta: { treasury: 2, people: 2, defense: 2 }, note: '稳定制度、留出调整空间，是本局的收束选择。' },
      { label: '加速见效，集中推行', delta: { treasury: 6, people: -5, defense: 4 }, note: '集中推行可能带来更快的短期收益，也增加社会承压。' },
      { label: '暂缓新政，先修复关系', delta: { treasury: -3, people: 6, defense: -2 }, note: '修复关系可以缓和矛盾，但改革成果可能失去连续性。' }
    ]
  }
];
