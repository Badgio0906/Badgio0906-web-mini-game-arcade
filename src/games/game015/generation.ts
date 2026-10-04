import { AIR_ACCELERATION, AIR_DRAG, GRAVITY, MAX_HORIZONTAL_SPEED, PIXELS_PER_METER, PLAYER_HEIGHT, PLAYER_WIDTH, SAFE_FALL_METERS, TERMINAL_VELOCITY, WORLD_WIDTH } from './types';
import type { FallHazard, FallPlatform, HazardSeed, PlatformSeed } from './types';

export interface GenerationCursor { y: number; center: number; nextId: number; chunks: number }
export interface GeneratedChunk { platforms: FallPlatform[]; hazards: FallHazard[]; cursor: GenerationCursor }
export const START_Y = 112;
export const INITIAL_PLATFORM: PlatformSeed = Object.freeze({ x: 48, y: START_Y, width: 160, type: 'normal', route: true, pattern: 'start' });
export const AUTHORED_PATTERNS = Object.freeze([
  { id: 'center', offsets: [0, 0.5, -0.5, 0], gaps: [3.6, 4, 4, 4] },
  { id: 'zigzag', offsets: [-1, 1, 1, 0], gaps: [4.2, 4.2, 4.2, 4.2] },
  { id: 'stairs', offsets: [1, 1, -1, 0], gaps: [4.4, 4.4, 4.4, 4.4] },
  { id: 'long-drop', offsets: [-1, 1, -1, 0], gaps: [3.9, 4.3, 4.3, 4] },
  { id: 'soft-route', offsets: [1, -1, 1, 0], gaps: [3.5, 3.5, 3.5, 4.2] },
].map(p => Object.freeze({ ...p, offsets: Object.freeze(p.offsets), gaps: Object.freeze(p.gaps) })));

export function platformFromSeed(seed: PlatformSeed, id: number): FallPlatform {
  return { ...seed, id, originX: seed.x, height: seed.type === 'soft' ? 10 : 6,
    route: seed.route ?? true, pattern: seed.pattern ?? 'authored', amplitude: seed.amplitude ?? 0,
    period: seed.period ?? 8, phase: seed.phase ?? 0, crumbleAge: null, gone: false };
}
export function platformX(platform: FallPlatform, time: number): number {
  return platform.originX + (platform.type === 'moving' ? platform.amplitude * Math.sin(time * Math.PI * 2 / platform.period + platform.phase) : 0);
}
export function hazardFromSeed(seed: HazardSeed, id: string, anchorPlatformId: number | null = null): FallHazard {
  return { ...seed, id, originX: seed.x, side: seed.side ?? 0, amplitude: seed.amplitude ?? 0,
    period: seed.period ?? 6, phase: seed.phase ?? 0, state: seed.kind === 'spikes' ? 'active' : seed.kind === 'bird' ? 'warning' : 'idle',
    age: seed.kind === 'bird' ? -1 : 0, warningRemaining: seed.kind === 'bird' ? 1 : 0, anchorPlatformId };
}
export function hazardX(hazard: FallHazard, time: number): number {
  return hazard.originX + (hazard.kind === 'bird' ? hazard.amplitude * Math.sin(time * Math.PI * 2 / hazard.period + hazard.phase) : 0);
}
/** Continuous gravity flight time from rest, including the bounded vertical speed. */
export function flightTime(distancePixels: number): number {
  const accelerationDistance = TERMINAL_VELOCITY ** 2 / (2 * GRAVITY);
  return distancePixels <= accelerationDistance ? Math.sqrt(Math.max(0, distancePixels) * 2 / GRAVITY)
    : TERMINAL_VELOCITY / GRAVITY + (distancePixels - accelerationDistance) / TERMINAL_VELOCITY;
}
/** Available displacement from settled takeoff; drag and speed cap match FallRun. */
export function horizontalReach(seconds: number): number {
  const capAt = -Math.log(1 - MAX_HORIZONTAL_SPEED * AIR_DRAG / AIR_ACCELERATION) / AIR_DRAG;
  const accelerating = Math.min(seconds, capAt);
  return AIR_ACCELERATION / AIR_DRAG * (accelerating - (1 - Math.exp(-AIR_DRAG * accelerating)) / AIR_DRAG)
    + Math.max(0, seconds - capAt) * MAX_HORIZONTAL_SPEED;
}
export function safeLinkIssues(previous: FallPlatform, next: FallPlatform): string[] {
  const issues: string[] = [], gap = next.y - previous.y;
  if (!(gap > 0 && gap / PIXELS_PER_METER <= SAFE_FALL_METERS)) issues.push('unsafe vertical gap');
  if (next.width < PLAYER_WIDTH + 16) issues.push('insufficient full-foot landing width');
  if (next.originX - next.amplitude < 0 || next.originX + next.width + next.amplitude > WORLD_WIDTH) issues.push('outside world');
  // A wide catch allows grounded repositioning. A narrow/moving support is assessed at both motion extremes.
  const takeoff = previous.width === WORLD_WIDTH ? Math.min(next.originX + next.width / 2, WORLD_WIDTH - PLAYER_WIDTH / 2) : previous.originX + previous.width / 2;
  const worstRequired = Math.max(0, Math.abs(next.originX + next.width / 2 - takeoff) + previous.amplitude + next.amplitude - next.width / 2 + PLAYER_WIDTH / 2 + 8);
  if (worstRequired > horizontalReach(flightTime(gap)) - 4) issues.push('insufficient steering margin');
  return issues;
}

/** Only choose an authored shape; no random coordinates. Paired spike floors leave honest full-body landing bays; no full-width safe catch. */
export function generateChunk(cursor: GenerationCursor, random: () => number): GeneratedChunk {
  const depth = (cursor.y - START_Y) / PIXELS_PER_METER;
  const choice = Math.min(AUTHORED_PATTERNS.length - 1, Math.max(0, Math.floor(random() * AUTHORED_PATTERNS.length)));
  const intro = cursor.chunks === 0;
  const earlyBend = cursor.chunks === 1;
  const pattern = earlyBend ? { id: 'early-bend', offsets: [0, 0, 0, 0], gaps: [4.4, 4.4, 4.2, 4.2] } : depth < 20 ? AUTHORED_PATTERNS[0] : AUTHORED_PATTERNS[choice];
  const width = intro || earlyBend ? 104 : depth < 100 ? 120 : depth < 300 ? 92 : depth < 600 ? 76 : depth < 1000 ? 64 : 56;
  const step = depth < 100 ? 16 : depth < 300 ? 32 : 40;
  let y = cursor.y, center = cursor.center, nextId = cursor.nextId;
  const platforms: FallPlatform[] = [], hazards: FallHazard[] = [];
  const fromY = cursor.y;
  for (let i = 0; i < 4; i++) {
    y += pattern.gaps[i] * PIXELS_PER_METER;
    const bayRow = i === 3;
    const moving = !bayRow && depth >= 600 && i === 1 && pattern.id === 'stairs';
    const amplitude = moving ? 8 : 0;
    const proposed = intro ? [128, 104, 164, 176][i] : earlyBend ? [96, 188, 156, 128][i] : center + pattern.offsets[i] * step;
    center = Math.max(width / 2 + amplitude + 8, Math.min(WORLD_WIDTH - width / 2 - amplitude - 8, proposed));
    const type = bayRow ? 'normal' : moving ? 'moving' : depth >= 100 && i === 2 && pattern.id === 'soft-route' ? 'soft' : depth >= 300 && i === 2 && pattern.id === 'zigzag' ? 'crumble' : 'normal';
    platforms.push(platformFromSeed({ x: center - width / 2, y, width,
      type, route: true, pattern: pattern.id, amplitude, period: 8, phase: nextId * 0.7 }, nextId++));
  }
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    const paired = i === 3 || (pattern.id === 'soft-route' ? i === 2 : i === 1 && p.type !== 'moving');
    if (paired) {
      hazards.push(hazardFromSeed({ kind: 'spikes', x: 0, y: p.y - 8, width: p.x, height: 8, side: -1 }, `spike-${p.id}-L`, p.id));
      hazards.push(hazardFromSeed({ kind: 'spikes', x: p.x + p.width, y: p.y - 8, width: WORLD_WIDTH - p.x - p.width, height: 8, side: 1 }, `spike-${p.id}-R`, p.id));
    }
    for (const side of [-1, 1] as const) hazards.push(hazardFromSeed({ kind: 'wall_needle', x: side === -1 ? 0 : WORLD_WIDTH - 18,
      y: p.y - 36, width: 18, height: 44, side }, `needle-${p.id}-${side}`, p.id));
  }
  if (!intro) {
    const first = platforms[0], gap = first.y - fromY;
    hazards.push(hazardFromSeed({ kind: 'bird', x: (WORLD_WIDTH - 18) / 2, y: fromY + (gap - PLAYER_HEIGHT - 10) / 2,
      width: 18, height: 10, amplitude: 88, period: 6, phase: cursor.chunks * 0.9 }, `bird-${first.id}`, first.id));
  }
  return { platforms, hazards, cursor: { y, center, nextId, chunks: cursor.chunks + 1 } };
}
