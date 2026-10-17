// 历史背景与游戏策略分离；文案为原创概述，不作为史料引文。
const notes = {
  "assessment-law": {
    "text": "万历元年，张居正推行考成法，以期限、文簿及逐级稽核督促政务办理，着重纠正拖延与责任不明。它不只是惩罚官员，也关乎行政执行。本题三策为情境推演，不对应三份真实奏议。",
    "sources": [
      {
        "title": "《明史》卷二十（数字转录）",
        "url": "https://zh.wikisource.org/zh-hans/明史/卷20"
      }
    ]
  },
  "land-survey": {
    "text": "清丈田亩旨在核实土地与赋税基础，应对隐漏及负担不均。各地清丈的进程并不一致，不能视为一道命令便立即完成。本题将复杂执行过程压缩为三种推进方式，供玩家体验取舍。",
    "sources": [
      {
        "title": "万明《传统国家近代转型的开端：张居正改革新论》（《文史哲》2015年第1期，第12—26页）",
        "url": "https://www.lhp.sdu.edu.cn/__local/E/42/C9/63CC9F534CFD81B3E6AABD59DE2_6CD9C791_481E82.pdf"
      }
    ]
  },
  "single-whip": {
    "text": "一条鞭法在张居正主政前已有地方实践，其内容与实施方式也有地区差异。清丈有助于厘清赋税基础，但两者并非同一措施。本题三策为推演，不表示历史上存在完全一致的全国方案。",
    "sources": [
      {
        "title": "万明《传统国家近代转型的开端：张居正改革新论》（《文史哲》2015年第1期，第12—26页）",
        "url": "https://www.lhp.sdu.edu.cn/__local/E/42/C9/63CC9F534CFD81B3E6AABD59DE2_6CD9C791_481E82.pdf"
      }
    ]
  },
  "relief": {
    "text": "万历初年确有灾荒赈济记录，救灾也是朝廷政务的重要议题。本题不复原某一次具体灾情，而将赈济、缓征与财政支出的取舍化为综合情境；三策及资源变化均为游戏推演，并非史料原文。",
    "sources": [
      {
        "title": "《明史》卷二十（数字转录）",
        "url": "https://zh.wikisource.org/zh-hans/明史/卷20"
      }
    ]
  },
  "jilong": {
    "text": "蓟镇是明代北方重要防区，戚继光在隆庆年间已赴北方任职，并在此经营边备。练兵与军需须相互配合，不能只以投入多少衡量成效。本题为综合军政情境，具体资源增减不代表历史统计。",
    "sources": [
      {
        "title": "中国国家博物馆：“万历十年登州戚氏”军刀",
        "url": "https://www.chnmuseum.cn/zp/zpml/kgfjp/202111/t20211126_252410.shtml"
      }
    ]
  },
  "mourning": {
    "text": "万历五年，张居正父亲去世，引发归籍守制与留任理政的争论。夺情须由皇帝下旨，并非首辅自行决定。本题推演不同处置意见，不把任何一策视为历史人物动机的最终解释。",
    "sources": [
      {
        "title": "故宫博物院：张居正的“奔丧之旅”（研究论文）",
        "url": "https://www.dpm.org.cn/Uploads/File/2020/03/26/u5e7c1dcc25d33.pdf"
      },
      {
        "title": "故宫博物院：票拟",
        "url": "https://www.dpm.org.cn/court/system/236395.html"
      }
    ]
  },
  "legacy": {
    "text": "张居正改革涉及行政、财政与边防等多方面，既有成效，也有代价与争议，不能由一道选择概括。本题是本局的收束，并非历史上的改革终点；治理评价只反映玩家本局的虚构数值。",
    "sources": [
      {
        "title": "万明《传统国家近代转型的开端：张居正改革新论》（《文史哲》2015年第1期，第12—26页）",
        "url": "https://www.lhp.sdu.edu.cn/__local/E/42/C9/63CC9F534CFD81B3E6AABD59DE2_6CD9C791_481E82.pdf"
      }
    ]
  }
};
export const HISTORY_NOTES = Object.freeze(Object.fromEntries(Object.entries(notes).map(([id, note]) => [id, Object.freeze({ text: note.text, sources: Object.freeze(note.sources.map(source => Object.freeze(source))) })])));
