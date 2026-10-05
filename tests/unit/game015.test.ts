import { describe, expect, it } from 'vitest';
import { classifyLanding, FallRun, isNiceLanding, sweptHazardHit } from '../../src/games/game015/FallRun';
import { AUTHORED_PATTERNS, generateChunk, hazardX, INITIAL_PLATFORM, platformFromSeed, platformX, safeLinkIssues, scrollSpeedAt, START_Y } from '../../src/games/game015/generation';
import { AIR_ACCELERATION, AIR_DRAG, GRAVITY, PLAYER_HEIGHT, PLAYER_WALL_MARGIN, CRUMBLE_SECONDS, HARD_STUN_SECONDS, MAX_HORIZONTAL_SPEED, PIXELS_PER_METER, PLAYER_WIDTH, TERMINAL_VELOCITY, SCROLL_START_SPEED, SCROLL_MAX_SPEED, SCROLL_ACCELERATION, WORLD_HEIGHT, WORLD_WIDTH } from '../../src/games/game015/types';
import type { FallEvent, FallSnapshot, FallPlatform, PlatformType } from '../../src/games/game015/types';

const random = (seed: number) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const advance = (run: FallRun, seconds: number) => { for (let left = seconds; left > 1e-9; left -= 1 / 120) run.step(Math.min(left, 1 / 120)); };
function until(run: FallRun, predicate: (snapshot: FallSnapshot) => boolean, maxSeconds = 20): FallSnapshot {
  let s = run.snapshot();
  for (let i = 0; !predicate(s) && i < maxSeconds * 120; i++) { run.step(1 / 120); s = run.snapshot(); }
  expect(predicate(s), 'ordinary model progression reaches the requested state').toBe(true); return s;
}
function course(distance: number, type: PlatformType = 'normal', emit: (event: FallEvent) => void = () => {}): FallRun {
  const run = new FallRun(emit, random(1), { scroll: false, course: [{ x: 0, y: START_Y, width: WORLD_WIDTH, type: 'normal' },
    { x: 0, y: START_Y + distance * PIXELS_PER_METER, width: WORLD_WIDTH, type }] }); run.start(); return run;
}
const signControl = (error: number, velocity: number): -1 | 0 | 1 => { const command = error * 5 - velocity * 1.8; return command > 4 ? 1 : command < -4 ? -1 : 0; };
/** Forecast the visible bird against the same ordinary steer/brake policy; this never mutates a run. */
function birdWindowClear(s: FallSnapshot, next: FallPlatform): boolean {
  const birds = s.hazards.filter(h => h.kind === 'bird' && h.y > s.player.y && h.y < next.y);
  if (!birds.length) return true;
  let x = s.player.x, y = s.player.y, vx = s.player.vx, vy = 0;
  const dt = 1 / 120;
  for (let elapsed = 0; elapsed < 2 && y < next.y; elapsed += dt) {
    const from = { x, y }, time = s.time + elapsed;
    const target = platformX(next, time) + next.width / 2;
    const input = signControl(target - x, vx);
    vx = Math.max(-MAX_HORIZONTAL_SPEED, Math.min(MAX_HORIZONTAL_SPEED, vx + (input * AIR_ACCELERATION - AIR_DRAG * vx) * dt));
    x = Math.max(PLAYER_WALL_MARGIN, Math.min(WORLD_WIDTH - PLAYER_WALL_MARGIN, x + vx * dt));
    vy = Math.min(TERMINAL_VELOCITY, vy + GRAVITY * dt); y = Math.min(next.y, y + vy * dt);
    for (const bird of birds) {
      // Four extra pixels represent timing/braking tolerance, not a modified production collision.
      const rect = { ...bird, x: hazardX(bird, time + dt) - 4, width: bird.width + 8, y: bird.y - 2, height: bird.height + 4 };
      if (sweptHazardHit(from, { x, y }, rect, hazardX(bird, time) - 4) !== null) return false;
    }
  }
  return true;
}
/** Conservative public-input policy: settle/recenter on safe support, then steer and brake toward the next support. */
function safeDescent(seed: number, goal: number): { snapshot: FallSnapshot; maxPlatforms: number; maxHazards: number; birdWaits: number; events: FallEvent[]; types: Set<PlatformType> } {
  const events: FallEvent[] = [], types = new Set<PlatformType>(); let maxPlatforms = 0, maxHazards = 0, birdWaits = 0;
  const run = new FallRun(e => { events.push(e); if (e.type === 'landing') types.add(e.landing.platformType); }, random(seed)); run.start();
  let s = run.snapshot();
  for (let frame = 0; frame < goal * 300 && s.alive && s.depth < goal; frame++) {
    maxPlatforms = Math.max(maxPlatforms, s.platforms.length); maxHazards = Math.max(maxHazards, s.hazards.length);
    const current = s.platforms.find(p => p.id === s.player.platformId);
    const next = s.platforms.filter(p => p.route && !p.gone && p.y > s.player.y + 0.01).sort((a, b) => a.y - b.y)[0];
    if (!next) throw new Error('Missing advertised safe support');
    if (s.player.grounded && current) {
      const target = current.width === WORLD_WIDTH ? next.x + next.width / 2 : current.x + current.width / 2;
      run.setHorizontal(signControl(target - s.player.x, s.player.vx));
      if (Math.abs(target - s.player.x) < 4 && Math.abs(s.player.vx) < 7 && !s.player.stunRemaining) {
        run.setHorizontal(0); if (birdWindowClear(s, next)) run.drop(); else birdWaits++;
      }
    } else {
      const target = next.width === WORLD_WIDTH ? s.player.x : next.x + next.width / 2;
      run.setHorizontal(signControl(target - s.player.x, s.player.vx));
    }
    run.step(1 / 120); s = run.snapshot();
  }
  return { snapshot: s, maxPlatforms, maxHazards, birdWaits, events, types };
}

describe('FALL KING honest impact and inertial control', () => {
  it('no jump, DROP skips only current support, rejected air presses do not skip the next landing', () => {
    const events: FallEvent[] = [], run = course(4, 'normal', e => events.push(e));
    const initial = run.snapshot(); expect(initial.player.y).toBe(112); expect(initial.player.y - PLAYER_HEIGHT).toBeGreaterThan(75);
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
    const run = new FallRun(() => {}, random(5), { scroll: false, course: [{ x: 112, y: START_Y, width: 32, type: 'normal' }, { x: 0, y: START_Y + 64, width: 256, type: 'normal' }] });
    run.start(); run.setHorizontal(1); until(run, s => !s.player.grounded); expect(run.inspection().fallStartY).toBe(START_Y); expect(run.snapshot().player.vy).toBeGreaterThan(0);
    const moving = new FallRun(() => {}, random(1), { scroll: false, course: [{ x: 90, y: START_Y, width: 100, type: 'moving', amplitude: 8, period: 8, phase: 0 }, { x: 0, y: START_Y + 64, width: 256, type: 'normal' }] });
    moving.start(); advance(moving, 0.4); const before = moving.snapshot(); expect(before.player.x - 140).toBeCloseTo(before.platforms[0].x - 90, 8);
    moving.drop(); expect(moving.snapshot().player.vx).toBeGreaterThan(0); expect(moving.snapshot().player.grounded).toBe(false);
  });
  it('crumble starts only on actual landing and expires after1.25s; hard stun leaves enough time for a deliberate next DROP', () => {
    const events: FallEvent[] = [], run = new FallRun(e => events.push(e), random(1), { scroll: false, course: [{ x: 0, y: START_Y, width: 256, type: 'normal' },
      { x: 0, y: START_Y + 8 * 16, width: 256, type: 'crumble' }, { x: 0, y: START_Y + 12 * 16, width: 256, type: 'normal' }] });
    run.start(); expect(run.snapshot().platforms[1].crumbleAge).toBeNull(); run.drop(); until(run, s => s.lastLanding !== null); advance(run, HARD_STUN_SECONDS + 0.01);
    expect(run.snapshot().platforms[1].gone).toBe(false); expect(run.drop()).toBe(true); until(run, s => s.player.platformId === 3);
    expect(run.snapshot().alive).toBe(true); advance(run, CRUMBLE_SECONDS); expect(events.filter(e => e.type === 'crumble')).toHaveLength(1);
    const idle = course(4, 'crumble'); idle.drop(); until(idle, s => s.lastLanding !== null); advance(idle, CRUMBLE_SECONDS + .02); expect(idle.snapshot().player.grounded).toBe(false);
  });
  it('real incoming momentum plus HARD recovery still permits a crumble-to-moving route across both sides and all moving phases', () => {
    for (const direction of [-1, 1] as const) for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const events: FallEvent[] = [], crumbleX = direction === 1 ? 146 : 34, movingX = direction === 1 ? 110 : 70;
      const run = new FallRun(e => events.push(e), random(1), { scroll: false, course: [{ x: 0, y: START_Y, width: 256, type: 'normal' },
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
    const firstTarget = run.snapshot().platforms.filter(p => p.route)[1];
    run.setHorizontal(firstTarget.x + firstTarget.width / 2 < 128 ? -1 : 1); run.drop(); let camera = 0;
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
      const route = platforms.filter(p => p.route); expect(route).toHaveLength(4); expect(route[3].width).toBeLessThan(256); expect(route[3].type).toBe('normal');
      for (const p of platforms) { patterns.add(p.pattern); types.add(p.type); expect(p.x - p.amplitude).toBeGreaterThanOrEqual(0); expect(p.x + p.width + p.amplitude).toBeLessThanOrEqual(WORLD_WIDTH);
        for (const other of platforms) if (p.id < other.id && p.y === other.y) expect(p.x + p.width <= other.x || other.x + other.width <= p.x).toBe(true); }
      for (const p of route) { expect(safeLinkIssues(previous, p), `${previous.pattern}→${p.pattern}`).toEqual([]); previous = p; }
    }
    expect(patterns.size).toBeGreaterThanOrEqual(6); expect([...types].sort()).toEqual(['crumble', 'moving', 'normal', 'soft']);
  });
  it('randomized early lanes include central spikes and break centered neutral descent', () => {
    const signatures = new Set<string>();
    for (let seed = 1; seed <= 25; seed++) {
      const run = new FallRun(() => {}, random(seed)); run.start();
      const initial = run.snapshot(); signatures.add(initial.platforms.filter(p => p.route).slice(1, 5).map(p => p.x.toFixed(0)).join(','));
      expect(initial.hazards.some(h => h.kind === 'spikes' && h.x < 128 && h.x + h.width > 128)).toBe(true);
      let s = initial;
      for (let frame = 0; frame < 20 * 120 && s.alive; frame++) { run.drop(); run.step(1 / 120); s = run.snapshot(); }
      expect(s.alive).toBe(false); expect(s.depth).toBeLessThan(45);
    }
    expect(signatures.size).toBeGreaterThan(15);
  });
  it('public steering/braking safely crosses1000m without freezing and continues5000m with bounded arrays and all material types', () => {
    const allTypes = new Set<PlatformType>();
    for (const seed of [1,17,77]) {
      const result = safeDescent(seed, seed === 1 ? 5000 : 1200);
      expect(result.snapshot.alive, `seed${seed} reached${result.snapshot.depth}`).toBe(true); expect(result.snapshot.depth).toBeGreaterThanOrEqual(seed === 1 ? 5000 : 1200);
      expect(result.maxPlatforms).toBeLessThan(45); expect(result.maxHazards).toBeLessThan(100); expect(result.events.filter(e => e.type === 'milestone')).toHaveLength(1);
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


describe('continuous downward pursuit and randomized fair choices', () => {
  it('standing still scrolls the world and ends once at the visible top boundary, with a generous opening', () => {
    const events: FallEvent[] = [], run = new FallRun(e => events.push(e), random(1)); run.start();
    expect(run.snapshot()).toMatchObject({ scrollSpeed: SCROLL_START_SPEED, cameraY: 0, topRemaining: 52 });
    advance(run, 2.4);
    expect(run.snapshot().alive).toBe(true); expect(run.snapshot().cameraY).toBeGreaterThan(40);
    const still = run.snapshot(); expect(still.player.y).toBe(START_Y); expect(still.depth).toBe(0);
    const ended = until(run, s => !s.alive, 1);
    expect(ended.time).toBeGreaterThan(2.5); expect(ended.time).toBeLessThan(3);
    expect(run.result()).toMatchObject({ outcome: 'scroll', depth: 0, fallDistance: 0 });
    expect(run.result()?.reason).toContain('早めに降り');
    advance(run, 10); expect(run.snapshot()).toEqual(ended); expect(events.filter(e => e.type === 'end')).toHaveLength(1);
  });
  it('speed increases smoothly to a sustainable cap, and only simulation steps consume the pursuit clock', () => {
    let previous = scrollSpeedAt(0);
    for (let time = .25; time <= 200; time += .25) {
      const speed = scrollSpeedAt(time); expect(speed).toBeGreaterThanOrEqual(previous);
      expect(speed - previous).toBeLessThanOrEqual(SCROLL_ACCELERATION * .25 + 1e-9);
      expect(speed).toBeLessThanOrEqual(SCROLL_MAX_SPEED); previous = speed;
    }
    expect(previous).toBe(SCROLL_MAX_SPEED); expect(SCROLL_MAX_SPEED).toBeLessThan(TERMINAL_VELOCITY / 3);
    const run = new FallRun(() => {}, random(4)); run.start(); const frozen = run.snapshot();
    for (let i = 0; i < 120; i++) { run.snapshot(); run.inspection(); run.setHorizontal(0); }
    expect(run.snapshot()).toEqual(frozen); run.step(.05); expect(run.snapshot().time).toBeCloseTo(.05);
    expect(run.snapshot().cameraY).toBeCloseTo(SCROLL_START_SPEED * .05 + SCROLL_ACCELERATION * .05 ** 2 / 2);
  });
  it('every generated row has a hazard-free landing envelope and a reachable next decision through varied widths/lanes', () => {
    const widths = new Set<number>(), centers = new Set<string>();
    for (let seed = 1; seed <= 80; seed++) {
      let cursor = { y: START_Y, center: 128, nextId: 2, chunks: 0 }, previous = platformFromSeed(INITIAL_PLATFORM, 1);
      for (let chunkIndex = 0; chunkIndex < 20; chunkIndex++) {
        const chunk = generateChunk(cursor, random(seed + chunkIndex * 80)); cursor = chunk.cursor;
        for (const p of chunk.platforms.filter(p => p.route)) {
          expect(safeLinkIssues(previous, p)).toEqual([]); widths.add(p.width);
          const center = p.originX + p.width / 2; centers.add(center < 116 ? 'left' : center > 140 ? 'right' : 'center');
          for (const h of chunk.hazards.filter(h => h.kind === 'spikes' && h.anchorPlatformId === p.id)) {
            expect(h.x + h.width <= p.originX - p.amplitude - 5 || h.x >= p.originX + p.width + p.amplitude + 5).toBe(true);
          }
          previous = p;
        }
      }
    }
    expect(widths.size).toBeGreaterThanOrEqual(5); expect([...centers].sort()).toEqual(['center', 'left', 'right']);
  });
  it('ordinary DROP/steer/brake survives changing routes and scrolling across sixty-four independent seeds', () => {
    for (let seed = 1; seed <= 64; seed++) {
      const result = safeDescent(seed, 350);
      expect(result.snapshot.alive, `seed ${seed}, reached ${result.snapshot.depth}m`).toBe(true);
      expect(result.snapshot.depth).toBeGreaterThanOrEqual(350);
      expect(result.snapshot.topRemaining).toBeGreaterThan(0);
    }
  }, 20000);
});


describe('enlarged king and genuine telegraphed revision hazards', () => {
  it('paired spike bays require all18px of body; exact contact edges remain safe and the underside is harmless', () => {
    for (const [x, safe] of [[109,true], [108.99,false], [147,true], [147.01,false]] as const) {
      const run = new FallRun(() => {}, random(1), { scroll: false, course: [
        { x: x - 28, y: START_Y, width: 56, type: 'normal' }, { x: 100, y: START_Y + 64, width: 56, type: 'normal' }],
        hazards: [{ kind: 'spikes', x: 0, y: START_Y + 56, width: 100, height: 8 }, { kind: 'spikes', x: 156, y: START_Y + 56, width: 100, height: 8 }] });
      run.start(); run.drop(); const s = until(run, s => !s.alive || s.player.platformId === 2);
      expect(s.alive).toBe(safe); if (!safe) expect(run.result()).toMatchObject({ outcome: 'spike', platformType: null });
      else { run.drop(); advance(run, .3); expect(run.snapshot().alive).toBe(true); }
    }
    expect(PLAYER_WIDTH).toBe(18); expect(PLAYER_HEIGHT).toBe(33);
  });
  it('wall hugging gets a visible0.9s warning before real needle death; leaving during warning avoids it', () => {
    for (const escape of [false,true]) {
      const stamps: {type:string,time:number}[] = [];
      const run = new FallRun(e => stamps.push({type:e.type,time:run.snapshot().time}), random(1), {
        course: [{x:0,y:START_Y,width:160,type:'normal'}], hazards: [{kind:'wall_needle',x:0,y:80,width:18,height:44,side:-1}] });
      run.start(); run.setHorizontal(-1); until(run, s => s.hazards[0].state === 'warning');
      const warned = run.snapshot().time; advance(run,.35); expect(run.snapshot().alive).toBe(true);
      if (escape) run.setHorizontal(1);
      advance(run,.55);
      if (escape) { expect(run.snapshot().alive).toBe(true); advance(run,2); expect(run.snapshot().alive).toBe(true); }
      else { const s=until(run,s=>!s.alive,2); expect(s.player.x).toBe(12); expect(run.result()?.outcome).toBe('needle');
        const activated=stamps.find(e=>e.type==='hazard_active')!; expect(activated.time-warned).toBeGreaterThanOrEqual(.9-1e-9);
        run.step(1); expect(stamps.filter(e=>e.type==='end')).toHaveLength(1); }
    }
  });
  it('ordinary early wall hugging reaches needle collision before any later spike row', () => {
    for(const direction of [-1,1] as const){
      const events:{type:string,time:number}[]=[];
      const run=new FallRun(e=>events.push({type:e.type,time:run.snapshot().time}),random(2));
      run.start();run.setHorizontal(direction);const ended=until(run,s=>!s.alive,5);
      expect(run.result()?.outcome).toBe('needle');expect(ended.depth).toBeLessThan(8);
      const warning=events.find(e=>e.type==='hazard_warning')!,active=events.find(e=>e.type==='hazard_active')!;
      expect(active.time-warning.time).toBeGreaterThanOrEqual(.9-1e-9);
    }
  });
  it('bird sweeps include its own motion and full king body, catching crossing even when both endpoint boxes miss', () => {
    const bird={x:200,y:120,width:18,height:10};
    expect(sweptHazardHit({x:128,y:140},{x:128,y:140},bird,40)).not.toBeNull();
    expect(sweptHazardHit({x:128,y:112},{x:128,y:112},bird,40)).toBeNull();
    expect(sweptHazardHit({x:128,y:176},{x:128,y:176},bird,40)).toBeNull();
  });
  it('grounded waiting is safe at both ends of bird gaps; legal timed DROP can avoid or hit the same active bird', () => {
    let hit=false,safe=false;
    for (const delay of [1.1,1.5,2,2.5,3,3.5,4,4.5,5]) {
      const stamps:{type:string,time:number}[]=[];
      const run=new FallRun(e=>stamps.push({type:e.type,time:run.snapshot().time}),random(1),{
        scroll:false,course:[{x:78,y:112,width:100,type:'normal'},{x:78,y:176,width:100,type:'normal'}],
        hazards:[{kind:'bird',x:119,y:122.5,width:18,height:10,amplitude:80,period:6,phase:0}] });
      run.start(); advance(run,delay); expect(run.snapshot().alive).toBe(true);
      const warning=stamps.find(e=>e.type==='hazard_warning')!, active=stamps.find(e=>e.type==='hazard_active')!;
      expect(active.time-warning.time).toBeGreaterThanOrEqual(1-1e-9); run.drop();
      const s=until(run,s=>!s.alive||s.player.platformId===2);
      if(!s.alive){hit=true;expect(run.result()?.outcome).toBe('bird');}
      else{safe=true;advance(run,7);expect(run.snapshot().alive).toBe(true);}
    }
    expect(hit).toBe(true);expect(safe).toBe(true);
  });
  it('spikes preserve the whole moving bay envelope and copied hazard state cannot alter physics', () => {
    let cursor={y:START_Y,center:128,nextId:2,chunks:0},previousY=START_Y;
    for(let i=0;i<80;i++){
      const chunk=generateChunk(cursor,random(i+1));cursor=chunk.cursor;
      expect(chunk.platforms.every(p=>p.width<WORLD_WIDTH)).toBe(true);
      for(const h of chunk.hazards){
        if(h.kind==='bird'){const next=chunk.platforms.filter(p=>p.route)[0];expect(h.y-previousY).toBeGreaterThanOrEqual(6);
          expect(next.y-PLAYER_HEIGHT-h.y-h.height).toBeGreaterThanOrEqual(6);expect(previousY).toBeGreaterThan(START_Y);}
        if(h.kind==='spikes'){const p=chunk.platforms.find(p=>p.id===h.anchorPlatformId)!;
          expect(h.x+h.width<=p.x||h.x>=p.x+p.width).toBe(true);}
      }
      previousY=chunk.platforms.filter(p=>p.route)[3].y;
    }
    const run=new FallRun(()=>{},random(1));run.start();const first=run.snapshot();
    const originalState=first.hazards[0].state;first.hazards[0].state='active';first.hazards[0].x=999;
    expect(run.snapshot().hazards[0].state).toBe(originalState);expect(run.snapshot().hazards[0].x).not.toBe(999);
  });
});


describe('revision03 continuous fall and consequential route choices', () => {
  it('holding DOWN passes ordinary floors without resetting gravity or impact distance; release catches the next floor', () => {
    const events: FallEvent[] = [];
    const run = new FallRun(e => events.push(e), random(1), { scroll: false, course: [
      { x: 0, y: 112, width: 256, type: 'normal' },
      { x: 0, y: 144, width: 256, type: 'normal' },
      { x: 0, y: 176, width: 256, type: 'normal' },
      { x: 0, y: 272, width: 256, type: 'normal' },
    ] });
    run.start(); run.setDropHeld(true);
    until(run, s => s.passedPlatforms === 2);
    expect(run.snapshot()).toMatchObject({ phase: 'falling', heldDrop: true });
    expect(run.snapshot().fallDistance).toBeGreaterThanOrEqual(4);
    expect(run.inspection().fallStartY).toBe(112);
    expect(events.filter(e => e.type === 'landing')).toHaveLength(0);
    run.setDropHeld(false); until(run, s => !s.alive);
    expect(run.result()).toMatchObject({ outcome: 'impact', fallDistance: 10 });
  });
  it('soft catches hold at its true deep distance, awards NICE and automatically resumes after bounded recovery', () => {
    const run = new FallRun(() => {}, random(1), { scroll: false, course: [
      { x: 0, y: 112, width: 256, type: 'normal' },
      { x: 0, y: 160, width: 256, type: 'normal' },
      { x: 0, y: 112 + 10.7 * 16, width: 256, type: 'soft' },
      { x: 0, y: 112 + 14 * 16, width: 256, type: 'crumble' },
    ] });
    run.start(); run.setDropHeld(true); const catchState = until(run, s => s.player.platformId === 3);
    expect(catchState.lastLanding).toMatchObject({ kind: 'hard', nice: true, fallDistance: 10.7 });
    expect(catchState.passedPlatforms).toBe(1); expect(catchState.niceDrops).toBe(1);
    until(run, s => s.player.platformId === 4);
    expect(run.snapshot().alive).toBe(true); expect(run.snapshot().lastLanding?.fallDistance).toBeCloseTo(3.3);
  });
  it('held continuous falls remain vulnerable to floor spikes and restart clears every held input', () => {
    const run = new FallRun(() => {}, random(1), { scroll: false, course: [
      { x: 0, y: 112, width: 256, type: 'normal' }, { x: 0, y: 176, width: 256, type: 'normal' },
    ], hazards: [{ kind: 'spikes', x: 112, y: 168, width: 32, height: 8 }] });
    run.start(); run.setDropHeld(true); until(run, s => !s.alive);
    expect(run.result()?.outcome).toBe('spike'); run.start();
    expect(run.snapshot()).toMatchObject({ heldDrop: false, passedPlatforms: 0, phase: 'grounded' });
  });
  it('varied safe steps and deep soft routes coexist in every authored pattern, with short and long gaps that remain physically reachable', () => {
    const gaps = new Set<number>();
    for (let index = 0; index < AUTHORED_PATTERNS.length; index++) {
      const chunk = generateChunk({ y: START_Y, center: 128, nextId: 2, chunks: 0 }, () => (index + .1) / AUTHORED_PATTERNS.length);
      let previous = platformFromSeed(INITIAL_PLATFORM, 1);
      for (const p of chunk.platforms.filter(p => p.route)) { gaps.add((p.y - previous.y) / 16); expect(safeLinkIssues(previous, p)).toEqual([]); previous = p; }
      const catchPad = chunk.platforms.find(p => p.type === 'soft')!;
      expect((catchPad.y - START_Y) / 16).toBeGreaterThan(10.2);
      expect((catchPad.y - START_Y) / 16).toBeLessThan(12);
    }
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeGreaterThan(3);
  });
  it('public hold and steering can choose the deep soft catch instead of stepping and neutral hold has no permanent safe lane', () => {
    for (const seed of [1, 17, 77]) {
      const run = new FallRun(() => {}, random(seed)); run.start();
      const soft = run.snapshot().platforms.find(p => p.type === 'soft')!; run.setDropHeld(true);
      let s = run.snapshot();
      for (let i = 0; s.alive && s.player.platformId !== soft.id && i < 600; i++) {
        run.setHorizontal(signControl(soft.x + soft.width / 2 - s.player.x, s.player.vx)); run.step(1 / 120); s = run.snapshot();
      }
      expect(s.alive, `seed ${seed} shortcut`).toBe(true); expect(s.player.platformId).toBe(soft.id);
      expect(s.lastLanding?.fallDistance).toBeGreaterThan(10.2); expect(s.niceDrops).toBe(1);
    }
    for (let seed = 1; seed <= 25; seed++) { const run = new FallRun(() => {}, random(seed)); run.start(); run.setDropHeld(true); until(run, s => !s.alive, 20); expect(run.snapshot().depth).toBeLessThan(40); }
  });
});
