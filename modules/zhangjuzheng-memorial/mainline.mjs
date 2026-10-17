import { MEMORIALS } from './memorials.mjs';

export const MAINLINE_IDS = Object.freeze([
  'assessment-law',
  'land-survey',
  'single-whip',
  'relief',
  'jilong',
  'mourning',
  'legacy'
]);

if (new Set(MAINLINE_IDS).size !== MAINLINE_IDS.length) throw new Error('主线奏报ID重复');
const byId = new Map(MEMORIALS.map(memorial => [memorial.id, memorial]));
export const MAINLINE_MEMORIALS = Object.freeze(MAINLINE_IDS.map(id => {
  const memorial = byId.get(id);
  if (!memorial) throw new Error(`找不到主线奏报：${id}`);
  return memorial;
}));
