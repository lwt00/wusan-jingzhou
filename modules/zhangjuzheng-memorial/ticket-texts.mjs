// 游戏化拟办意见，非真实历史奏疏；与奏报数值及动画实现分离。
export const TICKET_TEXTS = Object.freeze({
  'assessment-law': Object.freeze([
    '拟：依考成之法，按期核验，严明责罚。',
    '拟：先择要害衙门试行，再议推广。',
    '拟：暂缓考核，俟议定后施行。'
  ]),
  'land-survey': Object.freeze([
    '拟：通令各地清丈田亩，厘正赋役。',
    '拟：先清赋役最重之地，次第推行。',
    '拟：仍令地方自行核报田亩。'
  ]),
  'single-whip': Object.freeze([
    '拟：赋役合并折银，即行全面推行。',
    '拟：分省试行折银之法，酌留缓期。',
    '拟：赋役暂循旧制，毋遽更张。'
  ]),
  'relief': Object.freeze([
    '拟：开仓赈济，灾区赋税暂缓征收。',
    '拟：先核灾情，按灾轻重分别赈缓。',
    '拟：赋税仍照常征解，以济国用。'
  ]),
  'grain-transport': Object.freeze([
    '拟：严核漕粮损耗，整饬仓储船运。',
    '拟：拨银修缮仓运，分年渐次改善。',
    '拟：漕运暂循旧章，毋增扰动。'
  ]),
  'jilong': Object.freeze([
    '拟：先足练兵军饷，以固蓟镇边备。',
    '拟：核定军额，分批整训营伍。',
    '拟：暂缓增饷，先务内政安定。'
  ]),
  'qi-jiguang': Object.freeze([
    '拟：授戚继光整训之权，责成练军。',
    '拟：令戚继光会同旧将，协力整训。',
    '拟：军中仍循旧制，以免将帅失和。'
  ]),
  'court-pressure': Object.freeze([
    '拟：据考成实绩，继续推行政令。',
    '拟：申明新政本意，酌修施行细则。',
    '拟：新政一体从严，不留宽缓之地。'
  ]),
  'mourning': Object.freeze([
    '拟：国事为重，暂留任上续理政务。',
    '拟：依礼归籍守制，政务交群臣协理。',
    '拟：明定留任期限，申明后续安排。'
  ]),
  'legacy': Object.freeze([
    '拟：保全新政章法，循序稳步延续。',
    '拟：集中推行新政，务求速见成效。',
    '拟：暂缓新政，先修复朝野关系。'
  ])
});
export function getTicketText(id, choiceIndex) {
  return TICKET_TEXTS[id]?.[choiceIndex] ?? null;
}
