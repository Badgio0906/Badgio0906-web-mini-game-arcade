import {describe, it, expect} from 'vitest';
import {
  MAX_FRAME_DT,
  MAX_TOTAL_SCORE,
  createTiming,
  nextRound,
  roundScore,
  setPaused,
  stepTiming,
  stopTiming,
  targetOf,
  type TimingState,
} from '../../src/games/game036/model';

/** Advance by whole seconds in 0.5 s chunks (exact in binary floating point). */
const advance = (state: TimingState, seconds: number): void => {
  for (let i = 0; i < seconds * 2; i++) expect(stepTiming(state, 0.5)).toBe(true);
};

describe('Game036 timing pilot: marker motion', () => {
  it('moves at 35 units/s and reflects at both ends', () => {
    const s = createTiming();
    expect(stepTiming(s, 0.5)).toBe(true);
    expect(s.position).toBe(17.5);
    for (let i = 0; i < 5; i++) stepTiming(s, 0.5); // 3.0 s total = 105 units
    expect(s.position).toBe(95);
    expect(s.direction).toBe(-1);
    for (let i = 0; i < 6; i++) stepTiming(s, 0.5); // another 105 units, back across 0
    expect(s.position).toBe(10);
    expect(s.direction).toBe(1);
    expect(s.elapsed).toBeCloseTo(6, 9);
  });

  it('is frame-rate independent: 60 x 1/60 s matches 2 x 0.5 s', () => {
    const fine = createTiming();
    const coarse = createTiming();
    for (let i = 0; i < 60; i++) stepTiming(fine, 1 / 60);
    advance(coarse, 1);
    expect(fine.position).toBeCloseTo(coarse.position, 9);
    expect(fine.position).toBeCloseTo(35, 9);
  });

  it('refuses to advance on an invalid wall-clock dt and leaves the state untouched', () => {
    for (const bad of [Number.NaN, Infinity, -Infinity, -0.01, MAX_FRAME_DT + 0.001, 1, 60]) {
      const s = createTiming();
      stepTiming(s, 0.25);
      const before = structuredClone(s);
      expect(stepTiming(s, bad)).toBe(false);
      expect(s).toEqual(before);
    }
    const s = createTiming();
    const before = structuredClone(s);
    expect(stepTiming(s, 0)).toBe(true); // accepted, but nothing moves
    expect(s).toEqual(before);
  });

  it('freezes time and input while paused, then resumes where it stopped', () => {
    const s = createTiming();
    stepTiming(s, 0.5);
    setPaused(s, true);
    expect(stepTiming(s, 0.5)).toBe(false);
    expect(s.position).toBe(17.5);
    expect(stopTiming(s)).toBeNull();
    expect(s.results).toHaveLength(0);
    setPaused(s, false);
    expect(stepTiming(s, 0.5)).toBe(true);
    expect(s.position).toBe(35);
  });
});

describe('Game036 timing pilot: scoring', () => {
  it('uses max(0, round(1000 - |position - target| * 30))', () => {
    expect(roundScore(70, 70)).toBe(1000);
    expect(roundScore(69, 70)).toBe(970);
    expect(roundScore(35, 30)).toBe(850);
    expect(roundScore(52.5, 55)).toBe(925);
    expect(roundScore(80.3, 70)).toBe(691);
    expect(roundScore(63, 30)).toBe(10); // distance 33
    expect(roundScore(64, 30)).toBe(0); // distance 34 clamps at zero
    expect(roundScore(100, 0)).toBe(0);
    for (let p = 0; p <= 100; p += 0.7) {
      const score = roundScore(p, 55);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1000);
    }
  });
});

describe('Game036 timing pilot: rounds and run', () => {
  it('accepts exactly one confirmation per round and then holds the marker', () => {
    const s = createTiming();
    advance(s, 2); // 70 units
    expect(s.position).toBe(70);
    expect(nextRound(s)).toBe(false); // cannot skip a round that is still running
    expect(stopTiming(s)).toMatchObject({round: 0, target: 70, position: 70, distance: 0, score: 1000});
    expect(stopTiming(s)).toBeNull();
    expect(s.results).toHaveLength(1);
    expect(stepTiming(s, 0.2)).toBe(false);
    expect(s.position).toBe(70);
  });

  it('plays three rounds with targets 70, 30, 55 and completes at the third stop', () => {
    const s = createTiming();
    expect([0, 1, 2].map((round) => targetOf({round}))).toEqual([70, 30, 55]);

    advance(s, 2); // 70 -> distance 0
    expect(stopTiming(s)?.score).toBe(1000);
    expect(nextRound(s)).toBe(true);
    expect(s).toMatchObject({round: 1, position: 0, direction: 1, phase: 'running'});

    advance(s, 1); // 35 vs target 30 -> distance 5
    expect(stopTiming(s)?.score).toBe(850);
    expect(s.outcome).toBe('playing');
    expect(nextRound(s)).toBe(true);

    advance(s, 1.5); // 52.5 vs target 55 -> distance 2.5
    expect(stopTiming(s)?.score).toBe(925);
    expect(s.outcome).toBe('complete');
    expect(s.total).toBe(2775);
    expect(s.results.map((r) => r.score)).toEqual([1000, 850, 925]);
    expect(s.total).toBeLessThanOrEqual(MAX_TOTAL_SCORE);

    // a finished run accepts nothing more
    expect(stopTiming(s)).toBeNull();
    expect(nextRound(s)).toBe(false);
    expect(stepTiming(s, 0.1)).toBe(false);
  });

  it('retry starts from a clean state and shares nothing with the finished run', () => {
    const finished = createTiming();
    advance(finished, 2);
    stopTiming(finished);
    const fresh = createTiming();
    expect(fresh).toMatchObject({round: 0, position: 0, direction: 1, phase: 'running', total: 0, last: null, outcome: 'playing', paused: false, elapsed: 0});
    expect(fresh.results).toEqual([]);
    expect(fresh.results).not.toBe(finished.results);
    expect(finished.results).toHaveLength(1); // creating a new run did not touch the old one
  });
});

describe('Game036 timing pilot: practice mode', () => {
  it('gives feedback but never records a score, never completes and cycles the targets', () => {
    const p = createTiming(true);
    const seen: number[] = [];
    for (let i = 0; i < 5; i++) {
      seen.push(targetOf(p));
      advance(p, 1);
      const result = stopTiming(p);
      expect(result).not.toBeNull();
      expect(p.last).toEqual(result);
      expect(p.total).toBe(0);
      expect(p.results).toEqual([]);
      expect(p.outcome).toBe('playing');
      expect(nextRound(p)).toBe(true);
    }
    expect(seen).toEqual([70, 30, 55, 70, 30]);
  });
});

describe('Game036 timing pilot: bounds', () => {
  it('keeps the marker finite inside 0..100 and every score inside 0..1000 across 100 mixed-dt runs', () => {
    for (let n = 0; n < 100; n++) {
      const s = createTiming();
      for (let round = 0; round < 3; round++) {
        for (let i = 0; i < 200; i++) {
          const dt = (((n * 7 + i * 13 + round * 5) % 50) + 1) / 100; // 0.01 .. 0.50
          expect(stepTiming(s, dt)).toBe(true);
          expect(Number.isFinite(s.position)).toBe(true);
          expect(s.position).toBeGreaterThanOrEqual(0);
          expect(s.position).toBeLessThanOrEqual(100);
          expect(Math.abs(s.direction)).toBe(1);
        }
        const result = stopTiming(s);
        expect(result!.score).toBeGreaterThanOrEqual(0);
        expect(result!.score).toBeLessThanOrEqual(1000);
        nextRound(s);
      }
      expect(s.outcome).toBe('complete');
      expect(s.total).toBeLessThanOrEqual(MAX_TOTAL_SCORE);
    }
  });
});
