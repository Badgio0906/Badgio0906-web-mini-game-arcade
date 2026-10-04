import { describe, expect, it } from 'vitest';
import { ElevatorRun, CAPACITY_KG, decisionSecondsAt, travelSecondsFor } from '../../src/games/game007/ElevatorRun';
import type { ElevatorEvent, ElevatorSide } from '../../src/games/game007/contracts';

const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
function until(run: ElevatorRun, condition: () => boolean, budget = 10) {
  for (let n = 0; n < budget / .05 && run.snapshot().alive && !condition(); n++) run.step(.05);
  expect(condition(), JSON.stringify(run.inspection())).toBe(true);
}
function board(run: ElevatorRun, side: ElevatorSide) {
  until(run, () => run.snapshot().phase === 'boarding');
  const floor = run.snapshot().floor;
  expect(run.input(side)).toBe(true);
  if (run.snapshot().alive) until(run, () => run.snapshot().floor === floor + 1);
}
function start(seed = 1, events: ElevatorEvent[] = []) {
  const run = new ElevatorRun(event => events.push(event), seeded(seed)); run.start(); return run;
}

describe('Elevator capacity, real delivery and irreversible20F choice', () => {
  it('unloads before boarding and commits overload immediately once, before its warning animation', () => {
    const events: ElevatorEvent[] = []; const run = start(1, events);
    board(run, 'accept'); board(run, 'accept'); board(run, 'accept');
    expect(run.snapshot()).toMatchObject({ floor: 4, load: 330, deliveredPeople: 1, deliveredCargo: 0 });
    until(run, () => run.snapshot().phase === 'boarding');
    expect(run.input('accept')).toBe(true);
    expect(run.snapshot()).toMatchObject({ alive: false, phase: 'overload', load: 635, excessKg: 185 });
    expect(run.result()).toMatchObject({ outcome: 'overload', floor: 4, load: 635, excessKg: 185 });
    const ending = run.inspection();
    for (let n = 0; n < 100; n++) { run.step(.05); expect(run.input('refuse')).toBe(false); }
    expect(run.inspection()).toEqual(ending);
    expect(events.filter(event => event.type === 'overload')).toHaveLength(1);
    const copy = run.result()!; copy.party.items[0].kg = -1; expect(run.result()!.party.items[0].kg).toBe(85);
  });

  it('NEXT is the actual next party with no reroll, and declining a fitting long-haul cargo preserves a better delivery', () => {
    let draws = 0; const run = new ElevatorRun(() => {}, () => { draws++; return .8; }); run.start();
    const next = run.snapshot().nextParty; board(run, 'accept'); expect(run.snapshot().currentParty).toEqual(next);
    expect(draws).toBe(0); board(run, 'accept'); expect(draws).toBe(0);
    board(run, 'refuse'); expect(draws).toBe(3); expect(run.snapshot().load).toBe(90);
    board(run, 'accept'); board(run, 'refuse');
    expect(run.snapshot()).toMatchObject({ floor: 6, deliveredPeople: 3, deliveredCargo: 1, load: 0 });
    const prudent = run.snapshot();
    const greedy = start(); board(greedy, 'accept'); board(greedy, 'accept'); board(greedy, 'accept');
    board(greedy, 'refuse'); board(greedy, 'refuse');
    expect(greedy.snapshot()).toMatchObject({ floor: 6, deliveredPeople: 2, deliveredCargo: 0, load: 240 });
    expect(prudent.score).toBeGreaterThan(greedy.snapshot().score);
    expect(prudent.score - greedy.snapshot().score).toBeGreaterThan(350);
  });

  it('empty refusal and expired decisions earn no points, do not end a run, and retain bounded forecast data', () => {
    const events: ElevatorEvent[] = []; const run = start(2, events);
    until(run, () => run.snapshot().floor === 2, 10);
    expect(run.snapshot()).toMatchObject({ score: 0, timedOut: 1, refused: 1, alive: true });
    for (let floor = 2; floor < 1000; floor++) {
      if (run.snapshot().pending) expect(run.choose('normal')).toBe(true);
      board(run, 'refuse');
      const s = run.snapshot();
      expect(s).toMatchObject({ score: 0, load: 0, occupiedFloors: 0, deliveredPeople: 0, deliveredCargo: 0 });
      expect(s.aboard).toHaveLength(0); expect(s.nextUnload).toBeNull();
      expect(s.nextParty.id).toBe(s.currentParty.id + 1); expect(s.nextParty.items.length).toBeLessThanOrEqual(2);
    }
    expect(events.filter(event => event.type === 'milestone')).toHaveLength(1);
    expect(run.result()).toBeNull();
  });

  it('20F freezes the whole turn; fast is latched and affects only future delivery and occupied-travel points', () => {
    const normalEvents: ElevatorEvent[] = []; const fastEvents: ElevatorEvent[] = [];
    const normal = start(3, normalEvents); const fast = start(3, fastEvents);
    for (const run of [normal, fast]) {
      for (let floor = 1; floor < 20; floor++) board(run, floor === 19 ? 'accept' : 'refuse');
      const frozen = run.inspection();
      expect(frozen).toMatchObject({ floor: 20, phase: 'choice', pending: 'floor20', alive: true, mode: 'normal' });
      for (let n = 0; n < 50; n++) { run.step(.05); expect(run.input('accept')).toBe(false); }
      expect(run.inspection()).toEqual(frozen); expect(run.result()).toBeNull();
    }
    const oldScore = fast.snapshot().score; expect(oldScore).toBeGreaterThan(0);
    expect(normal.choose('normal')).toBe(true); expect(fast.choose('fast')).toBe(true);
    expect(fast.choose('normal')).toBe(false); expect(fast.snapshot().score).toBe(oldScore);
    expect(fast.snapshot()).toMatchObject({ mode: 'fast', scoreMultiplier: 1.5, travelSeconds: .58, decisionSeconds: 3.2 });
    for (let floor = 20; floor < 28; floor++) { board(normal, 'refuse'); board(fast, 'refuse'); }
    const newPoints = (events: ElevatorEvent[]) => events.slice(events.findIndex(event => event.type === 'choice') + 1)
      .filter((event): event is Extract<ElevatorEvent, { type: 'floor' | 'delivery' }> => event.type === 'floor' || event.type === 'delivery').map(event => event.points);
    expect(newPoints(fastEvents)).toEqual(newPoints(normalEvents).map(points => Math.round(points * 1.5)));
    expect(fast.snapshot().score - oldScore).toBe(newPoints(fastEvents).reduce((sum, n) => sum + n, 0));
    expect(fast.snapshot().time).toBeLessThan(normal.snapshot().time);
    expect(fastEvents.filter(event => event.type === 'milestone')).toHaveLength(1);
    expect(fastEvents.filter(event => event.type === 'choice')).toHaveLength(1);
    expect(decisionSecondsAt(1000, 'normal')).toBe(4.5); expect(decisionSecondsAt(1000, 'fast')).toBe(2);
    expect(travelSecondsFor('normal')).toBe(1.15);
    fast.start(); expect(fast.snapshot()).toMatchObject({ floor: 1, score: 0, time: 0, load: 0, mode: 'normal', scoreMultiplier: 1, pending: null });
  });

  it('exact450kg remains legal; accepting the next party above capacity ends on that action, not the next tick', () => {
    let found = false;
    for (let seed = 1; seed <= 25 && !found; seed++) {
      const run = start(seed);
      for (let n = 0; n < 180 && !found; n++) {
        if (run.snapshot().pending) run.choose('normal');
        until(run, () => run.snapshot().phase === 'boarding');
        const s = run.snapshot();
        if (s.load + s.currentParty.kg === CAPACITY_KG) {
          expect(run.input('accept')).toBe(true); expect(run.snapshot()).toMatchObject({ alive: true, load: 450 });
          until(run, () => run.snapshot().phase === 'boarding');
          // Continue legally until an actual non-empty load makes the offered party too heavy.
          for (let extra = 0; extra < 20 && run.snapshot().load + run.snapshot().currentParty.kg <= 450; extra++) {
            board(run, 'accept'); if (run.snapshot().pending) run.choose('normal'); until(run, () => run.snapshot().phase === 'boarding');
          }
          expect(run.snapshot().load + run.snapshot().currentParty.kg).toBeGreaterThan(450);
          run.input('accept'); expect(run.result()!.excessKg).toBeGreaterThan(0); expect(run.snapshot().alive).toBe(false); found = true;
        } else board(run, s.load + s.currentParty.kg <= 450 ? 'accept' : 'refuse');
      }
    }
    expect(found, 'public seeded party play must exercise exact capacity').toBe(true);
  });

  it('five long legal policies preserve manifest weights, forecasts and bounded aboard data, including fast mode', () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 5; seed++) {
      const run = start(seed);
      for (let n = 0; n < 300; n++) {
        if (run.snapshot().pending) run.choose(seed % 2 ? 'fast' : 'normal');
        until(run, () => run.snapshot().phase === 'boarding');
        const s = run.snapshot(); s.currentParty.items.forEach(item => kinds.add(item.kind));
        expect(s.load).toBe(s.aboard.reduce((sum, party) => sum + party.kg, 0));
        expect(s.aboard.length).toBeLessThanOrEqual(6); expect(s.load).toBeLessThanOrEqual(450);
        expect(s.currentParty.kg).toBe(s.currentParty.items.reduce((sum, item) => sum + item.kg, 0));
        expect(s.currentParty.kg).toBeLessThanOrEqual(450);
        const next = s.nextParty; board(run, s.load + s.currentParty.kg <= 450 ? 'accept' : 'refuse');
        expect(run.snapshot().currentParty).toEqual(next);
      }
      expect(run.snapshot().alive).toBe(true); expect(run.snapshot().score).toBeGreaterThan(0);
    }
    expect(kinds).toEqual(new Set(['office','courier','visitor','boxes','plant','copier','fridge']));
  });

  it('snapshots cannot mutate passengers or forecasts; phase bursts do not queue future boarding and dt is bounded', () => {
    const run = start(); const original = run.inspection(); const copy = run.inspection();
    copy.currentParty.items[0].kg = -99; copy.nextParty.destination = 999; expect(run.inspection()).toEqual(original);
    for (const invalid of [NaN, Infinity, -1, 0]) run.step(invalid); expect(run.inspection()).toEqual(original);
    run.step(99); expect(run.snapshot().time).toBeCloseTo(.05);
    run.input('accept'); const aboard = run.snapshot(); aboard.aboard[0].items[0].kg = -1;
    expect(run.snapshot().aboard[0].items[0].kg).toBe(65);
    for (let n = 0; n < 40; n++) expect(run.input('accept')).toBe(false);
    until(run, () => run.snapshot().phase === 'boarding'); expect(run.snapshot().load).toBe(65);
    expect(run.snapshot().currentParty.id).toBe(2); expect(run.snapshot().lastSide).toBeNull();
  });
});
