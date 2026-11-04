export interface Challenge { shots: number; score: number; pocketed: number; combo: number }
export const CHALLENGE_SHOTS = 10;
export function newChallenge(): Challenge { return { shots: 0, score: 0, pocketed: 0, combo: 0 }; }
export function validChallenge(value: unknown): value is Challenge {
  const c = value as Challenge;
  return !!c && Number.isInteger(c.shots) && c.shots >= 0 && c.shots <= CHALLENGE_SHOTS && Number.isInteger(c.score) && c.score >= 0 && c.score <= 100000 && Number.isInteger(c.pocketed) && c.pocketed >= 0 && c.pocketed <= 150 && Number.isInteger(c.combo) && c.combo >= 0 && c.combo <= 10;
}
export function scoreChallenge(c: Challenge, pocketed: readonly number[]): Challenge {
  if (c.shots >= CHALLENGE_SHOTS) return { ...c };
  const balls = pocketed.filter(id => id !== 0).length, scratch = pocketed.includes(0);
  const combo = balls && !scratch ? c.combo + 1 : 0;
  const points = balls * (100 + Math.min(8, Math.max(0, combo - 1)) * 25);
  return { shots: c.shots + 1, score: Math.max(0, c.score + points - (scratch ? 150 : 0)), pocketed: c.pocketed + balls, combo };
}
