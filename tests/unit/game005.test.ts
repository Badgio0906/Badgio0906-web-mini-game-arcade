import { describe, expect, it } from 'vitest';
import { SortRun } from '../../src/games/game005/SortRun';
import type { SortEvent, SortInspection, SortSide } from '../../src/games/game005/contracts';

const leftTrait = { shape: 'round', brightness: 'light', size: 'small', symbol: 'circle' } as const;
function answer(run: SortInspection): SortSide {
  return (run.parcel![run.rule.dimension] === leftTrait[run.rule.dimension]) !== run.rule.inverted ? 'left' : 'right';
}
function seeded(seed: number) { let n = seed; return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; }
function until(run: SortRun, condition: () => boolean, seconds = 8) {
  for (let t = 0; t < seconds && !condition(); t += 1 / 240) run.step(1 / 240);
  expect(condition(), JSON.stringify(run.inspection())).toBe(true);
}
function ready(run: SortRun) { until(run, () => run.snapshot().phase === 'sorting'); }

describe('SORT SHIFT parcel rules', () => {
  it('starts with one long-deadline shape parcel and keeps all four distinct traits', () => {
    const run = new SortRun(() => {}, () => 0); run.start();
    expect(run.snapshot()).toMatchObject({ sorted: 0, combo: 0, alive: true, phase: 'sorting', rule: { dimension: 'shape', inverted: false }, ruleChanges: 0 });
    expect(run.snapshot().decisionSeconds).toBeGreaterThanOrEqual(4.5);
    expect(run.snapshot().decisionSeconds).toBeLessThanOrEqual(5);
    expect(run.inspection().parcel).toMatchObject({shape:'round',brightness:'light',size:'small',symbol:'circle'});
    expect(run.inspection().expectedSide).toBe('left');
    run.input('left'); expect(run.snapshot()).toMatchObject({sorted:1,combo:1,phase:'dispatch'});
  });

  it('dispatch rejects every burst without queuing input for the next parcel', () => {
    const emitted: SortEvent[] = []; const run = new SortRun(e => emitted.push(e), () => 0); run.start();
    const initial = run.inspection().parcel!.id;
    run.input('left');
    for (let i = 0; i < 40; i++) { expect(run.input('left')).toBe(false); run.step(1 / 240); }
    expect(run.snapshot().sorted).toBe(1);
    ready(run); run.step(.05);
    expect(run.snapshot()).toMatchObject({sorted:1,phase:'sorting',alive:true});
    expect(run.inspection().parcel!.id).toBeGreaterThan(initial);
    expect(emitted.filter(e => e.type === 'correct')).toHaveLength(1);
  });

  it('four rule dimensions and both directions match domain labels across three seeded 128-parcel runs', () => {
    for (const seed of [1,17,77]) {
      const emitted: SortEvent[] = []; const run = new SortRun(e => emitted.push(e), seeded(seed)); run.start();
      const seen = new Set<string>(); const traits = new Set<string>(); let lastDecision = 5;
      for (let n = 0; n < 128; n++) {
        ready(run); const state = run.inspection(); const expected = answer(state);
        expect(state.expectedSide).toBe(expected);
        expect(state.rule.dimension).toBe(['shape','brightness','size','symbol'][Math.floor(n / 8) % 4]);
        expect(state.rule.inverted).toBe(Math.floor(n / 32) % 2 === 1);
        seen.add(`${state.rule.dimension}:${state.rule.inverted}`); traits.add(`${state.rule.dimension}:${state.parcel![state.rule.dimension]}`);
        expect(state.decisionSeconds).toBeLessThanOrEqual(lastDecision); expect(state.decisionSeconds).toBeGreaterThanOrEqual(1.3); lastDecision = state.decisionSeconds;
        expect(run.input(expected)).toBe(true); expect(run.snapshot().sorted).toBe(n + 1);
      }
      expect(seen.size).toBe(8); expect(traits.size).toBe(8);
      expect(emitted.filter(e => e.type === 'correct')).toHaveLength(128);
      expect(emitted.filter(e => e.type === 'mistake' || e.type === 'timeout')).toHaveLength(0);
    }
  });

  it('rule change announces the new mapping for about .95 seconds with no active parcel or accepted input', () => {
    const run = new SortRun(() => {}, () => 0); run.start();
    for (let n = 0; n < 8; n++) { ready(run); run.input(answer(run.inspection())); }
    until(run, () => run.snapshot().phase === 'rule_change'); const before = run.inspection();
    expect(before.rule).toMatchObject({dimension:'brightness',inverted:false}); expect(before.ruleChanges).toBe(1); expect(before.parcel).toBeNull();
    expect(before.phaseRemaining).toBeGreaterThan(.9); expect(before.phaseRemaining).toBeLessThanOrEqual(1);
    for (let i = 0; i < 100; i++) { expect(run.input(i % 2 ? 'left' : 'right')).toBe(false); run.step(1 / 240); }
    expect(run.snapshot()).toMatchObject({phase:'rule_change',sorted:8,combo:8,alive:true});
    ready(run); expect(run.snapshot().sorted).toBe(8); expect(run.inspection().parcel).not.toBeNull();
  });

  it('wrong side and deadline produce separate immediate single terminal outcomes with honest correct-direction feedback', () => {
    for (const outcome of ['wrong','timeout'] as const) {
      const events: SortEvent[] = []; const run = new SortRun(e => events.push(e), () => 0); run.start();
      if (outcome === 'wrong') run.input('right');
      else { for (let i = 0; i < 95; i++) run.step(.05); expect(run.snapshot().alive).toBe(true); run.step(.05); }
      expect(run.snapshot()).toMatchObject({alive:false,phase:'ended',sorted:0});
      expect(run.result()).toMatchObject({outcome,expectedSide:'left',actualSide:outcome==='wrong'?'right':null});
      expect(run.result()!.correctSummary.length).toBeGreaterThan(0);
      for (let i = 0; i < 20; i++) { expect(run.input('left')).toBe(false); run.step(.05); }
      expect(events.filter(e => e.type === outcome || e.type === 'mistake')).toHaveLength(1);
    }
  });

  it('copies cannot change rules/traits/results and invalid frame time cannot silently consume a deadline', () => {
    const run = new SortRun(() => {}, () => 0); run.start(); const copy = run.inspection(); copy.rule.inverted = true; copy.parcel!.shape = 'angular';
    expect(run.inspection()).toMatchObject({rule:{inverted:false},parcel:{shape:'round'},expectedSide:'left'});
    const remaining = run.snapshot().remaining; run.step(NaN); run.step(Infinity); run.step(-1); expect(run.snapshot().remaining).toBe(remaining);
    run.step(10); expect(run.snapshot().time).toBeCloseTo(.05,8);
    expect(run.input('invalid' as SortSide)).toBe(false); expect(run.snapshot().alive).toBe(true);
    run.input('right'); const result = run.result()!; result.rule.inverted = true; result.parcel.shape = 'angular';
    expect(run.result()).toMatchObject({rule:{inverted:false},parcel:{shape:'round'},expectedSide:'left'});
    run.reset(); expect(run.snapshot()).toMatchObject({alive:false,sorted:0,ruleChanges:0}); run.start(); expect(run.snapshot()).toMatchObject({alive:true,sorted:0,phase:'sorting'});
  });
});
