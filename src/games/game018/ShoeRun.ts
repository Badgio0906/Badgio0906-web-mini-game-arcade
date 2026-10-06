import { activeReplayHold, clamp, nearbyObstacles, normalizeInputs, routeFor, sampleTrajectory, simulate } from './physics';
import {RarePresentation} from './rarePresentation';
import { shoeFor } from './shoes';
import { spinExplanation } from './spinGuide';
import { JUST_MAX_SECONDS, JUST_MAX_THRESHOLD, KICK_SECONDS, LANDING_SECONDS, LOCK_SECONDS, type Effect, type Inputs, type Obstacle, type Phase, type PracticeStage, type Result, type ShoeEvent, type ShoeType, type Trajectory, type Vector } from './types';
export const ANGLE_PERIOD = 2.8;
export const SPIN_PERIOD = 1.65;
export const POWER_PERIOD = 1.36;
export const POWER_PEAK_START = .60;
export const POWER_PEAK_END = .70;
export function angleAt(seconds: number): number { return 45 - 40 * Math.cos(seconds / ANGLE_PERIOD * Math.PI * 2); }
export function spinAt(seconds: number): number { return Math.sin(seconds / SPIN_PERIOD * Math.PI * 2); }
export function powerAt(seconds: number): number {
  const cycle = (seconds % POWER_PERIOD + POWER_PERIOD) % POWER_PERIOD;
  return cycle < POWER_PEAK_START ? cycle / POWER_PEAK_START * 100 : cycle <= POWER_PEAK_END ? 100 : cycle < 1.3 ? (1.3 - cycle) / .6 * 100 : 0;
}
export class ShoeRun {
  phase: Phase = 'angle'; shoeType: ShoeType = 'sneaker'; angle = 5; spin = 0; power = 0;
  locked: { angle: number | null; spin: number | null; power: number | null } = { angle: null, spin: null, power: null };
  position: Vector = { x: 0, y: 2 }; velocity: Vector = { x: 0, y: 0 }; rotation = 0; angularVelocity = 0;
  maxHeight = 2; breaks = 0; breakCombo = 0; maxBreakCombo = 0; time = 0; flightElapsed = 0; flightDuration = 0; alive = false; paused = false; practice = false; practiceStage: PracticeStage = 0;
  result: Result | null = null; feedback = '';
  private lastNow = 0; private phaseStart = 0; private phaseDuration = 0; private pauseStart = 0; private trajectory: Trajectory | null = null; private effectIndex = 0; private recentEffects: Effect[] = []; private seenObstacles: Obstacle[] = [];
  presentation = new RarePresentation(0);
  private presentationSeed=0; private readonly emittedRare=new Set<string>();private readonly reachedSpecials=new Set<string>();
  constructor(private readonly event: (event: ShoeEvent) => void = () => {}) {}
  get justMax(): boolean { return this.locked.power !== null && this.locked.power >= JUST_MAX_THRESHOLD; }
  get route() { return routeFor(this.angle); }
  get phaseProgress(): number { return this.phaseDuration > 0 ? clamp((this.time - this.phaseStart) / this.phaseDuration, 0, 1) : 0; }
  get phaseElapsed(): number { return Math.max(0, this.time - this.phaseStart); }
  get activeHold() {
    if (this.phase !== 'flight' || !this.trajectory) return null;
    const hold = activeReplayHold(this.trajectory, this.flightElapsed);
    return hold ? { name: hold.name, remaining: Math.max(0, hold.end - this.flightElapsed), position: { x: hold.x, y: hold.y } } : null;
  }
  get effects(): readonly Effect[] { return this.recentEffects; }
  get obstacles(): readonly Obstacle[] { return nearbyObstacles(this.position.x, this.seenObstacles); }
  start(now: number, shoeType: ShoeType = 'sneaker'): void { this.reset(now, shoeType, false, 0); this.setPhase('angle'); }
  startPractice(now: number, stage: PracticeStage, shoeType: ShoeType = 'sneaker'): void {
    this.reset(now, shoeType, true, stage);
    // Individual steps keep the other inputs at an explained neutral value; no hidden best or real run is created.
    if (stage === 1) { this.angle = 45; this.locked.angle = 45; this.setPhase('spin'); }
    else if (stage === 2) { this.angle = 45; this.spin = .45; this.locked.angle = 45; this.locked.spin = .45; this.setPhase('power'); }
    else this.setPhase('angle');
  }
  private reset(now: number, shoeType: ShoeType, practice: boolean, stage: PracticeStage): void {
    this.shoeType = shoeFor(shoeType).id; this.practice = practice; this.practiceStage = stage; this.lastNow = Number.isFinite(now) ? now : 0;
    this.angle = 5; this.spin = this.power = this.time = this.phaseStart = this.flightElapsed = this.flightDuration = this.rotation = this.angularVelocity = this.breaks = 0;
    this.maxHeight = 2; this.breakCombo = this.maxBreakCombo = 0; this.position = { x: 0, y: 2 }; this.velocity = { x: 0, y: 0 }; this.locked = { angle: null, spin: null, power: null };
    this.presentation = new RarePresentation(++this.presentationSeed); this.emittedRare.clear();this.reachedSpecials.clear();
    this.alive = true; this.paused = false; this.result = null; this.feedback = ''; this.trajectory = null; this.effectIndex = 0; this.recentEffects = []; this.seenObstacles = [];
  }
  private setPhase(phase: Phase, duration = 0): void { this.phase = phase; this.phaseStart = this.time; this.phaseDuration = duration; this.event({ type: 'phase', phase }); }
  settle(now: number): void {
    if (!this.alive || this.paused || !Number.isFinite(now) || now < this.lastNow) return;
    this.time += (now - this.lastNow) / 1000; this.lastNow = now;
    const elapsed = this.phaseElapsed;
    if (this.phase === 'angle') this.angle = angleAt(elapsed);
    else if (this.phase === 'spin') this.spin = spinAt(elapsed);
    else if (this.phase === 'power') this.power = powerAt(elapsed);
    else if (this.phase === 'angle-lock' && elapsed + 1e-9 >= LOCK_SECONDS) {
      if (this.practice && this.practiceStage === 0) this.completePractice(); else this.setPhase('spin');
    } else if (this.phase === 'spin-lock' && elapsed + 1e-9 >= LOCK_SECONDS) {
      if (this.practice && this.practiceStage === 1) this.completePractice(); else this.setPhase('power');
    } else if (this.phase === 'max' && elapsed + 1e-9 >= JUST_MAX_SECONDS) this.setPhase('kick', KICK_SECONDS);
    else if (this.phase === 'kick' && elapsed + 1e-9 >= KICK_SECONDS) {
      if (this.practice && this.practiceStage === 2) this.completePractice();
      else { this.setPhase('flight', this.flightDuration); this.updateFlight(0); }
    } else if (this.phase === 'flight') {
      this.flightElapsed = elapsed + 1e-9 >= this.flightDuration ? this.flightDuration : elapsed; this.updateFlight(this.flightElapsed);
      if (elapsed + 1e-9 >= this.flightDuration) {this.updatePresentation(true);this.setPhase('landing', LANDING_SECONDS);}
    } else if (this.phase === 'landing' && elapsed + 1e-9 >= LANDING_SECONDS && this.trajectory) {
      this.result = structuredClone(this.trajectory.result); this.alive = false; this.setPhase(this.practice ? 'practice-complete' : 'result'); this.event({ type: 'end', result: structuredClone(this.result) });
    }
  }
  stop(now: number): boolean {
    if (!Number.isFinite(now) || now < this.lastNow) return false;
    this.settle(now); if (!this.alive || this.paused) return false;
    if (this.phase === 'angle') {
      this.locked.angle = this.angle; this.feedback = this.angle >= 55 ? '高いANGLEは空へ！' : this.angle <= 25 ? '低いANGLEは壁を突破！' : '中くらいのANGLEは飛距離重視！';
      this.event({ type: 'lock', step: 'angle', value: this.angle }); this.setPhase('angle-lock', LOCK_SECONDS); return true;
    }
    if (this.phase === 'spin') {
      this.locked.spin = this.spin; this.feedback = spinExplanation(this.spin);
      this.event({ type: 'lock', step: 'spin', value: this.spin }); this.setPhase('spin-lock', LOCK_SECONDS); return true;
    }
    if (this.phase === 'power') {
      this.locked.power = this.power; this.feedback = this.justMax ? 'JUST MAX！初速が一段アップ！' : this.power >= 98 ? 'PERFECT！次はMAXを狙え！' : 'POWERが高いほど速く飛ぶ！';
      this.event({ type: 'lock', step: 'power', value: this.power });
      if (!(this.practice && this.practiceStage === 2)) { this.trajectory = simulate(this.inputs(), this.practice); this.flightDuration = this.trajectory.duration; }
      this.updatePresentation(false);
      this.setPhase(this.justMax ? 'max' : 'kick', this.justMax ? JUST_MAX_SECONDS : KICK_SECONDS); return true;
    }
    return false;
  }
  private inputs(): Inputs { return normalizeInputs({ angle: this.angle, spin: this.spin, power: this.power, shoeType: this.shoeType }); }
  private completePractice(): void { this.alive = false; this.setPhase('practice-complete'); }
  private updateFlight(elapsed: number): void {
    if (!this.trajectory) return;
    const sample = sampleTrajectory(this.trajectory, elapsed);
    this.position = { x: sample.x, y: sample.y }; this.velocity = { x: sample.vx, y: sample.vy }; this.rotation = sample.rotation; this.angularVelocity = sample.angularVelocity; this.maxHeight = sample.maxHeight;
    while (this.effectIndex < this.trajectory.effects.length && this.trajectory.effects[this.effectIndex].time <= elapsed + 1e-9) {
      const effect = this.trajectory.effects[this.effectIndex++]; this.recentEffects.push({ ...effect });if(effect.type==='special')this.reachedSpecials.add(effect.name); if (this.recentEffects.length > 18) this.recentEffects.shift();
      if (effect.type === 'impact') {
        const obstacle = this.trajectory.obstacles.find(candidate => candidate.id === effect.obstacleId);
        if (obstacle) { this.seenObstacles.push({ ...obstacle }); if (this.seenObstacles.length > 64) this.seenObstacles.shift(); if (obstacle.broken) { this.breaks++; this.breakCombo++; this.maxBreakCombo = Math.max(this.maxBreakCombo, this.breakCombo); } else this.breakCombo = 0; }
      }
      this.event({ type: effect.type, effect: { ...effect } });
      this.updatePresentation(false);
    }
  }
  private updatePresentation(landed:boolean):void {
    this.presentation.update(this.inputs(),[...this.reachedSpecials],landed);
    for(const draw of this.presentation.draws)if(!this.emittedRare.has(draw.id)){this.emittedRare.add(draw.id);this.event({type:'presentation',draw:{...draw}});}
  }
  pause(value: boolean, now: number): void {
    if (!this.alive || value === this.paused || !Number.isFinite(now) || now < this.lastNow) return;
    if (value) { this.settle(now); if (!this.alive) return; this.paused = true; this.pauseStart = now; }
    else { if (now < this.pauseStart) return; this.lastNow = now; this.paused = false; }
  }
  snapshot() {
    return { presentation:{seed:this.presentation.seed,selected:this.presentation.selected,draws:this.presentation.draws.map(d=>({...d}))}, phase: this.phase, shoeType: this.shoeType, angle: this.angle, spin: this.spin, power: this.power, locked: { ...this.locked }, justMax: this.justMax, route: this.route, phaseProgress: this.phaseProgress, phaseElapsed: this.phaseElapsed, position: { ...this.position }, velocity: { ...this.velocity }, rotation: this.rotation, angularVelocity: this.angularVelocity, maxHeight: this.maxHeight, breaks: this.breaks, breakCombo: this.breakCombo, maxBreakCombo: this.maxBreakCombo, time: this.time, flightElapsed: this.flightElapsed, flightDuration: this.flightDuration, activeHold: this.activeHold, alive: this.alive, paused: this.paused, practice: this.practice, practiceStage: this.practiceStage, feedback: this.feedback, effects: this.recentEffects.map(effect => ({ ...effect })), obstacles: this.obstacles.map(obstacle => ({ ...obstacle })), result: this.result ? structuredClone(this.result) : null, timing: { anglePeriod: ANGLE_PERIOD, spinPeriod: SPIN_PERIOD, powerPeriod: POWER_PERIOD, powerPeakStart: POWER_PEAK_START, powerPeakEnd: POWER_PEAK_END } };
  }
}
