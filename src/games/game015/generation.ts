import { AIR_ACCELERATION, AIR_DRAG, GRAVITY, MAX_HORIZONTAL_SPEED, PIXELS_PER_METER, PLAYER_WIDTH, SAFE_FALL_METERS, SCROLL_ACCELERATION, SCROLL_MAX_SPEED, SCROLL_START_SPEED, TERMINAL_VELOCITY, WORLD_WIDTH } from './types';
import type { FallHazard, FallPlatform, HazardSeed, PlatformSeed } from './types';

export interface GenerationCursor { y: number; center: number; nextId: number; chunks: number }
export interface GeneratedChunk { platforms: FallPlatform[]; hazards: FallHazard[]; cursor: GenerationCursor }
export const START_Y = 112;
export const INITIAL_PLATFORM: PlatformSeed = Object.freeze({ x: 48, y: START_Y, width: 160, type: 'normal', route: true, pattern: 'start' });
/** Lanes are absolute targets, so a centered/stationary route cannot persist across chunks. */
export const AUTHORED_PATTERNS = Object.freeze([
  { id: 'center-left-right', lanes: [128, 80, 172, 176], gaps: [2.4, 5.4, 2.8, 5.6] },
  { id: 'right-center-left', lanes: [180, 132, 76, 76], gaps: [5.5, 2.2, 3.1, 4.6] },
  { id: 'left-center-right', lanes: [76, 124, 176, 176], gaps: [5.1, 2.4, 3.2, 5.8] },
  { id: 'stairs', lanes: [178, 142, 80, 80], gaps: [3.2, 2.1, 5.4, 4.8] },
  { id: 'zigzag', lanes: [80, 138, 176, 176], gaps: [2.2, 5.6, 2.9, 5.2] },
  { id: 'soft-route', lanes: [172, 116, 80, 80], gaps: [4.7, 3.5, 2.6, 5.7] },
].map(p => Object.freeze({ ...p, lanes: Object.freeze(p.lanes), gaps: Object.freeze(p.gaps) })));
export function scrollSpeedAt(seconds: number): number {
  return Math.min(SCROLL_MAX_SPEED, SCROLL_START_SPEED + Math.max(0, seconds) * SCROLL_ACCELERATION);
}

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

/** Four safe steps coexist with a 10.6–10.8m held shortcut to a soft catch.
 * Early spike banks leave a visible diagonal corridor open. The final decision row
 * closes that corridor with ordinary stone and central/side spikes: neutral hold fails.
 * Safe route widths and lateral transitions are bounded by the actual flight model.
 */
export function generateChunk(cursor: GenerationCursor, random: () => number): GeneratedChunk {
  const unit = () => Math.max(0, Math.min(0.999999, random()));
  const depth = (cursor.y - START_Y) / PIXELS_PER_METER;
  const pattern = AUTHORED_PATTERNS[Math.floor(unit() * AUTHORED_PATTERNS.length)];
  let y = cursor.y, center = cursor.center, nextId = cursor.nextId;
  const platforms: FallPlatform[] = [], hazards: FallHazard[] = [];
  for (let i = 0; i < 4; i++) {
    const gap = pattern.gaps[i] * PIXELS_PER_METER;
    y += gap;
    const widths = depth < 30 ? [104, 96, 112, 88] : [88, 104, 80, 96];
    const width = i === 3 ? 72 : i === 2 ? 100 : widths[(i + Math.floor(unit() * widths.length)) % widths.length];
    const moving = depth >= 100 && i === 1 && pattern.id === 'stairs';
    const amplitude = moving ? 6 : 0;
    const proposed = pattern.lanes[i] + (unit() - .5) * 8;
    const maxShift = Math.min(62, horizontalReach(flightTime(gap)) + width / 2 - PLAYER_WIDTH / 2 - 24 - amplitude);
    center = Math.max(width / 2 + amplitude + 24, Math.min(WORLD_WIDTH - width / 2 - amplitude - 24,
      Math.max(center - maxShift, Math.min(center + maxShift, proposed))));
    const type = i === 2 ? 'soft' : moving ? 'moving'
      : depth >= 30 && i === 1 && pattern.id === 'zigzag' ? 'crumble' : 'normal';
    platforms.push(platformFromSeed({ x: center - width / 2, y, width, type, route: true,
      pattern: pattern.id, amplitude, period: 8, phase: nextId * .7 }, nextId++));
  }
  const soft = platforms[2];
  for (let i = 0; i < 4; i++) {
    const p = platforms[i];
    // Reserve both the safe pad and the held-drop corridor, including full-body clearance.
    const reserveLeft = i === 3 ? p.originX - p.amplitude - 5
      : Math.min(p.originX - p.amplitude - 5, cursor.center - 28, soft.originX - 24);
    const reserveRight = i === 3 ? p.originX + p.width + p.amplitude + 5
      : Math.max(p.originX + p.width + p.amplitude + 5, cursor.center + 28, soft.originX + soft.width + 24);
    const leftWidth = Math.max(0, reserveLeft), rightX = Math.min(WORLD_WIDTH, reserveRight);
    if (leftWidth > 8) hazards.push(hazardFromSeed({ kind: 'spikes', x: 0, y: p.y - 8,
      width: leftWidth, height: 8, side: -1 }, `spike-${p.id}-L`, p.id));
    if (WORLD_WIDTH - rightX > 8) hazards.push(hazardFromSeed({ kind: 'spikes', x: rightX, y: p.y - 8,
      width: WORLD_WIDTH - rightX, height: 8, side: 1 }, `spike-${p.id}-R`, p.id));
    for (const side of [-1, 1] as const) hazards.push(hazardFromSeed({ kind: 'wall_needle',
      x: side === -1 ? 0 : WORLD_WIDTH - 18, y: p.y - 36, width: 18, height: 44, side }, `needle-${p.id}-${side}`, p.id));
  }
  // A spiked alternative on the final row clearly marks the blocked lane, without narrowing the safe bay.
  const final = platforms[3], ledgeX = final.originX > 72 ? 8 : 200;
  platforms.push(platformFromSeed({ x: ledgeX, y: final.y, width: 48, type: 'normal', route: false,
    pattern: `${pattern.id}-danger` }, nextId++));
  return { platforms, hazards, cursor: { y, center, nextId, chunks: cursor.chunks + 1 } };
}
