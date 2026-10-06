import { describe, expect, it } from 'vitest';
import { CONFIG, Simulation, angularAcceleration, createState, lengthAt, step } from '../../src/prototypes/stick-balance/model';

describe('isolated palm balance prototype', () => {
  it('falls without input and with either direction held', () => {
    for (const input of [-1, 0, 1]) {
      const s = createState();
      for (let i = 0; i < 120 * 20 && !s.over; i++) step(s, input);
      expect(s.over).toBe(true);
      if (input === 0) expect(s.time).toBeGreaterThan(3);
    }
  });
  it('shorter rods respond faster to identical gravity and hand acceleration', () => {
    const responses = CONFIG.stages.map(({ length }) => angularAcceleration(.2, 0, 0, length));
    responses.forEach((a, i) => { if (i) expect(a).toBeGreaterThan(responses[i - 1]); });
    expect(Math.abs(angularAcceleration(0, 0, 1, 1.15))).toBeGreaterThan(Math.abs(angularAcceleration(0, 0, 1, 3)));
  });
  it('has continuous, monotonic shortening at all four boundaries', () => {
    for (const stage of CONFIG.stages.slice(1)) {
      expect(lengthAt(stage.at).length).toBeCloseTo(lengthAt(stage.at - .0001).length, 6);
      expect(lengthAt(stage.at + CONFIG.shrinkDuration).length).toBe(stage.length);
      const s = createState(); s.time = stage.at - CONFIG.step; s.angle = .1; s.omega = .1;
      step(s, 0);
      expect(Math.abs(s.angle - .1)).toBeLessThan(.002);
      expect(s.over).toBe(false);
    }
  });
  it('uses the same fixed steps at 30, 60, 120 and 144Hz', () => {
    const states = [30, 60, 120, 144].map(hz => {
      const sim = new Simulation();
      for (let i = 0; i < hz * 3; i++) sim.advance(1 / hz, 0);
      return sim.state;
    });
    for (const s of states) { expect(s.angle).toBeCloseTo(states[0].angle, 10); expect(s.time).toBeCloseTo(3, 9); }
  });
  it('mirrors left and right, including recoveries', () => {
    const left = createState(-1), right = createState(1);
    for (let i = 0; i < 300; i++) {
      const input = i < 8 ? 1 : i < 16 ? -1 : 0;
      step(right, input); step(left, -input);
      expect(left.angle).toBeCloseTo(-right.angle, 10);
      expect(left.x).toBeCloseTo(-right.x, 10);
    }
  });
  it('allows sampled left/right recovery from the longest-stage danger window', () => {
    for (const sign of [-1, 1]) {
      const s = createState(sign);
      while (Math.abs(s.angle) < .56) step(s, 0);
      let recovered = false;
      for (let i = 0; i < 50 && !s.over; i++) {
        const best = [-1, 0, 1].map(input => {
          const predicted = { ...s };
          for (let j = 0; j < 12; j++) step(predicted, input);
          return { input, cost: (predicted.angle + .8 * predicted.omega) ** 2 + .0002 * predicted.v ** 2 };
        }).sort((a, b) => a.cost - b.cost)[0];
        for (let j = 0; j < 12; j++) step(s, best.input);
        if (Math.abs(s.angle) < .18 && Math.abs(s.omega) < .6) { recovered = true; break; }
      }
      expect(s.over).toBe(false);
      expect(recovered).toBe(true);
    }
  });
  it('freezes score on loss and resets accumulator and all physical state', () => {
    const sim = new Simulation();
    for (let i = 0; i < 1000; i++) sim.advance(1 / 60, 1);
    const score = sim.state.time; sim.advance(1, -1); expect(sim.state.time).toBe(score);
    sim.reset(-1); expect(sim.state).toEqual(createState(-1));
    sim.advance(8, 0); expect(sim.state.time).toBeCloseTo(.1, 10);
  });
});
