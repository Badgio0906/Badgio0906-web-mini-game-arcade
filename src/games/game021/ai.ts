import { COLS, ROWS, FourBoard, other, type Cell, type Difficulty, type Player } from './model';
export interface SearchOptions { random?: () => number; now?: () => number; milliseconds?: number; nodeLimit?: number }
const order = [3, 2, 4, 1, 5, 0, 6];
function immediate(board: FourBoard, side: Player): number[] {
  return board.legalColumns().filter(col => { const trial = board.clone(); trial.turn = side; trial.drop(col); return trial.wins.length > 0; });
}
function evaluate(cells: readonly Cell[], side: Player): number {
  let value = 0;
  for (let row = 0; row < ROWS; row++) {
    value += cells[row * COLS + 3] === side ? 5 : cells[row * COLS + 3] === other(side) ? -5 : 0;
    for (let col = 0; col < COLS; col++) for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) {
      const x = col + dx * 3, y = row + dy * 3;
      if (x < 0 || x >= COLS || y >= ROWS) continue;
      let ours = 0, theirs = 0;
      for (let n = 0; n < 4; n++) { const cell = cells[(row + n * dy) * COLS + col + n * dx]; if (cell === side) ours++; if (cell === other(side)) theirs++; }
      if (!theirs) value += [0, 1, 8, 45, 10000][ours];
      if (!ours) value -= [0, 1, 9, 55, 10000][theirs];
    }
  }
  return value;
}

/** All levels take a win or block an immediate defeat. Exploration is bounded. */
export function chooseMove(board: FourBoard, difficulty: Difficulty, options: SearchOptions = {}): number | null {
  const legal = board.legalColumns(); if (!legal.length) return null;
  const random = options.random ?? Math.random;
  const pick = (cols: number[]) => cols[Math.min(cols.length - 1, Math.max(0, Math.floor(random() * cols.length)))];
  const wins = immediate(board, board.turn); if (wins.length) return pick(wins);
  const threats = immediate(board, other(board.turn)); if (threats.length) return pick(threats);
  if (difficulty === 'easy') return pick(legal);
  const now = options.now ?? (() => performance.now()), deadline = now() + (options.milliseconds ?? (difficulty === 'strong' ? 350 : 100));
  const nodeLimit = options.nodeLimit ?? (difficulty === 'strong' ? 18000 : 3000);
  const side = board.turn;
  let nodes = 0, expired = false;
  const search = (position: FourBoard, depth: number, alpha: number, beta: number): number => {
    nodes++;
    if (nodes > nodeLimit || now() >= deadline) { expired = true; return evaluate(position.cells, side); }
    if (position.result !== 'playing') return position.result === 'draw' ? 0 : (position.result === (side === 1 ? 'green' : 'amber') ? 100000 + depth : -100000 - depth);
    if (!depth) return evaluate(position.cells, side);
    const maximize = position.turn === side;
    let best = maximize ? -Infinity : Infinity;
    for (const col of order) {
      if (position.landing(col) === null) continue;
      const next = position.clone(); next.drop(col);
      const score = search(next, depth - 1, alpha, beta);
      best = maximize ? Math.max(best, score) : Math.min(best, score);
      if (maximize) alpha = Math.max(alpha, best); else beta = Math.min(beta, best);
      if (beta <= alpha || expired) break;
    }
    return best;
  };
  // Complete iterations only; fallback is always a legal central column.
  let chosen = order.find(col => legal.includes(col))!;
  for (let depth = 1; depth <= (difficulty === 'strong' ? 6 : 3); depth++) {
    let best = -Infinity, candidate = chosen;
    for (const col of order) {
      if (!legal.includes(col)) continue;
      const next = board.clone(); next.drop(col);
      const score = search(next, depth - 1, -Infinity, Infinity);
      if (expired) break;
      if (score > best) { best = score; candidate = col; }
    }
    if (expired) break;
    chosen = candidate;
  }
  return chosen;
}
