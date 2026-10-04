import { AIR_ACCELERATION, AIR_DRAG, GRAVITY, MAX_HORIZONTAL_SPEED, PIXELS_PER_METER, PLAYER_WIDTH, SAFE_FALL_METERS, TERMINAL_VELOCITY, WORLD_WIDTH } from './types';
import type { FallPlatform, PlatformSeed } from './types';

export interface GenerationCursor { y: number; center: number; nextId: number; chunks: number }
export interface GeneratedChunk { platforms: FallPlatform[]; cursor: GenerationCursor }
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

/** Only choose an authored shape; no random coordinates. Every fourth row is a real full-width hard catch. */
export function generateChunk(cursor: GenerationCursor, random: () => number): GeneratedChunk {
  const depth = (cursor.y - START_Y) / PIXELS_PER_METER;
  const choice = Math.min(AUTHORED_PATTERNS.length - 1, Math.max(0, Math.floor(random() * AUTHORED_PATTERNS.length)));
  const earlyBend = cursor.chunks === 1;
  const pattern = earlyBend ? { id: 'early-bend', offsets: [0, 0, 0, 0], gaps: [4.4, 4.4, 4.2, 4.2] } : depth < 20 ? AUTHORED_PATTERNS[0] : AUTHORED_PATTERNS[choice];
  const width = earlyBend ? 104 : depth < 100 ? 120 : depth < 300 ? 92 : depth < 600 ? 76 : depth < 1000 ? 64 : 56;
  const step = depth < 100 ? 16 : depth < 300 ? 32 : 40;
  let y = cursor.y, center = cursor.center, nextId = cursor.nextId;
  const platforms: FallPlatform[] = [];
  for (let i = 0; i < 4; i++) {
    y += pattern.gaps[i] * PIXELS_PER_METER;
    const catchRow = i === 3;
    const moving = !catchRow && depth >= 600 && i === 1 && pattern.id === 'stairs';
    const amplitude = moving ? 8 : 0;
    const proposed = earlyBend ? [96, 188, 156, 128][i] : center + pattern.offsets[i] * step;
    center = catchRow ? WORLD_WIDTH / 2 : Math.max(width / 2 + amplitude + 8, Math.min(WORLD_WIDTH - width / 2 - amplitude - 8, proposed));
    const type = catchRow ? 'normal' : moving ? 'moving' : depth >= 300 && i === 2 && pattern.id === 'zigzag' ? 'crumble' : 'normal';
    platforms.push(platformFromSeed({ x: catchRow ? 0 : center - width / 2, y, width: catchRow ? WORLD_WIDTH : width,
      type, route: true, pattern: pattern.id, amplitude, period: 8, phase: nextId * 0.7 }, nextId++));
  }
  if (depth >= 100 && pattern.id === 'soft-route') {
    const beside = platforms[2], softWidth = 48;
    const softX = beside.originX + beside.width / 2 >= WORLD_WIDTH / 2 ? 8 : WORLD_WIDTH - softWidth - 8;
    if (softX + softWidth + 8 <= beside.originX || softX >= beside.originX + beside.width + 8)
      platforms.push(platformFromSeed({ x: softX, y: beside.y, width: softWidth, type: 'soft', route: false, pattern: 'soft-long-drop' }, nextId++));
  }
  return { platforms, cursor: { y, center, nextId, chunks: cursor.chunks + 1 } };
}
