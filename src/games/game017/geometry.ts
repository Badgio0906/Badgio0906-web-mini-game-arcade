import type { Point, Rain } from './types';
import { PLAYER_RADIUS } from './types';
export const distance = (a: Point, b: Point): number => Math.hypot(b.x - a.x, b.z - a.z);
export function segmentDistance(a: Point, b: Point, p: Point): number {
  const dx = b.x - a.x, dz = b.z - a.z, length = dx * dx + dz * dz;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / length)) : 0;
  return Math.hypot(a.x + dx * t - p.x, a.z + dz * t - p.z);
}
/** Exact segment entry, including tangencies: fast execution cannot tunnel through rain. */
export function circleEntry(a: Point, b: Point, center: Point, radius: number): number | null {
  const dx = b.x - a.x, dz = b.z - a.z, ox = a.x - center.x, oz = a.z - center.z;
  const c = ox * ox + oz * oz - radius * radius;
  if (c <= 0) return 0;
  const aa = dx * dx + dz * dz;
  if (!aa) return null;
  const bb = 2 * (ox * dx + oz * dz), discriminant = bb * bb - 4 * aa * c;
  if (discriminant < 0) return null;
  const t = (-bb - Math.sqrt(discriminant)) / (2 * aa);
  return t >= 0 && t <= 1 ? t : null;
}
export function safeSegment(a: Point, b: Point, rain: readonly Rain[], margin = 0): boolean {
  return rain.every(r => !r.dangerous || segmentDistance(a, b, r.impact) > r.radius + PLAYER_RADIUS + margin);
}
