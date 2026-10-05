import { generateChunk, hazardFromSeed, hazardX, INITIAL_PLATFORM, platformFromSeed, platformX, scrollSpeedAt, START_Y } from './generation';
import type { GenerationCursor } from './generation';
import { AIR_ACCELERATION, AIR_DRAG, BIRD_WARNING_SECONDS, NEEDLE_WARNING_SECONDS, NEEDLE_ACTIVE_SECONDS, NEEDLE_COOLDOWN_SECONDS, PLAYER_HEIGHT, PLAYER_WALL_MARGIN, CRUMBLE_SECONDS, FATAL_FALL_METERS, GRAVITY, GROUND_ACCELERATION, GROUND_DRAG, HARD_STUN_SECONDS, MAX_HORIZONTAL_SPEED, PIXELS_PER_METER, PLAYER_WIDTH, SAFE_FALL_METERS, SOFT_FATAL_METERS, SOFT_SAFE_METERS, SCROLL_TOP_LIMIT, TERMINAL_VELOCITY, WORLD_HEIGHT, WORLD_WIDTH } from './types';
import type { FallEvent, FallHazard, FallInspection, FallOptions, FallPlatform, FallPlayer, FallResult, FallSnapshot, HorizontalInput, LandingKind, LandingReport, PlatformType } from './types';

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
/** Relative-motion slab sweep: both the complete king body and moving bird are continuous. */
export function sweptHazardHit(from: Pick<FallPlayer, 'x' | 'y'>, to: Pick<FallPlayer, 'x' | 'y'>,
  hazard: Pick<FallHazard, 'x' | 'y' | 'width' | 'height'>, oldHazardX = hazard.x): number | null {
  const start = [from.x - oldHazardX, from.y - hazard.y];
  const delta = [to.x - from.x - (hazard.x - oldHazardX), to.y - from.y];
  const low = [-PLAYER_WIDTH / 2, 0], high = [hazard.width + PLAYER_WIDTH / 2, hazard.height + PLAYER_HEIGHT];
  let enter = 0, exit = 1;
  for (let axis = 0; axis < 2; axis++) {
    if (Math.abs(delta[axis]) < 1e-12) { if (start[axis] <= low[axis] || start[axis] >= high[axis]) return null; }
    else {
      const a = (low[axis] - start[axis]) / delta[axis], b = (high[axis] - start[axis]) / delta[axis];
      enter = Math.max(enter, Math.min(a, b)); exit = Math.min(exit, Math.max(a, b));
      if (enter >= exit) return null;
    }
  }
  return enter <= 1 && exit > 0 ? enter : null;
}

/** Input-free float simulation. Renderers alone quantize the pixel grid. DROP skips only the departed support. */
export class FallRun {
  private alive = false;
  private time = 0;
  private horizontal: HorizontalInput = 0;
  private player: FallPlayer = { x: WORLD_WIDTH / 2, y: START_Y, vx: 0, vy: 0, grounded: true, platformId: null, stunRemaining: 0 };
  private platforms: FallPlatform[] = [];
  private hazards: FallHazard[] = [];
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
    this.platforms = []; this.hazards = []; this.cursor = { y: START_Y, center: WORLD_WIDTH / 2, nextId: 2, chunks: 0 };
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
    this.hazards = (this.options.hazards ?? []).map((h, i) => hazardFromSeed(h, h.id ?? `authored-${i}`));
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
    const oldTime = this.time, tickStart = { x: this.player.x, y: this.player.y }; this.time += dt;
    this.updateHazards(dt);
    for (const p of this.platforms) {
      p.x = platformX(p, this.time);
      if (p.crumbleAge !== null && !p.gone) {
        p.crumbleAge += dt;
        if (p.crumbleAge >= CRUMBLE_SECONDS) { p.gone = true; this.emit({ type: 'crumble', platformId: p.id }); }
      }
    }
    const body = this.player; let groundAdvanced = false, airAdvanced = false;
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
      airAdvanced = true;
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
      const endpoint = crossing ? { x: crossing.x, y: crossing.p.y } : { x: body.x, y: body.y };
      if (this.hitHazard(tickStart, endpoint, oldTime, crossing ? oldTime + dt * crossing.alpha : this.time)) return;
      if (crossing) this.land(crossing.p, crossing.x);
    }
    if (!airAdvanced && body.grounded && this.alive && this.hitHazard(tickStart, body, oldTime)) return;
    this.deepestY = Math.max(this.deepestY, body.y);
    if (this.options.scroll !== false) {
      this.cameraY = Math.max(this.cameraY + scrollSpeedAt(oldTime + dt / 2) * dt, body.y - 224);
      if (body.y <= this.cameraY + SCROLL_TOP_LIMIT && this.alive) { this.finishScroll(); return; }
    } else this.cameraY = Math.max(this.cameraY, Math.max(0, Math.floor(body.y - 112)));
    if (!this.milestone1000 && this.depth() >= 1000) {
      this.milestone1000 = true; this.emit({ type: 'milestone', depth: 1000, message: '地上から1000m。まだ底は見えません。' });
    }
    if (this.options.endless ?? !this.options.course) {
      this.platforms = this.platforms.filter(p => p.y >= this.cameraY - 96 || p.id === body.platformId);
      this.hazards = this.hazards.filter(h => h.y + h.height >= this.cameraY - 96);
    }
  }
  private updateHazards(dt: number): void {
    for (const h of this.hazards) {
      h.x = hazardX(h, this.time);
      if (h.kind === 'spikes') continue;
      const visible = h.y < this.cameraY + WORLD_HEIGHT && h.y + h.height > this.cameraY - 96;
      if (h.kind === 'bird') {
        if (h.state === 'warning' && visible) {
          if (h.age < 0) {
            h.age = 0; this.emit({ type: 'hazard_warning', hazardId: h.id, kind: h.kind, seconds: BIRD_WARNING_SECONDS }); continue;
          }
          h.age += dt; h.warningRemaining = Math.max(0, BIRD_WARNING_SECONDS - h.age);
          if (h.age >= BIRD_WARNING_SECONDS) this.activate(h);
        }
        continue;
      }
      const nearWall = h.side < 0 ? this.player.x - PLAYER_WIDTH / 2 < 36 : this.player.x + PLAYER_WIDTH / 2 > WORLD_WIDTH - 36;
      const approaching = this.player.y >= h.y - 90 && this.player.y - PLAYER_HEIGHT <= h.y + h.height;
      if (h.state === 'idle') {
        if (visible && approaching && nearWall) {
          h.state = 'warning'; h.age = 0; h.warningRemaining = NEEDLE_WARNING_SECONDS;
          this.emit({ type: 'hazard_warning', hazardId: h.id, kind: h.kind, seconds: NEEDLE_WARNING_SECONDS });
        }
      } else {
        h.age += dt;
        if (h.state === 'warning') {
          h.warningRemaining = Math.max(0, NEEDLE_WARNING_SECONDS - h.age);
          if (h.age >= NEEDLE_WARNING_SECONDS) this.activate(h);
        } else if (h.state === 'active' && h.age >= NEEDLE_ACTIVE_SECONDS) { h.state = 'cooldown'; h.age = 0; }
        else if (h.state === 'cooldown' && h.age >= NEEDLE_COOLDOWN_SECONDS) { h.state = 'idle'; h.age = 0; }
      }
    }
  }
  private activate(h: FallHazard): void {
    h.state = 'active'; h.age = 0; h.warningRemaining = 0;
    this.emit({ type: 'hazard_active', hazardId: h.id, kind: h.kind });
  }
  private hitHazard(from: Pick<FallPlayer, 'x' | 'y'>, to: Pick<FallPlayer, 'x' | 'y'>, oldTime: number, endTime = this.time): boolean {
    let first: { hazard: FallHazard; alpha: number } | null = null;
    for (const hazard of this.hazards) {
      if (hazard.state !== 'active') continue;
      // Floor spikes have dangerous upper faces, not invisible teeth on their undersides.
      if (hazard.kind === 'spikes' && from.y > hazard.y + hazard.height + 1e-9) continue;
      const alpha = sweptHazardHit(from, to, { ...hazard, x: hazardX(hazard, endTime) }, hazardX(hazard, oldTime));
      if (alpha !== null && !(hazard.kind === 'spikes' && from.y + (to.y - from.y) * alpha > hazard.y + hazard.height + 1e-9)
        && (!first || alpha < first.alpha)) first = { hazard, alpha };
    }
    if (!first) return false;
    this.player.x = from.x + (to.x - from.x) * first.alpha;
    this.player.y = from.y + (to.y - from.y) * first.alpha;
    this.deepestY = Math.max(this.deepestY, this.player.y);
    this.cameraY = Math.max(this.cameraY, Math.max(0, Math.floor(this.player.y - (this.options.scroll === false ? 112 : 224))));
    const distance = this.player.grounded ? 0 : Math.max(0, (this.player.y - this.fallStartY) / PIXELS_PER_METER);
    const outcome = first.hazard.kind === 'spikes' ? 'spike' : first.hazard.kind === 'wall_needle' ? 'needle' : 'bird';
    const reason = outcome === 'spike' ? '棘に触れました。安全なすき間へ着地しましょう。' : outcome === 'needle' ? '壁の針に刺さりました。予告中に壁から離れましょう。' : '鳥にぶつかりました。動きを見てDROPのタイミングを変えましょう。';
    this.alive = false; this.horizontal = 0;
    this.ending = { depth: this.depth(), score: Math.floor(this.depth()), time: this.time, niceDrops: this.niceDrops, outcome, reason, fallDistance: distance, platformType: null };
    this.emit({ type: 'end', result: { ...this.ending } }); return true;
  }
  private clampWalls(): void {
    const min = PLAYER_WALL_MARGIN, max = WORLD_WIDTH - min;
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
  private finishScroll(): void {
    this.alive = false; this.horizontal = 0;
    this.ending = { depth: this.depth(), score: Math.floor(this.depth()), time: this.time, niceDrops: this.niceDrops,
      outcome: 'scroll', reason: 'スクロールに置いていかれました。次の足場へ早めに降りましょう。',
      fallDistance: this.player.grounded ? 0 : Math.max(0, (this.player.y - this.fallStartY) / PIXELS_PER_METER), platformType: null };
    this.emit({ type: 'end', result: { ...this.ending } });
  }
  private ensureGenerated(): void {
    if (!(this.options.endless ?? !this.options.course)) return;
    while (this.cursor.y < Math.max(this.player.y, this.cameraY) + WORLD_HEIGHT * 1.6) {
      const generated = generateChunk(this.cursor, this.random); this.cursor = generated.cursor; this.platforms.push(...generated.platforms); this.hazards.push(...generated.hazards);
      for (const h of generated.hazards) h.x = hazardX(h, this.time);
    }
  }
  private depth(): number { return Math.max(0, (this.deepestY - this.startY) / PIXELS_PER_METER); }
  snapshot(): FallSnapshot {
    const fallDistance = this.player.grounded ? this.lastLanding?.kind === 'fatal' ? this.lastLanding.fallDistance : 0 : Math.max(0, (this.player.y - this.fallStartY) / PIXELS_PER_METER);
    return { alive: this.alive, time: this.time, depth: this.depth(), score: Math.floor(this.depth()), fallDistance, niceDrops: this.niceDrops, cameraY: this.cameraY, scrollSpeed: this.options.scroll === false ? 0 : scrollSpeedAt(this.time),
      topRemaining: this.player.y - this.cameraY - SCROLL_TOP_LIMIT,
      horizontal: this.horizontal, phase: !this.alive ? 'ended' : this.player.grounded ? this.player.stunRemaining > 0 ? 'stunned' : 'grounded' : 'falling',
      player: { ...this.player }, platforms: this.platforms.map(copyPlatform), hazards: this.hazards.map(h => ({ ...h })), lastLanding: this.lastLanding ? { ...this.lastLanding } : null,
      danger: fallDistance >= FATAL_FALL_METERS ? 'fatal' : fallDistance > SAFE_FALL_METERS ? 'danger' : 'safe' };
  }
  inspection(): FallInspection { return { ...this.snapshot(), fallStartY: this.fallStartY, ignoredPlatformId: this.ignoredPlatformId, generatedThrough: this.cursor.y,
    nextPlatformId: this.cursor.nextId, milestones: this.milestone1000 ? [1000] : [] }; }
  result(): FallResult | null { return this.ending ? { ...this.ending } : null; }
}
