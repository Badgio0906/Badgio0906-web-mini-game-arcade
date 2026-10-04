import type { AcceptedLanding, CargoPose, Foundation, TowerChoice, TowerEvent, TowerInspection, TowerOutcome, TowerPhase, TowerResult, TowerSnapshot } from './contracts';

export const GRAVITY = 720;
export const PERFECT_PIXELS = 6;
export const SUPPORT_GRACE = 4;
export const SETTLE_SECONDS = 0.42;
export const FOUNDATION: Foundation = { x: 300, y: 660, width: 210, height: 42 };
export const swingSpeed = (floors: number): number => Math.min(1.22, 0.52 + floors * 0.024);
export const swingAmplitude = (floors: number): number => floors < 3 ? 38 : Math.min(155, 108 + floors * 1.6);
const DAMPING = 1.5;
const RETENTION = 0.02;

export interface StabilityReport {
  stable: boolean;
  instability: number;
  loadCenter: number;
  minMargin: number;
  weakJointIndex: number;
  unstableJointIndex: number;
  support: { left: number; right: number };
  lean: number;
}

/** All cargo keeps its full size. Test the mass above EVERY contact using one reverse O(n) scan. */
export function evaluateTowerStability(stack: readonly CargoPose[], foundation: Foundation = FOUNDATION): StabilityReport {
  let totalMass = 0; let weightedX = 0;
  const report: StabilityReport = { stable: true, instability: 0, loadCenter: foundation.x,
    minMargin: Infinity, weakJointIndex: -1, unstableJointIndex: -1,
    support: { left: foundation.x - foundation.width / 2, right: foundation.x + foundation.width / 2 }, lean: 0 };
  for (let i = stack.length - 1; i >= 0; i--) {
    const upper = stack[i]; const lower = i ? stack[i - 1] : foundation;
    totalMass += upper.mass; weightedX += upper.x * upper.mass;
    const center = weightedX / totalMass;
    const left = Math.max(upper.x - upper.width / 2, lower.x - lower.width / 2);
    const right = Math.min(upper.x + upper.width / 2, lower.x + lower.width / 2);
    const margin = Math.min(center - left, right - center);
    const instability = Math.max(0, Math.min(1, 1 - (margin + SUPPORT_GRACE) / Math.max(1, (right - left) / 2)));
    if (right <= left || margin < -SUPPORT_GRACE) { report.stable = false; report.unstableJointIndex = i; }
    report.minMargin = Math.min(report.minMargin, margin);
    if (instability > report.instability || report.weakJointIndex === -1) {
      report.instability = instability;
      report.loadCenter = center; report.weakJointIndex = i;
      report.support = { left, right }; report.lean = Math.max(-1, Math.min(1, (center - (left + right) / 2) / Math.max(1, (right - left) / 2)));
    }
  }
  if (!stack.length) report.minMargin = foundation.width / 2;
  return report;
}

export class TowerRun {
  time = 0;
  alive = false;
  phase: TowerPhase = 'ended';
  pending: 'height15' | null = null;
  cMode = false;
  cargo: CargoPose | null = null;
  readonly stack: CargoPose[] = [];
  instability = 0;
  private angle = 0;
  private cargoId = 0;
  private settleAge = 0;
  private perfectCount = 0;
  private combo = 0;
  private maxCombo = 0;
  private precisionScore = 0;
  private totalHeight = 0;
  private wind = 0;
  private missedTop = false;
  private missY = 0;
  private slipAge = -1;
  private slipPivotX = 0;
  private slipPivotY = 0;
  private slipDx = 0;
  private slipDy = 0;
  private slipSign = 1;
  private supportY = FOUNDATION.y - FOUNDATION.height / 2;
  private loadCenter = FOUNDATION.x;
  private weakJointIndex = -1;
  private failureJointIndex = -1;
  private recentlyAccepted: AcceptedLanding | null = null;
  private lastSupport = { left: FOUNDATION.x - FOUNDATION.width / 2, right: FOUNDATION.x + FOUNDATION.width / 2 };
  private ending: TowerResult | null = null;
  private heightOffered = false;

  constructor(private readonly emit: (event: TowerEvent) => void = () => {}, private readonly random: () => number = Math.random) {}
  get topY(): number { const top = this.stack[this.stack.length - 1] ?? FOUNDATION; return top.y - top.height / 2; }
  get topCenter(): number { return this.stack[this.stack.length - 1]?.x ?? FOUNDATION.x; }
  get speedMultiplier(): 1 | 2 { return this.cMode ? 2 : 1; }
  get perfectMultiplier(): 1 | 3 { return this.cMode ? 3 : 1; }
  get supportDiagnostic() { return { ...this.lastSupport, y: this.supportY, loadCenter: this.loadCenter, weakJointIndex: this.weakJointIndex, failureJointIndex: this.failureJointIndex }; }

  start(): void { this.reset(); this.alive = true; this.spawnCargo(); }
  reset(): void {
    this.time = this.angle = this.cargoId = this.settleAge = this.perfectCount = this.combo = this.maxCombo = this.precisionScore = 0;
    this.totalHeight = 0;
    this.alive = false; this.phase = 'ended'; this.pending = null; this.cMode = false; this.heightOffered = false; this.cargo = null; this.stack.length = 0; this.instability = 0;
    this.wind = 0; this.missedTop = false; this.missY = 0; this.recentlyAccepted = null; this.ending = null;
    this.slipAge = -1; this.supportY = FOUNDATION.y - FOUNDATION.height / 2; this.loadCenter = FOUNDATION.x; this.weakJointIndex = this.failureJointIndex = -1;
    this.lastSupport = { left: FOUNDATION.x - FOUNDATION.width / 2, right: FOUNDATION.x + FOUNDATION.width / 2 };
  }
  drop(): boolean {
    if (!this.alive || this.pending || this.phase !== 'hanging' || !this.cargo) return false;
    this.phase = 'falling';
    this.cargo.vx = Math.max(-3, Math.min(3, this.cargo.vx * RETENTION));
    this.cargo.vy = 0;
    this.wind = this.windAtRelease();
    this.missedTop = false;
    this.emit({ type: 'release' });
    return true;
  }
  /** Once per run, accepted height strictly exceeding 15m offers a frozen, fresh-input choice.
   * C mode doubles hanging swing only; the real clock, gravity and settling are unchanged.
   * PERFECT gains are tripled prospectively, with no recalculation of already earned points.
   */
  choose(choice: TowerChoice): boolean {
    if (!this.alive || !this.pending || (choice !== 'normal' && choice !== 'challenge')) return false;
    this.pending = null; this.cMode = choice === 'challenge';
    this.emit({ type: 'choice', milestone: 'height15', choice });
    return true;
  }

  /** Honest projected shadow for a vertical release with small bounded inherited motion. */
  landingProjection(): number {
    if (!this.cargo) return this.topCenter;
    const cargo = this.cargo;
    const distance = Math.max(0, this.topY - cargo.y - cargo.height / 2);
    const t = (Math.sqrt(cargo.vy * cargo.vy + 2 * GRAVITY * distance) - cargo.vy) / GRAVITY;
    const vx = this.phase === 'hanging' ? Math.max(-3, Math.min(3, cargo.vx * RETENTION)) : cargo.vx;
    const wind = this.phase === 'hanging' ? this.windAtRelease() : this.wind;
    const decay = (1 - Math.exp(-DAMPING * t)) / DAMPING;
    return cargo.x + vx * decay + wind / DAMPING * (t - decay);
  }

  step(seconds: number): void {
    if (!this.alive || this.pending || !Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = Math.min(seconds, 0.05);
    while (remaining > 0 && this.alive && !this.pending) {
      const dt = Math.min(remaining, 1 / 240); remaining -= dt;
      this.time += dt; this.angle += swingSpeed(this.stack.length) * dt * (this.phase === 'hanging' ? this.speedMultiplier : 1);
      if (this.phase === 'hanging' && this.cargo) {
        this.cargo.x = 300 + Math.sin(this.angle) * swingAmplitude(this.stack.length);
        this.cargo.vx = Math.cos(this.angle) * swingAmplitude(this.stack.length) * swingSpeed(this.stack.length) * this.speedMultiplier;
        this.cargo.rotation = Math.sin(this.angle) * 0.012;
      } else if (this.phase === 'falling' && this.cargo) {
        const cargo = this.cargo; const oldY = cargo.y; const oldX = cargo.x;
        if (this.slipAge >= 0 && this.slipAge < 0.3) {
          this.slipAge += dt;
          const rotation = this.slipSign * Math.min(1, this.slipAge / 0.3) * 0.78;
          cargo.rotation = rotation;
          cargo.x = this.slipPivotX + this.slipDx * Math.cos(rotation) - this.slipDy * Math.sin(rotation);
          cargo.y = this.slipPivotY + this.slipDx * Math.sin(rotation) + this.slipDy * Math.cos(rotation);
          if (this.slipAge >= 0.3) { cargo.vx = this.slipSign * 36; cargo.vy = 75; }
          continue;
        }
        cargo.vy += GRAVITY * dt;
        cargo.vx = (cargo.vx + this.wind * dt) * Math.exp(-DAMPING * dt);
        cargo.x += cargo.vx * dt; cargo.y += cargo.vy * dt;
        if (this.slipAge >= 0) cargo.rotation += this.slipSign * dt * 0.5;
        else cargo.rotation *= Math.exp(-dt * 3);
        const topY = this.topY;
        if (!this.missedTop && cargo.y + cargo.height / 2 >= topY) {
          const fraction = Math.max(0, Math.min(1, (topY - cargo.height / 2 - oldY) / Math.max(0.0001, cargo.y - oldY)));
          cargo.x = oldX + (cargo.x - oldX) * fraction;
          const lower = this.stack[this.stack.length - 1] ?? FOUNDATION;
          const overlap = Math.min(cargo.x + cargo.width / 2, lower.x + lower.width / 2) - Math.max(cargo.x - cargo.width / 2, lower.x - lower.width / 2);
          if (overlap <= 0) { this.missedTop = true; this.missY = topY; }
          else { cargo.y = topY - cargo.height / 2; cargo.vy = 0; this.land(overlap); }
        }
        if (this.missedTop && cargo.y - cargo.height / 2 > this.missY + 190) this.finish('fall');
      } else if (this.phase === 'settling') {
        this.settleAge += dt;
        if (this.settleAge >= SETTLE_SECONDS) this.spawnCargo();
      }
    }
  }

  snapshot(): TowerSnapshot {
    return { floors: this.stack.length, height: this.totalHeight / 60,
      pending: this.pending, cMode: this.cMode, mode: this.cMode ? 'challenge' : 'normal', speedMultiplier: this.speedMultiplier, perfectMultiplier: this.perfectMultiplier,
      time: this.time, perfectCount: this.perfectCount, combo: this.combo, maxCombo: this.maxCombo,
      precisionScore: this.precisionScore, alive: this.alive, phase: this.phase, instability: this.instability, outcome: this.ending?.outcome ?? null };
  }
  result(): TowerResult | null { return this.ending ? { ...this.ending } : null; }
  inspection(): TowerInspection {
    return { ...this.snapshot(), cargo: this.cargo ? { ...this.cargo } : null, stack: this.stack.map(cargo => ({ ...cargo })),
      foundation: { ...FOUNDATION }, topCenter: this.topCenter, topY: this.topY, support: { ...this.lastSupport },
      supportY: this.supportY, loadCenter: this.loadCenter, weakJointIndex: this.weakJointIndex,
      recentlyAccepted: this.recentlyAccepted ? { ...this.recentlyAccepted } : null };
  }

  private spawnCargo(): void {
    const floors = this.stack.length;
    const width = floors < 3 ? 176 - floors * 4 : Math.round((floors < 10 ? 158 : floors < 20 ? 145 : 136) + (this.random() - 0.5) * 18);
    const height = floors < 3 ? 40 : Math.round(38 + this.random() * 7);
    this.cargo = { id: this.cargoId++, x: 300 + Math.sin(this.angle) * swingAmplitude(floors),
      y: Math.min(220, this.topY - 190), width, height, mass: floors < 3 ? 60 : Math.round(55 + this.random() * 20),
      rotation: 0, vx: Math.cos(this.angle) * swingAmplitude(floors) * swingSpeed(floors) * this.speedMultiplier, vy: 0 };
    this.phase = 'hanging'; this.settleAge = 0; this.missedTop = false; this.slipAge = -1;
  }
  private land(overlap: number): void {
    const cargo = this.cargo!;
    const perfect = Math.abs(cargo.x - this.topCenter) <= PERFECT_PIXELS;
    const candidate = [...this.stack, cargo];
    const report = evaluateTowerStability(candidate);
    this.lastSupport = report.support;
    this.weakJointIndex = report.weakJointIndex; this.loadCenter = report.loadCenter;
    const supportBox = report.weakJointIndex > 0 ? candidate[report.weakJointIndex - 1] : FOUNDATION;
    this.supportY = supportBox.y - supportBox.height / 2;
    const wasSafe = this.instability < 0.62;
    this.instability = report.instability;
    if (!report.stable) {
      if (report.unstableJointIndex < candidate.length - 1) { this.failureJointIndex = report.unstableJointIndex; this.finish('collapse'); return; }
      // Only the arriving crate is unsupported: it tips about the ledge, then falls away.
      this.missedTop = true; this.missY = this.topY; this.slipAge = 0;
      this.slipSign = cargo.x >= this.topCenter ? 1 : -1;
      this.slipPivotX = this.slipSign > 0 ? report.support.right : report.support.left;
      this.slipPivotY = this.topY;
      this.slipDx = cargo.x - this.slipPivotX; this.slipDy = cargo.y - this.slipPivotY;
      this.emit({ type: 'danger', instability: 1 });
      return;
    }
    cargo.vx = cargo.vy = 0;
    cargo.rotation = report.lean * 0.026;
    this.stack.push(cargo);
    this.totalHeight += cargo.height;
    this.recentlyAccepted = { x: cargo.x, width: cargo.width, height: cargo.height,
      overlapRatio: overlap / cargo.width, loadCenter: report.loadCenter, supportMargin: report.minMargin, perfect };
    this.cargo = null; this.phase = 'settling'; this.settleAge = 0;
    this.emit({ type: 'land', floors: this.stack.length });
    if (perfect) {
      this.combo++; this.perfectCount++; this.maxCombo = Math.max(this.maxCombo, this.combo);
      const points = 100 * Math.min(this.combo, 8) * this.perfectMultiplier; this.precisionScore += points;
      this.emit({ type: 'perfect', combo: this.combo, points });
    } else this.combo = 0;
    if (wasSafe && this.instability >= 0.62) this.emit({ type: 'danger', instability: this.instability });
    if (!this.heightOffered && this.totalHeight / 60 > 15) {
      this.heightOffered = true; this.pending = 'height15'; this.emit({ type: 'milestone', milestone: 'height15' });
    }
  }
  private windAtRelease(): number { return this.stack.length < 8 ? 0 : Math.sin(this.time * 0.37) * 3; }
  private finish(outcome: TowerOutcome): void {
    if (!this.alive) return;
    this.alive = false; this.phase = 'ended'; this.pending = null;
    const snap = this.snapshot();
    this.ending = { floors: snap.floors, height: snap.height, time: snap.time, perfectCount: snap.perfectCount,
      cMode: this.cMode, mode: snap.mode, speedMultiplier: this.speedMultiplier, perfectMultiplier: this.perfectMultiplier,
      maxCombo: snap.maxCombo, precisionScore: snap.precisionScore, outcome,
      reason: outcome === 'fall' ? '荷物が塔の横へ落ちました。' : '重心が支えの外へ。塔が崩れました。' };
    this.emit({ type: 'collapse', reason: outcome });
  }
}
