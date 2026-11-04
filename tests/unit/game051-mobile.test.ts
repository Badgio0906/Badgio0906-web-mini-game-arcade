import { readFileSync } from 'node:fs';
import { it, expect } from 'vitest';
const source = readFileSync('src/games/game051/recovered/main.js', 'utf8');
// Run the shipped pure model without its browser/audio bootstrapping.
const { create, stamp, tick, forecast } = new Function(`${source.slice(source.indexOf('const Z ='), source.indexOf('const tt ='))}; return {create:at,stamp:dt,tick:ft,forecast:lt};`)();
it('recorded positions replay as upcoming ghosts, and collaboration chains gain a capped multiplier', () => {
  const state = create(false);
  while (state.tick < 1800) {
    const take = Math.floor(state.tick / 600), local = state.tick % 600;
    if ([120, 300, 480].includes(local)) expect(stamp(state, take)).toBe(true);
    if (state.tick === 700) expect(forecast(state)).toEqual(expect.arrayContaining([expect.objectContaining({ lane: 0, actor: 1 })]));
    tick(state);
  }
  expect(state.pairs).toBe(3); expect(state.trios).toBe(3);
  expect(state.maxCombo).toBe(6); expect(state.multiplier).toBe(4);
  expect(state.score).toBeGreaterThan(4500);
  while (state.tick < 2000) tick(state);
  expect(state.combo).toBe(0); expect(state.multiplier).toBe(1);
});
it('practice completes independently without requiring the full score run', () => {
  const state = create(true);
  while (state.status === 'run' && state.tick < 1200) {
    const take = Math.floor(state.tick / 600), local = state.tick % 600;
    if ([120, 300, 480].includes(local)) stamp(state, take);
    tick(state);
  }
  expect(state.status).toBe('clear'); expect(state.tick).toBeLessThan(1200);
});
