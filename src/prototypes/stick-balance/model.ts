/** Units: seconds, metres, radians. Uniform rod pivoting on a translating palm.
 * Telescoping is deliberately quasi-static: preserve angle/angular velocity; no
 * artificial contraction impulse. Gravity and base acceleration use current length.
 */
export const CONFIG = {
  step: 1 / 120, gravity: 3.2, damping: 0.62,
  maxSpeed: 6.4, acceleration: 5.4, brake: 7.2,
  fallAngle: 0.92, warning: 2, shrinkDuration: 2.4,
  stages: [{ at: 0, length: 3 }, { at: 12, length: 2.5 }, { at: 24, length: 2 }, { at: 36, length: 1.55 }, { at: 48, length: 1.15 }],
} as const;
export interface State { time: number; x: number; v: number; angle: number; omega: number; length: number; stage: number; over: boolean }
export function createState(direction = 1): State {
  return { time: 0, x: 0, v: 0, angle: 0.036 * direction, omega: 0.008 * direction, length: 3, stage: 0, over: false };
}
export function lengthAt(time: number): { length: number; stage: number } {
  let stage = 0;
  for (let i = 1; i < CONFIG.stages.length; i++) if (time >= CONFIG.stages[i].at) stage = i;
  const next = CONFIG.stages[stage];
  const from = CONFIG.stages[Math.max(0, stage - 1)].length;
  const t = Math.min(1, Math.max(0, (time - next.at) / CONFIG.shrinkDuration));
  return { stage, length: from + (next.length - from) * t * t * (3 - 2 * t) };
}
export function angularAcceleration(angle: number, omega: number, acceleration: number, length: number): number {
  return 1.5 / length * (CONFIG.gravity * Math.sin(angle) - acceleration * Math.cos(angle)) - CONFIG.damping * omega;
}
export function step(s: State, input: number): void {
  if (s.over) return;
  const dt = CONFIG.step;
  const target = Math.max(-1, Math.min(1, input)) * CONFIG.maxSpeed;
  const maxDelta = (input === 0 ? CONFIG.brake : CONFIG.acceleration) * dt;
  const newV = s.v + Math.max(-maxDelta, Math.min(maxDelta, target - s.v));
  const a = (newV - s.v) / dt;
  s.v = newV;
  s.x += s.v * dt;
  s.time += dt;
  Object.assign(s, lengthAt(s.time));
  s.omega += angularAcceleration(s.angle, s.omega, a, s.length) * dt;
  s.angle += s.omega * dt;
  s.over = Math.abs(s.angle) >= CONFIG.fallAngle;
}
/** Accumulator shared by production and tests; long stalls pause instead of killing. */
export class Simulation {
  state = createState();
  private remainder = 0;
  reset(direction = 1): void { this.state = createState(direction); this.remainder = 0; }
  advance(seconds: number, input: number): void {
    this.remainder += Math.min(0.1, Math.max(0, seconds));
    while (this.remainder + 1e-10 >= CONFIG.step) { step(this.state, input); this.remainder -= CONFIG.step; }
  }
}
