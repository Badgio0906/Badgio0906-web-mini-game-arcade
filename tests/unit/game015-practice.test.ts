import { describe, expect, it } from 'vitest';
import { PracticeSession } from '../../src/arcade/PracticeSession';
import { FallPractice, PRACTICE_START_Y } from '../../src/arcade/FallPractice';
import { AIR_ACCELERATION, GRAVITY, PLAYER_WIDTH } from '../../src/games/game015/types';
const advance = (s: PracticeSession, seconds: number, dt = .005): void => { for (let t = 0; t < seconds; t += dt) s.update(dt); };
function reachSteering(): PracticeSession { const s = new PracticeSession('game015'); s.action('action'); advance(s, 2.2); expect(s.snapshot().step).toBe(1); return s; }
describe('FALL KING isolated physical practice', () => {
  it('cannot complete by waiting and rejects invalid elapsed values without changing any state', () => {
    const s = new PracticeSession('game015'), first = s.snapshot();
    for (const dt of [0, -1, NaN, Infinity]) s.update(dt);
    expect(s.snapshot()).toEqual(first); advance(s, 40); expect(s.snapshot()).toMatchObject({ step: 0, complete: false });
    const direct = new FallPractice(), directFirst = direct.snapshot(); for (const dt of [0, -1, NaN, Infinity]) direct.update(dt); expect(direct.snapshot()).toEqual(directFirst);
  });
  it('DROP must descend and contact the first platform before the lesson advances', () => {
    const s = new PracticeSession('game015'); s.action('action'); advance(s, .25);
    expect(s.snapshot().fall).toMatchObject({ grounded: false, phase: 'falling' }); expect(s.snapshot().fall!.y).toBeGreaterThan(PRACTICE_START_Y); expect(s.snapshot().step).toBe(0);
    s.action('action'); advance(s, .8); const f = s.snapshot().fall!; expect(f).toMatchObject({ grounded: true, phase: 'landed', step: 0 }); expect(f.y).toBe(f.target.y); expect(f.fallDistance).toBeCloseTo(5);
    advance(s, 1); expect(s.snapshot()).toMatchObject({ step: 1, complete: false });
  });
  it.each([.005, 1 / 60, .05])('requires rightward air steering and recovers from a wrong-way miss at %s seconds per update', dt => {
    const s = reachSteering(); s.setInput(-1); s.action('action'); advance(s, 4, dt); expect(s.snapshot()).toMatchObject({ step: 1, complete: false }); expect(s.snapshot().fall).toMatchObject({ grounded: true, phase: 'grounded' });
    s.setInput(1); s.action('action'); advance(s, 1.05, dt); const landed = s.snapshot().fall!; expect(landed.phase).toBe('landed'); expect(landed.x + PLAYER_WIDTH / 2).toBeGreaterThan(landed.target.x); expect(landed.x - PLAYER_WIDTH / 2).toBeLessThan(landed.target.x + landed.target.width);
    advance(s, 1, dt); expect(s.snapshot().step).toBe(2);
  });
  it('uses production acceleration and gravity, retains air drift and allows opposite input to brake', () => {
    const s = reachSteering(); s.setInput(1); s.action('action'); s.update(.005); const first = s.snapshot().fall!;
    expect(first.vx).toBeCloseTo(AIR_ACCELERATION * .005); expect(first.vy).toBeCloseTo(GRAVITY * .005);
    advance(s, .25); s.setInput(0); const released = s.snapshot().fall!; advance(s, .1); expect(s.snapshot().fall!.x).toBeGreaterThan(released.x); expect(s.snapshot().fall!.vx).toBeGreaterThan(0);
    s.setInput(-1); advance(s, .15); expect(s.snapshot().fall!.vx).toBeLessThan(released.vx);
  });
  it('earns all three real landings then waits for the separate ghost fatal impact demonstration', () => {
    const s = reachSteering(); s.setInput(1); s.action('action'); advance(s, 2.2); expect(s.snapshot().step).toBe(2);
    s.action('action'); advance(s, 1.1); expect(s.snapshot().fall).toMatchObject({ phase: 'landed', grounded: true, ghost: false }); expect(s.snapshot().fall!.fallDistance).toBeCloseTo(5.2); expect(s.snapshot().complete).toBe(false);
    advance(s, 1); expect(s.snapshot().fall).toMatchObject({ ghost: true, step: 3 }); expect(s.snapshot().complete).toBe(false);
    advance(s, 2); expect(s.snapshot().fall).toMatchObject({ ghost: true, phase: 'splat' }); expect(s.snapshot().fall!.fallDistance).toBeGreaterThan(9); expect(s.snapshot().feedback).toContain('着地衝撃'); expect(s.snapshot().complete).toBe(false);
    advance(s, 1.3); expect(s.snapshot()).toMatchObject({ step: 4, complete: true }); expect(s.snapshot().practicePoints).toBe(0);
  });
  it('nested exposed geometry edits cannot alter practice and completion absorbs further inputs', () => {
    const s = new PracticeSession('game015'), exposed = s.snapshot(); exposed.fall!.target.x = 999; exposed.fall!.y = 999; expect(s.snapshot().fall!.target.x).toBe(48); expect(s.snapshot().fall!.y).toBe(PRACTICE_START_Y);
    s.action('action'); advance(s, 2.2); s.setInput(1); s.action('action'); advance(s, 2.2); s.action('action'); advance(s, 5); const done = s.snapshot(); expect(done.complete).toBe(true); s.action('action'); advance(s, 2); expect(s.snapshot()).toEqual(done);
  });
});
