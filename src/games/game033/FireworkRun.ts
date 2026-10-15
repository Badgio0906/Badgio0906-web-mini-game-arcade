export const RUN_SECONDS = 100;
export const CHARGE_SECONDS = 1.6;
export const MAX_PARTICLES = 900;
export const LAUNCH_Y = 550;
export type FireworkPhase = 'ready' | 'playing' | 'settling' | 'ended';
export interface Target { id: number; x: number; y: number; power: number }
export interface Rocket { id: number; x: number; y: number; bloomY: number; age: number; duration: number; target: Target; hue: number }
export interface Bloom { id: number; x: number; y: number; age: number; hue: number; quality: 'perfect' | 'good' | 'miss'; chain: number; special: boolean; points: number }
export interface Spark { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; hue: number; size: number; smoke: boolean }
export interface FireworkResult { score: number; successes: number; perfects: number; maxCombo: number; maxChain: number; launches: number; duration: number }
export interface FireworkSnapshot { phase: FireworkPhase; practice: boolean; time: number; remaining: number; score: number; charge: number; holding: boolean; combo: number; maxChain: number; successes: number; target: Target; rockets: Rocket[]; blooms: Bloom[]; particles: Spark[]; result: FireworkResult | null }
export type FireworkEvent = { type: 'launch'; power: number } | { type: 'bloom'; bloom: Bloom } | { type: 'end'; result: FireworkResult };
const powers = [.35, .68, .49, .82, .25, .60, .43, .73];
const xs = [128, 230, 342, 250, 142, 250, 356, 244];
export const bloomHeight = (power: number): number => 120 + Math.max(0, Math.min(1, power)) * 310;
export const targetAt = (id: number): Target => ({ id, x: xs[id % xs.length], power: powers[id % powers.length], y: LAUNCH_Y - bloomHeight(powers[id % powers.length]) });
export class FireworkRun {
  private phase: FireworkPhase = 'ready'; private practice = false; private time = 0; private score = 0;
  private charge = 0; private holding = false; private lastLaunch = -1; private nextId = 0;
  private combo = 0; private maxCombo = 0; private maxChain = 0; private successes = 0; private perfects = 0;
  private target = targetAt(0); private rockets: Rocket[] = []; private blooms: Bloom[] = []; private particles: Spark[] = [];
  private ending: FireworkResult | null = null;
  constructor(private readonly emit: (e: FireworkEvent) => void = () => {}, private readonly random: () => number = Math.random) {}
  start(practice = false): void {
    this.phase = 'playing'; this.practice = practice; this.time = this.score = this.charge = this.nextId = this.combo = this.maxCombo = this.maxChain = this.successes = this.perfects = 0;
    this.holding = false; this.lastLaunch = -1; this.target = targetAt(0); this.rockets = []; this.blooms = []; this.particles = []; this.ending = null;
  }
  reset(): void { this.start(); this.phase = 'ready'; }
  press(): boolean { if (this.phase !== 'playing' || this.holding || this.rockets.length >= 6) return false; this.holding = true; this.charge = 0; return true; }
  cancelCharge(): void { this.holding = false; this.charge = 0; }
  release(): boolean {
    if (this.phase !== 'playing' || !this.holding) return false;
    if (this.time - this.lastLaunch < .18) { this.cancelCharge(); return false; }
    this.holding = false; const power = this.charge; this.charge = 0; this.lastLaunch = this.time;
    const id = this.nextId++;
    this.rockets.push({ id, x: this.target.x, y: LAUNCH_Y, bloomY: LAUNCH_Y - bloomHeight(power), age: 0, duration: .55 + power * .75, target: { ...this.target }, hue: (id * 61 + 25) % 360 });
    this.target = targetAt(this.nextId); this.emit({ type: 'launch', power }); return true;
  }
  step(seconds: number): void {
    if (this.phase === 'ready' || this.phase === 'ended' || !Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = Math.min(.05, seconds);
    while (remaining > 1e-10) { const dt = Math.min(1 / 120, remaining); remaining -= dt; this.tick(dt); if (this.ending) break; }
  }
  private tick(dt: number): void {
    this.time += dt;
    if (this.holding) this.charge = Math.min(1, this.charge + dt / CHARGE_SECONDS);
    if (!this.practice && this.phase === 'playing' && this.time >= RUN_SECONDS) { this.phase = 'settling'; this.cancelCharge(); }
    for (const bloom of this.blooms) bloom.age += dt;
    this.blooms = this.blooms.filter(b => b.age < 2.8);
    for (const particle of this.particles) {
      particle.life -= dt; particle.vx *= Math.exp(-dt * (particle.smoke ? 1 : .7)); particle.vy += dt * (particle.smoke ? -6 : 36);
      particle.x += particle.vx * dt; particle.y += particle.vy * dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    const arrived: Rocket[] = [];
    for (const rocket of this.rockets) { rocket.age += dt; const progress = Math.min(1, rocket.age / rocket.duration); rocket.y = LAUNCH_Y + (rocket.bloomY - LAUNCH_Y) * (1 - (1 - progress) ** 2); if (progress >= 1) arrived.push(rocket); }
    this.rockets = this.rockets.filter(r => !arrived.includes(r));
    for (const rocket of arrived) this.burst(rocket);
    if (this.phase === 'settling' && this.rockets.length === 0) {
      this.phase = 'ended'; this.ending = { score: this.score, successes: this.successes, perfects: this.perfects, maxCombo: this.maxCombo, maxChain: this.maxChain, launches: this.nextId, duration: this.time };
      this.emit({ type: 'end', result: { ...this.ending } });
    }
  }
  private burst(rocket: Rocket): void {
    const error = Math.abs(rocket.bloomY - rocket.target.y), quality = error <= 12 ? 'perfect' : error <= 32 ? 'good' : 'miss';
    if (quality === 'miss') this.combo = 0; else { this.combo++; this.successes++; if (quality === 'perfect') this.perfects++; }
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const linked = quality === 'miss' ? [] : this.blooms.filter(b => b.quality !== 'miss' && b.age <= 1.8 && Math.hypot(b.x - rocket.x, b.y - rocket.bloomY) <= 205);
    const chain = quality === 'miss' ? 0 : Math.min(8, linked.reduce((max, b) => Math.max(max, b.chain), 0) + 1);
    this.maxChain = Math.max(this.maxChain, chain); const special = this.combo > 0 && this.combo % 4 === 0;
    const points = quality === 'miss' ? 10 : (quality === 'perfect' ? 240 : 110) + Math.min(10, this.combo - 1) * 30 + Math.max(0, chain - 1) * 80 + (special ? 180 : 0);
    this.score += points;
    const bloom: Bloom = { id: rocket.id, x: rocket.x, y: rocket.bloomY, age: 0, hue: rocket.hue, quality, chain, special, points };
    this.blooms.push(bloom);
    const count = special ? 100 : 64;
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2, speed = (special && i % 2 ? 82 : 52) + this.random() * 25;
      this.particles.push({ x: rocket.x, y: rocket.bloomY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 2.1 + this.random() * .6, maxLife: 2.7, hue: rocket.hue + (special ? i % 2 * 35 : 0), size: i % 5 ? 1.5 : 2.5, smoke: false });
    }
    for (let i = 0; i < 7; i++) this.particles.push({ x: rocket.x, y: rocket.bloomY, vx: (this.random() - .5) * 20, vy: -6 - this.random() * 8, life: 2.5, maxLife: 2.5, hue: rocket.hue, size: 14 + this.random() * 8, smoke: true });
    if (this.particles.length > MAX_PARTICLES) this.particles.splice(0, this.particles.length - MAX_PARTICLES);
    this.emit({ type: 'bloom', bloom: { ...bloom } });
  }
  snapshot(): FireworkSnapshot { return { phase: this.phase, practice: this.practice, time: this.time, remaining: this.practice ? Infinity : Math.max(0, RUN_SECONDS - this.time), score: this.score, charge: this.charge, holding: this.holding, combo: this.combo, maxChain: this.maxChain, successes: this.successes, target: { ...this.target }, rockets: this.rockets.map(r => ({ ...r, target: { ...r.target } })), blooms: this.blooms.map(b => ({ ...b })), particles: this.particles.map(p => ({ ...p })), result: this.ending ? { ...this.ending } : null }; }
}
