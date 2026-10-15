import { describe, it, expect } from 'vitest';
import { SortRun, FEVER_SECONDS, decisionSecondsAt } from '../../src/games/game005/SortRun';
import type { SortEvent } from '../../src/games/game005/contracts';
function wait(run: SortRun, predicate: () => boolean, seconds = 10) {
  for (let t = 0; t < seconds && !predicate(); t += .005) run.step(.005);
  expect(predicate()).toBe(true);
}
function answer(run: SortRun) { wait(run, () => run.phase === 'sorting'); run.input(run.inspection().expectedSide!); }
describe('SORT SHIFT v2 combo score and finite fever', () => {
  it('awards more for fast answers and consecutive answers, resetting combo on a recoverable miss', () => {
    const fast = new SortRun(undefined, () => 0), slow = new SortRun(undefined, () => 0); fast.start(); slow.start();
    fast.input('left'); for (let t = 0; t < 2; t += .01) slow.step(.01); slow.input('left');
    expect(fast.score).toBeGreaterThan(slow.score);
    for (let n = 1; n < 5; n++) answer(fast);
    expect(fast.lastPoints).toBeGreaterThan(150); expect(fast.maxCombo).toBe(5);
    wait(fast, () => fast.phase === 'sorting'); const before = fast.score; fast.input('right');
    expect(fast.snapshot()).toMatchObject({ score: before, combo: 0, maxCombo: 5, lives: 2, feverGauge: 0, phase: 'miss' });
    expect(fast.input('left')).toBe(false); answer(fast); expect(fast.combo).toBe(1);
  });
  it('starts at 8, boosts points and tempo, expires even during continued correct answers, then requires another eight', () => {
    const events: SortEvent[] = []; const run = new SortRun(e => events.push(e), () => 0); run.start();
    for (let n = 0; n < 7; n++) answer(run);
    expect(run.feverRemaining).toBe(0); expect(run.feverGauge).toBe(7);
    answer(run); expect(run.feverRemaining).toBe(FEVER_SECONDS);
    wait(run, () => run.phase === 'sorting');
    expect(run.snapshot().decisionSeconds).toBeCloseTo(decisionSecondsAt(8) * .8);
    const start = run.time;
    while (run.feverRemaining > 0) { if (run.phase === 'sorting') run.input(run.inspection().expectedSide!); run.step(.005); }
    expect(run.time - start).toBeLessThanOrEqual(6);
    expect(events.filter(e => e.type === 'fever' && e.active)).toHaveLength(1);
    expect(events.filter(e => e.type === 'fever' && !e.active)).toHaveLength(1);
    expect(run.feverGauge).toBe(0);
    for (let n = 0; n < 7; n++) answer(run);
    expect(run.feverRemaining).toBe(0); answer(run); expect(run.feverRemaining).toBe(6);
  });
  it('does not repeat a rule switch after mistakes at a boundary and freezes a parcel deadline through fever expiry', () => {
    const run = new SortRun(undefined, () => 0); run.start(); for (let n = 0; n < 8; n++) answer(run);
    wait(run, () => run.phase === 'sorting'); const rule = run.inspection().rule;
    run.input('right'); wait(run, () => run.phase === 'sorting');
    expect(run.ruleChanges).toBe(1); expect(run.rule).toEqual(rule);
    while (run.feverRemaining > .4) { if (run.phase === 'sorting') run.input(run.inspection().expectedSide!); run.step(.005); }
    wait(run, () => run.phase === 'sorting'); const deadline = run.snapshot().decisionSeconds;
    while (run.feverRemaining > 0) run.step(.005);
    expect(run.snapshot().decisionSeconds).toBe(deadline);
  });
});
