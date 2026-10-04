import { describe, expect, it } from 'vitest';
import { classifyLanding, FallRun, isNiceLanding } from '../../src/games/game015/FallRun';
import { AUTHORED_PATTERNS, generateChunk, INITIAL_PLATFORM, platformFromSeed, platformX, safeLinkIssues, START_Y } from '../../src/games/game015/generation';
import { CRUMBLE_SECONDS, HARD_STUN_SECONDS, MAX_HORIZONTAL_SPEED, PIXELS_PER_METER, PLAYER_WIDTH, TERMINAL_VELOCITY, WORLD_HEIGHT, WORLD_WIDTH } from '../../src/games/game015/types';
import type { FallEvent, FallSnapshot, PlatformType } from '../../src/games/game015/types';

const random = (seed: number) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const advance = (run: FallRun, seconds: number) => { for (let left = seconds; left > 1e-9; left -= 1 / 120) run.step(Math.min(left, 1 / 120)); };
function until(run: FallRun, predicate: (snapshot: FallSnapshot) => boolean, maxSeconds = 20): FallSnapshot {
  let s = run.snapshot();
  for (let i = 0; !predicate(s) && i < maxSeconds * 120; i++) { run.step(1 / 120); s = run.snapshot(); }
  expect(predicate(s), 'ordinary model progression reaches the requested state').toBe(true); return s;
}
function course(distance: number, type: PlatformType = 'normal', emit: (event: FallEvent) => void = () => {}): FallRun {
  const run = new FallRun(emit, random(1), { course: [{ x: 0, y: START_Y, width: WORLD_WIDTH, type: 'normal' },
    { x: 0, y: START_Y + distance * PIXELS_PER_METER, width: WORLD_WIDTH, type }] }); run.start(); return run;
}
const signControl = (error: number, velocity: number): -1 | 0 | 1 => { const command = error * 5 - velocity * 1.8; return command > 4 ? 1 : command < -4 ? -1 : 0; };
/** Conservative public-input policy: settle/recenter on safe support, then steer and brake toward the next support. */
function safeDescent(seed: number, goal: number): { snapshot: FallSnapshot; maxPlatforms: number; events: FallEvent[]; types: Set<PlatformType> } {
  const events: FallEvent[] = [], types = new Set<PlatformType>(); let maxPlatforms = 0;
  const run = new FallRun(e => { events.push(e); if (e.type === 'landing') types.add(e.landing.platformType); }, random(seed)); run.start();
  let s = run.snapshot();
  for (let frame = 0; frame < goal * 100 && s.alive && s.depth < goal; frame++) {
    maxPlatforms = Math.max(maxPlatforms, s.platforms.length);
    const current = s.platforms.find(p => p.id === s.player.platformId);
    const next = s.platforms.filter(p => p.route && !p.gone && p.y > s.player.y + 0.01).sort((a, b) => a.y - b.y)[0];
    if (!next) throw new Error('Missing advertised safe support');
    if (s.player.grounded && current) {
      const target = current.width === WORLD_WIDTH ? next.x + next.width / 2 : current.x + current.width / 2;
      run.setHorizontal(signControl(target - s.player.x, s.player.vx));
      if (Math.abs(target - s.player.x) < 4 && Math.abs(s.player.vx) < 7 && !s.player.stunRemaining) { run.setHorizontal(0); run.drop(); }
    } else {
      const target = next.width === WORLD_WIDTH ? s.player.x : next.x + next.width / 2;
      run.setHorizontal(signControl(target - s.player.x, s.player.vx));
    }
    run.step(1 / 60); s = run.snapshot();
  }
  return { snapshot: s, maxPlatforms, events, types };
}

describe('FALL KING honest impact and inertial control', () => {
  it('no jump, DROP skips only current support, rejected air presses do not skip the next landing', () => {
    const events: FallEvent[] = [], run = course(4, 'normal', e => events.push(e));
    const initial = run.snapshot(); expect(initial.player.y).toBe(112); expect(initial.player.y - 22).toBeGreaterThan(75);
    expect(run.drop()).toBe(true); for (let i = 0; i < 20; i++) expect(run.drop()).toBe(false);
    const landed = until(run, s => s.lastLanding !== null);
    expect(landed).toMatchObject({ alive: true, score: 4, fallDistance: 0, phase: 'grounded' });
    expect(landed.player).toMatchObject({ y: START_Y + 64, vy: 0, platformId: 2 });
    expect(events.filter(e => e.type === 'drop')).toHaveLength(1); expect(events.filter(e => e.type === 'landing')).toHaveLength(1);
  });
  it('classifies exact normal6/9 and soft9/12 boundaries through real swept landings', () => {
    for (const [distance, type, kind] of [[6, 'normal', 'safe'], [6.01, 'normal', 'hard'], [8.999, 'normal', 'hard'], [9, 'normal', 'fatal'],
      [9, 'soft', 'safe'], [9.01, 'soft', 'hard'], [11.999, 'soft', 'hard'], [12, 'soft', 'fatal']] as const) {
      const events: FallEvent[] = [], run = course(distance, type, e => events.push(e)); run.drop();
      const s = until(run, s => s.lastLanding !== null); expect(s.lastLanding?.kind).toBe(kind); expect(s.lastLanding?.fallDistance).toBeCloseTo(distance, 8);
      expect(s.player.y).toBeCloseTo(START_Y + distance * 16, 8); expect(s.alive).toBe(kind !== 'fatal');
      if (kind === 'fatal') { expect(run.result()).toMatchObject({ outcome: 'impact', fallDistance: distance, platformType: type }); run.step(5); run.drop(); expect(events.filter(e => e.type === 'end')).toHaveLength(1); }
    }
    expect(classifyLanding(6, 'moving')).toBe('safe'); expect(classifyLanding(9, 'crumble')).toBe('fatal');
  });
  it('HARD landing resets the real fall but locks for a brief bounded recovery; NICE is separate from DEPTH', () => {
    const run = course(8.2); run.drop(); const s = until(run, s => s.lastLanding !== null);
    expect(s).toMatchObject({ phase: 'stunned', fallDistance: 0, niceDrops: 1, score: 8 }); expect(s.player.stunRemaining).toBeCloseTo(HARD_STUN_SECONDS, 8);
    expect(run.drop()).toBe(false); advance(run, HARD_STUN_SECONDS + 0.01); expect(run.drop()).toBe(true);
    expect(isNiceLanding(7.65, 'normal')).toBe(true); expect(isNiceLanding(7.64, 'normal')).toBe(false); expect(isNiceLanding(9, 'normal')).toBe(false);
    expect(isNiceLanding(10.2, 'soft')).toBe(true); expect(isNiceLanding(10.19, 'soft')).toBe(false); expect(isNiceLanding(12, 'soft')).toBe(false);
  });
  it('air acceleration is gradual, release drifts, opposing input brakes then reverses, and speed is capped', () => {
    const run = course(100); run.drop(); run.setHorizontal(1); advance(run, 0.2); const right = run.snapshot().player;
    expect(right.vx).toBeGreaterThan(30); expect(right.vx).toBeLessThan(MAX_HORIZONTAL_SPEED); expect(right.x).toBeGreaterThan(128);
    run.setHorizontal(0); advance(run, 0.15); const release = run.snapshot().player;
    expect(release.x).toBeGreaterThan(right.x); expect(release.vx).toBeGreaterThan(0); expect(release.vx).toBeLessThan(right.vx);
    run.setHorizontal(-1); advance(run, 0.4); expect(run.snapshot().player.vx).toBeLessThan(0);
    run.setHorizontal(0); advance(run, 2); expect(run.snapshot().player.vy).toBe(TERMINAL_VELOCITY);
  });
  it('walking off starts from support plane; moving support carries player and contributes honest departure momentum', () => {
    const run = new FallRun(() => {}, random(5), { course: [{ x: 112, y: START_Y, width: 32, type: 'normal' }, { x: 0, y: START_Y + 64, width: 256, type: 'normal' }] });
    run.start(); run.setHorizontal(1); until(run, s => !s.player.grounded); expect(run.inspection().fallStartY).toBe(START_Y); expect(run.snapshot().player.vy).toBeGreaterThan(0);
    const moving = new FallRun(() => {}, random(1), { course: [{ x: 90, y: START_Y, width: 100, type: 'moving', amplitude: 8, period: 8, phase: 0 }, { x: 0, y: START_Y + 64, width: 256, type: 'normal' }] });
    moving.start(); advance(moving, 0.4); const before = moving.snapshot(); expect(before.player.x - 140).toBeCloseTo(before.platforms[0].x - 90, 8);
    moving.drop(); expect(moving.snapshot().player.vx).toBeGreaterThan(0); expect(moving.snapshot().player.grounded).toBe(false);
  });
  it('crumble starts only on actual landing and expires after1.25s; hard stun leaves enough time for a deliberate next DROP', () => {
    const events: FallEvent[] = [], run = new FallRun(e => events.push(e), random(1), { course: [{ x: 0, y: START_Y, width: 256, type: 'normal' },
      { x: 0, y: START_Y + 8 * 16, width: 256, type: 'crumble' }, { x: 0, y: START_Y + 12 * 16, width: 256, type: 'normal' }] });
    run.start(); expect(run.snapshot().platforms[1].crumbleAge).toBeNull(); run.drop(); until(run, s => s.lastLanding !== null); advance(run, HARD_STUN_SECONDS + 0.01);
    expect(run.snapshot().platforms[1].gone).toBe(false); expect(run.drop()).toBe(true); until(run, s => s.player.platformId === 3);
    expect(run.snapshot().alive).toBe(true); advance(run, CRUMBLE_SECONDS); expect(events.filter(e => e.type === 'crumble')).toHaveLength(1);
    const idle = course(4, 'crumble'); idle.drop(); until(idle, s => s.lastLanding !== null); advance(idle, CRUMBLE_SECONDS + .02); expect(idle.snapshot().player.grounded).toBe(false);
  });
  it('real incoming momentum plus HARD recovery still permits a crumble-to-moving route across both sides and all moving phases', () => {
    for (const direction of [-1, 1] as const) for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const events: FallEvent[] = [], crumbleX = direction === 1 ? 146 : 34, movingX = direction === 1 ? 110 : 70;
      const run = new FallRun(e => events.push(e), random(1), { course: [{ x: 0, y: START_Y, width: 256, type: 'normal' },
        { x: crumbleX, y: START_Y + 128, width: 76, type: 'crumble' }, { x: movingX, y: START_Y + 192, width: 76, type: 'moving', amplitude: 8, period: 8, phase }] });
      run.start(); run.setHorizontal(direction); advance(run, .22); expect(Math.abs(run.snapshot().player.vx)).toBeGreaterThan(70); run.drop(); run.setHorizontal(0);
      const landed = until(run, s => s.lastLanding !== null); expect(landed.lastLanding).toMatchObject({ kind: 'hard', fallDistance: 8, platformType: 'crumble' });
      expect(Math.abs(landed.player.vx)).toBeGreaterThan(30); const arrivedAt = landed.time; let departedAt = 0, s = landed;
      for (let i = 0; i < 5 * 120 && s.alive && s.player.platformId !== 3; i++) {
        const target = s.player.grounded ? crumbleX + 38 : s.platforms[2].x + 38;
        run.setHorizontal(signControl(target - s.player.x, s.player.vx));
        if (s.player.grounded && !s.player.stunRemaining && !departedAt && s.time - arrivedAt >= .55) {
          if (run.drop()) departedAt = s.time;
        }
        run.step(1 / 120); s = run.snapshot();
      }
      expect(departedAt - arrivedAt).toBeGreaterThanOrEqual(HARD_STUN_SECONDS); expect(departedAt - arrivedAt).toBeLessThan(CRUMBLE_SECONDS);
      expect(s).toMatchObject({ alive: true, player: { grounded: true, platformId: 3 } }); expect(s.lastLanding?.kind).toBe('safe');
    }
  });
  it('camera never rises, previews2–3 next supports, snapshots/events cannot mutate physics and invalid deltas do nothing', () => {
    const events: FallEvent[] = [], run = new FallRun(e => events.push(e), random(7)); run.start(); const first = run.inspection();
    first.player.y = -100; first.platforms[0].width = 0; expect(run.snapshot().player.y).toBe(112); expect(run.snapshot().platforms[0].width).toBe(160);
    const fresh = run.snapshot(); for (const dt of [NaN, Infinity, -1, 0]) run.step(dt); expect(run.snapshot()).toEqual(fresh);
    run.drop(); let camera = 0;
    until(run, s => { expect(s.cameraY).toBeGreaterThanOrEqual(camera); camera = s.cameraY;
      const visible = s.platforms.filter(p => p.route && !p.gone && p.y > s.player.y && p.y < s.cameraY + WORLD_HEIGHT); expect(visible.length).toBeGreaterThanOrEqual(3);
      return s.lastLanding !== null; });
    const event = events.find(e => e.type === 'landing')!; if (event.type === 'landing') event.landing.fallDistance = 999;
    expect(run.snapshot().lastLanding?.fallDistance).toBeLessThan(6); run.reset(); expect(run.snapshot()).toMatchObject({ alive: false, time: 0, depth: 0, niceDrops: 0, platforms: [] });
  });
});

describe('authored descending routes and bounded endless generation', () => {
  it('all authored chunks keep safe full-foot reach margins at every depth/edge and never overlap same-row alternatives', () => {
    let previous = platformFromSeed(INITIAL_PLATFORM, 1), cursor = { y: START_Y, center: 128, nextId: 2, chunks: 0 }; const patterns = new Set<string>(), types = new Set<PlatformType>();
    for (let i = 0; i < 700; i++) {
      const { platforms, cursor: next } = generateChunk(cursor, () => i % AUTHORED_PATTERNS.length / AUTHORED_PATTERNS.length + .01); cursor = next;
      const route = platforms.filter(p => p.route); expect(route).toHaveLength(4); expect(route[3]).toMatchObject({ x: 0, width: 256, type: 'normal' });
      for (const p of platforms) { patterns.add(p.pattern); types.add(p.type); expect(p.x - p.amplitude).toBeGreaterThanOrEqual(0); expect(p.x + p.width + p.amplitude).toBeLessThanOrEqual(WORLD_WIDTH);
        for (const other of platforms) if (p.id < other.id && p.y === other.y) expect(p.x + p.width <= other.x || other.x + other.width <= p.x).toBe(true); }
      for (const p of route) { expect(safeLinkIssues(previous, p), `${previous.pattern}→${p.pattern}`).toEqual([]); previous = p; }
    }
    expect(patterns.size).toBeGreaterThanOrEqual(6); expect([...types].sort()).toEqual(['crumble', 'moving', 'normal', 'soft']);
  });
  it('guarantees an early visible bend and long uncontrolled falls end by an actual hard catch, never hidden midair death', () => {
    const run = new FallRun(() => {}, random(3)); run.start(); const bend = run.snapshot().platforms.filter(p => p.pattern === 'early-bend');
    expect(bend).toHaveLength(4); expect(bend[1].x).toBeGreaterThan(128 + PLAYER_WIDTH / 2); expect(bend[1].y - START_Y).toBeLessThan(35 * 16);
    run.setHorizontal(-1); until(run, s => s.player.x === PLAYER_WIDTH / 2 || !s.player.grounded); run.setHorizontal(0);
    const s = until(run, s => !s.alive); expect(s.lastLanding?.kind).toBe('fatal'); expect(s.player.grounded).toBe(true); expect(run.result()?.outcome).toBe('impact'); expect(run.result()?.fallDistance).toBeGreaterThan(9);
  });
  it('public steering/braking safely crosses1000m without freezing and continues5000m with bounded arrays and all material types', () => {
    const allTypes = new Set<PlatformType>();
    for (const seed of [1,17,77]) {
      const result = safeDescent(seed, seed === 1 ? 5000 : 1200);
      expect(result.snapshot.alive, `seed${seed} reached${result.snapshot.depth}`).toBe(true); expect(result.snapshot.depth).toBeGreaterThanOrEqual(seed === 1 ? 5000 : 1200);
      expect(result.maxPlatforms).toBeLessThan(30); expect(result.events.filter(e => e.type === 'milestone')).toHaveLength(1);
      for (const type of result.types) allTypes.add(type);
    }
    expect(allTypes.has('moving')).toBe(true); expect(allTypes.has('crumble')).toBe(true);
  }, 20_000);
  it('moving phases stay inside envelopes and route validation rejects physically impossible links', () => {
    const p = platformFromSeed({ x: 70, y: 112, width: 60, type: 'moving', amplitude: 8, period: 8 }, 1);
    for (let time = 0; time < 20; time += .17) expect(Math.abs(platformX(p, time) - p.originX)).toBeLessThanOrEqual(8);
    const a = platformFromSeed({ x: 0, y: 112, width: 28, type: 'normal' }, 2), b = platformFromSeed({ x: 210, y: 116, width: 28, type: 'normal' }, 3);
    expect(safeLinkIssues(a,b)).toContain('insufficient steering margin'); b.y = 112 + 9 * 16; expect(safeLinkIssues(a,b)).toContain('unsafe vertical gap');
  });
});
