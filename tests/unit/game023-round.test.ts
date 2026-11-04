import { describe, expect, it } from 'vitest';
import { createQuestion, guess } from '../../src/games/game023/model';
import { freshRound, settleRound, validRound } from '../../src/games/game023/round';
import { emptySave, validateSave } from '../../src/games/game023/persistence';
function solved() { let q = createQuestion('w_food_001', 23); for (const kana of 'おにぎり') q = guess(q, kana).question; return q; }
describe('five-word rounds', () => {
  it('awards accuracy and consecutive solved-word bonuses only once', () => {
    const first = settleRound(freshRound(), solved());
    expect(first).toMatchObject({ index: 1, score: 310, streak: 1, solved: 1, settled: true });
    expect(settleRound(first, solved())).toBe(first);
    expect(settleRound({ ...first, index: 2, settled: false }, solved()).score).toBe(670);
  });
  it('halves hinted points, failed words break the streak, playing words award nothing', () => {
    const initial = freshRound(); expect(settleRound(initial, createQuestion('w_food_001', 1))).toBe(initial);
    expect(settleRound(initial, { ...solved(), hintUsed: true }).score).toBe(155);
    const failed = { ...createQuestion('w_food_001', 1), remaining: 0, outcome: 'ended' as const };
    expect(settleRound({ ...initial, streak: 2, index: 3, solved: 2, score: 670 }, failed)).toMatchObject({ streak: 0, score: 670, solved: 2, settled: true });
  });
  it('validates optional round save metadata without changing legacy snapshots', () => {
    const old = emptySave(23); expect(validateSave(old)).toEqual(old);
    const current = { ...old, round: freshRound() }; expect(validateSave(current)).toEqual(current);
    for (const patch of [{ index: 6 }, { score: -1 }, { streak: 2 }, { settled: 'yes' }, { solved: 6 }]) {
      expect(validRound({ ...freshRound(), ...patch })).toBe(false);
      expect(validateSave({ ...old, round: { ...freshRound(), ...patch } })).toBeNull();
    }
  });
});
