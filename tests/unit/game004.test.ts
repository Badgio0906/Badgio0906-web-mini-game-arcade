import { describe, expect, it } from 'vitest';
import { EchoRun } from '../../src/games/game004/EchoRun';
import type { EchoEvent } from '../../src/games/game004/contracts';

function until(run: EchoRun, condition: () => boolean, budget = 20) {
  for (let t = 0; t < budget && !condition(); t += 1 / 240) run.step(1 / 240);
  expect(condition(), JSON.stringify(run.inspection())).toBe(true);
}
function recall(run: EchoRun) { until(run, () => run.snapshot().phase === 'recall'); }
function complete(run: EchoRun) {
  recall(run); const sequence = run.inspection().sequence;
  for (const cell of sequence) run.input(cell);
  return sequence.length;
}

describe('ECHO GRID sequence memory', () => {
  it('opens with two slow cues, ignores WATCH input, and only correct recall increments input count', () => {
    const emitted: EchoEvent[] = []; const run = new EchoRun(e => emitted.push(e), () => 0); run.start();
    expect(run.snapshot()).toMatchObject({ level: 1, phase: 'watch', totalLength: 2, correctInputs: 0, alive: true });
    expect(run.inspection().flashSeconds).toBeGreaterThanOrEqual(0.55);
    const seq = run.inspection().sequence; expect(seq[0]).not.toBe(seq[1]);
    for (let cell = 0; cell < 9; cell++) expect(run.input(cell)).toBe(false);
    expect(emitted.filter(e => e.type === 'mistake')).toHaveLength(0);
    expect(run.snapshot().correctInputs).toBe(0);
    recall(run); expect(run.input(seq[0])).toBe(true);
    expect(run.snapshot()).toMatchObject({ level: 1, correctInputs: 1, index: 1, alive: true });
    run.input(seq[1]); expect(run.snapshot().correctInputs).toBe(2);
    until(run, () => run.snapshot().level === 2);
    expect(run.snapshot().level).toBe(2); expect(run.snapshot().correctInputs).toBe(2);
  });

  it('reached level differs from completed levels; failure on the first recall scores reached LEVEL 1', () => {
    const emitted: EchoEvent[] = []; const run = new EchoRun(e => emitted.push(e), () => 0.25); run.start(); recall(run);
    const inspection = run.inspection(); run.input((inspection.expectedCell! + 1) % 9);
    expect(run.snapshot()).toMatchObject({ level: 1, correctInputs: 0, alive: false, phase: 'ended' });
    expect(run.result()).toMatchObject({ level: 1, expectedCell: inspection.expectedCell, actualCell: (inspection.expectedCell! + 1) % 9, sequence: inspection.sequence });
    expect(emitted.filter(e => e.type === 'level_clear')).toHaveLength(0);
    for (let i = 0; i < 20; i++) { run.input(inspection.expectedCell!); run.step(.05); }
    expect(emitted.filter(e => e.type === 'mistake')).toHaveLength(1);
    expect(run.snapshot().correctInputs).toBe(0);
  });

  it('recall has no hidden deadline and preserves a partial answer during a long thinking interval', () => {
    const run = new EchoRun(() => {}, () => 0.5); run.start(); recall(run);
    run.input(run.inspection().sequence[0]);
    for (let n = 0; n < 2400; n++) run.step(0.05);
    expect(run.snapshot()).toMatchObject({ alive: true, phase: 'recall', level: 1, correctInputs: 1, index: 1 });
    expect(run.snapshot().highlightedCell).toBe(null);
  });

  it('same-cell cues after the beginner levels have an explicit visible off interval', () => {
    const run = new EchoRun(() => {}, () => 0); run.start();
    for (let level = 1; level < 4; level++) { complete(run); until(run, () => run.snapshot().level === level + 1); }
    const sequence = run.inspection().sequence;
    expect(sequence.some((cell, i) => i > 0 && cell === sequence[i - 1])).toBe(true);
    until(run, () => run.snapshot().highlightedCell !== null);
    const first = run.snapshot().highlightedCell;
    until(run, () => run.snapshot().highlightedCell === null);
    const offStart = run.snapshot().time;
    until(run, () => run.snapshot().highlightedCell !== null);
    expect(run.snapshot().time - offStart).toBeGreaterThanOrEqual(run.inspection().gapSeconds - 1 / 240);
    expect(run.snapshot().highlightedCell).toBe(first);
  });

  it('40 completed levels keep a nine-cell maximum, readable timing floors and at most two consecutive identical cues', () => {
    const run = new EchoRun(() => {}, () => 0); run.start(); let correct = 0;
    for (let level = 1; level <= 40; level++) {
      const current = run.inspection();
      expect(current.level).toBe(level); expect(current.sequence.length).toBeGreaterThanOrEqual(2); expect(current.sequence.length).toBeLessThanOrEqual(9);
      expect(current.flashSeconds).toBeGreaterThanOrEqual(.28); expect(current.gapSeconds).toBeGreaterThanOrEqual(.12);
      expect(current.sequence.every(cell => Number.isInteger(cell) && cell >= 0 && cell <= 8)).toBe(true);
      for (let i = 2; i < current.sequence.length; i++) expect(current.sequence[i] === current.sequence[i - 1] && current.sequence[i] === current.sequence[i - 2]).toBe(false);
      correct += complete(run); until(run, () => run.snapshot().level === level + 1);
      expect(run.snapshot()).toMatchObject({ alive: true, correctInputs: correct });
    }
  });

  it('diagnostic/result sequence copies cannot alter expected answers; invalid inputs and frame times are ignored', () => {
    const run = new EchoRun(() => {}, () => .5); run.start();
    const original = run.inspection().sequence[0]; const copy = run.inspection(); copy.sequence[0] = -100;
    expect(run.inspection().sequence[0]).toBe(original);
    run.step(NaN); run.step(Infinity); run.step(-1); expect(run.snapshot().time).toBe(0);
    run.step(1); expect(run.snapshot().time).toBeCloseTo(.05, 8);
    recall(run); for (const cell of [-1, 9, NaN, 1.2]) expect(run.input(cell)).toBe(false);
    expect(run.snapshot()).toMatchObject({ alive: true, correctInputs: 0 });
    run.input((original + 1) % 9); const result = run.result()!; result.sequence[0] = -100; result.level = 999;
    expect(run.result()!.sequence[0]).toBe(original); expect(run.result()!.level).toBe(1);
    run.reset(); expect(run.snapshot()).toMatchObject({ alive: false, level: 1, correctInputs: 0 });
    run.start(); expect(run.snapshot()).toMatchObject({ alive: true, level: 1, phase: 'watch', correctInputs: 0 });
  });
});
