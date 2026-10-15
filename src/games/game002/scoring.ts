export interface WorkdayScore { distance: number; dodges: number; bonusPercent: number; score: number }
const validCount = (value: number): number => Number.isFinite(value) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value))) : 0;

/** NICE DODGE is a stepped distance bonus, never distance multiplied by the raw count. */
export function bonusPercentForDodges(dodges: number): number {
  const count = validCount(dodges);
  return count >= 15 ? 170 : count >= 10 ? 145 : count >= 6 ? 125 : count >= 3 ? 110 : 100;
}
export const BIKE_SPEEDS = Object.freeze([2, 2.25, 2.5, 2.8, 3.1, 3.4, 3.7, 4]);
export const BIKE_SCORE_MULTIPLIERS = Object.freeze([1, 1.5, 2.2, 3.2, 4.5, 6, 7.5, 9, 10.5]);
export function bikeStageAt(distance: number, bikeStartDistance: number | null): number {
  return bikeStartDistance === null ? 0 : Math.floor(Math.max(0, distance - bikeStartDistance) / 1000);
}
export const bikeSpeedAt = (stage: number): number => BIKE_SPEEDS[Math.min(BIKE_SPEEDS.length - 1, Math.max(0, Math.floor(stage)))];
export const bikeScoreMultiplierAt = (stage: number): number => BIKE_SCORE_MULTIPLIERS[Math.min(BIKE_SCORE_MULTIPLIERS.length - 1, Math.max(0, Math.floor(stage)))];
/** Integrate completed 1000m bands; the current multiplier never reprices earlier metres. */
export function weightedWorkdayDistance(distance: number, bikeStartDistance: number | null): number {
  const metres = Math.max(0, Number.isFinite(distance) ? distance : 0);
  if (bikeStartDistance === null) return metres;
  const before = Math.max(0, Math.min(metres, bikeStartDistance)), ridden = metres - before;
  let weighted = before;
  for (let stage = 0; stage < BIKE_SCORE_MULTIPLIERS.length; stage++) {
    const band = Math.max(0, ridden - stage * 1000);
    weighted += (stage === BIKE_SCORE_MULTIPLIERS.length - 1 ? band : Math.min(1000, band)) * BIKE_SCORE_MULTIPLIERS[stage];
  }
  return Math.min(Number.MAX_SAFE_INTEGER, weighted);
}
export function calculateWorkdayScore(distance: number, dodges: number, bikeStartDistance: number | null = null): WorkdayScore {
  const metres = validCount(distance); const count = validCount(dodges);
  const bonusPercent = bonusPercentForDodges(count);
  const weightedDistance = weightedWorkdayDistance(metres, bikeStartDistance);
  // NICE contributes its legacy bonus to plain metres once, separately from the bike integral.
  return { distance: metres, dodges: count, bonusPercent,
    score: Math.min(Number.MAX_SAFE_INTEGER, Math.floor(weightedDistance + metres * (bonusPercent - 100) / 100)) };
}
