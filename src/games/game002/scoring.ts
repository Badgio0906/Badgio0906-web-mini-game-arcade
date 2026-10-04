export interface WorkdayScore { distance: number; dodges: number; bonusPercent: number; score: number }
const validCount = (value: number): number => Number.isFinite(value) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value))) : 0;

/** NICE DODGE is a stepped distance bonus, never distance multiplied by the raw count. */
export function bonusPercentForDodges(dodges: number): number {
  const count = validCount(dodges);
  return count >= 15 ? 170 : count >= 10 ? 145 : count >= 6 ? 125 : count >= 3 ? 110 : 100;
}
export function calculateWorkdayScore(distance: number, dodges: number): WorkdayScore {
  const metres = validCount(distance); const count = validCount(dodges);
  const bonusPercent = bonusPercentForDodges(count);
  return { distance: metres, dodges: count, bonusPercent, score: Math.min(Number.MAX_SAFE_INTEGER, Math.floor(metres * bonusPercent / 100)) };
}
