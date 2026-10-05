import { describe, expect, it } from 'vitest';
import { PracticeSession } from '../../src/arcade/PracticeSession';
import { FallPractice, PRACTICE_START_Y } from '../../src/arcade/FallPractice';
import { AIR_ACCELERATION, GRAVITY, PLAYER_WIDTH, SCROLL_START_SPEED, SCROLL_TOP_LIMIT } from '../../src/games/game015/types';
const advance = (s: PracticeSession, seconds: number, dt = .005): void => { for (let t = 0; t < seconds; t += dt) s.update(dt); };
function reachSteering(): PracticeSession { const s = new PracticeSession('game015'); s.action('action'); advance(s, 2.2); expect(s.snapshot().step).toBe(1); return s; }
function reachScrollDemo(): PracticeSession {
  const s = reachSteering(); s.setInput(1); s.action('action'); advance(s, 2.2); expect(s.snapshot().step).toBe(2);
  s.setInput(-1); s.action('action'); advance(s, 2.2); expect(s.snapshot().step).toBe(3); return s;
}
describe('FALL KING isolated scrolling and hazard practice', () => {
  it('cannot complete by waiting, safely retries the scroll death, and ignores invalid elapsed values', () => {
    const s = new PracticeSession('game015'), first = s.snapshot();
    for (const dt of [0, -1, NaN, Infinity]) s.update(dt);
    expect(s.snapshot()).toEqual(first); advance(s, 40); expect(s.snapshot()).toMatchObject({ step: 0, complete: false });
    expect(s.snapshot().fall).toMatchObject({ cause: 'scroll', phase: 'grounded' }); expect(s.snapshot().feedback).toContain('何度でも');
    const direct = new FallPractice(), directFirst = direct.snapshot(); for (const dt of [0, -1, NaN, Infinity]) direct.update(dt); expect(direct.snapshot()).toEqual(directFirst);
  });
  it('DROP must descend and contact the first platform before the lesson advances', () => {
    const s = new PracticeSession('game015'); s.action('action'); advance(s, .25);
    expect(s.snapshot().fall).toMatchObject({ grounded: false, phase: 'falling' }); expect(s.snapshot().fall!.y).toBeGreaterThan(PRACTICE_START_Y); expect(s.snapshot().step).toBe(0);
    s.action('action'); advance(s, .8); const f = s.snapshot().fall!; expect(f).toMatchObject({ grounded: true, phase: 'landed', step: 0 }); expect(f.y).toBe(f.target.y); expect(f.fallDistance).toBeCloseTo(5);
    advance(s, 1); expect(s.snapshot()).toMatchObject({ step: 1, complete: false });
  });
  it.each([.005, 1 / 60, .05])('requires both rightward and leftward steering around central spikes at %s seconds per update', dt => {
    const s = reachSteering(); s.action('action'); advance(s, 1, dt);
    expect(s.snapshot()).toMatchObject({ step: 1, complete: false }); expect(s.snapshot().fall).toMatchObject({ phase: 'grounded', cause: 'spike' });
    s.setInput(-1); s.action('action'); advance(s, 4, dt); expect(s.snapshot()).toMatchObject({ step: 1, complete: false }); expect(s.snapshot().fall).toMatchObject({ grounded: true, phase: 'grounded' });
    s.setInput(1); s.action('action'); advance(s, 1.1, dt); const right = s.snapshot().fall!;
    expect(right.phase).toBe('landed'); expect(right.x + PLAYER_WIDTH / 2).toBeGreaterThan(right.target.x); expect(right.x - PLAYER_WIDTH / 2).toBeLessThan(right.target.x + right.target.width);
    advance(s, 1, dt); expect(s.snapshot().step).toBe(2);
    s.action('action'); advance(s, 1, dt); expect(s.snapshot().fall).toMatchObject({ step: 2, cause: 'spike', phase: 'grounded' });
    s.setInput(-1); s.action('action'); advance(s, 1.1, dt); const left = s.snapshot().fall!;
    expect(left.phase).toBe('landed'); expect(left.x + PLAYER_WIDTH / 2).toBeGreaterThan(left.target.x); expect(left.x - PLAYER_WIDTH / 2).toBeLessThan(left.target.x + left.target.width);
    expect(left.fallDistance).toBeLessThan(6); advance(s, 1, dt); expect(s.snapshot().step).toBe(3);
  });
  it('uses production acceleration and gravity, retains air drift and allows opposite input to brake', () => {
    const s = reachSteering(); s.setInput(1); s.action('action'); s.update(.005); const first = s.snapshot().fall!;
    expect(first.vx).toBeCloseTo(AIR_ACCELERATION * .005); expect(first.vy).toBeCloseTo(GRAVITY * .005);
    advance(s, .25); s.setInput(0); const released = s.snapshot().fall!; advance(s, .1); expect(s.snapshot().fall!.x).toBeGreaterThan(released.x); expect(s.snapshot().fall!.vx).toBeGreaterThan(0);
    s.setInput(-1); advance(s, .15); expect(s.snapshot().fall!.vx).toBeLessThan(released.vx);
  });
  it('earns three real landings then demonstrates a stationary ghost being swept into the top edge', () => {
    const s = reachScrollDemo(), before = s.snapshot().fall!;
    expect(before).toMatchObject({ ghost: true, grounded: true, phase: 'ghost', fallDistance: 0 }); expect(s.snapshot().complete).toBe(false);
    s.setInput(1); s.action('action'); advance(s, 1); const scrolling = s.snapshot().fall!;
    expect(scrolling.x).toBe(before.x); expect(scrolling.y).toBe(before.y); expect(scrolling.cameraY - before.cameraY).toBeCloseTo(SCROLL_START_SPEED, 0);
    expect(scrolling.y - scrolling.cameraY).toBeLessThan(before.y - before.cameraY); expect(scrolling.topRemaining).toBeCloseTo(scrolling.y - scrolling.cameraY - SCROLL_TOP_LIMIT);
    advance(s, 1.7); expect(s.snapshot().fall).toMatchObject({ ghost: true, phase: 'splat', cause: 'scroll', fallDistance: 0 });
    expect(s.snapshot().fall!.topRemaining).toBeLessThanOrEqual(0); expect(s.snapshot().feedback).toContain('上端'); expect(s.snapshot().complete).toBe(false);
    advance(s, 1.3); expect(s.snapshot()).toMatchObject({ step: 4, complete: true, practicePoints: 0 });
  });
  it('exposed geometry cannot alter practice and completion absorbs further inputs', () => {
    const s = reachSteering(), exposed = s.snapshot(); exposed.fall!.target.x = 999; exposed.fall!.startPlatform.y = 999; exposed.fall!.hazards[0].x = 999; exposed.fall!.y = 999;
    expect(s.snapshot().fall!.target.x).toBe(168); expect(s.snapshot().fall!.startPlatform.y).toBe(PRACTICE_START_Y); expect(s.snapshot().fall!.hazards[0].x).toBe(104); expect(s.snapshot().fall!.y).toBe(PRACTICE_START_Y);
    const doneSession = reachScrollDemo(); advance(doneSession, 5); const done = doneSession.snapshot(); expect(done.complete).toBe(true);
    doneSession.action('action'); advance(doneSession, 2); expect(doneSession.snapshot()).toEqual(done);
    const direct = new FallPractice(); direct.setInput(NaN); direct.setInput(2); direct.drop(); direct.update(.005); expect(direct.snapshot().vx).toBe(0);
  });
});
