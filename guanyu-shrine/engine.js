/* Pure game rules, shared by the page, the hint worker and verification scripts. */
function createHuarongEngine() {
  const definitions = [
    { id: 'cao', name: '曹操', glyph: '曹操', group: 'cao', w: 2, h: 2, x: 1, y: 0 },
    { id: 'guan', name: '关羽', glyph: '关羽', group: 'horizontal', w: 2, h: 1, x: 1, y: 2 },
    { id: 'zhang', name: '张飞', glyph: '张飞', group: 'vertical', w: 1, h: 2, x: 0, y: 0 },
    { id: 'zhao', name: '赵云', glyph: '赵云', group: 'vertical', w: 1, h: 2, x: 3, y: 0 },
    { id: 'ma', name: '马超', glyph: '马超', group: 'vertical', w: 1, h: 2, x: 0, y: 2 },
    { id: 'huang', name: '黄忠', glyph: '黄忠', group: 'vertical', w: 1, h: 2, x: 3, y: 2 },
    { id: 'pawn1', name: '小卒一', glyph: '卒', group: 'pawn', w: 1, h: 1, x: 1, y: 3 },
    { id: 'pawn2', name: '小卒二', glyph: '卒', group: 'pawn', w: 1, h: 1, x: 2, y: 3 },
    { id: 'pawn3', name: '小卒三', glyph: '卒', group: 'pawn', w: 1, h: 1, x: 0, y: 4 },
    { id: 'pawn4', name: '小卒四', glyph: '卒', group: 'pawn', w: 1, h: 1, x: 3, y: 4 }
  ];
  const directions = { left: [-1, 0], up: [0, -1], down: [0, 1], right: [1, 0] };
  function initial() { return definitions.map(p => p.y * 4 + p.x); }
  function occupancy(state) {
    const grid = Array(20).fill(-1);
    state.forEach((pos, i) => {
      const { w, h } = definitions[i];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) grid[pos + y * 4 + x] = i;
    });
    return grid;
  }
  function canMove(state, index, direction, grid) {
    if (!definitions[index] || !directions[direction]) return false;
    if (index === 0 && state[0] === 13 && direction === 'down') return 'exit';
    const p = definitions[index], [dx, dy] = directions[direction];
    const x = state[index] % 4 + dx, y = Math.floor(state[index] / 4) + dy;
    if (x < 0 || y < 0 || x + p.w > 4 || y + p.h > 5) return false;
    const occupied = grid || occupancy(state);
    for (let yy = y; yy < y + p.h; yy++) for (let xx = x; xx < x + p.w; xx++) {
      const owner = occupied[yy * 4 + xx];
      if (owner !== -1 && owner !== index) return false;
    }
    return true;
  }
  function move(state, index, direction) {
    const valid = canMove(state, index, direction);
    if (!valid) return null;
    const next = state.slice();
    if (valid === 'exit') return { state: next, won: true };
    const [dx, dy] = directions[direction];
    next[index] += dx + dy * 4;
    return { state: next, won: false };
  }
  function key(state) {
    return String.fromCharCode(65 + state[0], 65 + state[1], ...state.slice(2, 6).sort((a, b) => a - b).map(x => 65 + x), ...state.slice(6).sort((a, b) => a - b).map(x => 65 + x));
  }
  function solve(start) {
    const states = [start.slice()], parents = [-1], actions = [null];
    const visited = new Set([key(start)]);
    for (let head = 0; head < states.length; head++) {
      const state = states[head];
      if (state[0] === 13) {
        const path = [{ index: 0, direction: 'down' }];
        for (let cur = head; parents[cur] !== -1; cur = parents[cur]) path.push(actions[cur]);
        return path.reverse();
      }
      const grid = occupancy(state);
      for (let i = 0; i < definitions.length; i++) for (const direction of Object.keys(directions)) {
        if (canMove(state, i, direction, grid) !== true) continue;
        const [dx, dy] = directions[direction], next = state.slice();
        next[i] += dx + dy * 4;
        const encoded = key(next);
        if (visited.has(encoded)) continue;
        visited.add(encoded); states.push(next); parents.push(head); actions.push({ index: i, direction });
      }
    }
    return null;
  }
  function rating(moves, elapsedSeconds) { return moves <= 140 && elapsedSeconds <= 480 ? 3 : moves <= 200 && elapsedSeconds <= 900 ? 2 : 1; }
  return { definitions, directions, initial, occupancy, canMove, move, key, solve, rating };
}
if (typeof module !== 'undefined' && module.exports) module.exports = createHuarongEngine;
