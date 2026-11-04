export const HEART_BEST_KEY = 'game014.mobile.v2.best';
export const poseNames = ['heart', 'peace', 'open', 'ok', 'fox', 'point', 'thumbs_up'];
export function heartInterval(successes) { return [.65, .55, .45, .35, .25][Math.min(4, Math.floor(successes / 5))]; }
export function heartJudge(pose, elapsed, interval) {
  if (pose !== 'heart' || elapsed < 0 || elapsed >= interval) return { label: 'ミス', points: 0 };
  const perfect = Math.abs(elapsed - interval / 2) <= interval * .22;
  return { label: perfect ? 'ぴったり！' : 'まあまあ', points: perfect ? 100 : 60 };
}
export function heartRank(score) { return score >= 2300 ? 'S' : score >= 1800 ? 'A' : score >= 1200 ? 'B' : score >= 600 ? 'C' : 'D'; }
