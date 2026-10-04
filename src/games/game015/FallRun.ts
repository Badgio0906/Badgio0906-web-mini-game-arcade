import { generateChunk, INITIAL_PLATFORM, platformFromSeed, platformX, START_Y } from './generation';
import type { GenerationCursor } from './generation';
import { AIR_ACCELERATION, AIR_DRAG, CRUMBLE_SECONDS, FATAL_FALL_METERS, GRAVITY, GROUND_ACCELERATION, GROUND_DRAG, HARD_STUN_SECONDS, MAX_HORIZONTAL_SPEED, PIXELS_PER_METER, PLAYER_WIDTH, SAFE_FALL_METERS, SOFT_FATAL_METERS, SOFT_SAFE_METERS, TERMINAL_VELOCITY, WORLD_HEIGHT, WORLD_WIDTH } from './types';
import type { FallEvent, FallInspection, FallOptions, FallPlatform, FallPlayer, FallResult, FallSnapshot, HorizontalInput, LandingKind, LandingReport, PlatformType } from './types';

export function classifyLanding(distance: number, type: PlatformType): LandingKind {
  const fatal = type === 'soft' ? SOFT_FATAL_METERS : FATAL_FALL_METERS;
  const safe = type === 'soft' ? SOFT_SAFE_METERS : SAFE_FALL_METERS;
  return distance >= fatal ? 'fatal' : distance > safe ? 'hard' : 'safe';
}
export function isNiceLanding(distance: number, type: PlatformType): boolean {
  return distance >= (type === 'soft' ? SOFT_FATAL_METERS : FATAL_FALL_METERS) * 0.85 && classifyLanding(distance, type) !== 'fatal';
}
const clampVelocity = (value: number): number => Math.max(-MAX_HORIZONTAL_SPEED, Math.min(MAX_HORIZONTAL_SPEED, value));
const copyPlatform = (p: FallPlatform): FallPlatform => ({ ...p });

/** Input-free float simulation. Renderers alone quantize the pixel grid. DROP skips only the departed support. */
export class FallRun {
  private alive = false;
  private time = 0;
  private horizontal: HorizontalInput = 0;
  private player: FallPlayer = { x: WORLD_WIDTH / 2, y: START_Y, vx: 0, vy: 0, grounded: true, platformId: null, stunRemaining: 0 };
  private platforms: FallPlatform[] = [];
  private cursor: GenerationCursor = { y: START_Y, center: WORLD_WIDTH / 2, nextId: 2, chunks: 0 };
  private fallStartY = START_Y;
  private startY = START_Y;
  private deepestY = START_Y;
  private cameraY = 0;
  private ignoredPlatformId: number | null = null;
  private niceDrops = 0;
  private lastLanding: LandingReport | null = null;
  private ending: FallResult | null = null;
  private milestone1000 = false;
  constructor(private readonly emit: (event: FallEvent) => void = () => {}, private readonly random: () => number = Math.random, private readonly options: FallOptions = {}) {}
  reset(): void {
    this.alive = false; this.time = 0; this.horizontal = 0; this.niceDrops = 0; this.cameraY = 0;
    this.lastLanding = null; this.ending = null; this.ignoredPlatformId = null; this.milestone1000 = false;
    this.platforms = []; this.cursor = { y: START_Y, center: WORLD_WIDTH / 2, nextId: 2, chunks: 0 };
    this.startY = this.fallStartY = this.deepestY = START_Y;
    this.player = { x: WORLD_WIDTH / 2, y: START_Y, vx: 0, vy: 0, grounded: true, platformId: null, stunRemaining: 0 };
  }
  start(): void {
    this.reset();
    const seeds = this.options.course?.length ? this.options.course : [INITIAL_PLATFORM];
    this.platforms = seeds.map((p, i) => platformFromSeed(p, i + 1)).sort((a, b) => a.y - b.y);
    for (const p of this.platforms) p.x = platformX(p, 0);
    const first = this.platforms[0], last = this.platforms[this.platforms.length - 1];
    this.startY = this.fallStartY = this.deepestY = first.y;
    this.player.x = first.x + first.width / 2; this.player.y = first.y; this.player.platformId = first.id;
    this.cursor = { y: last.y, center: last.x + last.width / 2, nextId: this.platforms.length + 1, chunks: 0 };
    this.alive = true; this.ensureGenerated();
  }
  setHorizontal(direction: HorizontalInput): void {
    if (direction === -1 || direction === 0 || direction === 1) this.horizontal = this.alive ? direction : 0;
  }
  drop(): boolean {
    if (!this.alive || !this.player.grounded || this.player.stunRemaining > 0) return false;
    const support = this.support(); if (!support) return false;
    this.depart(support); return true;
  }
  private support(): FallPlatform | undefined { return this.platforms.find(p => p.id === this.player.platformId && !p.gone); }
  private motionVelocity(p: FallPlatform): number { return p.type === 'moving' ? p.amplitude * Math.PI * 2 / p.period * Math.cos(this.time * Math.PI * 2 / p.period + p.phase) : 0; }
  private depart(support: FallPlatform): void {
    this.fallStartY = this.player.y; this.ignoredPlatformId = support.id;
    this.player.vx = clampVelocity(this.player.vx + this.motionVelocity(support));
    this.player.grounded = false; this.player.platformId = null; this.player.vy = 0;
    this.emit({ type: 'drop', platformId: support.id, depth: this.depth() });
  }
  /** At most50ms catch-up; 120Hz substeps keep actual swept crossing and inertial braking stable. */
  step(seconds: number): void {
    if (!this.alive || !Number.isFinite(seconds) || seconds <= 0) return;
    const elapsed = Math.min(seconds, 0.05), count = Math.ceil(elapsed * 120), dt = elapsed / count;
    for (let i = 0; i < count && this.alive; i++) this.tick(dt);
  }
  private tick(dt: number): void {
    this.ensureGenerated();
    const oldTime = this.time; this.time += dt;
    for (const p of this.platforms) {
      p.x = platformX(p, this.time);
      if (p.crumbleAge !== null && !p.gone) {
        p.crumbleAge += dt;
        if (p.crumbleAge >= CRUMBLE_SECONDS) { p.gone = true; this.emit({ type: 'crumble', platformId: p.id }); }
      }
    }
    const body = this.player; let groundAdvanced = false;
    if (body.grounded) {
      const support = this.support();
      if (!support) {
        const vanished = this.platforms.find(p => p.id === body.platformId);
        if (vanished) this.depart(vanished);
      } else {
        body.x += platformX(support, this.time) - platformX(support, oldTime);
        const stunned = body.stunRemaining > 0; body.stunRemaining = Math.max(0, body.stunRemaining - dt);
        if (!stunned && this.horizontal) body.vx = clampVelocity(body.vx + this.horizontal * GROUND_ACCELERATION * dt);
        else body.vx *= Math.exp(-GROUND_DRAG * dt);
        body.x += body.vx * dt; this.clampWalls(); groundAdvanced = true;
        if (body.x + PLAYER_WIDTH / 2 <= support.x || body.x - PLAYER_WIDTH / 2 >= support.x + support.width) this.depart(support);
      }
    }
    if (!body.grounded) {
      const beforeX = body.x, beforeY = body.y;
      if (!groundAdvanced) {
        body.vx = clampVelocity(body.vx + (this.horizontal * AIR_ACCELERATION - AIR_DRAG * body.vx) * dt);
        body.x += body.vx * dt; this.clampWalls();
      }
      body.vy = Math.min(TERMINAL_VELOCITY, body.vy + GRAVITY * dt); body.y += body.vy * dt;
      const crossing = this.platforms.filter(p => !p.gone && p.id !== this.ignoredPlatformId && p.y >= beforeY && p.y <= body.y)
        .map(p => {
          const alpha = (p.y - beforeY) / Math.max(1e-12, body.y - beforeY);
          const x = beforeX + (body.x - beforeX) * alpha, platformLeft = platformX(p, oldTime + dt * alpha);
          return { p, x, alpha, overlaps: x + PLAYER_WIDTH / 2 > platformLeft && x - PLAYER_WIDTH / 2 < platformLeft + p.width };
        }).filter(hit => hit.overlaps).sort((a, b) => a.alpha - b.alpha)[0];
      if (crossing) this.land(crossing.p, crossing.x);
    }
    this.deepestY = Math.max(this.deepestY, body.y);
    this.cameraY = Math.max(this.cameraY, Math.max(0, Math.floor(body.y - 112)));
    if (!this.milestone1000 && this.depth() >= 1000) {
      this.milestone1000 = true; this.emit({ type: 'milestone', depth: 1000, message: '地上から1000m。まだ底は見えません。' });
    }
    if (this.options.endless ?? !this.options.course) this.platforms = this.platforms.filter(p => p.y >= this.cameraY - 96 || p.id === body.platformId);
  }
  private clampWalls(): void {
    const min = PLAYER_WIDTH / 2, max = WORLD_WIDTH - min;
    if (this.player.x < min) { this.player.x = min; this.player.vx = 0; }
    if (this.player.x > max) { this.player.x = max; this.player.vx = 0; }
  }
  private land(platform: FallPlatform, x: number): void {
    const distance = Math.max(0, (platform.y - this.fallStartY) / PIXELS_PER_METER);
    const kind = classifyLanding(distance, platform.type), nice = isNiceLanding(distance, platform.type);
    this.player.x = x; this.player.y = platform.y; this.player.vy = 0; this.player.grounded = true; this.player.platformId = platform.id;
    this.player.vx = clampVelocity(this.player.vx - this.motionVelocity(platform));
    this.deepestY = Math.max(this.deepestY, platform.y);
    const landing: LandingReport = { kind, fallDistance: distance, nice, platformId: platform.id, platformType: platform.type, depth: this.depth() };
    this.lastLanding = landing; this.emit({ type: 'landing', landing: { ...landing } });
    if (kind === 'fatal') {
      this.finish(distance, platform.type); return;
    }
    this.fallStartY = platform.y; this.ignoredPlatformId = null;
    this.player.stunRemaining = kind === 'hard' ? HARD_STUN_SECONDS : 0;
    if (platform.type === 'crumble' && platform.crumbleAge === null) platform.crumbleAge = 0;
    if (nice) { this.niceDrops++; this.emit({ type: 'nice_drop', count: this.niceDrops, landing: { ...landing } }); }
  }
  private finish(distance: number, type: PlatformType): void {
    if (!this.alive) return;
    this.alive = false; this.horizontal = 0;
    this.ending = { depth: this.depth(), score: Math.floor(this.depth()), time: this.time, niceDrops: this.niceDrops, outcome: 'impact',
      reason: `落下距離 ${distance.toFixed(1)}m。着地衝撃に耐えられませんでした。`, fallDistance: distance, platformType: type };
    this.emit({ type: 'end', result: { ...this.ending } });
  }
  private ensureGenerated(): void {
    if (!(this.options.endless ?? !this.options.course)) return;
    while (this.cursor.y < this.player.y + WORLD_HEIGHT * 1.6) {
      const generated = generateChunk(this.cursor, this.random); this.cursor = generated.cursor; this.platforms.push(...generated.platforms);
    }
  }
  private depth(): number { return Math.max(0, (this.deepestY - this.startY) / PIXELS_PER_METER); }
  snapshot(): FallSnapshot {
    const fallDistance = this.player.grounded ? this.lastLanding?.kind === 'fatal' ? this.lastLanding.fallDistance : 0 : Math.max(0, (this.player.y - this.fallStartY) / PIXELS_PER_METER);
    return { alive: this.alive, time: this.time, depth: this.depth(), score: Math.floor(this.depth()), fallDistance, niceDrops: this.niceDrops, cameraY: this.cameraY,
      horizontal: this.horizontal, phase: !this.alive ? 'ended' : this.player.grounded ? this.player.stunRemaining > 0 ? 'stunned' : 'grounded' : 'falling',
      player: { ...this.player }, platforms: this.platforms.map(copyPlatform), lastLanding: this.lastLanding ? { ...this.lastLanding } : null,
      danger: fallDistance >= FATAL_FALL_METERS ? 'fatal' : fallDistance > SAFE_FALL_METERS ? 'danger' : 'safe' };
  }
  inspection(): FallInspection { return { ...this.snapshot(), fallStartY: this.fallStartY, ignoredPlatformId: this.ignoredPlatformId, generatedThrough: this.cursor.y,
    nextPlatformId: this.cursor.nextId, milestones: this.milestone1000 ? [1000] : [] }; }
  result(): FallResult | null { return this.ending ? { ...this.ending } : null; }
}
