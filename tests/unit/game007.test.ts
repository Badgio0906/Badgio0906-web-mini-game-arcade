import { describe, expect, it } from 'vitest';
import { ElevatorRun, BOARD_SECONDS, UNLOAD_SECONDS, SPECIAL_SCORE } from '../../src/games/game007/ElevatorRun';
import { floorParties } from '../../src/games/game007/scenarios';
import type { ElevatorEvent, ElevatorSnapshot } from '../../src/games/game007/contracts';
function wait(run: ElevatorRun, condition: () => boolean, budget = 100) { for (let n = 0; n < budget * 20 && run.snapshot().alive && !condition(); n++) run.step(.05); expect(condition(), JSON.stringify(run.snapshot())).toBe(true); }
function settle(run: ElevatorRun) { wait(run, () => run.snapshot().phase === 'boarding' || !run.snapshot().alive || !!run.snapshot().pending); }
function depart(run: ElevatorRun) { expect(run.input('depart')).toBe(true); settle(run); }
function policy(s: ElevatorSnapshot, kind: 'greedy' | 'light' | 'planning') {
  const p = s.currentParty!; if (s.load + p.kg > 450) return false;
  if (kind === 'greedy') return true;
  if (kind === 'light') return p.kg <= 150;
  if (p.deadline !== null && s.minimumArrival! > p.deadline) return false;
  if (p.value >= 600) return true;
  if (p.value / p.kg < 1.5 && p.destination - s.floor > 2) return false;
  const upcoming = s.future.flatMap(f => f.parties).filter(f => f.value >= 340 && f.floor < p.destination);
  if (upcoming.some(f => s.load + p.kg + f.kg > 450) && p.value < 300) return false;
  return true;
}
export function playPolicy(scenario: number, kind: 'greedy' | 'light' | 'planning') {
  const events: ElevatorEvent[] = []; const run = new ElevatorRun(e => events.push(e)); run.start(scenario);
  for (let n = 0; n < 100 && run.snapshot().alive; n++) {
    const s = run.snapshot(); if (s.pending) { run.choose('finish'); break; }
    if (!s.currentParty) depart(run); else { run.input(policy(s, kind) ? 'accept' : 'refuse'); settle(run); }
  }
  return { ...run.result()!, events };
}
describe('Game007 transport rules v2', () => {
  it('scores only at actual destination after deterministic unload; weight conserved and passenger removed', () => {
    const events: ElevatorEvent[] = [], run = new ElevatorRun(e => events.push(e)); run.start();
    expect(run.input('accept')).toBe(true); expect(run.snapshot()).toMatchObject({ load: 70, score: 0 }); settle(run);
    run.input('depart'); settle(run); expect(run.snapshot()).toMatchObject({ floor: 2, load: 70, score: 0 });
    depart(run); expect(run.snapshot()).toMatchObject({ floor: 3, load: 0, score: 100, deliveredPeople: 1 });
    expect(run.snapshot().aboard).toHaveLength(0); expect(events.filter(e => e.type === 'delivery')).toHaveLength(1);
    expect(run.snapshot().time).toBeCloseTo(BOARD_SECONDS + 2 * 1.4 + UNLOAD_SECONDS);
  });
  it('prevents overload without finishing, exposes projection and leaves declined candidates permanently consumed', () => {
    const run = new ElevatorRun(); run.start(); run.input('accept'); settle(run); run.input('accept'); settle(run); depart(run);
    expect(run.snapshot().load).toBe(390); const p = run.snapshot().currentParty;
    expect(run.input('accept')).toBe(false); expect(run.snapshot().alive).toBe(true); expect(run.snapshot().currentParty).toEqual(p);
    expect(run.input('refuse')).toBe(true); settle(run); expect(run.snapshot().currentParty?.id).not.toBe(p?.id);
    const future = run.snapshot().future; depart(run); expect(run.snapshot().queue).toEqual(future[0].parties);
    expect(run.snapshot().load).toBe(320);
  });
  it('departing non-full preserves room for valuable next-floor delivery and grouped destinations share unload stop', () => {
    const run = new ElevatorRun(); run.start(); run.input('accept'); settle(run); depart(run);
    expect(run.snapshot().load).toBe(70); run.input('accept'); settle(run); run.input('accept'); settle(run); depart(run);
    expect(run.snapshot()).toMatchObject({ floor: 3, load: 180, score: 200 });
    expect(run.snapshot().lastUnloaded).toHaveLength(2);
    expect(run.snapshot().time).toBeCloseTo(3 * .7 + 2 * 1.4 + .8);
    depart(run); expect(run.snapshot()).toMatchObject({ floor: 4, load: 0, score: 680 });
  });
  it('deadlines use same model time and expired passengers unload but earn zero', () => {
    const run = new ElevatorRun(); run.start(); depart(run);
    const predicted = run.snapshot().minimumArrival!; run.input('accept'); settle(run); depart(run); depart(run);
    expect(run.snapshot().time).toBeCloseTo(predicted); expect(run.snapshot().score).toBe(480);
    const late = new ElevatorRun(); late.start(); depart(late); late.input('accept'); settle(late);
    for (let n = 0; n < 12 * 20; n++) late.step(.05); depart(late); depart(late);
    expect(late.snapshot()).toMatchObject({ load: 0, score: 0, expired: 1, delivered: 0 });
  });
  it('three scenarios reward planning and do not make always-light or always-full optimal', () => {
    const results = [0, 1, 2].map(scenario => ({ scenario, greedy: playPolicy(scenario, 'greedy').score, light: playPolicy(scenario, 'light').score, planning: playPolicy(scenario, 'planning').score }));
    console.info('POLICY_RESULTS', JSON.stringify(results));
    expect(results.filter(r => r.planning > r.greedy)).toHaveLength(2); expect(results.every(r => r.planning > r.light)).toBe(true);
    expect(floorParties(1, 1)[1].value).toBeGreaterThan(floorParties(1, 0)[1].value);
    expect(results[1].greedy).toBeGreaterThan(results[1].planning);
  });
  it('roof offer is conditional, freezes clock and either finishes or starts special capacity tradeoff', () => {
    const run = new ElevatorRun(); run.start();
    for (let n = 0; n < 100 && run.snapshot().alive && !run.snapshot().pending; n++) { const s = run.snapshot(); run.input(s.currentParty ? policy(s, 'planning') ? 'accept' : 'refuse' : 'depart'); settle(run); }
    expect(run.snapshot().score).toBeGreaterThanOrEqual(SPECIAL_SCORE); const frozen = run.snapshot(); for (let n = 0; n < 100; n++) run.step(.05); expect(run.snapshot()).toEqual(frozen);
    expect(run.choose('roof')).toBe(true); expect(run.snapshot()).toMatchObject({ floor: 10, mode: 'roof', remaining: 28 });
    run.input('accept'); settle(run); depart(run); expect(run.snapshot()).toMatchObject({ floor: 11, load: 320 }); expect(run.input('accept')).toBe(true); settle(run); expect(run.snapshot().load).toBe(430);
    expect(run.choose('finish')).toBe(false);
    for (let n = 0; n < 20 && run.snapshot().alive; n++) { run.input('depart'); settle(run); }
    expect(run.result()).toMatchObject({ outcome: 'complete', floor: 14, mode: 'roof' });
    expect(playPolicy(0, 'light').score).toBeLessThan(SPECIAL_SCORE);
  });
  it('practice uses same transport but isolated short scenario can teach non-full depart and express delivery', () => {
    const run = new ElevatorRun(); run.start(0, true); run.input('accept'); settle(run); depart(run);
    run.input('accept'); settle(run); depart(run); depart(run);
    expect(run.result()).toMatchObject({ score: 550, delivered: 2, floor: 4, outcome: 'complete' });
  });
  it('finite timeout ends once; readonly snapshots and invalid dt cannot corrupt run or queue', () => {
    const events: ElevatorEvent[] = [], run = new ElevatorRun(e => events.push(e)); run.start(); const initial = run.snapshot();
    const copy = run.snapshot(); copy.queue[0].kg = -99; copy.future[0].parties.length = 0; expect(run.snapshot()).toEqual(initial);
    [NaN, Infinity, -1, 0].forEach(dt => run.step(dt)); expect(run.snapshot()).toEqual(initial);
    run.step(100); expect(run.snapshot().time).toBeCloseTo(.05);
    for (let n = 0; n < 1300; n++) run.step(.05); expect(run.result()).toMatchObject({ outcome: 'timeout', score: 0, floor: 1 });
    const end = run.snapshot(); run.step(.05); expect(run.input('depart')).toBe(false); expect(run.snapshot()).toEqual(end);
  });
});
