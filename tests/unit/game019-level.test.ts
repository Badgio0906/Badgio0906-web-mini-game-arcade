import { describe, it, expect } from 'vitest';
import { ChargeRun } from '../../src/games/game019/ChargeRun';
import { createAuthoredLevel } from '../../src/games/game019/authoredLevel';
import { createStagePrototype } from '../../src/games/game019/prototypeLevel';
import { STEP, PPM, type Direction, type ChargeEvent } from '../../src/games/game019/chargeTypes';
type Input = [number, Direction, string];
const safe: Input[] = [[391.667, -1, "first"], [483.333, 1, "brick"], [383.333, -1, "under-beam"], [50, -1, "under-beam"], [450, 1, "takeoff"], [80, 1, "takeoff"], [666.667, -1, "root-top"], [433.333, 1, "brick-narrow"], [283.333, 0, "catch-25"], [433.333, -1, "cracked-step"], [566.667, 1, "moss-low"], [466.667, -1, "moss-turn"], [533.333, 1, "timber-long"], [300, -1, "timber-short"], [158.333, -1, "timber-nub"], [200, -1, "rest-edge"], [383.333, 1, "catch-50"], [616.667, 1, "root-gap-top"], [558.333, -1, "bucket-approach"], [366.667, -1, "old-bucket"], [491.667, 1, "bucket-return"], [250, 0, "fork-start"], [341.667, 1, "fork-safe-low"], [316.667, -1, "catch-75"], [358.333, -1, "fork-safe-high"], [416.667, 1, "fork-join"], [458.333, -1, "upper-moss"], [483.333, 1, "last-crack"], [491.667, -1, "light-root"], [483.333, 1, "exit-stone"], [300, -1, "sky-start"], [416.667, -1, "cloud-left"], [533.333, 1, "flag-east"], [500, -1, "east-cloud"], [458.333, 1, "rising-base"], [508.333, -1, "rising-top"], [441.667, 1, "west-flag-cloud"], [441.667, -1, "west-cloud"], [516.667, 1, "heavy-base"], [500, -1, "heavy-top"], [433.333, 1, "sky-catch"], [408.333, 1, "sky-rest-top"], [541.667, -1, "strong-east-base"], [408.333, 1, "strong-east-top"], [650, -1, "bird-perch"], [558.333, 1, "bird-high"], [441.667, -1, "ice-rise-base"], [483.333, 1, "ice-rise-top"], [550, -1, "ice-heavy-step"], [391.667, 1, "star-catch"], [408.333, -1, "star-west"], [533.333, 1, "last-star-base"], [450, -1, "last-star"], [408.333, 1, "space-goal"]];
const risk: Input[] = [[391.667, -1, "first"], [483.333, 1, "brick"], [383.333, -1, "under-beam"], [50, -1, "under-beam"], [450, 1, "takeoff"], [80, 1, "takeoff"], [666.667, -1, "root-top"], [433.333, 1, "brick-narrow"], [283.333, 0, "catch-25"], [433.333, -1, "cracked-step"], [566.667, 1, "moss-low"], [466.667, -1, "moss-turn"], [533.333, 1, "timber-long"], [300, -1, "timber-short"], [158.333, -1, "timber-nub"], [200, -1, "rest-edge"], [383.333, 1, "catch-50"], [616.667, 1, "root-gap-top"], [558.333, -1, "bucket-approach"], [366.667, -1, "old-bucket"], [491.667, 1, "bucket-return"], [250, 0, "fork-start"], [641.667, -1, "fork-risk"], [583.333, 1, "fork-join"], [458.333, -1, "upper-moss"], [483.333, 1, "last-crack"], [491.667, -1, "light-root"], [491.667, 1, "exit-stone"], [300, -1, "sky-start"], [416.667, -1, "cloud-left"], [533.333, 1, "flag-east"], [500, -1, "east-cloud"], [458.333, 1, "rising-base"], [508.333, -1, "rising-top"], [441.667, 1, "west-flag-cloud"], [441.667, -1, "west-cloud"], [516.667, 1, "heavy-base"], [500, -1, "heavy-top"], [433.333, 1, "sky-catch"], [408.333, 1, "sky-rest-top"], [541.667, -1, "strong-east-base"], [408.333, 1, "strong-east-top"], [650, -1, "bird-perch"], [558.333, 1, "bird-high"], [441.667, -1, "ice-rise-base"], [483.333, 1, "ice-rise-top"], [550, -1, "ice-heavy-step"], [391.667, 1, "star-catch"], [408.333, -1, "star-west"], [533.333, 1, "last-star-base"], [450, -1, "last-star"], [408.333, 1, "space-goal"]];
const act = (r: ChargeRun, ms: number, dir: Direction) => {
  r.setDirection(dir); expect(r.beginCharge()).toBe(true);
  for (let i = 0; i < Math.round(ms / 1000 / STEP); i++) r.update(STEP);
  expect(r.releaseCharge()).toBe(true);
  for (let i = 0; i < 3000 && !r.player.grounded && r.alive; i++) r.update(STEP);
  expect(r.player.grounded).toBe(true);
};
const replay = (r: ChargeRun, inputs: Input[]) => { for (const [ms, dir, id] of inputs) { act(r, ms, dir); expect(r.player.ledgeId).toBe(id); } };
describe('Game019 authored well and sky', () => {
  it('preserves the accepted pilot and has 12 named well/12 sky sections with unequal gaps', () => {
    const l = createAuthoredLevel(), pilot = createStagePrototype();
    expect(l.ledges.slice(0, 6)).toEqual(pilot.ledges); expect(l.blocks).toEqual(pilot.blocks);
    expect(l.sections.filter(s => s.from < 100)).toHaveLength(12); expect(l.sections.filter(s => s.from >= 100)).toHaveLength(12);
    expect(new Set(l.ledges.map((p, i) => i ? Number(((p.y - l.ledges[i-1].y) / PPM).toFixed(1)) : 0)).size).toBeGreaterThan(15);
    expect(l.ledges.filter(p => p.amplitude)).toHaveLength(1); expect(l.winds).toHaveLength(12); expect(l.goal).toBe(200);
    expect(l).toEqual(createAuthoredLevel());
  });
  it('climbs both physically reachable routes through sea/bird/sky to a real star landing', () => {
    for (const route of [safe, risk]) { const events: ChargeEvent[] = [], r = new ChargeRun(createAuthoredLevel(), e => events.push(e)); replay(r, route);
      expect(r.clear).toBe(true); expect(r.chapter).toBe('space'); expect(r.player.ledgeId).toBe('space-goal'); expect(r.totalFall).toBeGreaterThan(0);
      expect(events.filter(e => e.type === 'well_clear')).toHaveLength(1); expect(events.filter(e => e.type === 'chapter_reached' && e.data.chapter === 'sky')).toHaveLength(1);
      expect(new Set(events.filter(e => e.type === 'jump').map(e => e.data.wind_direction))).toEqual(new Set(['none', 'left', 'right', 'up', 'down']));
      expect(new Set(events.filter(e => e.type === 'jump').map(e => e.data.wind_strength))).toEqual(new Set(['none', 'weak', 'medium', 'strong']));
    }
    expect(safe.length - risk.length).toBe(2); expect(safe.some(p => p[2] === 'fork-safe-low')).toBe(true); expect(risk.some(p => p[2] === 'fork-risk')).toBe(true);
  });
  it('lands on the moving bucket at four different initial clock phases without position injection', () => {
    const prefix = safe.slice(0, safe.findIndex(p => p[2] === 'old-bucket') + 1), locations: number[] = [];
    for (const delay of [0, 1.1, 2.2, 3.3]) { const r = new ChargeRun(createAuthoredLevel()); for (let i = 0; i < Math.round(delay / STEP); i++) r.update(STEP); replay(r, prefix); locations.push(r.snapshot().ledges.find(p => p.id === 'old-bucket')!.x); }
    expect(Math.max(...locations) - Math.min(...locations)).toBeGreaterThan(10);
  });
  it('makes a small error, ordinary error, and high risk error lose different progress in the same RUN', () => {
    const cases: Array<[Input[], number, Direction, number, string]> = [
      [safe.slice(0, safe.findIndex(p => p[2] === 'timber-nub') + 1), 150, 1, 1.1, 'timber-short'],
      [safe.slice(0, safe.findIndex(p => p[2] === 'takeoff') + 1), 300, -1, 3.7, 'under-beam'],
      [risk.slice(0, risk.findIndex(p => p[2] === 'fork-risk') + 1), 100, -1, 27.5, 'catch-50'],
    ];
    for (const [prefix, ms, dir, loss, ledgeId] of cases) { const r = new ChargeRun(createAuthoredLevel()); replay(r, prefix); act(r, ms, dir); expect(r.alive).toBe(true); expect(r.lastLanding!.loss).toBeCloseTo(loss, 3); expect(r.player.ledgeId).toBe(ledgeId); expect(r.beginCharge()).toBe(true); }
  });
  it('physically catches a failed high jump at 50m instead of respawning there', () => {
    const events: ChargeEvent[] = [], r = new ChargeRun(createAuthoredLevel(), e => events.push(e)); replay(r, safe.slice(0, safe.findIndex(p => p[2] === 'root-gap-top') + 1));
    const before = r.time; act(r, 300, -1); expect(r.lastLanding!.loss).toBeCloseTo(7.2); expect(r.player.y / PPM).toBe(50); expect(r.time).toBeGreaterThan(before);
    expect(events.filter(e => e.type === 'catch_ledge_used')).toHaveLength(1); expect(r.alive).toBe(true);
  });
  it('holds the takeoff wind across a zone boundary and still has no air direction control', () => {
    const r = new ChargeRun(createAuthoredLevel()); replay(r, safe.slice(0, safe.findIndex(p => p[2] === 'cloud-left') + 1));
    r.setDirection(1); r.beginCharge(); for (let i = 0; i < 64; i++) r.update(STEP); r.releaseCharge();
    let checked = false;
    for (let i = 0; i < 500 && !r.player.grounded; i++) { r.setDirection(-1); const before = r.player.vx; r.update(STEP); if (!r.player.grounded && r.player.y / PPM > 112) { expect(r.snapshot().wind!.direction).toBe('left'); expect(r.player.vx - before).toBeCloseTo(-20 * STEP, 6); checked = true; } }
    expect(checked).toBe(true); expect(r.player.ledgeId).toBe('flag-east'); expect(r.snapshot().wind!.direction).toBe('right');
  });
  it('cannot bypass the pilot beam with repeated maximum straight jumps', () => {
    const r = new ChargeRun(createAuthoredLevel()); for (let i = 0; i < 12; i++) act(r, 700, 0);
    expect(r.player.y / PPM).toBe(7.2); expect(r.wellCleared).toBe(false); expect(r.clear).toBe(false);
  });
});
