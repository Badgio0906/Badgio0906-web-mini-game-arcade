import { describe, it, expect } from 'vitest';
import { ChargeRun } from '../../src/games/game019/ChargeRun';
import { MAX_CHARGE_MS, PPM, STEP, jumpFor, type ChargeEvent } from '../../src/games/game019/chargeTypes';
import { createFlatPrototype } from '../../src/games/game019/prototypeLevel';
const hold = (run: ChargeRun, ms: number) => { expect(run.beginCharge()).toBe(true); for (let i = 0; i < Math.round(ms / 1000 / STEP); i++) run.update(STEP); };
const land = (run: ChargeRun) => { for (let i = 0; i < 1200 && !run.player.grounded; i++) run.update(STEP); expect(run.player.grounded).toBe(true); };
describe('Game019 continuous charge prototype', () => {
  it('holds without launching even at maximum, then launches only on release', () => {
    const events: ChargeEvent[] = [], r = new ChargeRun(createFlatPrototype(), e => events.push(e)); hold(r, 1300);
    expect(r.player.grounded).toBe(true); expect(r.chargeMs).toBe(MAX_CHARGE_MS); expect(r.jumps).toBe(0); expect(r.releaseCharge()).toBe(true); expect(r.releaseCharge()).toBe(false); expect(events.filter(e => e.type === 'jump')).toHaveLength(1);
  });
  it('has continuous power, a useful short displacement, and distinct medium/maximum heights', () => {
    const peaks: number[] = [];
    for (const ms of [90, 360, 450, 720]) { const r = new ChargeRun(createFlatPrototype()); r.setDirection(0); hold(r, ms); r.releaseCharge(); land(r); peaks.push(r.maxHeight); }
    expect(peaks[0]).toBeLessThan(1); expect(peaks[1]).toBeGreaterThan(3); expect(peaks[2]).toBeGreaterThan(peaks[1] + 1); expect(peaks[3]).toBeCloseTo(9, 2);
    const r = new ChargeRun(createFlatPrototype()); r.setDirection(1); hold(r, 90); r.releaseCharge(); land(r); expect(r.player.x - 180).toBeGreaterThan(15); expect(r.player.x - 180).toBeLessThan(40);
    expect(jumpFor(400).height).not.toBe(jumpFor(410).height);
  });
  it('cancels instead of launching on pause/cancel and cannot pre-charge in air', () => {
    const r = new ChargeRun(createFlatPrototype()); hold(r, 450); r.cancelCharge(); expect(r.releaseCharge()).toBe(false); expect(r.jumps).toBe(0); hold(r, 300); r.releaseCharge(); expect(r.beginCharge()).toBe(false);
  });
  it('commits direction at release and ignores air direction in the first candidate', () => {
    const r = new ChargeRun(createFlatPrototype()); hold(r, 450); r.setDirection(1); r.releaseCharge(); const vx = r.player.vx; r.setDirection(-1); r.update(.1); expect(r.player.vx).toBe(vx);
  });
  it('compares a measurable weak correction without shipping it as the default', () => {
    const a = new ChargeRun(createFlatPrototype()), b = new ChargeRun(createFlatPrototype(), () => {}, 24);
    for (const r of [a, b]) { r.setDirection(0); hold(r, 450); r.releaseCharge(); r.setDirection(1); for (let i = 0; i < 60; i++) r.update(STEP); }
    expect(a.player.x).toBe(180); expect(b.player.x).toBeGreaterThan(a.player.x + 2);
  });
  it('retries from the actual floor in the same run and records descent separately from progress lost', () => {
    const r = new ChargeRun(createFlatPrototype()); hold(r, 450); r.releaseCharge(); land(r); expect(r.alive).toBe(true); expect(r.totalFall).toBeGreaterThan(4); expect(r.falls).toBe(0); expect(r.player.y / PPM).toBe(0); hold(r, 100); expect(r.time).toBeGreaterThan(0);
  });
  it('forecast has no source state/event/time side effects', () => {
    const events: ChargeEvent[] = [], r = new ChargeRun(createFlatPrototype(), e => events.push(e)); const before = r.snapshot(); const f = r.forecast(450, 1); expect(f.landing).not.toBe(null); expect(r.snapshot()).toEqual(before); expect(events).toHaveLength(0);
  });
});
