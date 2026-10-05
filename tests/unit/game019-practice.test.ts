import { describe, expect, it } from 'vitest';
import { FrogPractice, PRACTICE_LESSONS } from '../../src/games/game019/FrogPractice';
import type { Direction } from '../../src/games/game019/types';
const settle = (practice: FrogPractice) => { for (let i = 0; i < 1600 && !practice.run.player.grounded; i++) practice.update(1 / 120); };
describe('Game019 separate practice', () => {
  it('requires matching jump size, real landing and explicit next for each lesson', () => {
    const passed: number[] = [];
    const practice = new FrogPractice(stage => passed.push(stage));
    expect(practice.next()).toBe(false);
    for (let stage = 0; stage < 4; stage++) {
      expect(practice.stage).toBe(stage); expect(practice.passed).toBe(false);
      const direction: Direction = stage === 2 ? 1 : -1;
      expect(practice.jump(PRACTICE_LESSONS[stage].size, direction)).toBe(true);
      expect(practice.passed).toBe(false); settle(practice);
      expect(practice.passed).toBe(true); expect(practice.jump('small', 0)).toBe(false);
      expect(practice.next()).toBe(true);
    }
    expect(practice.complete).toBe(true); expect(passed).toEqual([0, 1, 2, 3]);
    expect(practice.next()).toBe(false);
  });
  it('small straight hop and a different size do not pretend to teach repositioning', () => {
    const practice = new FrogPractice();
    practice.jump('small', 0); settle(practice); expect(practice.passed).toBe(false);
    practice.jump('medium', -1); settle(practice); expect(practice.passed).toBe(false);
    practice.jump('small', 1); settle(practice); expect(practice.passed).toBe(true);
  });
  it('neutral big jump misses the actual big lesson ledge and cannot complete it', () => {
    const practice = new FrogPractice(); practice.jump('small', -1); settle(practice); practice.next();
    practice.jump('medium', -1); settle(practice); practice.next();
    expect(practice.lesson.text).toContain('→'); practice.jump('large', 0); settle(practice); expect(practice.passed).toBe(false);
    practice.jump('large', 1); settle(practice); expect(practice.passed).toBe(true);
  });
  it('practice starts fresh and remains isolated from normal progression', () => {
    const practice = new FrogPractice(); practice.jump('small', -1); settle(practice); practice.next();
    practice.start(); expect(practice.stage).toBe(0); expect(practice.complete).toBe(false); expect(practice.run.height).toBe(0);
    expect(practice.run.snapshot().practice).toBe(true); expect(practice.run.snapshot().milestoneSeen).toBe(false);
  });
});
