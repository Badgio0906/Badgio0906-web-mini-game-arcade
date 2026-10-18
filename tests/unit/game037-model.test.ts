import {describe, expect, it} from 'vitest';
import {
  act, cellBounds, checkPlacement, clockElapsed, clockStart, clockStop, createPieces, createRun, isFull,
  occupancy, pieceCells, placementCovering, resume, rotateCW, shapeCells, solveStage, stageScore, suspend,
  totalScore, BOARD_SIZE, PRACTICE_STAGE, SHAPES, SHAPE_KEYS, STAGES, type RunState, type Action,
} from '../../src/games/game037/model';

const key = (cells: readonly (readonly [number, number])[]) => JSON.stringify(cells);

/** Drive a stage through the reducer using a solver result, as the browser does. */
function solveThroughReducer(s: RunState, now: number): RunState {
  const [solution] = solveStage(s.mode === 'run' ? STAGES[s.stageIndex] : PRACTICE_STAGE);
  for (const p of solution) {
    s = act(s, {type: 'select', id: p.id}, now).state;
    for (let r = 0; r < p.rotation; r++) s = act(s, {type: 'rotate'}, now).state;
    const step = act(s, {type: 'place', id: p.id, x: p.x, y: p.y}, now);
    expect(step.outcome.ok).toBe(true);
    s = step.state;
  }
  return s;
}

describe('game037 shapes and rotation', () => {
  it('keeps the seven assigned tetromino definitions with four distinct cells each', () => {
    expect(SHAPE_KEYS).toEqual(['I', 'O', 'L', 'J', 'T', 'S', 'Z']);
    for (const k of SHAPE_KEYS) {
      expect(SHAPES[k]).toHaveLength(4);
      expect(new Set(SHAPES[k].map(c => c.join(','))).size).toBe(4);
    }
    expect(SHAPES.L).toEqual([[0, 0], [0, 1], [0, 2], [1, 2]]);
    expect(SHAPES.J).toEqual([[1, 0], [1, 1], [0, 2], [1, 2]]);
  });

  it('rotates clockwise in screen space, normalizes and returns after four turns', () => {
    // I vertical → horizontal; L foot turns from bottom-right to bottom-left.
    expect(shapeCells('I', 1)).toEqual([[0, 0], [1, 0], [2, 0], [3, 0]]);
    expect(shapeCells('L', 1)).toEqual([[0, 0], [1, 0], [2, 0], [0, 1]]);
    expect(cellBounds(shapeCells('T', 1))).toEqual({w: 2, h: 3});
    for (const k of SHAPE_KEYS) {
      let c = shapeCells(k, 0);
      for (let i = 0; i < 4; i++) c = rotateCW(c);
      expect(key(c)).toBe(key(shapeCells(k, 0)));
    }
  });

  it('never mirrors: L and J, S and Z stay distinct under every rotation', () => {
    const orbit = (k: 'L' | 'J' | 'S' | 'Z') => new Set([0, 1, 2, 3].map(r => key(shapeCells(k, r as 0))));
    for (const [a, b] of [['L', 'J'], ['S', 'Z']] as const) {
      const A = orbit(a), B = orbit(b);
      for (const k of A) expect(B.has(k)).toBe(false);
    }
  });
});

describe('game037 stages', () => {
  it('uses the six fixed stages, each with four pieces and unique instance ids', () => {
    expect(STAGES).toEqual(['IIOO', 'OOLL', 'IOLL', 'ILTT', 'ILJZ', 'JTTS']);
    expect(new Set(STAGES).size).toBe(6);
    for (const s of STAGES) {
      const pieces = createPieces(s);
      expect(pieces).toHaveLength(4);
      expect(new Set(pieces.map(p => p.id)).size).toBe(4);
    }
    expect(createPieces('IIOO').map(p => p.id)).toEqual(['I1', 'I2', 'O1', 'O2']);
  });

  it('every stage has an exact cover using rotations only, with no overlap and full coverage', () => {
    for (const stage of STAGES) {
      const solutions = solveStage(stage, 1);
      expect(solutions.length, stage).toBe(1);
      const covered = new Map<string, string>();
      for (const p of solutions[0]) {
        for (const [x, y] of pieceCells(p, p.x, p.y)) {
          expect(x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE).toBe(true);
          expect(covered.has(`${x},${y}`), `${stage} overlap at ${x},${y}`).toBe(false);
          covered.set(`${x},${y}`, p.id);
        }
      }
      expect(covered.size).toBe(16);
      expect(solutions[0].map(p => p.id).sort()).toEqual(createPieces(stage).map(p => p.id).sort());
    }
  });

  it('solver rejects an impossible set (no false positives)', () => {
    // Four S pieces cannot tile a 4x4 box without mirroring.
    expect(solveStage('SSSS', 1)).toHaveLength(0);
    expect(solveStage('ZZZZ', 1)).toHaveLength(0);
  });
});

describe('game037 placement rules', () => {
  it('rejects out-of-bounds and overlapping placements without changing the board', () => {
    let pieces = createPieces('IIOO');
    expect(checkPlacement(pieces, 'I1', 0, 1)).toMatchObject({ok: false, reason: 'out'});
    expect(checkPlacement(pieces, 'I1', -1, 0)).toMatchObject({ok: false, reason: 'out'});
    expect(checkPlacement(pieces, 'O1', 3, 0)).toMatchObject({ok: false, reason: 'out'});
    pieces = pieces.map(p => p.id === 'I1' ? {...p, at: {x: 0, y: 0}} : p);
    expect(checkPlacement(pieces, 'O1', 0, 1)).toMatchObject({ok: false, reason: 'overlap'});
    expect(checkPlacement(pieces, 'I1', 1, 0)).toMatchObject({ok: false, reason: 'placed'});
    expect(checkPlacement(pieces, 'O1', 1, 1)).toMatchObject({ok: true});
    expect(occupancy(pieces).filter(Boolean)).toHaveLength(4);
    expect(checkPlacement(pieces, 'I1', 0.5, 0)).toMatchObject({ok: false, reason: 'unknown'});
  });

  it('tap placement finds the origin covering the tapped cell, preferring the first food cell', () => {
    const pieces = createPieces('ILJZ');
    expect(placementCovering(pieces, 'L1', 0, 0)).toEqual({x: 0, y: 0});
    // Tapping the bottom row: first cell cannot start there, a later cell aligns instead.
    expect(placementCovering(pieces, 'L1', 1, 3)).toEqual({x: 1, y: 1});
    const blocked = pieces.map(p => p.id === 'I1' ? {...p, at: {x: 0, y: 0}} : p);
    expect(placementCovering(blocked, 'L1', 0, 2)).toBeNull();
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
    expect(act(s, {type: 'rotate'}, 0).outcome).toEqual({ok: false, reason: 'noSelection'});
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
    expect(clockStart(c, 20000)).toBe(c); // idempotent while running
    let s = resume(createRun('run', 'r'), 0);
    s = suspend(s, 4000);
    s = resume(s, 60000); // 56 s in background are not counted
    s = solveThroughReducer(s, 61000);
    expect(s.phase).toBe('cleared');
    expect(s.results[0].activeMs).toBe(5000);
    expect(s.clock.since).toBeNull();
  });

  it('scores each stage with the assigned formula, clamped at zero', () => {
    expect(stageScore(0, 0, 0)).toBe(1000);
    expect(stageScore(12999, 2, 1)).toBe(1000 - 36 - 40 - 50);
    expect(stageScore(999, 0, 0)).toBe(1000);
    expect(stageScore(10 * 60 * 1000, 30, 30)).toBe(0);
  });

  it('a full run needs explicit next per stage, records six scores once, total 0..6000', () => {
    let s = started();
    let now = 0;
    for (let i = 0; i < STAGES.length; i++) {
      now += 2000;
      s = solveThroughReducer(s, now);
      expect(s.phase).toBe('cleared');
      expect(s.results).toHaveLength(i + 1);
      // Further input after the clear does not change the stage or rescore it.
      expect(act(s, {type: 'remove', id: s.pieces[0].id}, now).outcome).toEqual({ok: false, reason: 'inactive'});
      const next = act(s, {type: 'next'}, now);
      expect(next.outcome.ok).toBe(true);
      s = resume(next.state, now);
      expect(s.results).toHaveLength(i + 1);
    }
    expect(s.phase).toBe('complete');
    for (const r of s.results) {
      expect(r.activeMs).toBe(2000);
      expect(r.score).toBe(1000 - 3 * 2 - 20 * r.rotates);
    }
    expect(totalScore(s)).toBe(s.results.reduce((n, r) => n + r.score, 0));
    expect(totalScore(s)).toBeGreaterThanOrEqual(0);
    expect(totalScore(s)).toBeLessThanOrEqual(6000);
    expect(act(s, {type: 'next'}, now).outcome).toEqual({ok: false, reason: 'notCleared'});
  });

  it('practice never records stage results and "next" restarts the same practice board', () => {
    let s = started('practice');
    s = solveThroughReducer(s, 3000);
    expect(s.phase).toBe('cleared');
    expect(isFull(s.pieces)).toBe(true);
    expect(s.results).toHaveLength(0);
    const again = act(s, {type: 'next'}, 3000).state;
    expect(again.mode).toBe('practice');
    expect(again.phase).toBe('playing');
    expect(again.pieces.every(p => p.at === null)).toBe(true);
    expect(again.results).toHaveLength(0);
  });

  it('retry is a brand-new run with no carried stage, selection, counters or results', () => {
    let s = started();
    s = solveThroughReducer(s, 1000);
    s = resume(act(s, {type: 'next'}, 1000).state, 1000);
    s = act(s, {type: 'select', id: 'O1'}, 1000).state;
    s = act(s, {type: 'rotate'}, 1000).state;
    const fresh = createRun('run', 'r2');
    expect(fresh.stageIndex).toBe(0);
    expect(fresh.results).toEqual([]);
    expect(fresh.selectedId).toBeNull();
    expect(fresh.rotates + fresh.undos).toBe(0);
    expect(fresh.runId).not.toBe(s.runId);
  });
});
