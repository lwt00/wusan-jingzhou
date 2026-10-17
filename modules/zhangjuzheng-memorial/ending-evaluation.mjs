import { isVictory } from './state.mjs';

export const ENDING_NOTICE = '本评价依据本局虚构数值生成，不代表对张居正本人或真实历史的定论。';
const ENDINGS = Object.freeze({
  good: Object.freeze({ name: '经世善治', copy: '七折既毕，财赋、民生与边备相互支撑，改革留下了继续施行的余地。经世济民，既须整顿积弊，也须顾及百姓承受。你的票拟在多重取舍之间，守住了较为均衡的局面。' }),
  strength: Object.freeze({ name: '富国强兵', copy: '七折既毕，财政与边防成为本轮治理的相对重心。整顿财赋、筹措军需，为推行政务积蓄了力量；与此同时，改革的代价仍需体察。国用与边备之外，民生同样关乎长远。' }),
  people: Object.freeze({ name: '体恤民生', copy: '七折既毕，你的取舍较多顾及民生承受与改革接受。赈缓、协理与调整，为政令施行留下了缓冲；财政与边防的后续经营，仍不可松懈。体恤百姓，也需要使善意获得长久支撑。' }),
  difficult: Object.freeze({ name: '改革维艰', copy: '七折既毕，部分治理资源承压，或整体余力仍显不足。财政整顿、边防筹措与民生照顾，难以处处兼得。这次票拟留下了一道值得再问的问题：下一回，你愿先补足哪一处短板？' })
});

const RULES = Object.freeze({
  7: Object.freeze({ minimumSum: 175, goodSum: 185 }),
  10: Object.freeze({ minimumSum: 180, goodSum: 195 })
});

// Select rules by the explicit run length, never by resource values.
// No score or resource is written back to the supplied state.
export function evaluateEnding(state) {
  const rules = RULES[state?.totalMemorials];
  if (!rules || !Number.isInteger(state.totalMemorials) || state.phase !== 'won' || state.memorialIndex !== state.totalMemorials) return null;
  const values = ['treasury', 'people', 'defense'].map(key => state.resources?.[key]);
  if (values.some(value => !Number.isFinite(value) || value < 0 || value > 100) || !isVictory(state)) return null;
  const [t, p, d] = values;
  const sum = t + p + d, minimum = Math.min(t, p, d);
  let id, reason;
  if (minimum < 40 || sum < rules.minimumSum) {
    id = 'difficult';
    const shortages = [['国库', t], ['民心', p], ['边防', d]].filter(([, value]) => value < 40).map(([label, value]) => `${label}${value}，低于40`);
    if (sum < rules.minimumSum) shortages.push(`三项合计${sum}，不足${rules.minimumSum}`);
    reason = shortages.join('；') + '。';
  } else if (minimum >= 55 && sum >= rules.goodSum) {
    id = 'good';
    reason = `三项资源均不低于55（最低${minimum}），合计${sum}，达到${rules.goodSum}的综合标准。`;
  } else if (2 * p >= t + d) {
    id = 'people';
    reason = `三项最低${minimum}、合计${sum}，守住40与${rules.minimumSum}的底线；未同时达到善治标准。民心${p}不低于国库与边防的平均值${(t + d) / 2}，呈现民生侧重。`;
  } else {
    id = 'strength';
    reason = `三项最低${minimum}、合计${sum}，守住40与${rules.minimumSum}的底线；未同时达到善治标准。国库与边防的平均值${(t + d) / 2}高于民心${p}，呈现财政与边备侧重。`;
  }
  const ending = ENDINGS[id];
  const copy = state.totalMemorials === 7 ? ending.copy : ending.copy.replace('七折既毕', '十折既毕');
  return Object.freeze({ id, ...ending, copy, reason });
}
