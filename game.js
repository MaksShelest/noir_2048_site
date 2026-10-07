/* Rules reproduced from 3_Game_Specification_Noir_2048.md, §§2.1–2.3. */
(function (root) {
  'use strict';
  function move(board, direction) {
    const next = Array(16).fill(0), movements = [], mergedCells = [];
    let points = 0;
    if (!['left', 'right', 'up', 'down'].includes(direction)) throw new Error('Invalid direction');
    for (let line = 0; line < 4; line++) {
      const indices = Array.from({ length: 4 }, (_, n) => direction === 'left' ? line * 4 + n : direction === 'right' ? line * 4 + 3 - n : direction === 'up' ? n * 4 + line : (3 - n) * 4 + line);
      const tiles = indices.filter(i => board[i]).map(i => ({ from: i, value: board[i] }));
      let target = 0;
      for (let n = 0; n < tiles.length; n++) {
        const tile = tiles[n], to = indices[target++];
        if (n + 1 < tiles.length && tiles[n + 1].value === tile.value) {
          next[to] = tile.value * 2; points += next[to]; mergedCells.push(to);
          movements.push({ from: tile.from, to }, { from: tiles[++n].from, to });
        } else { next[to] = tile.value; movements.push({ from: tile.from, to }); }
      }
    }
    return { board: next, points, movements, mergedCells, changed: next.some((v, i) => v !== board[i]) };
  }
  function canMove(board) {
    if (board.some(v => !v)) return true;
    return board.some((v, i) => (i % 4 < 3 && v === board[i + 1]) || (i < 12 && v === board[i + 4]));
  }
  function spawn(board, random = Math.random, value) {
    const empty = board.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    if (!empty.length) return -1;
    const cell = empty[Math.min(empty.length - 1, Math.floor(random() * empty.length))];
    board[cell] = value || (random() < 0.9 ? 2 : 4);
    return cell;
  }
  function start(random = Math.random) { const board = Array(16).fill(0); spawn(board, random, 2); spawn(board, random, 2); return board; }
  const api = { move, canMove, spawn, start };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NoirGame = api;
})(typeof window !== 'undefined' ? window : globalThis);
