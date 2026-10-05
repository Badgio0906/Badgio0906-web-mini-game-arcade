import { createLevel } from './generation';
import { FIXED_STEP, GRAVITY, JUMPS, PPM, SPACE_HEIGHT, VIEW_HEIGHT, WELL_HEIGHT, WORLD_WIDTH, type Chapter, type Direction, type FrogEvent, type FrogPlayer, type FrogSnapshot, type JumpForecast, type JumpSize, type Obstacle, type Phase, type Platform, type WindZone } from './types';

const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
export class FrogRun {
  alive = false; cleared = false; time = 0; maxHeight = 0; falls = 0;
  chapter: Chapter = 'well'; phase: Phase = 'grounded'; feedback = '小で位置調整、中・大で上へ。';
  player: FrogPlayer = this.initialPlayer();
  private platforms: Platform[] = []; private obstacles: Obstacle[] = []; private wind: WindZone[] = [];
  private accumulator = 0; private peak = 0; private milestoneTime = 0;
  milestoneSeen = false;
  practice = false; practiceBaseHeight = 0;
  constructor(private readonly event: (event: FrogEvent) => void = () => {}) {}
  private initialPlayer(): FrogPlayer { return { x: 180, y: 0, vx: 0, vy: 0, width: 18, height: 24, grounded: true, facing: 1, jumpSize: 'medium', landingTimer: 0, platformId: 0 }; }
  start(seed = 1): void {
    const level = createLevel(seed); this.platforms = level.platforms; this.obstacles = level.obstacles; this.wind = level.wind;
    this.alive = true; this.cleared = false; this.time = this.maxHeight = this.falls = this.accumulator = this.peak = this.milestoneTime = 0;
    this.chapter = 'well'; this.phase = 'grounded'; this.milestoneSeen = false; this.practice = false; this.practiceBaseHeight = 0; this.player = this.initialPlayer(); this.feedback = '小で位置調整、中・大で上へ。';
  }
  /** Independent sandbox. Stage 3 introduces wind without the story transition. */
  startPractice(stage = 0): void {
    this.start(1); this.practice = true; const base = stage === 3 ? 1100 : 0;
    this.practiceBaseHeight = base / PPM; this.player.y = base; this.maxHeight = base / PPM;
    this.platforms = [{ id: 0, x: 24, y: base, width: 312, height: 8, type: stage === 3 ? 'cloud' : 'stone', active: true, crumbleTimer: -1, restoreTimer: 0, slide: 0, route: 'base' }];
    if (stage === 1 || stage === 2 || stage === 3) this.platforms.push({ id: 1, x: stage === 2 ? 216 : 50, y: base + (stage === 2 ? 76 : 36), width: 88, height: 8, type: stage === 3 ? 'cloud' : 'wood', active: true, crumbleTimer: -1, restoreTimer: 0, slide: 0, route: 'safe' });
    this.obstacles = []; if (stage !== 3) this.wind = [];
    this.milestoneSeen = stage === 3; this.chapter = stage === 3 ? 'sky' : 'well'; this.feedback = '練習：記録は残りません。';
  }
  get height(): number { return this.player.y / PPM; }
  get cameraY(): number { return clamp(this.player.y - 160, 0, SPACE_HEIGHT - VIEW_HEIGHT + 120); }
  get activeWind(): WindZone | null { return this.wind.find(zone => this.player.y >= zone.yMin && this.player.y < zone.yMax) ?? null; }
  jump(size: JumpSize, direction: Direction = 0): boolean {
    if (!this.alive || this.phase === 'milestone' || !this.player.grounded || !Object.hasOwn(JUMPS, size) || ![-1, 0, 1].includes(direction)) return false;
    const p = this.player; p.grounded = false; p.platformId = null; p.jumpSize = size;
    p.vy = Math.sqrt(2 * GRAVITY * JUMPS[size].height); p.vx = direction * JUMPS[size].speed; if (direction) p.facing = direction;
    p.landingTimer = 0; this.phase = 'rising'; this.peak = p.y;
    this.feedback = size === 'small' ? '小ジャンプ：端をちょい調整！' : size === 'medium' ? '中ジャンプ：着地点をよく見て。' : '大ジャンプ：欲張ったぶん、着地が大事！';
    this.event({ type: 'jump', size, direction, height: this.height }); return true;
  }
  /** The caller pauses by not advancing. Capped, fixed stepping avoids tab-resume teleporting. */
  update(dt: number): void {
    if (!this.alive || !Number.isFinite(dt) || dt <= 0) return;
    this.accumulator += Math.min(dt, .1);
    while (this.accumulator + 1e-10 >= FIXED_STEP && this.alive) { this.accumulator -= FIXED_STEP; this.step(FIXED_STEP); }
  }
  private step(dt: number): void {
    this.time += dt;
    const p = this.player; p.landingTimer = Math.max(0, p.landingTimer - dt);
    for (const platform of this.platforms) {
      if (platform.crumbleTimer >= 0) {
        platform.crumbleTimer -= dt;
        if (platform.crumbleTimer <= 0) { platform.active = false; platform.crumbleTimer = -1; platform.restoreTimer = 3; }
      } else if (!platform.active) { platform.restoreTimer -= dt; if (platform.restoreTimer <= 0) platform.active = true; }
    }
    if (this.phase === 'milestone') {
      this.milestoneTime += dt;
      // Sea celebration, then a gull carries the frog sideways to the first sky ledge.
      p.x = 180 + Math.sin(this.milestoneTime * 4) * 20; p.y = WELL_HEIGHT + Math.sin(Math.min(1, this.milestoneTime / 2.2) * Math.PI) * 55;
      if (this.milestoneTime >= 2.2) {
        p.x = 180; p.y = WELL_HEIGHT; p.vx = p.vy = 0; p.grounded = true; p.platformId = this.platforms.find(platform => platform.type === 'shore')!.id;
        this.peak = WELL_HEIGHT; this.chapter = 'sky'; this.phase = 'grounded'; this.feedback = '井の外の蛙、宇宙を目指す！ 次の風を読もう。';
        this.event({ type: 'sky', height: this.height, maxHeight: this.maxHeight });
      }
      return;
    }
    if (p.grounded) {
      const platform = this.platforms.find(candidate => candidate.id === p.platformId);
      if (platform?.active) { p.vx = platform.slide; p.x += p.vx * dt; if (p.x + p.width / 2 > platform.x && p.x - p.width / 2 < platform.x + platform.width) return; }
      p.grounded = false; p.platformId = null; p.vy = 0; this.peak = p.y;
    }
    const oldX = p.x; const oldY = p.y; const wind = this.activeWind;
    // Direction is committed on launch. Wind, collisions and gravity are the only air steering.
    const ax = wind?.x ?? 0; const ay = (wind?.y ?? 0) - GRAVITY;
    p.x += p.vx * dt + .5 * ax * dt * dt; p.y += p.vy * dt + .5 * ay * dt * dt;
    p.vx += ax * dt; p.vy += ay * dt;
    const left = 24 + p.width / 2; const right = WORLD_WIDTH - 24 - p.width / 2;
    if (p.x < left || p.x > right) { p.x = clamp(p.x, left, right); p.vx = 0; }
    for (const obstacle of this.obstacles) {
      const overlapsX = p.x + p.width / 2 > obstacle.x && p.x - p.width / 2 < obstacle.x + obstacle.width;
      const bottom = obstacle.y - obstacle.height;
      if (p.vy > 0 && overlapsX && oldY + p.height <= bottom && p.y + p.height >= bottom) {
        p.y = bottom - p.height; p.vy = 0; this.feedback = 'ゴツン！ 大きく跳べばいいとは限らない。'; this.event({ type: 'bump', obstacleId: obstacle.id });
      } else if (p.y < obstacle.y && p.y + p.height > bottom && overlapsX) {
        if (oldX <= obstacle.x) p.x = obstacle.x - p.width / 2; else p.x = obstacle.x + obstacle.width + p.width / 2;
        p.vx = 0;
      }
    }
    this.peak = Math.max(this.peak, p.y); this.maxHeight = Math.max(this.maxHeight, Math.min(SPACE_HEIGHT, p.y) / PPM);
    if (!this.milestoneSeen && p.y >= WELL_HEIGHT) { this.beginMilestone(); return; }
    if (p.y >= SPACE_HEIGHT) {
      this.alive = false; this.cleared = true; this.chapter = 'space'; this.phase = 'clear'; this.maxHeight = SPACE_HEIGHT / PPM;
      this.feedback = '宇宙だ！ ……次はどこ？'; this.event({ type: 'clear', height: this.height, maxHeight: this.maxHeight }); return;
    }
    this.phase = p.vy > 0 ? 'rising' : 'falling';
    if (p.vy <= 0) {
      const landed = this.platforms.filter(platform => platform.active && oldY >= platform.y - .01 && p.y <= platform.y && p.x + p.width / 2 > platform.x && p.x - p.width / 2 < platform.x + platform.width).sort((a, b) => b.y - a.y)[0];
      if (landed) this.land(landed);
    }
  }
  private land(platform: Platform): void {
    const p = this.player; const drop = Math.max(0, (this.peak - platform.y) / PPM);
    p.y = platform.y; p.vx = platform.slide; p.vy = 0; p.grounded = true; p.platformId = platform.id; p.landingTimer = .16; this.phase = 'grounded';
    if (platform.type === 'crumble' && platform.crumbleTimer < 0) platform.crumbleTimer = .8;
    if (drop >= 10) { this.falls++; this.feedback = `${drop.toFixed(1)}mも落ちた！ ゲコーッ！ まだ跳べる。`; this.event({ type: 'fall', drop, height: this.height }); }
    else if (platform.type === 'moss') this.feedback = '苔でつるっ！ 小ジャンプで位置を直そう。';
    else if (platform.type === 'crumble') this.feedback = 'この足場、崩れる！ 次を急ごう。';
    this.event({ type: 'land', platformId: platform.id, height: this.height, drop }); this.peak = platform.y;
  }
  private beginMilestone(): void {
    this.milestoneSeen = true; this.chapter = 'shore'; this.phase = 'milestone'; this.milestoneTime = 0; this.maxHeight = Math.max(100, this.maxHeight);
    this.player.vx = this.player.vy = 0; this.player.grounded = false; this.player.platformId = null;
    this.feedback = '海だ！ ……あっ、鳥にさらわれた!?'; this.event({ type: 'milestone', height: 100, maxHeight: this.maxHeight });
  }
  quit(): void { if (!this.alive) return; this.alive = false; this.phase = 'quit'; this.event({ type: 'quit', height: this.height, maxHeight: this.maxHeight }); }
  snapshot(): FrogSnapshot {
    return { alive: this.alive, cleared: this.cleared, time: this.time, height: this.height, maxHeight: this.maxHeight, cameraY: this.cameraY, chapter: this.chapter, phase: this.phase, player: { ...this.player }, platforms: this.platforms.map(p => ({ ...p })), obstacles: this.obstacles.map(o => ({ ...o })), wind: this.wind.map(w => ({ ...w })), activeWind: this.activeWind ? { ...this.activeWind } : null, feedback: this.feedback, falls: this.falls, milestoneSeen: this.milestoneSeen, milestoneProgress: clamp(this.milestoneTime / 2.2, 0, 1), practice: this.practice, practiceBaseHeight: this.practiceBaseHeight };
  }
  /** Read-only, actual physics preview; it never changes time, platforms or events. */
  forecast(size: JumpSize, direction: Direction = 0): JumpForecast {
    const copy = new FrogRun();
    copy.alive = this.alive; copy.cleared = this.cleared; copy.time = this.time; copy.maxHeight = this.maxHeight; copy.falls = this.falls;
    copy.chapter = this.chapter; copy.phase = this.phase; copy.feedback = this.feedback; copy.player = { ...this.player }; copy.platforms = this.platforms.map(p => ({ ...p })); copy.obstacles = this.obstacles.map(o => ({ ...o })); copy.wind = this.wind.map(w => ({ ...w })); copy.peak = this.peak; copy.milestoneSeen = this.milestoneSeen; copy.practice = this.practice; copy.practiceBaseHeight = this.practiceBaseHeight;
    const points = [{ x: copy.player.x, y: copy.player.y }]; let landing: JumpForecast['landing'] = null;
    if (copy.jump(size, direction)) {
      for (let i = 0; i < 1200; i++) {
        copy.step(FIXED_STEP); if (i % 8 === 0) points.push({ x: copy.player.x, y: copy.player.y });
        if (copy.player.grounded) { landing = { platformId: copy.player.platformId!, x: copy.player.x, y: copy.player.y }; break; }
        if (copy.phase === 'milestone' || copy.cleared) break;
      }
    }
    return { size, direction, points, landing, maxHeight: copy.maxHeight, milestone: copy.phase === 'milestone', cleared: copy.cleared };
  }
}
