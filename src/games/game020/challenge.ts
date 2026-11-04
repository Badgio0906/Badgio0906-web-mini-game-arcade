export interface PairChallenge { score: number; combo: number; lastAt: number; rewarded: number[] }
export const freshChallenge = (): PairChallenge => ({ score: 0, combo: 0, lastAt: -Infinity, rewarded: [] });
/** A tile earns points once per board, including after undo or reshuffle. */
export function rewardPair(state: PairChallenge, pair: readonly number[], activeMs: number): PairChallenge {
  if (pair.some(id => state.rewarded.includes(id))) return { ...state, combo: 0, lastAt: -Infinity };
  const combo = activeMs - state.lastAt <= 4000 ? Math.min(8, state.combo + 1) : 1;
  return { score: state.score + 100 * combo, combo, lastAt: activeMs, rewarded: [...state.rewarded, ...pair] };
}
export const attackDuration = (mini: boolean): number => mini ? 60000 : 180000;
