import { describe, expect, it } from 'vitest';
import { PairBoard, isFree } from '../../src/games/game020/PairBoard';
import { attackDuration, freshChallenge, rewardPair } from '../../src/games/game020/challenge';
describe('12-tile challenge', () => {
  it('has a legal complete six-pair solution for every tested seed', () => {
    for (let seed = 0; seed < 100; seed++) {
      const board = new PairBoard('mini', seed); expect(board.remaining).toBe(12);
      const route = board.solution.map(pair => [...pair]);
      for (const [a, b] of route) { expect(isFree(board.tiles, a)).toBe(true); expect(isFree(board.tiles, b)).toBe(true); board.select(a); expect(board.select(b)).toBe('removed'); }
      expect(board.cleared).toBe(true);
    }
  });
  it('combos use active play time, cap at eight, and expire after four seconds', () => {
    let state = freshChallenge();
    for (let i = 0; i < 10; i++) state = rewardPair(state, [i * 2, i * 2 + 1], i * 3000);
    expect(state.combo).toBe(8); expect(state.score).toBe(5200);
    state = rewardPair(state, [20, 21], 31001); expect(state.combo).toBe(1); expect(state.score).toBe(5300);
    expect(attackDuration(true)).toBe(60000); expect(attackDuration(false)).toBe(180000);
  });
  it('never farms points by undoing or reshuffling already scored tiles', () => {
    const first = rewardPair(freshChallenge(), [0, 1], 1000);
    expect(rewardPair(first, [0, 1], 2000)).toMatchObject({ score: 100, combo: 0 });
    expect(rewardPair(first, [0, 3], 2000)).toMatchObject({ score: 100, combo: 0 });
    expect(rewardPair(first, [2, 3], 2000)).toMatchObject({ score: 300, combo: 2 });
  });
});
