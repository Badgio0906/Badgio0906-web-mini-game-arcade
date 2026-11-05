import {describe, expect, it} from 'vitest';
import {
  act, boardSize, cellBounds, checkPlacement, clockElapsed, clockStart, clockStop, createPieces, createRun, generateStage,
  isFull, occupancy, pieceCells, placementCovering, resume, rotateCells, rotateCW, shapeKey, sizeIndexOf, solvePieces, solveStage,
  stageScore, suspend, tetrominoPieces, totalScore, BOARD_SIZES, MAX_PIECES, PIECE_RANGE, PRACTICE_STAGE, RUN_MAX_SCORE, SHAPES,
  STAGES, STAGES_PER_SIZE, TETROMINO_STAGES, type RunState, type Action, type Stage,
} from '../../src/games/game037/model';

const key = (cells: readonly (readonly [number, number])[]) => JSON.stringify(cells);

/** Drive the current stage through the reducer using its stored solution, as the browser does. */
function solveThroughReducer(s: RunState, now: number): RunState {
  const stage: Stage = s.mode === 'run' ? STAGES[s.stageIndex] : PRACTICE_STAGE;
  for (const p of stage.solution) {
    s = act(s, {type: 'select', id: p.id}, now).state;
    for (let r = 0; r < p.rotation; r++) s = act(s, {type: 'rotate'}, now).state;
    const step = act(s, {type: 'place', id: p.id, x: p.x, y: p.y}, now);
    expect(step.outcome.ok, `${s.stageIndex} ${p.id}`).toBe(true);
    s = step.state;
  }
  return s;
}

/** Check a placement list really is an exact cover of the stage's box. */
function expectExactCover(stage: Stage, sol: readonly {id: string; rotation: number; x: number; y: number}[]) {
  const n = stage.size;
  const seen = new Set<string>();
  expect(sol.map(p => p.id).sort()).toEqual(stage.pieces.map(p => p.id).sort());
  for (const p of sol) {
    const def = stage.pieces.find(q => q.id === p.id)!;
    for (const [x, y] of rotateCells(def.cells, p.rotation).map(([cx, cy]) => [cx + p.x, cy + p.y])) {
      expect(x >= 0 && y >= 0 && x < n && y < n, `${p.id} inside`).toBe(true);
      expect(seen.has(`${x},${y}`), `${p.id} overlap ${x},${y}`).toBe(false);
      seen.add(`${x},${y}`);
    }
  }
  expect(seen.size).toBe(n * n);
}

describe('game037 shapes and rotation', () => {
  it('keeps the seven v1 tetromino definitions and their foods on the 4×4 stages', () => {
    expect(SHAPES.L).toEqual([[0, 0], [0, 1], [0, 2], [1, 2]]);
    expect(SHAPES.J).toEqual([[1, 0], [1, 1], [0, 2], [1, 2]]);
    expect(TETROMINO_STAGES).toEqual(['IIOO', 'OOLL', 'IOLL', 'ILTT', 'ILJZ', 'JTTS']);
    expect(tetrominoPieces('IIOO').map(p => [p.id, p.food])).toEqual([['I1', 'tamago'], ['I2', 'tamago'], ['O1', 'onigiri'], ['O2', 'onigiri']]);
    expect(STAGES.slice(0, 6).every(s => s.size === 4 && s.pieces.every(p => p.cells.length === 4))).toBe(true);
  });

  it('rotates clockwise in screen space, normalizes and returns after four turns', () => {
    expect(rotateCells(SHAPES.I, 1)).toEqual([[0, 0], [1, 0], [2, 0], [3, 0]]);
    expect(rotateCells(SHAPES.L, 1)).toEqual([[0, 0], [1, 0], [2, 0], [0, 1]]);
    expect(cellBounds(rotateCells(SHAPES.T, 1))).toEqual({w: 2, h: 3});
    for (const cells of Object.values(SHAPES)) {
      let c = rotateCells(cells, 0);
      for (let i = 0; i < 4; i++) c = rotateCW(c);
      expect(key(c)).toBe(key(rotateCells(cells, 0)));
    }
  });

  it('never mirrors: L/J and S/Z have different rotation-invariant keys', () => {
    expect(shapeKey(SHAPES.L)).not.toBe(shapeKey(SHAPES.J));
    expect(shapeKey(SHAPES.S)).not.toBe(shapeKey(SHAPES.Z));
    expect(shapeKey(SHAPES.L)).toBe(shapeKey(rotateCells(SHAPES.L, 3)));
  });
});

describe('game037 growing boxes', () => {
  it('has 30 stages: six each for 4×4, 5×5, 6×6, 7×7 and 8×8, in that order', () => {
    expect(BOARD_SIZES).toEqual([4, 5, 6, 7, 8]);
    expect(STAGES).toHaveLength(30);
    STAGES.forEach((s, i) => {
      expect(s.size).toBe(BOARD_SIZES[Math.floor(i / STAGES_PER_SIZE)]);
      expect(sizeIndexOf(i)).toBe(Math.floor(i / 6));
    });
    expect(RUN_MAX_SCORE).toBe(30000);
  });

  it('every stage is an exact cover: the stored solution tiles the box, and the solver finds one without mirroring', () => {
    for (const stage of STAGES) {
      expectExactCover(stage, stage.solution);
      const [found] = solveStage(stage, 1);
      expect(found, `stage size ${stage.size}`).toBeTruthy();
      expectExactCover(stage, found);
    }
  });

  it('larger boxes use 4–8 cell dishes in their range, fit a 4×4 tray box, at most 10 dishes, unique ids', () => {
    for (const stage of STAGES.slice(6)) {
      const [lo, hi] = PIECE_RANGE[stage.size];
      expect(stage.pieces.length).toBeLessThanOrEqual(MAX_PIECES);
      expect(new Set(stage.pieces.map(p => p.id)).size).toBe(stage.pieces.length);
      for (const p of stage.pieces) {
        expect(p.cells.length).toBeGreaterThanOrEqual(lo);
        expect(p.cells.length).toBeLessThanOrEqual(hi);
        const b = cellBounds(p.cells);
        expect(Math.max(b.w, b.h)).toBeLessThanOrEqual(4);
      }
      expect(stage.pieces.reduce((n, p) => n + p.cells.length, 0)).toBe(stage.size ** 2);
    }
    // 5- to 8-cell dishes really appear, not only tetrominoes.
    const sizes = new Set(STAGES.flatMap(s => s.pieces.map(p => p.cells.length)));
    for (const k of [5, 6, 7, 8]) expect(sizes.has(k)).toBe(true);
  });

  it('stage generation is deterministic for a seed (same levels in every browser)', () => {
    expect(JSON.stringify(generateStage(7, 1234))).toBe(JSON.stringify(generateStage(7, 1234)));
    expect(JSON.stringify(generateStage(7, 1234))).not.toBe(JSON.stringify(generateStage(7, 1235)));
  });

  it('solver rejects an impossible set (no false positives)', () => {
    // S/Z tetrominoes cannot tile a 4×4 box without mirroring.
    expect(solvePieces(4, tetrominoPieces('SSSS'), 1)).toHaveLength(0);
    expect(solvePieces(4, tetrominoPieces('ZZZZ'), 1)).toHaveLength(0);
  });
});

describe('game037 placement rules', () => {
  it('rejects out-of-bounds and overlapping placements without changing the board', () => {
    let pieces = createPieces(STAGES[0]);
    expect(checkPlacement(pieces, 4, 'I1', 0, 1)).toMatchObject({ok: false, reason: 'out'});
    expect(checkPlacement(pieces, 4, 'I1', -1, 0)).toMatchObject({ok: false, reason: 'out'});
    expect(checkPlacement(pieces, 4, 'O1', 3, 0)).toMatchObject({ok: false, reason: 'out'});
    pieces = pieces.map(p => p.id === 'I1' ? {...p, at: {x: 0, y: 0}} : p);
    expect(checkPlacement(pieces, 4, 'O1', 0, 1)).toMatchObject({ok: false, reason: 'overlap'});
    expect(checkPlacement(pieces, 4, 'I1', 1, 0)).toMatchObject({ok: false, reason: 'placed'});
    expect(checkPlacement(pieces, 4, 'O1', 1, 1)).toMatchObject({ok: true});
    expect(occupancy(pieces, 4).filter(Boolean)).toHaveLength(4);
    expect(checkPlacement(pieces, 4, 'I1', 0.5, 0)).toMatchObject({ok: false, reason: 'unknown'});
  });

  it('the same dish fits on a bigger box where it stuck out of a smaller one', () => {
    const big = createPieces(STAGES[24]);
    const p = big[0];
    const {w, h} = cellBounds(p.cells);
    expect(checkPlacement(big, 8, p.id, 8 - w, 8 - h).ok).toBe(true);
    expect(checkPlacement(big, 8, p.id, 9 - w, 8 - h)).toMatchObject({ok: false, reason: 'out'});
    expect(pieceCells(p, 1, 2)[0]).toEqual([p.cells[0][0] + 1, p.cells[0][1] + 2]);
  });

  it('tap placement finds the origin covering the tapped cell, preferring the first food cell', () => {
    const pieces = createPieces(STAGES[4]); // ILJZ
    expect(placementCovering(pieces, 4, 'L1', 0, 0)).toEqual({x: 0, y: 0});
    expect(placementCovering(pieces, 4, 'L1', 1, 3)).toEqual({x: 1, y: 1});
    const blocked = pieces.map(p => p.id === 'I1' ? {...p, at: {x: 0, y: 0}} : p);
    expect(placementCovering(blocked, 4, 'L1', 0, 2)).toBeNull();
  });
});

describe('game037 run reducer', () => {
  const started = (mode: 'run' | 'practice' = 'run') => resume(createRun(mode, 'r1'), 0);

  it('ignores all gameplay input while paused/suspended', () => {
    let s = suspend(started(), 0);
    for (const a of [{type: 'select', id: 'I1'}, {type: 'rotate'}, {type: 'place', id: 'I1', x: 0, y: 0}, {type: 'remove', id: 'I1'}] as Action[]) {
      const step = act(s, a, 10);
      expect(step.outcome).toEqual({ok: false, reason: 'inactive'});
      s = step.state;
    }
    expect(s.rotates).toBe(0);
    expect(s.pieces.every(p => p.at === null)).toBe(true);
  });

  it('counts only accepted rotations and removals; invalid placements cost nothing', () => {
    let s = started();
    expect(act(s, {type: 'rotate'}, 0).outcome).toEqual({ok: false, reason: 'noSelection'});
    s = act(s, {type: 'select', id: 'I1'}, 0).state;
    s = act(s, {type: 'rotate'}, 0).state;
    expect(s.rotates).toBe(1);
    const bad = act(s, {type: 'place', id: 'I1', x: 1, y: 0}, 0);
    expect(bad.outcome).toEqual({ok: false, reason: 'out'});
    expect(bad.state.rotates).toBe(1);
    s = act(s, {type: 'place', id: 'I1', x: 0, y: 0}, 0).state;
    expect(act(s, {type: 'select', id: 'I1'}, 0).outcome).toEqual({ok: false, reason: 'placed'});
    s = act(s, {type: 'remove', id: 'I1'}, 0).state;
    expect(s.undos).toBe(1);
    expect(s.selectedId).toBe('I1');
    expect(s.pieces.find(p => p.id === 'I1')!.at).toBeNull();
  });

  it('clock only advances while active and stops at the clear instant', () => {
    let c = clockStart({accumulatedMs: 0, since: null}, 1000);
    c = clockStop(c, 3500);
    expect(clockElapsed(c, 99999)).toBe(2500);
    c = clockStart(c, 10000);
    expect(clockElapsed(c, 10500)).toBe(3000);
    expect(clockStart(c, 20000)).toBe(c);
    let s = resume(createRun('run', 'r'), 0);
    s = suspend(s, 4000);
    s = resume(s, 60000);
    s = solveThroughReducer(s, 61000);
    expect(s.phase).toBe('cleared');
    expect(s.results[0].activeMs).toBe(5000);
    expect(s.clock.since).toBeNull();
  });

  it('scores exactly as rules v1 on 4×4 and scales penalties to box and dish count', () => {
    expect(stageScore(0, 0, 0)).toBe(1000);
    expect(stageScore(12999, 2, 1)).toBe(1000 - 36 - 40 - 50);
    expect(stageScore(999, 0, 0)).toBe(1000);
    expect(stageScore(10 * 60 * 1000, 30, 30)).toBe(0);
    // 8×8 with 8 dishes: 64 s costs as much as 16 s on 4×4; a rotation costs half.
    expect(stageScore(64000, 0, 0, 64, 8)).toBe(stageScore(16000, 0, 0));
    expect(stageScore(0, 2, 0, 64, 8)).toBe(stageScore(0, 1, 0));
  });

  it('a full run goes through all five boxes with an explicit next per bento, totals 0..30000', () => {
    let s = started();
    let now = 0;
    for (let i = 0; i < STAGES.length; i++) {
      expect(boardSize(s)).toBe(STAGES[i].size);
      now += 2000;
      s = solveThroughReducer(s, now);
      expect(s.phase).toBe('cleared');
      expect(s.results).toHaveLength(i + 1);
      expect(s.results[i]).toMatchObject({stageIndex: i, size: STAGES[i].size, activeMs: 2000});
      expect(act(s, {type: 'remove', id: s.pieces[0].id}, now).outcome).toEqual({ok: false, reason: 'inactive'});
      const next = act(s, {type: 'next'}, now);
      expect(next.outcome.ok).toBe(true);
      s = resume(next.state, now);
    }
    expect(s.phase).toBe('complete');
    expect(totalScore(s)).toBe(s.results.reduce((n, r) => n + r.score, 0));
    expect(totalScore(s)).toBeGreaterThan(0);
    expect(totalScore(s)).toBeLessThanOrEqual(RUN_MAX_SCORE);
    expect(act(s, {type: 'next'}, now).outcome).toEqual({ok: false, reason: 'notCleared'});
  });

  it('continuing from a box checkpoint starts at that box with earlier results kept', () => {
    const earlier = Array.from({length: 12}, (_, i) => ({stageIndex: i, size: STAGES[i].size, activeMs: 1000, rotates: 0, undos: 0, score: 900}));
    const s = createRun('run', 'c', 2, earlier);
    expect(s.stageIndex).toBe(12);
    expect(boardSize(s)).toBe(6);
    expect(totalScore(s)).toBe(10800);
    expect(s.pieces).toHaveLength(STAGES[12].pieces.length);
  });

  it('practice never records stage results and "next" restarts the same 4×4 practice board', () => {
    let s = started('practice');
    s = solveThroughReducer(s, 3000);
    expect(s.phase).toBe('cleared');
    expect(isFull(s.pieces, 4)).toBe(true);
    expect(s.results).toHaveLength(0);
    const again = act(s, {type: 'next'}, 3000).state;
    expect(again.mode).toBe('practice');
    expect(boardSize(again)).toBe(4);
    expect(again.pieces.every(p => p.at === null)).toBe(true);
    expect(again.results).toHaveLength(0);
  });

  it('retry is a brand-new run with no carried stage, selection, counters or results', () => {
    let s = started();
    s = solveThroughReducer(s, 1000);
    s = resume(act(s, {type: 'next'}, 1000).state, 1000);
    s = act(s, {type: 'select', id: 'O1'}, 1000).state;
    const fresh = createRun('run', 'r2');
    expect(fresh.stageIndex).toBe(0);
    expect(fresh.results).toEqual([]);
    expect(fresh.selectedId).toBeNull();
    expect(fresh.rotates + fresh.undos).toBe(0);
    expect(fresh.runId).not.toBe(s.runId);
  });
});
