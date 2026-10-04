import type { CoffeeChoice, CoffeeCup, CoffeeDirection, CoffeeEvent, CoffeeHazard, CoffeeHazardType, CoffeeInspection, CoffeeMilestone, CoffeeResult, CoffeeSnapshot } from './contracts';

export const TAP_SECONDS = 0.18;
export const MAX_SPILL_PERCENT_PER_SECOND = 25;
export const HAZARD_WARNING_SECONDS = 1.4;
export const MAX_BODY_LEAN = 0.95;
export const CUP_PARAMETERS = [
  { name: 'あなたの分', frequency: 4.2, damping: 0.52, gain: 0.7 },
  { name: '部長の分', frequency: 3.4, damping: 0.28, gain: 1 },
  { name: '会長の分', frequency: 5.3, damping: 0.12, gain: 1.15 },
] as const;
export const walkingSpeedAt = (distance: number): number => 10 + Math.min(1000, distance) * 0.002;
export const multiplierForCups = (count: number): 1 | 1.5 | 2 => count === 3 ? 2 : count === 2 ? 1.5 : 1;
const clamp = (n: number, a: number, b: number): number => Math.max(a, Math.min(b, n));
/** The same 124x82 inner cross-section is drawn in the renderer. Relative surface slope drives overflow. */
export function spillRateFor(remaining: number, surfaceTilt: number): number {
  const edge = 0.8 * clamp(remaining, 0, 100) / 100 + Math.tan(Math.abs(clamp(surfaceTilt, -1.2, 1.2))) * 62 / 82;
  return Math.min(MAX_SPILL_PERCENT_PER_SECOND, Math.max(0, edge - 1) * 20);
}
interface CupState extends CoffeeCup { bucket: number; gain: number }
interface HazardState extends CoffeeHazard { warned: boolean; started: boolean }
const hazardTypes: CoffeeHazardType[] = ['people', 'step', 'stop', 'door', 'train'];
const names: Record<CoffeeHazardType, string> = { people: '人とすれ違う', step: '足元に段差', stop: '急停止に注意', door: 'ドアを通ります', train: '電車が揺れます' };
const durations: Record<CoffeeHazardType, number> = { people: 1.5, step: 0.6, stop: 1, door: 1.2, train: 2.4 };

export class CoffeeRun {
  private distance = 0;
  private score = 0;
  private time = 0;
  private alive = false;
  private bodyLean = 0;
  private bodyVelocity = 0;
  private bodyAcceleration = 0;
  private held: CoffeeDirection = 0;
  private pulse: CoffeeDirection = 0;
  private pulseRemaining = 0;
  private cups: CupState[] = [];
  private pending: CoffeeMilestone | null = null;
  private secondOffered = false;
  private thirdProcessed = false;
  private ending: CoffeeResult | null = null;
  private hazards: HazardState[] = [];
  private nextOnset = 9;
  private nextId = 0;
  constructor(private readonly emit: (event: CoffeeEvent) => void = () => {}, private readonly random: () => number = Math.random) { this.reset(); }
  private addCup(): void {
    const id = this.cups.length; const config = CUP_PARAMETERS[id];
    this.cups.push({ id, ...config, remaining: 100, liquidAngle: 0, liquidVelocity: 0, surfaceTilt: -this.bodyLean, spilling: false, spillRate: 0, bucket: 0 });
  }
  reset(): void {
    this.distance = this.score = this.time = this.bodyLean = this.bodyVelocity = this.bodyAcceleration = 0;
    this.alive = false; this.held = this.pulse = 0; this.pulseRemaining = 0; this.pending = null;
    this.secondOffered = this.thirdProcessed = false; this.ending = null; this.cups.length = this.hazards.length = 0; this.nextOnset = 9; this.nextId = 0; this.addCup();
  }
  start(): void { this.reset(); this.alive = true; this.generateAhead(); }
  setInput(direction: CoffeeDirection): boolean {
    if (direction !== -1 && direction !== 0 && direction !== 1) return false;
    if (direction === 0) { this.held = this.pulse = 0; this.pulseRemaining = 0; return true; }
    if (!this.alive || this.pending) return false;
    this.held = direction; this.pulse = 0; this.pulseRemaining = 0; return true;
  }
  tap(direction: -1 | 1): boolean {
    if (!this.alive || this.pending || (direction !== -1 && direction !== 1)) return false;
    this.pulse = direction; this.pulseRemaining = TAP_SECONDS; return true;
  }
  choose(choice: CoffeeChoice): boolean {
    if (!this.alive || !this.pending || (choice !== 'decline' && choice !== 'accept')) return false;
    const milestone = this.pending; this.pending = null; this.setInput(0);
    if (choice === 'accept') this.addCup();
    this.emit({ type: 'choice', milestone, choice, cupCount: this.cups.length as 1 | 2 | 3 }); return true;
  }
  step(seconds: number): void {
    if (!this.alive || this.pending || !Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = Math.min(0.05, seconds);
    while (remaining > 1e-10 && this.alive && !this.pending) {
      const dt = Math.min(1 / 240, remaining); remaining -= dt; this.time += dt;
      if (this.pulseRemaining > 0) { this.pulseRemaining = Math.max(0, this.pulseRemaining - dt); if (this.pulseRemaining === 0) this.pulse = 0; }
      const input = this.held || this.pulse;
      for (const h of this.hazards) {
        if (!h.warned && this.time >= h.warningStart) { h.warned = true; this.emit({ type: 'warning', hazard: this.copyHazard(h) }); }
        if (!h.started && this.time >= h.onsetTime) { h.started = true; this.emit({ type: 'hazard', hazard: this.copyHazard(h) }); }
      }
      const hazard = this.hazards.find(h => this.time >= h.onsetTime && this.time < h.onsetTime + h.duration);
      const forces = this.forces(hazard);
      const rawAcceleration = 2.4 * input + 0.65 * this.bodyLean - 2.8 * this.bodyVelocity + 0.012 + 0.1 * Math.sin(this.time * 2.7) + forces.body;
      const previousVelocity = this.bodyVelocity;
      this.bodyVelocity = clamp(this.bodyVelocity + rawAcceleration * dt, -1.4, 1.4);
      this.bodyLean += this.bodyVelocity * dt;
      if (Math.abs(this.bodyLean) > MAX_BODY_LEAN) { this.bodyLean = Math.sign(this.bodyLean) * MAX_BODY_LEAN; this.bodyVelocity = 0; }
      this.bodyAcceleration = (this.bodyVelocity - previousVelocity) / dt;
      for (const cup of this.cups) {
        // Positive body acceleration forces the fluid in the opposite direction; each oscillator is independent.
        const liquidAcceleration = -cup.frequency * cup.frequency * cup.liquidAngle - 2 * cup.damping * cup.frequency * cup.liquidVelocity
          - cup.gain * this.bodyAcceleration + forces.liquid + 0.05 * Math.sin(this.time * 2.7 + cup.id * 1.4);
        cup.liquidVelocity = clamp(cup.liquidVelocity + liquidAcceleration * dt, -5, 5);
        cup.liquidAngle = clamp(cup.liquidAngle + cup.liquidVelocity * dt, -0.9, 0.9);
        cup.surfaceTilt = clamp(cup.liquidAngle - this.bodyLean, -1.2, 1.2);
        cup.spillRate = spillRateFor(cup.remaining, cup.surfaceTilt); cup.spilling = cup.spillRate > 0;
        cup.remaining = Math.max(0, cup.remaining - cup.spillRate * dt);
        const bucket = Math.floor((100 - cup.remaining) / 5);
        if (bucket > cup.bucket) { const amount = (bucket - cup.bucket) * 5; cup.bucket = bucket; this.emit({ type: 'spill', cupId: cup.id, remaining: cup.remaining, amount }); }
      }
      const boundary = !this.secondOffered ? 500 : !this.thirdProcessed ? 1000 : Infinity;
      this.distance = Math.min(boundary, this.distance + walkingSpeedAt(this.distance) * dt);
      // Cups are added only at500/1000m. Exact earned-segment anchors avoid cumulative rounding drift.
      this.score = this.cups.length === 3 ? 1250 + (this.distance - 1000) * 2
        : this.cups.length === 2 ? 500 + (this.distance - 500) * 1.5 : this.distance;
      const empty = this.cups.find(c => c.remaining <= 0);
      if (empty) { this.finish(empty); break; }
      if (!this.secondOffered && this.distance >= 500) { this.secondOffered = true; this.offer('second_cup'); break; }
      if (!this.thirdProcessed && this.distance >= 1000) {
        this.thirdProcessed = true;
        if (this.cups.length === 2) { this.offer('third_cup'); break; }
      }
      this.hazards = this.hazards.filter(h => this.time < h.onsetTime + h.duration + 0.1); this.generateAhead();
    }
  }
  private offer(milestone: CoffeeMilestone): void { this.pending = milestone; this.setInput(0); this.emit({ type: 'milestone', milestone }); }
  private forces(hazard: HazardState | undefined): { body: number; liquid: number } {
    if (!hazard) return { body: 0, liquid: 0 };
    const age = this.time - hazard.onsetTime; const envelope = Math.sin(Math.PI * age / hazard.duration);
    const scale = Math.min(1.5, 1 + this.distance / 2000); const side = hazard.side;
    if (hazard.type === 'train') return { body: side * Math.sin(age * 5.3) * 0.22 * envelope * scale, liquid: side * Math.sin(age * 5.3) * 4 * envelope * scale };
    const body = { people: 0.35, step: 0.18, stop: 0.15, door: 0.4 }[hazard.type];
    const liquid = { people: 0.35, step: 2, stop: 1.6, door: 0.4 }[hazard.type];
    return { body: side * body * envelope * scale, liquid: side * liquid * envelope * scale };
  }
  private generateAhead(): void {
    while (this.nextOnset <= this.time + 15) {
      const id = this.nextId++; const type = hazardTypes[id % hazardTypes.length];
      this.hazards.push({ id, type, name: names[type], side: this.random() < 0.5 ? -1 : 1, onsetTime: this.nextOnset,
        warningStart: this.nextOnset - HAZARD_WARNING_SECONDS, duration: durations[type], warned: false, started: false });
      this.nextOnset += this.distance < 500 ? 7 : this.distance < 1000 ? 5.5 : 4.8;
    }
  }
  private copyHazard(h: CoffeeHazard): CoffeeHazard { return { id: h.id, type: h.type, name: h.name, side: h.side, onsetTime: h.onsetTime, warningStart: h.warningStart, duration: h.duration }; }
  private copyCup(c: CoffeeCup): CoffeeCup { return { id: c.id, name: c.name, remaining: c.remaining, liquidAngle: c.liquidAngle, liquidVelocity: c.liquidVelocity,
    surfaceTilt: c.surfaceTilt, spilling: c.spilling, spillRate: c.spillRate, frequency: c.frequency, damping: c.damping }; }
  private finish(cup: CupState): void {
    if (!this.alive) return;
    this.alive = false; this.setInput(0); this.pending = null;
    this.ending = { distance: Math.floor(this.distance), score: Math.floor(this.score), time: this.time, cupCount: this.cups.length as 1 | 2 | 3,
      multiplier: multiplierForCups(this.cups.length), cups: this.cups.map(c => this.copyCup(c)), outcome: 'empty', emptyCupId: cup.id, emptyCupName: cup.name,
      reason: `${cup.name}のコーヒーが空になりました。` }; this.emit({ type: 'empty', cupId: cup.id });
  }
  snapshot(): CoffeeSnapshot {
    return { distance: Math.floor(this.distance), score: Math.floor(this.score), time: this.time, alive: this.alive, phase: !this.alive ? 'ended' : this.pending ? 'choice' : 'walking',
      bodyLean: this.bodyLean, bodyVelocity: this.bodyVelocity, input: this.held || this.pulse, cups: this.cups.map(c => this.copyCup(c)), cupCount: this.cups.length as 1 | 2 | 3,
      minRemaining: Math.min(...this.cups.map(c => c.remaining)), pending: this.pending, multiplier: multiplierForCups(this.cups.length),
      preview: (() => { const h = this.hazards.find(h => this.time >= h.warningStart && this.time < h.onsetTime); return h ? this.copyHazard(h) : null; })(),
      activeEvent: (() => { const h = this.hazards.find(h => this.time >= h.onsetTime && this.time < h.onsetTime + h.duration); return h ? this.copyHazard(h) : null; })() };
  }
  inspection(): CoffeeInspection { return { ...this.snapshot(), hazards: this.hazards.map(h => this.copyHazard(h)), bodyAcceleration: this.bodyAcceleration, tapRemaining: this.pulseRemaining }; }
  result(): CoffeeResult | null { return this.ending ? { ...this.ending, cups: this.ending.cups.map(c => this.copyCup(c)) } : null; }
}
