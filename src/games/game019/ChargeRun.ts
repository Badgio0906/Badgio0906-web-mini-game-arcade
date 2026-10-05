import { GRAVITY, MAX_CHARGE_MS, PPM, STEP, WORLD_WIDTH, bandFor, jumpFor, type ChargeEvent, type ChargeSnapshot, type Direction, type Forecast, type Frog, type Ledge, type Level, type Wind } from './chargeTypes.ts';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/** Game019's committed, continuous charge flight. No DOM, storage, RNG or hidden respawn. */
export class ChargeRun {
  private level: Level;
  private onEvent: (event: ChargeEvent) => void;
  private airAssist: number;
  private accumulator = 0;
  private peak = 0;
  private launchHeight = 0;
  private launchBand = 'medium';
  private attempt = 0;
  private bump = false;
  private fallingReported = false;
  private activeAttempt = false;
  private reportedCollisions = new Set<string>();
  private seaTime = 0;
  private flightWind: Wind | null = null;
  private visited = new Set<string>();
  alive = true; clear = false; time = 0; maxHeight = 0; totalFall = 0; falls = 0; biggestFall = 0; jumps = 0;
  wellCleared = false; direction: Direction = 0; chargeMs = 0;
  phase: ChargeSnapshot['phase'] = 'grounded'; chapter: ChargeSnapshot['chapter'] = 'well';
  feedback = '溜めて、離して、跳ぶ。';
  lastLanding: ChargeSnapshot['lastLanding'] = null;
  player: Frog;

  constructor(level: Level, onEvent: (event: ChargeEvent) => void = () => {}, airAssist = 0) {
    this.level = structuredClone(level); this.onEvent = onEvent; this.airAssist = airAssist;
    this.player = { x: level.startX, y: level.startY, vx: 0, vy: 0, width: 18, height: 24, grounded: true, ledgeId: level.ledges.find(p => Math.abs(p.y - level.startY) < .01 && level.startX >= p.x && level.startX <= p.x + p.width)?.id ?? level.ledges[0]?.id ?? null, facing: 1, landTime: 0, slipTime: 0 };
    this.peak = this.launchHeight = this.maxHeight = level.startY / PPM;
    this.chapter = level.startY >= 100 * PPM ? 'sky' : 'well';
    this.wellCleared = level.seaHeight === null && level.startY >= 100 * PPM;
  }
  private emit(type: string, data: ChargeEvent['data'] = {}): void { this.onEvent({ type, data }); }
  setDirection(direction: Direction): void { if ([-1, 0, 1].includes(direction)) this.direction = direction; }
  beginCharge(): boolean {
    if (!this.alive || !this.player.grounded || !['grounded'].includes(this.phase)) return false;
    this.phase = 'charging'; this.chargeMs = 0; this.emit('charge_start', { height: this.player.y / PPM }); return true;
  }
  cancelCharge(): void { if (this.phase === 'charging') { this.phase = 'grounded'; this.chargeMs = 0; this.emit('charge_cancel'); } }
  releaseCharge(): boolean {
    if (!this.alive || this.phase !== 'charging' || !this.player.grounded) return false;
    const jump = jumpFor(this.chargeMs), p = this.player;
    this.attempt++; this.jumps++; this.activeAttempt = true; this.reportedCollisions.clear(); this.launchHeight = p.y / PPM; this.launchBand = bandFor(this.chargeMs);
    this.bump = this.fallingReported = false; this.peak = this.launchHeight; this.lastLanding = null;
    this.flightWind = this.windAt(p.y); p.grounded = false; p.ledgeId = null; p.vy = Math.sqrt(2 * GRAVITY * jump.height); p.vx = this.direction * jump.speed;
    if (this.direction) p.facing = this.direction; p.landTime = p.slipTime = 0; this.phase = 'rising';
    this.feedback = this.launchBand === 'short' ? 'ちょい跳び。立ち位置を整える。' : this.launchBand === 'medium' ? '離したら、着地を待つ。' : '遠くへ！ 着地まで、もう戻せない。';
    this.emit('jump', { attempt_id: this.attempt, jump_charge_ms: Number(this.chargeMs.toFixed(2)), jump_power_normalized: jump.power, jump_band: this.launchBand, jump_direction: this.direction, jump_start_height: this.launchHeight, wind_direction: this.flightWind?.direction ?? 'none', wind_strength: this.flightWind?.strength ?? 'none', section_id: this.sectionAt(p.y)?.id ?? 'none' });
    return true;
  }
  update(dt: number): void {
    if (!this.alive || !Number.isFinite(dt) || dt <= 0) return;
    this.accumulator += Math.min(dt, .1);
    while (this.accumulator + 1e-10 >= STEP && this.alive) { this.accumulator -= STEP; this.step(STEP); }
  }
  private windAt(y: number): Wind | null { return this.level.winds.find(w => y / PPM >= w.from && y / PPM < w.to) ?? null; }
  private sectionAt(y: number) { return this.level.sections.find(s => y / PPM >= s.from && y / PPM < s.to) ?? null; }
  private moveLedges(): void {
    for (const p of this.level.ledges) {
      p.x = p.originX + p.amplitude * Math.sin(this.time * Math.PI * 2 / p.period + p.offset);
      if (p.crumbleAt !== null && this.time >= p.crumbleAt) { p.active = false; p.crumbleAt = null; p.restoreAt = this.time + 3; }
      if (p.restoreAt !== null && this.time >= p.restoreAt) { p.active = true; p.restoreAt = null; }
    }
  }
  private step(dt: number): void {
    const p = this.player;
    const support = this.level.ledges.find(l => l.id === p.ledgeId), oldSupportX = support?.x ?? 0;
    this.time += dt; this.moveLedges(); p.landTime = Math.max(0, p.landTime - dt); p.slipTime = Math.max(0, p.slipTime - dt);
    if (this.phase === 'sea') { this.stepSea(dt); return; }
    if (p.grounded) {
      if (support?.active) {
        p.x += support.x - oldSupportX;
        if (support.surface === 'moss') { p.x += p.vx * dt; p.vx *= Math.exp(-5.5 * dt); if (Math.abs(p.vx) < 1) p.vx = 0; }
        if (p.x + p.width / 2 > support.x + 1 && p.x - p.width / 2 < support.x + support.width - 1) {
          if (this.phase === 'charging') this.chargeMs = Math.min(MAX_CHARGE_MS, this.chargeMs + dt * 1000);
          this.reportSections(); return;
        }
      }
      this.cancelCharge(); p.grounded = false; p.ledgeId = null; p.vy = 0;
      this.launchHeight = this.peak = p.y / PPM; this.flightWind = this.windAt(p.y); this.fallingReported = false; this.phase = 'falling';
    }
    const oldX = p.x, oldY = p.y;
    // Wind is sampled on takeoff and held until landing, even across a visible zone boundary.
    // airAssist is a prototype-only comparison parameter; production passes zero.
    const ax = (this.flightWind?.x ?? 0) + this.airAssist * this.direction, ay = (this.flightWind?.y ?? 0) - GRAVITY;
    p.x += p.vx * dt + .5 * ax * dt * dt; p.y += p.vy * dt + .5 * ay * dt * dt;
    p.vx += ax * dt; p.vy += ay * dt;
    const left = 24 + p.width / 2, right = WORLD_WIDTH - 24 - p.width / 2;
    if (p.x < left || p.x > right) { p.x = clamp(p.x, left, right); p.vx = 0; this.feedback = '壁にゴツン。踏み切る位置を見直そう。'; this.bump = true; this.reportCollision('wall', 'wall_bump', { height: p.y / PPM }); }
    for (const o of this.level.blocks) {
      const xOverlap = p.x + p.width / 2 > o.x && p.x - p.width / 2 < o.x + o.width;
      const bottom = o.y - o.height;
      if (p.vy > 0 && xOverlap && oldY + p.height <= bottom + .01 && p.y + p.height >= bottom) {
        p.y = bottom - p.height; p.vy = 0; this.bump = true; this.feedback = '梁にゴツン！ 溜めすぎも危ない。'; this.reportCollision(o.id, 'ceiling_bump', { obstacle_id: o.id, height: p.y / PPM });
      } else if (p.y < o.y && p.y + p.height > bottom && xOverlap) {
        p.x = oldX <= o.x ? o.x - p.width / 2 : o.x + o.width + p.width / 2; p.vx = 0; this.bump = true; this.reportCollision(o.id, 'wall_bump', { obstacle_id: o.id, height: p.y / PPM });
      }
    }
    this.peak = Math.max(this.peak, p.y / PPM); this.maxHeight = Math.max(this.maxHeight, Math.min(this.level.goal, p.y / PPM));
    if (p.y < oldY) this.totalFall += (oldY - p.y) / PPM;
    this.reportSections();
    if (this.level.seaHeight !== null && !this.wellCleared && p.y >= this.level.seaHeight * PPM) { this.beginSea(); return; }
    if (p.vy <= 0 && !this.fallingReported) { this.fallingReported = true; this.emit('fall_start', { attempt_id: this.attempt, fall_start_height: this.peak }); }
    this.phase = p.vy > 0 ? 'rising' : 'falling';
    if (p.vy <= 0) {
      const next = this.level.ledges.filter(l => l.active && oldY >= l.y - .01 && p.y <= l.y && p.x + p.width / 2 > l.x + 1 && p.x - p.width / 2 < l.x + l.width - 1).sort((a, b) => b.y - a.y)[0];
      if (next) this.land(next);
    }
    // The bottom is a physical full-width catch, never a game-over or teleport.
  }
  private reportCollision(id: string, type: string, data: ChargeEvent['data']): void {
    if (!this.reportedCollisions.has(id)) { this.reportedCollisions.add(id); this.emit(type, data); }
  }
  private reportSections(): void {
    for (const s of this.level.sections) if (this.maxHeight >= s.from && !this.visited.has(s.id)) { this.visited.add(s.id); this.emit('section_reached', { section_id: s.id, section_name: s.name, height: this.maxHeight, section_from: s.from }); }
  }
  private land(l: Ledge): void {
    const p = this.player, drop = Math.max(0, this.peak - l.y / PPM), loss = Math.max(0, this.launchHeight - l.y / PPM), oldVx = p.vx;
    this.totalFall = Math.max(0, this.totalFall - Math.max(0, (l.y - p.y) / PPM));
    p.y = l.y; p.vy = 0; p.grounded = true; p.ledgeId = l.id; p.landTime = .16; p.slipTime = l.surface === 'moss' ? .65 : 0;
    p.vx = l.surface === 'moss' ? clamp(oldVx * .35, -42, 42) : 0; this.phase = 'grounded'; this.chargeMs = 0; this.flightWind = null;
    if (l.surface === 'crumble' && l.crumbleAt === null) l.crumbleAt = this.time + 1.5;
    if (loss >= .5) this.falls++; this.biggestFall = Math.max(this.biggestFall, drop);
    const success = loss < .2 && !this.bump;
    this.lastLanding = { id: l.id, height: l.y / PPM, drop, loss, success };
    this.feedback = loss >= 10 ? `${loss.toFixed(1)}m戻った！ まだ跳べる。` : loss >= .5 ? `${loss.toFixed(1)}m戻った。次は溜め方を変えよう。` : l.route === 'catch' ? 'ふう……この棚で、ひと息。' : l.surface === 'moss' ? 'つるっ。着地位置も、跳ぶ前に。' : l.surface === 'crumble' ? 'ひびの足場！ 観察は短めに。' : '着地。次はどこへ？';
    this.emit('fall_end', { attempt_id: this.attempt, fall_start_height: this.peak, fall_end_height: l.y / PPM, fall_distance: drop, progress_lost: loss, total_fall: this.totalFall });
    if (this.activeAttempt) this.emit('jump_end', { attempt_id: this.attempt, jump_start_height: this.launchHeight, jump_end_height: l.y / PPM, landing_success: success, landing_id: l.id, jump_band: this.launchBand, ceiling_or_wall_bump: this.bump });
    this.activeAttempt = false;
    if (l.route === 'catch' && loss >= .5) this.emit('catch_ledge_used', { ledge_id: l.id, height: l.y / PPM, fall_distance: drop });
    this.emit('land', { ledge_id: l.id, height: l.y / PPM, surface: l.surface, drop, loss, success }); this.peak = l.y / PPM;
    if (l.y >= this.level.goal * PPM) {
      this.clear = true; this.alive = false; this.phase = 'clear'; this.chapter = this.level.goal >= 200 ? 'space' : this.chapter;
      this.feedback = this.level.goal >= 200 ? '宇宙だ！' : '試験区間の上へ出た！';
      this.emit('clear', { height: this.level.goal, seconds: this.time, total_fall: this.totalFall });
    }
  }
  private beginSea(): void {
    this.cancelCharge(); this.wellCleared = true; this.chapter = 'sea'; this.phase = 'sea'; this.seaTime = 0;
    this.player.vx = this.player.vy = 0; this.player.grounded = false; this.player.ledgeId = null;
    this.feedback = '海だ！ ……あっ、鳥!?'; if (this.activeAttempt) this.emit('jump_end', { attempt_id: this.attempt, jump_start_height: this.launchHeight, jump_end_height: 100, landing_success: true, outcome: 'well_clear' }); this.activeAttempt = false; this.emit('well_clear', { height: 100, seconds: this.time });
  }
  private stepSea(dt: number): void {
    this.seaTime += dt; const lift = this.level.ledges.find(p => p.id === 'sky-start') ?? this.level.ledges.find(p => p.surface === 'shore')!;
    this.player.x += (lift.x + lift.width / 2 - this.player.x) * Math.min(1, dt * 4);
    const start = this.level.seaHeight! * PPM; this.player.y = start + Math.max(0, Math.min(1, (this.seaTime - .75) / 1.5)) * (lift.y - start);
    this.maxHeight = Math.max(this.maxHeight, this.player.y / PPM);
    if (this.seaTime >= 2.4) { this.player.x = lift.x + lift.width / 2; this.player.y = lift.y; this.player.grounded = true; this.player.ledgeId = lift.id; this.phase = 'grounded'; this.chapter = 'sky'; this.peak = this.launchHeight = lift.y / PPM; this.flightWind = null; this.feedback = '井の外の蛙、宇宙を目指す。風を読もう。'; this.emit('chapter_reached', { chapter: 'sky', height: lift.y / PPM }); }
  }
  quit(): void { this.cancelCharge(); this.alive = false; this.phase = 'quit'; }
  snapshot(): ChargeSnapshot {
    const p = this.player, wind = p.grounded ? this.windAt(p.y) : this.flightWind;
    return { alive: this.alive, clear: this.clear, levelId: this.level.id, goal: this.level.goal, time: this.time, height: Math.max(0, p.y / PPM), maxHeight: this.maxHeight, player: { ...p }, phase: this.phase, chargeMs: this.chargeMs, chargeBand: bandFor(this.chargeMs), direction: this.direction, chapter: this.chapter, seaProgress: clamp(this.seaTime / 2.4, 0, 1), wellCleared: this.wellCleared, ledges: this.level.ledges.map(p => ({ ...p })), blocks: this.level.blocks.map(o => ({ ...o })), winds: this.level.winds.map(w => ({ ...w })), sections: this.level.sections.map(s => ({ ...s })), section: this.sectionAt(p.y) ? { ...this.sectionAt(p.y)! } : null, wind: wind ? { ...wind } : null, nextWind: (() => { const w = this.level.winds.find(w => w.from * PPM > p.y); return w ? { ...w } : null; })(), totalFall: this.totalFall, falls: this.falls, biggestFall: this.biggestFall, jumps: this.jumps, feedback: this.feedback, lastLanding: this.lastLanding ? { ...this.lastLanding } : null };
  }
  /** QA-only when exposed by a DEV caller. Simulates actual charge/release without mutations. */
  forecast(ms: number, direction: Direction): Forecast {
    const copy = new ChargeRun(this.level, () => {}, this.airAssist);
    copy.player = { ...this.player }; copy.time = this.time; copy.maxHeight = this.maxHeight; copy.wellCleared = this.wellCleared; copy.chapter = this.chapter;
    copy.alive = this.alive; copy.clear = this.clear; copy.phase = this.player.grounded ? 'grounded' : this.phase; copy.setDirection(direction);
    const start = copy.time; copy.beginCharge(); const ticks = Math.round(clamp(ms, 0, MAX_CHARGE_MS) / 1000 / STEP);
    for (let i = 0; i < ticks; i++) copy.update(STEP);
    if (!copy.releaseCharge()) return { chargeMs: ms, direction, landing: null, peak: copy.maxHeight, bump: false, clear: false, sea: false, duration: copy.time - start };
    let peak = copy.player.y / PPM;
    for (let i = 0; i < 2400 && !copy.player.grounded && copy.alive && copy.phase !== 'sea'; i++) { copy.update(STEP); peak = Math.max(peak, copy.player.y / PPM); }
    return { chargeMs: ticks * STEP * 1000, direction, landing: copy.player.grounded ? { id: copy.player.ledgeId!, x: copy.player.x, y: copy.player.y / PPM } : null, peak, bump: copy.bump, clear: copy.clear, sea: copy.phase === 'sea', duration: copy.time - start };
  }
}
