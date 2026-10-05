import { DASH_SECONDS, GOAL, START, type Point, type Rain, type Scene } from './types';
import { safeSegment, distance } from './geometry';
export function randomFrom(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}
export function findSafeRoute(rain: readonly Rain[]): Point[] | null {
  // Forward grid edges are checked continuously, not merely at their endpoints.
  const columns = (GOAL.x - START.x) / 20 + 1, rows = 25, parents = new Int16Array(columns * rows).fill(-1);
  const point = (col: number, row: number): Point => ({ x: START.x + col * 20, z: 60 + row * 20 });
  parents[12] = 12;
  for (let col = 1; col < columns; col++) for (let row = 0; row < rows; row++) {
    for (let before = Math.max(0, row - 2); before <= Math.min(rows - 1, row + 2); before++) {
      const previous = (col - 1) * rows + before;
      if (parents[previous] >= 0 && safeSegment(point(col - 1, before), point(col, row), rain, 12)) { parents[col * rows + row] = previous; break; }
    }
  }
  let index = (columns - 1) * rows + 12;
  if (parents[index] < 0) return null;
  const path: Point[] = [];
  while (index >= rows) { path.push(point(Math.floor(index / rows), index % rows)); index = parents[index]; }
  path.push({ ...START }); path.reverse(); return path;
}
export function rainCandidate(round: number, random: () => number, wind: Point): Rain[] {
  const count = Math.min(42, 7 + round * 4), rain: Rain[] = [];
  for (let i = 0; i < count; i++) {
    const timeToImpact = i % 4 === 3 ? 2.6 + random() * 2 : .15 + random() * (DASH_SECONDS - .2);
    const fallSpeed = 100 + random() * 90;
    const impact = { x: 220 + random() * 580, z: 70 + random() * 460 };
    const radius = round >= 6 && i % 5 === 0 ? 27 : 13 + Math.min(7, round) + random() * 6;
    rain.push({ id: i, x: impact.x - wind.x * timeToImpact, z: impact.z - wind.z * timeToImpact, height: fallSpeed * timeToImpact, fallSpeed, timeToImpact, impact, radius, dangerous: timeToImpact <= DASH_SECONDS });
  }
  return rain;
}
export function createScene(round: number, seed: number, candidate = rainCandidate): Scene {
  const random = randomFrom(seed), wind = round >= 4 ? { x: (random() - .5) * 26, z: (random() - .5) * 42 } : { x: 0, z: 0 };
  for (let attempts = 1; attempts <= 24; attempts++) {
    const rain = candidate(round, random, wind), safeRoute = findSafeRoute(rain);
    if (safeRoute) return { rain, wind, safeRoute, attempts, rejected: attempts - 1, fallback: false };
  }
  // Bounded recovery still passes the same geometric validator; never accept an impossible scene.
  const rain = rainCandidate(round, random, wind).filter(r => !r.dangerous || Math.abs(r.impact.z - START.z) > r.radius + 60);
  const safeRoute = findSafeRoute(rain);
  if (!safeRoute) throw new Error('RAINSHIFT fallback route invariant');
  return { rain, wind, safeRoute, attempts: 25, rejected: 24, fallback: true };
}
export function practiceScene(): Scene {
  const rain: Rain[] = [410, 650, 760].map((x, i) => ({ id: i, x, z: i === 1 ? 420 : 300, height: 90, fallSpeed: 100, timeToImpact: .9, impact: { x, z: i === 1 ? 420 : 300 }, radius: 24, dangerous: true }));
  const safeRoute = findSafeRoute(rain)!;
  if (!safeRoute || distance(safeRoute[0], START) > 0) throw new Error('Invalid practice scene');
  return { rain, safeRoute, wind: { x: 0, z: 0 }, attempts: 1, rejected: 0, fallback: false };
}
