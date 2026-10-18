// Game037 BENTO BOX — pure rules model. No DOM, storage, audio or timers here.
// Every input path (drag, tap, keyboard) goes through `act` so placement,
// rotation, removal, clock and score stay in one place.

export const BOARD_SIZE = 4;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
export const STAGE_MAX_SCORE = 1000;
export const RUN_MAX_SCORE = 6000;

export type ShapeKey = 'I' | 'O' | 'L' | 'J' | 'T' | 'S' | 'Z';
export type Rotation = 0 | 1 | 2 | 3;
export type Cell = readonly [number, number];

export const SHAPE_KEYS: readonly ShapeKey[] = ['I', 'O', 'L', 'J', 'T', 'S', 'Z'];

/** Local cells `[x,y]` at rotation 0, exactly as fixed by the assignment. */
export const SHAPES: Readonly<Record<ShapeKey, readonly Cell[]>> = {
  I: [[0, 0], [0, 1], [0, 2], [0, 3]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  L: [[0, 0], [0, 1], [0, 2], [1, 2]],
  J: [[1, 0], [1, 1], [0, 2], [1, 2]],
  T: [[0, 0], [1, 0], [2, 0], [1, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
};

export const FOODS: Readonly<Record<ShapeKey, {ja: string; en: string}>> = {
  I: {ja: '卵焼き', en: 'tamagoyaki'},
  O: {ja: 'おにぎり', en: 'onigiri'},
  L: {ja: '海老フライ', en: 'ebi fry'},
  J: {ja: 'ウインナー', en: 'wiener'},
  T: {ja: 'からあげ', en: 'karaage'},
  S: {ja: 'ブロッコリー', en: 'broccoli'},
  Z: {ja: 'プチトマト', en: 'cherry tomato'},
};

/** Fixed production order. Practice reuses STAGES[0] in an isolated run. */
export const STAGES: readonly string[] = ['IIOO', 'OOLL', 'IOLL', 'ILTT', 'ILJZ', 'JTTS'];
export const PRACTICE_STAGE = STAGES[0];

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

export function shapeCells(shape: ShapeKey, rotation: Rotation): Cell[] {
  let cells = normalize(SHAPES[shape]);
  for (let i = 0; i < rotation; i++) cells = rotateCW(cells);
  return cells;
}

export function cellBounds(cells: readonly Cell[]): {w: number; h: number} {
  return {w: Math.max(...cells.map(c => c[0])) + 1, h: Math.max(...cells.map(c => c[1])) + 1};
}

export interface Piece {
  readonly id: string;
  readonly shape: ShapeKey;
  readonly rotation: Rotation;
  /** Bounding-box origin on the board, or null while in the tray. */
  readonly at: {readonly x: number; readonly y: number} | null;
}

export function createPieces(stage: string): Piece[] {
  const seen: Record<string, number> = {};
  return [...stage].map(ch => {
    const shape = ch as ShapeKey;
    if (!SHAPE_KEYS.includes(shape)) throw new Error(`unknown shape ${ch}`);
    seen[shape] = (seen[shape] ?? 0) + 1;
    return {id: `${shape}${seen[shape]}`, shape, rotation: 0, at: null};
  });
}

export function pieceCells(piece: Pick<Piece, 'shape' | 'rotation'>, x: number, y: number): Cell[] {
  return shapeCells(piece.shape, piece.rotation).map(([cx, cy]) => [cx + x, cy + y] as Cell);
}

/** Board index → occupying piece id. */
export function occupancy(pieces: readonly Piece[], excludeId?: string): (string | null)[] {
  const grid: (string | null)[] = Array(CELL_COUNT).fill(null);
  for (const p of pieces) {
    if (!p.at || p.id === excludeId) continue;
    for (const [x, y] of pieceCells(p, p.at.x, p.at.y)) grid[y * BOARD_SIZE + x] = p.id;
  }
  return grid;
}

export type PlaceCheck =
  | {ok: true; cells: Cell[]}
  | {ok: false; reason: 'unknown' | 'placed' | 'out' | 'overlap'; cells: Cell[]};

export function checkPlacement(pieces: readonly Piece[], id: string, x: number, y: number): PlaceCheck {
  const piece = pieces.find(p => p.id === id);
  if (!piece || !Number.isInteger(x) || !Number.isInteger(y)) return {ok: false, reason: 'unknown', cells: []};
  const cells = pieceCells(piece, x, y);
  if (piece.at) return {ok: false, reason: 'placed', cells};
  if (cells.some(([cx, cy]) => cx < 0 || cy < 0 || cx >= BOARD_SIZE || cy >= BOARD_SIZE)) return {ok: false, reason: 'out', cells};
  const grid = occupancy(pieces);
  if (cells.some(([cx, cy]) => grid[cy * BOARD_SIZE + cx] !== null)) return {ok: false, reason: 'overlap', cells};
  return {ok: true, cells};
}

/**
 * For tap placement: the origin that makes the piece cover board cell (cx,cy).
 * Tries the piece's own cells in reading order so the tapped cell becomes the
 * top-left-most food cell when that fits, otherwise the next legal alignment.
 */
export function placementCovering(pieces: readonly Piece[], id: string, cx: number, cy: number): {x: number; y: number} | null {
  const piece = pieces.find(p => p.id === id);
  if (!piece) return null;
  for (const [lx, ly] of shapeCells(piece.shape, piece.rotation)) {
    const x = cx - lx, y = cy - ly;
    if (checkPlacement(pieces, id, x, y).ok) return {x, y};
  }
  return null;
}

export function isFull(pieces: readonly Piece[]): boolean {
  return occupancy(pieces).every(v => v !== null);
}

// ---------------------------------------------------------------- solver

export interface SolvedPlacement {shape: ShapeKey; id: string; rotation: Rotation; x: number; y: number}

/** Exact cover by backtracking. Rotations only (no mirror). Pieces used in stage order ids. */
export function solveStage(stage: string, limit = 1): SolvedPlacement[][] {
  const base = createPieces(stage);
  const results: SolvedPlacement[][] = [];
  const grid: boolean[] = Array(CELL_COUNT).fill(false);
  const used = base.map(() => false);
  const chosen: SolvedPlacement[] = [];
  const firstEmpty = () => grid.indexOf(false);
  const visit = () => {
    if (results.length >= limit) return;
    const target = firstEmpty();
    if (target === -1) { if (chosen.length === base.length) results.push(chosen.map(c => ({...c}))); return; }
    const tx = target % BOARD_SIZE, ty = Math.floor(target / BOARD_SIZE);
    const triedShapes = new Set<ShapeKey>();
    for (let i = 0; i < base.length; i++) {
      if (used[i] || triedShapes.has(base[i].shape)) continue;
      triedShapes.add(base[i].shape); // identical shapes are interchangeable
      const seenRot = new Set<string>();
      for (let r = 0 as Rotation; r < 4; r = (r + 1) as Rotation) {
        const cells = shapeCells(base[i].shape, r);
        const key = JSON.stringify(cells);
        if (seenRot.has(key)) continue;
        seenRot.add(key);
        // The first empty cell in reading order must be the piece's first cell.
        const x = tx - cells[0][0], y = ty - cells[0][1];
        const abs = cells.map(([cx, cy]) => [cx + x, cy + y] as Cell);
        if (abs.some(([cx, cy]) => cx < 0 || cy < 0 || cx >= BOARD_SIZE || cy >= BOARD_SIZE || grid[cy * BOARD_SIZE + cx])) continue;
        abs.forEach(([cx, cy]) => { grid[cy * BOARD_SIZE + cx] = true; });
        used[i] = true;
        chosen.push({shape: base[i].shape, id: base[i].id, rotation: r, x, y});
        visit();
        chosen.pop();
        used[i] = false;
        abs.forEach(([cx, cy]) => { grid[cy * BOARD_SIZE + cx] = false; });
      }
    }
  };
  visit();
  return results;
}

// ---------------------------------------------------------------- clock & score

export interface Clock {readonly accumulatedMs: number; readonly since: number | null}

export const clockStart = (c: Clock, now: number): Clock => c.since === null ? {accumulatedMs: c.accumulatedMs, since: now} : c;
export const clockStop = (c: Clock, now: number): Clock => c.since === null ? c : {accumulatedMs: c.accumulatedMs + Math.max(0, now - c.since), since: null};
export const clockElapsed = (c: Clock, now: number): number => c.accumulatedMs + (c.since === null ? 0 : Math.max(0, now - c.since));

export function stageScore(activeMs: number, rotates: number, undos: number): number {
  return Math.max(0, STAGE_MAX_SCORE - 3 * Math.floor(Math.max(0, activeMs) / 1000) - 20 * rotates - 50 * undos);
}

// ---------------------------------------------------------------- run reducer

export type Mode = 'run' | 'practice';
export type Phase = 'playing' | 'cleared' | 'complete';

export interface StageResult {stage: string; activeMs: number; rotates: number; undos: number; score: number}

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

export function createRun(mode: Mode, runId: string): RunState {
  const stage = mode === 'run' ? STAGES[0] : PRACTICE_STAGE;
  return {mode, runId, stageIndex: 0, pieces: createPieces(stage), selectedId: null, clock: {accumulatedMs: 0, since: null}, rotates: 0, undos: 0, results: [], phase: 'playing'};
}

export const stageOf = (s: RunState): string => s.mode === 'run' ? STAGES[s.stageIndex] : PRACTICE_STAGE;
export const totalScore = (s: RunState): number => s.results.reduce((n, r) => n + r.score, 0);
export const isActive = (s: RunState): boolean => s.phase === 'playing' && s.clock.since !== null;

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
  if (a.type === 'next') {
    if (s.phase !== 'cleared') return reject(s, 'notCleared');
    if (s.mode === 'practice') {
      // Practice "again": a fresh practice board, never scored.
      return {state: {...createRun('practice', s.runId)}, outcome: {ok: true, event: 'nextStage'}};
    }
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
      const at = placementCovering(s.pieces, a.id, a.cx, a.cy);
      if (!at) {
        const p = s.pieces.find(q => q.id === a.id);
        if (!p) return reject(s, 'unknown');
        if (p.at) return reject(s, 'placed');
        const inBoard = a.cx >= 0 && a.cy >= 0 && a.cx < BOARD_SIZE && a.cy < BOARD_SIZE;
        return reject(s, inBoard ? 'overlap' : 'out');
      }
      return act(s, {type: 'place', id: a.id, x: at.x, y: at.y}, now);
    }
    case 'place': {
      const check = checkPlacement(s.pieces, a.id, a.x, a.y);
      if (!check.ok) return reject(s, check.reason);
      const pieces = s.pieces.map(q => q.id === a.id ? {...q, at: {x: a.x, y: a.y}} : q);
      if (!isFull(pieces)) return {state: {...s, pieces, selectedId: null}, outcome: {ok: true, event: 'placed'}};
      const clock = clockStop(s.clock, now);
      const activeMs = clock.accumulatedMs;
      const result: StageResult = {stage: stageOf(s), activeMs, rotates: s.rotates, undos: s.undos, score: stageScore(activeMs, s.rotates, s.undos)};
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
  return {stage: PRACTICE_STAGE, activeMs: s.clock.accumulatedMs, rotates: s.rotates, undos: s.undos, score: stageScore(s.clock.accumulatedMs, s.rotates, s.undos)};
}
