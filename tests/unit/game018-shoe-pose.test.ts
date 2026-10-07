import { describe, expect, it } from 'vitest';
import { kickPose, supportPose } from '../../src/games/game018/kickPose';
import { ANKLE_SPIN_LIMIT, attachedShoe, releasedShoe, setupSwing } from '../../src/games/game018/shoePose';

describe('Game018 connected artwork transforms', () => {
  it('keeps the ankle fixed and the shoe/toe in the same foot transform for all settings', () => {
    for (const angle of [5, 45, 85]) for (const spin of [-1, -.5, 0, .5, 1]) {
      const pose = kickPose(0, setupSwing(angle)), attached = attachedShoe(pose, spin);
      expect(attached.ankle).toEqual(pose.ankle);
      expect(Math.hypot(attached.center.x - pose.ankle.x, attached.center.y - pose.ankle.y)).toBeCloseTo(14, 10);
      expect(Math.hypot(attached.toe.x - pose.ankle.x, attached.toe.y - pose.ankle.y)).toBeCloseTo(46, 10);
      expect(Math.atan2(attached.center.y - pose.ankle.y, attached.center.x - pose.ankle.x)).toBeCloseTo(attached.footAngle, 10);
      expect(Math.atan2(attached.toe.y - pose.ankle.y, attached.toe.x - pose.ankle.x)).toBeCloseTo(attached.footAngle, 10);
    }
  });
  it('makes sign and strength visible without rotating the knee, calf or supporting foot', () => {
    const pose = kickPose(0, setupSwing(45)), before = structuredClone(pose), support = supportPose();
    const values = [-1, -.5, 0, .5, 1].map(spin => attachedShoe(pose, spin).footAngle);
    expect(values[0] - values[2]).toBeCloseTo(ANKLE_SPIN_LIMIT);
    expect(values[2] - values[4]).toBeCloseTo(ANKLE_SPIN_LIMIT);
    expect(values[1] - values[2]).toBeCloseTo(ANKLE_SPIN_LIMIT / 2);
    expect(values.every((v, i) => i === 0 || v < values[i - 1])).toBe(true);
    expect(pose).toEqual(before); expect(supportPose()).toEqual(support);
    expect(ANKLE_SPIN_LIMIT).toBeLessThan(Math.PI / 6);
  });
  it('has no position or orientation snap at the shoe release frame', () => {
    for (const angle of [5, 45, 85]) for (const spin of [-1, 0, 1]) {
      const pose = kickPose(.63, setupSwing(angle)), attached = attachedShoe(pose, spin), released = releasedShoe(pose, spin, angle);
      expect(released.x).toBeCloseTo(attached.center.x, 10); expect(released.y).toBeCloseTo(attached.center.y, 10);
      expect(released.rotation).toBeCloseTo(attached.footAngle, 10);
    }
  });
  it('moves the released shoe along the chosen cos/sin angle even while the leg moves', () => {
    for (const angle of [5, 45, 85]) for (const spin of [-1, 0, 1]) {
      const initial = releasedShoe(kickPose(.63), spin, angle), theta = angle * Math.PI / 180;
      for (const progress of [.64, .7, .78, .9, 1]) {
        const pose = kickPose(progress), released = releasedShoe(pose, spin, angle);
        const dx = released.x - initial.x, dy = released.y - initial.y;
        expect(dx * Math.sin(theta) + dy * Math.cos(theta)).toBeCloseTo(0, 10);
        expect(Math.atan2(-dy, dx)).toBeCloseTo(theta, 10);
        expect(Math.hypot(dx, dy)).toBeCloseTo(pose.releaseProgress * 260, 10);
      }
    }
  });
});
