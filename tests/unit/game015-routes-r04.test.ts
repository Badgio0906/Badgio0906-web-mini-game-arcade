import { describe, expect, it } from 'vitest';
import { FallRun } from '../../src/games/game015/FallRun';
import { AUTHORED_PATTERNS, generateChunk, hazardX, platformFromSeed, platformX, safeLinkIssues, START_Y, INITIAL_PLATFORM } from '../../src/games/game015/generation';
import { PLAYER_HEIGHT } from '../../src/games/game015/types';

const random = (seed: number) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
describe('Game015 r04 visible patrols and moving route choices', () => {
  it('adds center, same-side, short, bridge and bird routes with phase-safe links at early and late depths', () => {
    expect(AUTHORED_PATTERNS).toHaveLength(12);
    const amplitudes = new Set<number>(), periods = new Set<number>(); let birds = 0, earlyMoving = 0;
    for (let seed = 1; seed <= 32; seed++) {
      let cursor = { y: START_Y, center: 128, nextId: 2, chunks: 0 }, previous = platformFromSeed(INITIAL_PLATFORM, 1);
      const rng = random(seed);
      for (let i = 0; i < 40; i++) {
        const chunk = generateChunk(cursor, rng), oldY = cursor.y; cursor = chunk.cursor;
        const route = chunk.platforms.filter(p => p.route);
        for (const p of route) {
          expect(safeLinkIssues(previous, p)).toEqual([]);
          if (p.type === 'moving') { amplitudes.add(p.amplitude); periods.add(p.period); if (p.y < START_Y + 100 * 16) earlyMoving++; }
          previous = p;
        }
        for (const h of chunk.hazards.filter(h => h.kind === 'bird')) {
          birds++;
          // Waiting on either perch cannot contact the bird's complete swept body.
          expect(h.y - oldY).toBeGreaterThanOrEqual(6);
          expect(route[0].y - PLAYER_HEIGHT - h.y - h.height).toBeGreaterThanOrEqual(6);
          expect(h.originX - h.amplitude).toBeGreaterThan(0);
          expect(h.originX + h.amplitude + h.width).toBeLessThan(256);
          // Smooth motion has a known velocity bound, including turnaround phases.
          const speed = h.amplitude * Math.PI * 2 / h.period;
          for (let t = 0; t < h.period; t += .05) expect(Math.abs(hazardX(h, t + .01) - hazardX(h, t))).toBeLessThanOrEqual(speed * .01 + 1e-8);
        }
      }
    }
    expect(birds).toBeGreaterThan(100); expect(earlyMoving).toBeGreaterThan(0);
    expect([...amplitudes].sort((a,b) => a-b)).toEqual([8, 12, 16]); expect(periods.size).toBe(3);
  });
  it('carries a resting king continuously and freezes both patrols and moving floors between steps', () => {
    for (const [amplitude, period] of [[8, 9], [16, 7], [12, 5.2]]) {
      const run = new FallRun(() => {}, random(1), { scroll: false, course: [
        { x: 60, y:112, width:128, type:'moving', amplitude, period, phase: .7 },
        { x: 40, y:200, width:160, type:'soft' },
      ], hazards: [{kind:'bird', x:119, y:128, width:18, height:10, amplitude:56, period:2.4}] });
      run.start(); const first = run.snapshot(), offset = first.player.x - first.platforms[0].x;
      for (let frame = 0; frame < 120 * 12; frame++) {
        run.step(1 / 120); const s = run.snapshot();
        expect(s.alive).toBe(true); expect(s.player.grounded).toBe(true);
        expect(s.player.x - s.platforms[0].x).toBeCloseTo(offset, 8);
        expect(s.platforms[0].x).toBeCloseTo(platformX(s.platforms[0], s.time), 8);
      }
      const before = run.inspection(); run.snapshot(); run.inspection(); expect(run.inspection()).toEqual(before);
    }
  });
});
