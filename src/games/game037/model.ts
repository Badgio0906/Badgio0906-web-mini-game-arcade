// Game037 BENTO BOX — pure rules model. No DOM, storage, audio or timers here.
// Every input path (drag, tap, keyboard) goes through `act` so placement,
// rotation, removal, clock and score stay in one place.
//
// Rules v2: the box grows 4×4 → 5×5 → 6×6 → 7×7 → 8×8, six bentos each (30).
// The 4×4 set keeps the six fixed tetromino stages; larger boxes use dishes
// of 4–8 cells cut from a seeded random tiling, so every stage is solvable.

export const MIN_BOARD = 4;
export const MAX_BOARD = 8;
export const BOARD_SIZES: readonly number[] = [4, 5, 6, 7, 8];
export const STAGES_PER_SIZE = 6;
export const STAGE_MAX_SCORE = 1000;
export const MAX_PIECES = 10;

export type Cell = readonly [number, number];
export type Rotation = 0 | 1 | 2 | 3;
export type FoodKey = 'tamago' | 'onigiri' | 'ebi' | 'tako' | 'karaage' | 'broccoli' | 'tomato' | 'salmon' | 'edamame' | 'hamburg';

export const FOOD_KEYS: readonly FoodKey[] = ['tamago', 'onigiri', 'ebi', 'tako', 'karaage', 'broccoli', 'tomato', 'salmon', 'edamame', 'hamburg'];

export const FOODS: Readonly<Record<FoodKey, {ja: string; en: string}>> = {
  tamago: {ja: '卵焼き', en: 'tamagoyaki'},
  onigiri: {ja: 'おにぎり', en: 'onigiri'},
  ebi: {ja: '海老フライ', en: 'ebi fry'},
  tako: {ja: 'ウインナー', en: 'wiener'},
  karaage: {ja: 'からあげ', en: 'karaage'},
  broccoli: {ja: 'ブロッコリー', en: 'broccoli'},
  tomato: {ja: 'プチトマト', en: 'cherry tomato'},
  salmon: {ja: '焼き鮭', en: 'grilled salmon'},
  edamame: {ja: '枝豆', en: 'edamame'},
  hamburg: {ja: 'ハンバーグ', en: 'hamburg steak'},
};

// ---------------------------------------------------------------- geometry

/** Sort by row then column and translate so the minimum x/y is zero. */
export function normalize(cells: readonly Cell[]): Cell[] {
  const minX = Math.min(...cells.map(c => c[0]));
  const minY = Math.min(...cells.map(c => c[1]));
  return cells
    .map(([x, y]) => [x - minX, y - minY] as Cell)
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

/** One clockwise quarter turn in screen coordinates (y down), then normalized. */
export function rotateCW(cells: readonly Cell[]): Cell[] {
  return normalize(cells.map(([x, y]) => [-y, x] as Cell));
}

export function rotateCells(cells: readonly Cell[], rotation: number): Cell[] {
  let c = normalize(cells);
  for (let i = 0; i < ((rotation % 4) + 4) % 4; i++) c = rotateCW(c);
  return c;
}

export function cellBounds(cells: readonly Cell[]): {w: number; h: number} {
  return {w: Math.max(...cells.map(c => c[0])) + 1, h: Math.max(...cells.map(c => c[1])) + 1};
}

/** Rotation-invariant key: identical dishes are interchangeable for the solver. */
export function shapeKey(cells: readonly Cell[]): string {
  return [0, 1, 2, 3].map(r => JSON.stringify(rotateCells(cells, r))).sort()[0];
}

// ---------------------------------------------------------------- stages

export interface PieceDef {readonly id: string; readonly food: FoodKey; readonly cells: readonly Cell[]}
export interface SolvedPlacement {id: string; rotation: Rotation; x: number; y: number}
export interface Stage {readonly size: number; readonly pieces: readonly PieceDef[]; readonly solution: readonly SolvedPlacement[]}

/** The original fixed 4×4 tetrominoes (rotation 0 local cells). */
export const SHAPES: Readonly<Record<'I' | 'O' | 'L' | 'J' | 'T' | 'S' | 'Z', readonly Cell[]>> = {
  I: [[0, 0], [0, 1], [0, 2], [0, 3]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  L: [[0, 0], [0, 1], [0, 2], [1, 2]],
  J: [[1, 0], [1, 1], [0, 2], [1, 2]],
  T: [[0, 0], [1, 0], [2, 0], [1, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
};
const TETRO_FOOD: Readonly<Record<keyof typeof SHAPES, FoodKey>> = {I: 'tamago', O: 'onigiri', L: 'ebi', J: 'tako', T: 'karaage', S: 'broccoli', Z: 'tomato'};
export const TETROMINO_STAGES: readonly string[] = ['IIOO', 'OOLL', 'IOLL', 'ILTT', 'ILJZ', 'JTTS'];

/** A fixed tetromino stage such as 'ILJZ'; ids I1, I2, O1 … as in rules v1. */
export function tetrominoPieces(stage: string): PieceDef[] {
  const seen: Record<string, number> = {};
  return [...stage].map(ch => {
    const shape = ch as keyof typeof SHAPES;
    if (!SHAPES[shape]) throw new Error(`unknown shape ${ch}`);
    seen[shape] = (seen[shape] ?? 0) + 1;
    return {id: `${shape}${seen[shape]}`, food: TETRO_FOOD[shape], cells: normalize(SHAPES[shape])};
  });
}

/** Deterministic PRNG (mulberry32) so the 24 generated stages are fixed. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Dish sizes per box: bigger boxes use bigger dishes, up to 8 cells. */
export const PIECE_RANGE: Readonly<Record<number, readonly [number, number]>> = {5: [4, 6], 6: [4, 7], 7: [5, 8], 8: [6, 8]};

function emptyComponents(owner: readonly number[], size: number): number[] {
  const seen = new Uint8Array(owner.length);
  const sizes: number[] = [];
  for (let i = 0; i < owner.length; i++) {
    if (owner[i] !== -1 || seen[i]) continue;
    let n = 0;
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const c = stack.pop()!;
      n++;
      const x = c % size, y = Math.floor(c / size);
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const j = ny * size + nx;
        if (nx >= 0 && ny >= 0 && nx < size && ny < size && owner[j] === -1 && !seen[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    sizes.push(n);
  }
  return sizes;
}

/**
 * Cut a size×size box into dishes of [min,max] cells, each fitting a 4×4
 * bounding box (so it shows clearly in the tray), with no enclosed holes.
 * Retries with the same seeded stream until every rule holds.
 */
export function generateStage(size: number, seed: number): Stage {
  const [minK, maxK] = PIECE_RANGE[size];
  const rand = rng(seed);
  const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
  for (let attempt = 0; attempt < 5000; attempt++) {
    const owner: number[] = Array(size * size).fill(-1);
    const groups: Cell[][] = [];
    let ok = true;
    while (ok && owner.includes(-1)) {
      const start = owner.indexOf(-1);
      const remaining = owner.filter(v => v === -1).length;
      const k = Math.min(int(minK, maxK), remaining);
      const cells: number[] = [start];
      owner[start] = groups.length;
      while (cells.length < k) {
        const cand: number[] = [];
        for (const c of cells) {
          const x = c % size, y = Math.floor(c / size);
          for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
            const j = ny * size + nx;
            if (nx < 0 || ny < 0 || nx >= size || ny >= size || owner[j] !== -1 || cand.includes(j)) continue;
            const xs = [...cells, j].map(v => v % size), ys = [...cells, j].map(v => Math.floor(v / size));
            if (Math.max(...xs) - Math.min(...xs) > 3 || Math.max(...ys) - Math.min(...ys) > 3) continue;
            cand.push(j);
          }
        }
        if (!cand.length) break;
        const pick = cand[Math.floor(rand() * cand.length)];
        owner[pick] = groups.length;
        cells.push(pick);
      }
      if (cells.length < minK) { ok = false; break; }
      groups.push(cells.map(c => [c % size, Math.floor(c / size)] as Cell));
      if (emptyComponents(owner, size).some(n => n < minK)) ok = false;
    }
    if (!ok || groups.length > MAX_PIECES) continue;
    // Fisher–Yates (not sort with a random comparator) so every browser gets the same stages.
    const shuffle = <T,>(xs: T[]): T[] => { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs; };
    const foods = shuffle([...FOOD_KEYS]);
    const order = shuffle(groups.map((_, i) => i));
    const pieces: PieceDef[] = [];
    const solution: SolvedPlacement[] = [];
    order.forEach((g, n) => {
      const abs = groups[g];
      const turn = Math.floor(rand() * 4);
      const id = `p${n + 1}`;
      pieces.push({id, food: foods[n % foods.length], cells: rotateCells(abs, turn)});
      // Turning the shown dish back by (4 - turn) restores its place in the tiling.
      solution.push({id, rotation: ((4 - turn) % 4) as Rotation, x: Math.min(...abs.map(c => c[0])), y: Math.min(...abs.map(c => c[1]))});
    });
    return {size, pieces, solution};
  }
  throw new Error(`could not generate ${size}x${size} stage for seed ${seed}`);
}

function tetrominoStage(code: string): Stage {
  const pieces = tetrominoPieces(code);
  const [solution] = solvePieces(4, pieces, 1);
  return {size: 4, pieces, solution};
}

export const STAGES: readonly Stage[] = [
  ...TETROMINO_STAGES.map(tetrominoStage),
  ...BOARD_SIZES.slice(1).flatMap(size => Array.from({length: STAGES_PER_SIZE}, (_, j) => generateStage(size, size * 1000 + j * 37 + 11))),
];
export const PRACTICE_STAGE: Stage = STAGES[0];
export const RUN_MAX_SCORE = STAGES.length * STAGE_MAX_SCORE;

/** Which box (0 = 4×4 … 4 = 8×8) and which bento inside it. */
export const sizeIndexOf = (stageIndex: number): number => Math.floor(stageIndex / STAGES_PER_SIZE);
export const stageInSize = (stageIndex: number): number => stageIndex % STAGES_PER_SIZE;

// ---------------------------------------------------------------- pieces & placement

export interface Piece extends PieceDef {
  readonly rotation: Rotation;
  /** Bounding-box origin on the board, or null while in the tray. */
  readonly at: {readonly x: number; readonly y: number} | null;
}

export const createPieces = (stage: Stage): Piece[] => stage.pieces.map(p => ({...p, rotation: 0, at: null}));
export const pieceShape = (p: Pick<Piece, 'cells' | 'rotation'>): Cell[] => rotateCells(p.cells, p.rotation);

export function pieceCells(p: Pick<Piece, 'cells' | 'rotation'>, x: number, y: number): Cell[] {
  return pieceShape(p).map(([cx, cy]) => [cx + x, cy + y] as Cell);
}

/** Board index → occupying piece id. */
export function occupancy(pieces: readonly Piece[], size: number, excludeId?: string): (string | null)[] {
  const grid: (string | null)[] = Array(size * size).fill(null);
  for (const p of pieces) {
    if (!p.at || p.id === excludeId) continue;
    for (const [x, y] of pieceCells(p, p.at.x, p.at.y)) grid[y * size + x] = p.id;
  }
  return grid;
}

export type PlaceCheck =
  | {ok: true; cells: Cell[]}
  | {ok: false; reason: 'unknown' | 'placed' | 'out' | 'overlap'; cells: Cell[]};

export function checkPlacement(pieces: readonly Piece[], size: number, id: string, x: number, y: number): PlaceCheck {
  const piece = pieces.find(p => p.id === id);
  if (!piece || !Number.isInteger(x) || !Number.isInteger(y)) return {ok: false, reason: 'unknown', cells: []};
  const cells = pieceCells(piece, x, y);
  if (piece.at) return {ok: false, reason: 'placed', cells};
  if (cells.some(([cx, cy]) => cx < 0 || cy < 0 || cx >= size || cy >= size)) return {ok: false, reason: 'out', cells};
  const grid = occupancy(pieces, size);
  if (cells.some(([cx, cy]) => grid[cy * size + cx] !== null)) return {ok: false, reason: 'overlap', cells};
  return {ok: true, cells};
}

/**
 * For tap placement: the origin that makes the piece cover board cell (cx,cy).
 * Tries the piece's own cells in reading order so the tapped cell becomes the
 * top-left-most food cell when that fits, otherwise the next legal alignment.
 */
export function placementCovering(pieces: readonly Piece[], size: number, id: string, cx: number, cy: number): {x: number; y: number} | null {
  const piece = pieces.find(p => p.id === id);
  if (!piece) return null;
  for (const [lx, ly] of pieceShape(piece)) {
    const x = cx - lx, y = cy - ly;
    if (checkPlacement(pieces, size, id, x, y).ok) return {x, y};
  }
  return null;
}

export const isFull = (pieces: readonly Piece[], size: number): boolean => occupancy(pieces, size).every(v => v !== null);

// ---------------------------------------------------------------- solver

/** Exact cover by backtracking. Rotations only (no mirror); identical dishes are interchangeable. */
export function solvePieces(size: number, defs: readonly PieceDef[], limit = 1): SolvedPlacement[][] {
  const results: SolvedPlacement[][] = [];
  const grid: boolean[] = Array(size * size).fill(false);
  const used = defs.map(() => false);
  const keys = defs.map(d => shapeKey(d.cells));
  const orients = defs.map(d => {
    const seen = new Set<string>();
    const list: {rotation: Rotation; cells: Cell[]}[] = [];
    for (let r = 0; r < 4; r++) {
      const cells = rotateCells(d.cells, r);
      const k = JSON.stringify(cells);
      if (!seen.has(k)) { seen.add(k); list.push({rotation: r as Rotation, cells}); }
    }
    return list;
  });
  const chosen: SolvedPlacement[] = [];
  const visit = () => {
    if (results.length >= limit) return;
    const target = grid.indexOf(false);
    if (target === -1) { if (chosen.length === defs.length) results.push(chosen.map(c => ({...c}))); return; }
    const tx = target % size, ty = Math.floor(target / size);
    const tried = new Set<string>();
    for (let i = 0; i < defs.length; i++) {
      if (used[i] || tried.has(keys[i])) continue;
      tried.add(keys[i]);
      for (const o of orients[i]) {
        // The first empty cell in reading order must be the dish's first cell.
        const x = tx - o.cells[0][0], y = ty - o.cells[0][1];
        const abs = o.cells.map(([cx, cy]) => [cx + x, cy + y] as Cell);
        if (abs.some(([cx, cy]) => cx < 0 || cy < 0 || cx >= size || cy >= size || grid[cy * size + cx])) continue;
        abs.forEach(([cx, cy]) => { grid[cy * size + cx] = true; });
        used[i] = true;
        chosen.push({id: defs[i].id, rotation: o.rotation, x, y});
        visit();
        chosen.pop();
        used[i] = false;
        abs.forEach(([cx, cy]) => { grid[cy * size + cx] = false; });
      }
    }
  };
  visit();
  return results;
}

export const solveStage = (stage: Stage, limit = 1): SolvedPlacement[][] => solvePieces(stage.size, stage.pieces, limit);

// ---------------------------------------------------------------- clock & score

export interface Clock {readonly accumulatedMs: number; readonly since: number | null}

export const clockStart = (c: Clock, now: number): Clock => c.since === null ? {accumulatedMs: c.accumulatedMs, since: now} : c;
export const clockStop = (c: Clock, now: number): Clock => c.since === null ? c : {accumulatedMs: c.accumulatedMs + Math.max(0, now - c.since), since: null};
export const clockElapsed = (c: Clock, now: number): number => c.accumulatedMs + (c.since === null ? 0 : Math.max(0, now - c.since));

/**
 * 1000 minus penalties scaled to the box: time per 16 cells, rotations and
 * removals per 4 dishes. On a 4×4 box with 4 dishes this is exactly rules v1:
 * 1000 - 3·sec - 20·rotations - 50·removals.
 */
export function stageScore(activeMs: number, rotates: number, undos: number, cells = 16, pieces = 4): number {
  const sec = Math.floor(Math.max(0, activeMs) / 1000);
  const penalty = Math.round((48 * sec) / cells + (80 * rotates) / pieces + (200 * undos) / pieces);
  return Math.max(0, STAGE_MAX_SCORE - penalty);
}

// ---------------------------------------------------------------- run reducer

export type Mode = 'run' | 'practice';
export type Phase = 'playing' | 'cleared' | 'complete';

export interface StageResult {stageIndex: number; size: number; activeMs: number; rotates: number; undos: number; score: number}

export interface RunState {
  readonly mode: Mode;
  readonly runId: string;
  readonly stageIndex: number;
  readonly pieces: readonly Piece[];
  readonly selectedId: string | null;
  readonly clock: Clock;
  readonly rotates: number;
  readonly undos: number;
  readonly results: readonly StageResult[];
  readonly phase: Phase;
}

export const stageOf = (s: RunState): Stage => s.mode === 'run' ? STAGES[s.stageIndex] : PRACTICE_STAGE;
export const boardSize = (s: RunState): number => stageOf(s).size;

/** A new run. `fromSize` > 0 continues at the first bento of that box with earlier results kept. */
export function createRun(mode: Mode, runId: string, fromSize = 0, earlier: readonly StageResult[] = []): RunState {
  const stageIndex = mode === 'run' ? fromSize * STAGES_PER_SIZE : 0;
  const stage = mode === 'run' ? STAGES[stageIndex] : PRACTICE_STAGE;
  return {mode, runId, stageIndex, pieces: createPieces(stage), selectedId: null, clock: {accumulatedMs: 0, since: null}, rotates: 0, undos: 0, results: mode === 'run' ? [...earlier] : [], phase: 'playing'};
}

export const totalScore = (s: RunState): number => s.results.reduce((n, r) => n + r.score, 0);
export const isActive = (s: RunState): boolean => s.phase === 'playing' && s.clock.since !== null;
export const liveStageScore = (s: RunState, ms: number): number => stageScore(ms, s.rotates, s.undos, boardSize(s) ** 2, s.pieces.length);

/** Resume the active clock (UI is visible, focused, unpaused). */
export const resume = (s: RunState, now: number): RunState => s.phase === 'playing' ? {...s, clock: clockStart(s.clock, now)} : s;
/** Stop the active clock (pause, blur, hidden, overlay). Selection is dropped so no input carries over. */
export const suspend = (s: RunState, now: number): RunState => ({...s, clock: clockStop(s.clock, now), selectedId: null});

export type Action =
  | {type: 'select'; id: string}
  | {type: 'deselect'}
  | {type: 'rotate'}
  | {type: 'place'; id: string; x: number; y: number}
  | {type: 'placeCovering'; id: string; cx: number; cy: number}
  | {type: 'remove'; id: string}
  | {type: 'next'};

export type Outcome =
  | {ok: true; event: 'selected' | 'deselected' | 'rotated' | 'placed' | 'removed' | 'cleared' | 'nextStage' | 'complete'}
  | {ok: false; reason: 'inactive' | 'unknown' | 'placed' | 'out' | 'overlap' | 'noSelection' | 'notCleared'};

export interface Step {state: RunState; outcome: Outcome}

const reject = (state: RunState, reason: Extract<Outcome, {ok: false}>['reason']): Step => ({state, outcome: {ok: false, reason}});

export function act(s: RunState, a: Action, now: number): Step {
  const size = boardSize(s);
  if (a.type === 'next') {
    if (s.phase !== 'cleared') return reject(s, 'notCleared');
    if (s.mode === 'practice') return {state: createRun('practice', s.runId), outcome: {ok: true, event: 'nextStage'}};
    if (s.stageIndex >= STAGES.length - 1) return {state: {...s, phase: 'complete'}, outcome: {ok: true, event: 'complete'}};
    const stageIndex = s.stageIndex + 1;
    return {
      state: {...s, stageIndex, pieces: createPieces(STAGES[stageIndex]), selectedId: null, clock: {accumulatedMs: 0, since: null}, rotates: 0, undos: 0, phase: 'playing'},
      outcome: {ok: true, event: 'nextStage'},
    };
  }
  if (!isActive(s)) return reject(s, 'inactive');
  switch (a.type) {
    case 'select': {
      const p = s.pieces.find(q => q.id === a.id);
      if (!p) return reject(s, 'unknown');
      if (p.at) return reject(s, 'placed');
      return {state: {...s, selectedId: p.id}, outcome: {ok: true, event: 'selected'}};
    }
    case 'deselect':
      return {state: {...s, selectedId: null}, outcome: {ok: true, event: 'deselected'}};
    case 'rotate': {
      const p = s.pieces.find(q => q.id === s.selectedId);
      if (!p) return reject(s, 'noSelection');
      if (p.at) return reject(s, 'placed');
      const rotation = ((p.rotation + 1) % 4) as Rotation;
      return {state: {...s, pieces: s.pieces.map(q => q.id === p.id ? {...q, rotation} : q), rotates: s.rotates + 1}, outcome: {ok: true, event: 'rotated'}};
    }
    case 'placeCovering': {
      const at = placementCovering(s.pieces, size, a.id, a.cx, a.cy);
      if (!at) {
        const p = s.pieces.find(q => q.id === a.id);
        if (!p) return reject(s, 'unknown');
        if (p.at) return reject(s, 'placed');
        const inBoard = a.cx >= 0 && a.cy >= 0 && a.cx < size && a.cy < size;
        return reject(s, inBoard ? 'overlap' : 'out');
      }
      return act(s, {type: 'place', id: a.id, x: at.x, y: at.y}, now);
    }
    case 'place': {
      const check = checkPlacement(s.pieces, size, a.id, a.x, a.y);
      if (!check.ok) return reject(s, check.reason);
      const pieces = s.pieces.map(q => q.id === a.id ? {...q, at: {x: a.x, y: a.y}} : q);
      if (!isFull(pieces, size)) return {state: {...s, pieces, selectedId: null}, outcome: {ok: true, event: 'placed'}};
      const clock = clockStop(s.clock, now);
      const activeMs = clock.accumulatedMs;
      const result: StageResult = {stageIndex: s.stageIndex, size, activeMs, rotates: s.rotates, undos: s.undos, score: stageScore(activeMs, s.rotates, s.undos, size * size, s.pieces.length)};
      return {
        state: {...s, pieces, selectedId: null, clock, phase: 'cleared', results: s.mode === 'run' ? [...s.results, result] : s.results},
        outcome: {ok: true, event: 'cleared'},
      };
    }
    case 'remove': {
      const p = s.pieces.find(q => q.id === a.id);
      if (!p) return reject(s, 'unknown');
      if (!p.at) return reject(s, 'noSelection');
      return {
        state: {...s, pieces: s.pieces.map(q => q.id === p.id ? {...q, at: null} : q), selectedId: p.id, undos: s.undos + 1},
        outcome: {ok: true, event: 'removed'},
      };
    }
  }
}

/** The result a finished practice/run stage just produced (practice computes but never stores it). */
export function lastStageResult(s: RunState): StageResult | null {
  if (s.mode === 'run') return s.results.at(-1) ?? null;
  if (s.phase !== 'cleared') return null;
  const size = boardSize(s);
  return {stageIndex: 0, size, activeMs: s.clock.accumulatedMs, rotates: s.rotates, undos: s.undos, score: stageScore(s.clock.accumulatedMs, s.rotates, s.undos, size * size, s.pieces.length)};
}
