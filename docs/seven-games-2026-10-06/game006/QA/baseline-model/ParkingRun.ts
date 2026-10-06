import type { ParkingChoice, ParkingEvent, ParkingGrade, ParkingInspection, ParkingLayout, ParkingMode, ParkingOutcome, ParkingPose, ParkingResult, ParkingSnapshot, Point } from './contracts';

export const CAR_WIDTH = 42;
export const CAR_HEIGHT = 70;
export const WHEELBASE = 110;
export const MIN_DISTANCE = 120;
export const MAX_DISTANCE = 340;
export const PARKED_SECONDS = 0.65;
export const STEERING_LIMIT_DEGREES = 38;
export const anglePeriodAt = (parked: number): number => Math.max(18, 24 - Math.max(0, parked) * 0.2);
export const powerPeriodAt = (parked: number): number => Math.max(7, 9 - Math.max(0, parked) * 0.08);
export const FORBIDDEN_SLOT = { width: 50, height: 82 };
const RAD = Math.PI / 180;
const clamp = (n: number, a: number, b: number): number => Math.max(a, Math.min(b, n));
export const curvatureFor = (degrees: number): number => Math.tan(degrees * RAD) / WHEELBASE;
export const distanceFor = (power: number): number => MIN_DISTANCE + clamp(power, 0, 1) * (MAX_DISTANCE - MIN_DISTANCE);

/** Heading zero points north; integration is the exact forward circular arc, not a visual spline. */
export function poseAlongArc(start: ParkingPose, curvature: number, distance: number): ParkingPose {
  const rotation = start.rotation + curvature * distance;
  return { ...start, rotation,
    x: start.x + (Math.abs(curvature) < 1e-10 ? Math.sin(start.rotation) * distance : (Math.cos(start.rotation) - Math.cos(rotation)) / curvature),
    y: start.y + (Math.abs(curvature) < 1e-10 ? -Math.cos(start.rotation) * distance : (Math.sin(start.rotation) - Math.sin(rotation)) / curvature) };
}
export function rectangleCorners(rect: ParkingPose): Point[] {
  const c = Math.cos(rect.rotation); const s = Math.sin(rect.rotation);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
    const x = a * rect.width / 2; const y = b * rect.height / 2;
    return { x: rect.x + x * c - y * s, y: rect.y + x * s + y * c };
  });
}
function local(point: Point, rect: ParkingPose): Point {
  const dx = point.x - rect.x; const dy = point.y - rect.y;
  return { x: dx * Math.cos(rect.rotation) + dy * Math.sin(rect.rotation), y: -dx * Math.sin(rect.rotation) + dy * Math.cos(rect.rotation) };
}
export function containsCar(slot: ParkingPose, car: ParkingPose): boolean {
  return rectangleCorners(car).every(p => { const q = local(p, slot); return Math.abs(q.x) <= slot.width / 2 + 1e-7 && Math.abs(q.y) <= slot.height / 2 + 1e-7; });
}
function polygonsTouch(a: Point[], b: Point[]): boolean {
  for (const polygon of [a, b]) for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i]; const q = polygon[(i + 1) % polygon.length];
    const ax = -(q.y - p.y); const ay = q.x - p.x;
    const pa = a.map(v => v.x * ax + v.y * ay); const pb = b.map(v => v.x * ax + v.y * ay);
    if (Math.max(...pa) < Math.min(...pb) - 1e-8 || Math.max(...pb) < Math.min(...pa) - 1e-8) return false;
  }
  return true;
}
export function rectanglesTouch(a: ParkingPose, b: ParkingPose): boolean { return polygonsTouch(rectangleCorners(a), rectangleCorners(b)); }
function intersectionCenter(subject: Point[], boundary: Point[]): Point | null {
  let polygon = subject;
  for (let i = 0; i < boundary.length; i++) {
    const a = boundary[i]; const b = boundary[(i + 1) % boundary.length]; const input = polygon; polygon = [];
    const side = (p: Point): number => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    if (!input.length) return null;
    for (let j = 0; j < input.length; j++) {
      const p = input[j]; const q = input[(j + 1) % input.length]; const sp = side(p); const sq = side(q);
      if (sp >= -1e-8) polygon.push(p);
      if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); polygon.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }); }
    }
  }
  return polygon.length ? { x: polygon.reduce((sum, p) => sum + p.x, 0) / polygon.length, y: polygon.reduce((sum, p) => sum + p.y, 0) / polygon.length } : null;
}
function hull(points: Point[]): Point[] {
  const ordered = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Point, a: Point, b: Point): number => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Point[] = []; const upper: Point[] = [];
  for (const p of ordered) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  for (const p of [...ordered].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  lower.pop(); upper.pop(); return lower.concat(upper);
}
/** Swept corner hull plus rotation sagitta bounds the true swept body. Call with <=.5px / .25deg increments. */
export function sweptCarTouches(before: ParkingPose, after: ParkingPose, obstacle: ParkingPose): boolean {
  const angle = Math.abs(after.rotation - before.rotation);
  const centerRadius = angle > 1e-10 ? Math.hypot(after.x - before.x, after.y - before.y) / (2 * Math.sin(angle / 2)) : 0;
  const padding = (centerRadius + Math.hypot(before.width, before.height) / 2) * (1 - Math.cos(angle / 2)) + 1e-8;
  const expand = (p: ParkingPose): ParkingPose => ({ ...p, width: p.width + padding * 2, height: p.height + padding * 2 });
  return polygonsTouch(hull([...rectangleCorners(expand(before)), ...rectangleCorners(expand(after))]), rectangleCorners(obstacle));
}
export function parkingGrade(car: ParkingPose, slot: ParkingPose): ParkingGrade {
  const p = local(car, slot);
  const error = Math.max(Math.abs(p.x) / Math.max(1, (slot.width - car.width) / 2), Math.abs(p.y) / Math.max(1, (slot.height - car.height) / 2), Math.abs(car.rotation - slot.rotation) / (8 * RAD));
  return error <= 0.2 ? 'PERFECT PARK' : error <= 0.55 ? 'GREAT' : 'GOOD';
}
export function scoreParking(grade: ParkingGrade, streak: number, mode: ParkingMode): number {
  const base = grade === 'PERFECT PARK' ? 200 : grade === 'GREAT' ? 150 : 100;
  return Math.round(base * (grade === 'PERFECT PARK' ? 1 + Math.min(4, Math.max(0, streak - 1)) * 0.25 : 1) * (mode === 'forbidden' ? 2 : 1));
}

export const PARKING_TEMPLATES = ['straight', 'angle-right', 'angle-left', 'tight-right', 'tight-left', 'parallel-right', 'parallel-left'] as const;
/** Finite designed routes; targets come from feasible arcs. Appearance never changes handling. */
export function createParkingLayout(index: number, mode: ParkingMode, roll = 0): ParkingLayout {
  const eligible = index < 2 ? 1 : index < 4 ? 3 : index < 7 ? 5 : 7;
  const template = Math.min(eligible - 1, Math.floor(clamp(roll, 0, 0.9999999) * eligible));
  const parallel = template >= 5; const side = template % 2 ? 1 : -1;
  const turn = template === 0 ? 0 : side * (parallel ? Math.PI / 2 : template >= 3 ? 40 * RAD : 25 * RAD);
  const distance = parallel ? 270 : template >= 3 ? 250 : 240;
  const start: ParkingPose = { x: parallel ? side > 0 ? 180 : 420 : 300, y: 490, rotation: 0, width: CAR_WIDTH, height: CAR_HEIGHT };
  const target = poseAlongArc(start, turn / distance, distance);
  const slot = { ...target, width: mode === 'forbidden' ? FORBIDDEN_SLOT.width : Math.max(56, 72 - index * 1.4), height: mode === 'forbidden' ? FORBIDDEN_SLOT.height : Math.max(90, 106 - index * 1.2) };
  const obstacles = index < 2 ? [] : [-1, 1].map((s, id) => ({ ...target,
    x: target.x + Math.cos(target.rotation) * s * 71, y: target.y + Math.sin(target.rotation) * s * 71,
    id, kind: 'car' as const, variant: (index + id + 1) % 3 }));
  const layout: ParkingLayout = { id: index, templateId: PARKING_TEMPLATES[template], name: parallel ? '縦列駐車' : template ? '斜めの区画' : 'まっすぐ駐車', start, slot, obstacles, variant: index % 3 };
  // No arbitrary RNG rescue: every designed route must fit and remain collision-free.
  if (!containsCar(slot, target)) throw new Error('Parking target does not fit');
  let previous = start;
  for (let d = 0.5; d <= distance; d += 0.5) {
    const next = poseAlongArc(start, turn / distance, Math.min(distance, d));
    if (obstacles.some(o => sweptCarTouches(previous, next, o))) throw new Error(`Unsafe parking template ${layout.templateId}`);
    previous = next;
  }
  return layout;
}

export class ParkingRun {
  private state: ParkingSnapshot;
  private layout: ParkingLayout;
  private phaseTime = 0;
  private driveDistance = 0;
  private driven = 0;
  private contact: Point | null = null;
  private ending: ParkingResult | null = null;
  private offered = false;
  private layoutRoll = 0;
  constructor(private readonly emit: (event: ParkingEvent) => void = () => {}, private readonly random: () => number = Math.random) {
    this.layout = createParkingLayout(0, 'normal'); this.state = this.initial();
  }
  private initial(): ParkingSnapshot {
    return { score: 0, parked: 0, perfectCount: 0, perfectStreak: 0, maxStreak: 0, time: 0, alive: false,
      phase: 'angle', pending: null, mode: 'normal', steeringDegrees: -STEERING_LIMIT_DEGREES, power: 0,
      lockedSteering: null, lockedPower: null, grade: null, pose: { ...this.layout.start }, streakMultiplier: 1, modeMultiplier: 1, outcome: null };
  }
  reset(): void { this.layout = createParkingLayout(0, 'normal'); this.state = this.initial(); this.phaseTime = this.driveDistance = this.driven = 0; this.contact = this.ending = null; this.offered = false; this.layoutRoll = 0; }
  start(): void { this.reset(); this.state.alive = true; }
  act(): boolean {
    const s = this.state;
    if (!s.alive || s.pending) return false;
    if (s.phase === 'angle') { s.lockedSteering = s.steeringDegrees; s.phase = 'power'; this.phaseTime = 0; s.power = 0; this.emit({ type: 'angle', steeringDegrees: s.lockedSteering }); return true; }
    if (s.phase !== 'power') return false;
    s.lockedPower = s.power; this.driveDistance = distanceFor(s.power); this.driven = 0; this.phaseTime = 0; s.phase = 'driving';
    this.emit({ type: 'launch', power: s.power }); return true;
  }
  choose(choice: ParkingChoice): boolean {
    const s = this.state;
    if (!s.alive || !s.pending || (choice !== 'normal' && choice !== 'forbidden')) return false;
    s.mode = choice; s.modeMultiplier = choice === 'forbidden' ? 2 : 1; s.pending = null; s.phase = 'angle'; s.steeringDegrees = -STEERING_LIMIT_DEGREES; this.phaseTime = 0;
    this.layout = createParkingLayout(s.parked, s.mode, this.layoutRoll); s.pose = { ...this.layout.start };
    this.emit({ type: 'choice', milestone: 'parked10', choice }); return true;
  }
  step(seconds: number): void {
    const s = this.state;
    if (!s.alive || s.pending || !Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = Math.min(0.05, seconds);
    while (remaining > 1e-10 && s.alive && !s.pending) {
      const dt = Math.min(1 / 240, remaining); remaining -= dt; s.time += dt; this.phaseTime += dt;
      if (s.phase === 'angle') s.steeringDegrees = -STEERING_LIMIT_DEGREES * Math.cos(this.phaseTime * Math.PI * 2 / anglePeriodAt(s.parked));
      else if (s.phase === 'power') s.power = (1 - Math.cos(this.phaseTime * Math.PI * 2 / powerPeriodAt(s.parked))) / 2;
      else if (s.phase === 'driving') this.drive(dt);
      else if (s.phase === 'parked' && this.phaseTime >= PARKED_SECONDS) this.next();
    }
  }
  private drive(dt: number): void {
    const s = this.state; const k = curvatureFor(s.lockedSteering!);
    const nextDistance = Math.min(this.driveDistance, this.driven + dt * (this.driveDistance / (1.1 + this.driveDistance / MAX_DISTANCE * 0.35)));
    const pieces = Math.max(1, Math.ceil((nextDistance - this.driven) / 0.5), Math.ceil(Math.abs(k * (nextDistance - this.driven)) / (0.25 * RAD)));
    const from = this.driven;
    for (let i = 1; i <= pieces; i++) {
      const d = from + (nextDistance - from) * i / pieces;
      const pose = poseAlongArc(this.layout.start, k, d);
      const obstacle = this.layout.obstacles.find(o => sweptCarTouches(s.pose, pose, o));
      const previous = s.pose;
      s.pose = pose; this.driven = d;
      if (obstacle) {
        this.contact = intersectionCenter(hull([...rectangleCorners(previous), ...rectangleCorners(pose)]), rectangleCorners(obstacle));
        this.finish('collision', '隣の車に接触！'); return;
      }
      const outside = rectangleCorners(pose).find(p => p.x < 22 || p.x > 578 || p.y < 22 || p.y > 578);
      if (outside) { this.contact = { ...outside }; this.finish('collision', '駐車場の縁石に接触！'); return; }
    }
    if (this.driven < this.driveDistance - 1e-7) return;
    if (!containsCar(this.layout.slot, s.pose)) {
      const error = local(s.pose, this.layout.slot); const angleError = Math.abs(s.pose.rotation - this.layout.slot.rotation);
      // Short curved travel also changes the final heading. Attribute power from the full visible route,
      // rather than treating that travel-induced heading difference as a wrong steering selection.
      const turn = Math.abs(this.layout.slot.rotation - this.layout.start.rotation);
      const chord = Math.hypot(this.layout.slot.x - this.layout.start.x, this.layout.slot.y - this.layout.start.y);
      const targetTravel = turn < 1e-10 ? chord : turn * chord / (2 * Math.sin(turn / 2));
      const steeringCanFit = containsCar(this.layout.slot, poseAlongArc(this.layout.start, k, targetTravel));
      const distanceDominates = Math.abs(error.y) > Math.max(Math.abs(error.x) * 1.25, (this.layout.slot.height - CAR_HEIGHT) / 2);
      const reason = steeringCanFit
        ? this.driveDistance < targetTravel ? '強さが足りず、枠に届きませんでした。' : '強すぎて、枠を通り過ぎました。'
        : distanceDominates ? error.y > 0 ? '枠の手前で止まりました。強さと角度を確認してください。' : '枠の先まで進みました。強さと角度を確認してください。'
          : angleError > 6 * RAD || Math.abs(error.x) > Math.abs(error.y) ? '角度が合わず、枠からはみ出しました。'
            : '枠に収まりませんでした。強さと角度を確認してください。';
      this.finish('outside', reason); return;
    }
    s.grade = parkingGrade(s.pose, this.layout.slot); s.parked++;
    if (s.grade === 'PERFECT PARK') { s.perfectCount++; s.perfectStreak++; } else s.perfectStreak = 0;
    s.maxStreak = Math.max(s.maxStreak, s.perfectStreak); s.streakMultiplier = 1 + Math.min(4, Math.max(0, s.perfectStreak - 1)) * 0.25;
    const points = scoreParking(s.grade, s.perfectStreak, s.mode); s.score += points; s.phase = 'parked'; this.phaseTime = 0;
    this.emit({ type: 'park', grade: s.grade, points, streak: s.perfectStreak, parked: s.parked });
  }
  private next(): void {
    const s = this.state; this.layoutRoll = this.random();
    const offer = s.parked === 10 && !this.offered;
    this.layout = createParkingLayout(s.parked, offer ? 'forbidden' : s.mode, this.layoutRoll);
    s.pose = { ...this.layout.start }; s.lockedSteering = s.lockedPower = null; s.steeringDegrees = -STEERING_LIMIT_DEGREES; s.power = 0; s.grade = null;
    this.phaseTime = this.driven = this.driveDistance = 0;
    if (offer) { this.offered = true; s.pending = 'forbidden'; s.phase = 'choice'; this.emit({ type: 'milestone', milestone: 'parked10' }); }
    else s.phase = 'angle';
  }
  private finish(outcome: ParkingOutcome, reason: string): void {
    const s = this.state; if (!s.alive) return;
    s.alive = false; s.phase = 'ended'; s.outcome = outcome;
    this.ending = { score: s.score, parked: s.parked, perfectCount: s.perfectCount, maxStreak: s.maxStreak, time: s.time, mode: s.mode,
      outcome, reason, pose: { ...s.pose }, contact: this.contact ? { ...this.contact } : null, steeringDegrees: s.lockedSteering ?? s.steeringDegrees, power: s.lockedPower ?? s.power };
    this.emit({ type: 'failure', outcome });
  }
  snapshot(): ParkingSnapshot { return { ...this.state, pose: { ...this.state.pose } }; }
  result(): ParkingResult | null { return this.ending ? { ...this.ending, pose: { ...this.ending.pose }, contact: this.ending.contact ? { ...this.ending.contact } : null } : null; }
  inspection(): ParkingInspection {
    const s = this.state; const k = curvatureFor(s.lockedSteering ?? s.steeringDegrees);
    const distance = s.phase === 'angle' ? MAX_DISTANCE : distanceFor(s.lockedPower ?? s.power);
    const projection = Array.from({ length: 41 }, (_, i) => poseAlongArc(this.layout.start, k, distance * i / 40));
    return { ...this.snapshot(), layout: { ...this.layout, start: { ...this.layout.start }, slot: { ...this.layout.slot }, obstacles: this.layout.obstacles.map(o => ({ ...o })) },
      projection, endpoint: { ...projection[projection.length - 1] }, contact: this.contact ? { ...this.contact } : null, driveDistance: this.driveDistance, phaseTime: this.phaseTime };
  }
}
