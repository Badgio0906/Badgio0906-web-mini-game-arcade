import { shoeFor } from './shoes';
import { FIXED_STEP, JUST_MAX_THRESHOLD, type Effect, type Inputs, type Obstacle, type ObstacleType, type Result, type ReplayHold, type Route, type Sample, type Trajectory } from './types';
export const clamp = (value: number, min: number, max: number): number => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
export function normalizeInputs(input: Inputs): Inputs { return { angle: clamp(input.angle, 5, 85), spin: clamp(input.spin, -1, 1), power: clamp(input.power, 0, 100), shoeType: shoeFor(input.shoeType).id }; }
export function routeFor(angle: number): Route { return angle <= 25 ? 'ground' : angle < 55 ? 'distance' : 'sky'; }
export function formatDistance(meters: number): string { const value = Math.max(0, Number.isFinite(meters) ? meters : 0); return value >= 1000 ? (value / 1000).toFixed(value >= 10000 ? 1 : 2) + ' km' : value.toFixed(1) + ' m'; }
const obstacleTypes: readonly ObstacleType[] = ['fence', 'wall', 'vending', 'sign', 'truck', 'warehouse', 'building'];
const heights = [18, 42, 25, 44, 34, 65, 105], widths = [4, 9, 9, 5, 35, 45, 38], strengths = [300, 850, 550, 420, 950, 1200, 1800];
export function obstacleAt(id: number): Obstacle {
  const index = ((id * 5 + Math.floor(id / 7)) % obstacleTypes.length + obstacleTypes.length) % obstacleTypes.length;
  return { id, type: obstacleTypes[index], x: 150 + id * 190 + (id * 37 % 41), y: 0, width: widths[index], height: heights[index], resistance: strengths[index], broken: false, time: -1 };
}
export function nearbyObstacles(x: number, history: readonly Obstacle[], radius = 1150): Obstacle[] {
  const first = Math.max(0, Math.floor((x - radius - 191) / 190)), last = Math.max(first, Math.ceil((x + radius) / 190)), result: Obstacle[] = [];
  for (let id = first; id <= last && result.length < 24; id++) { const prior = history.find(obstacle => obstacle.id === id); result.push(prior ? { ...prior } : obstacleAt(id)); }
  return result;
}
export function segmentBoxEntry(ax: number, ay: number, bx: number, by: number, obstacle: Pick<Obstacle, 'x' | 'y' | 'width' | 'height'>): number | null {
  let entry = 0, exit = 1;
  for (const [from, to, min, max] of [[ax, bx, obstacle.x, obstacle.x + obstacle.width], [ay, by, obstacle.y, obstacle.y + obstacle.height]]) {
    const delta = to - from;
    if (Math.abs(delta) < 1e-12) { if (from < min || from > max) return null; continue; }
    const t0 = (min - from) / delta, t1 = (max - from) / delta;
    entry = Math.max(entry, Math.min(t0, t1)); exit = Math.min(exit, Math.max(t0, t1));
    if (entry > exit) return null;
  }
  return entry;
}
export function launchParameters(raw: Inputs) {
  const input = normalizeInputs(raw), shoe = shoeFor(input.shoeType), magnitude = Math.abs(input.spin), justMax = input.power >= JUST_MAX_THRESHOLD;
  const precision = Math.max(0, 1 - Math.abs(magnitude - shoe.optimalSpin));
  const ironPrecision = (input.angle >= 15 && input.angle <= 28 || input.angle >= 48 && input.angle <= 68) && magnitude >= .65 && magnitude <= .94;
  let speed = shoe.launchSpeed * (.13 + .87 * input.power / 100) * (.91 + precision * .09);
  if (justMax) speed *= input.shoeType === 'iron-geta' ? ironPrecision ? 7.5 : 2.2 : input.shoeType === 'paper' ? 2.15 : 1.45;
  if (input.shoeType === 'paper' && justMax && input.angle >= 78) speed *= 1.55;
  speed = Math.min(3600, speed);
  const radians = input.angle * Math.PI / 180;
  return { speed, vx: speed * Math.cos(radians), vy: speed * Math.sin(radians), angularVelocity: input.spin * shoe.spinEfficiency * 24, justMax, precision, ironPrecision };
}
export function simulate(raw: Inputs, practice = false): Trajectory {
  const input = normalizeInputs(raw), shoe = shoeFor(input.shoeType), launch = launchParameters(input), route = routeFor(input.angle);
  const samples: Sample[] = [], effects: Effect[] = [], obstacles: Obstacle[] = [], crossed = new Set<number>(), specialNames = new Set<string>();
  let x = 0, y = 2, vx = launch.vx, vy = launch.vy, rotation = 0, angularVelocity = launch.angularVelocity, maxHeight = y, breaks = 0, combo = 0, maxBreakCombo = 0, bounces = 0, t = 0;
  const addSpecial = (name: string, atX = x, atY = y, atT = t) => { if (!specialNames.has(name)) { specialNames.add(name); effects.push({ type: 'special', name, x: atX, y: atY, time: atT }); } };
  if (input.shoeType === 'paper' && launch.justMax && input.angle >= 78) addSpecial('JET STREAM');
  if (input.shoeType === 'zori' && Math.abs(input.spin) >= .92) addSpecial('TORNADO ZORI');
  if (input.shoeType === 'leather' && route === 'ground' && launch.justMax) addSpecial('BUSINESS MISSILE');
  if (input.shoeType === 'iron-geta' && launch.justMax && launch.ironPrecision) addSpecial(route === 'ground' ? 'IRON BREAKER' : 'IRON GETA EVENT');
  if (route === 'ground' && input.angle <= 12 && input.power >= 85) addSpecial('HIGHWAY STAR');
  samples.push({ t, x, y, vx, vy, rotation, angularVelocity, maxHeight, breaks });
  for (let step = 1; step <= 3600; step++) {
    const previousX = x, previousY = y;
    t = step * FIXED_STEP;
    const spinStability = clamp(Math.abs(angularVelocity) / (shoe.spinEfficiency * 24), 0, 1), mismatch = Math.abs(spinStability - shoe.optimalSpin);
    const dragFactor = shoe.drag / shoe.aerodynamics * (1 + mismatch * .75) / (1 + spinStability * shoe.spinEfficiency * .35);
    const speed = Math.hypot(vx, vy), gravity = shoe.gravity * (.94 + .06 * Math.sqrt(shoe.weight)), wind = input.shoeType === 'paper' ? Math.sin(t * .48) * 2.4 : 0;
    // Semi-implicit fixed-step integration. Drag opposes motion; lift depends on real spin and horizontal velocity.
    const lift = Math.min(gravity * .48, Math.abs(vx) * spinStability * shoe.spinEfficiency * .012);
    vx += (-vx * speed * dragFactor * (input.shoeType === 'paper' ? 1.8 : 1) + wind) * FIXED_STEP;
    vy += (-gravity + lift - vy * speed * dragFactor * .55) * FIXED_STEP;
    angularVelocity *= Math.exp(-(.026 + mismatch * .028) * FIXED_STEP);
    x += Math.max(0, vx) * FIXED_STEP; y += vy * FIXED_STEP; rotation += angularVelocity * FIXED_STEP;
    // Every obstacle slab crossed in this fixed step is checked, including high-speed launch frames.
    const first = Math.max(0, Math.floor((previousX - 235) / 190)), last = Math.ceil(x / 190);
    for (let id = first; id <= last; id++) {
      if (crossed.has(id)) continue;
      const obstacle = obstacleAt(id);
      if (previousX > obstacle.x + obstacle.width || x < obstacle.x) continue;
      const entry = segmentBoxEntry(previousX, previousY, x, y, obstacle);
      if (entry === null) continue;
      const atY = previousY + (y - previousY) * entry;
      crossed.add(id);
      const penetration = Math.hypot(vx, vy) * shoe.penetration * (.65 + Math.abs(input.spin) * .85) * (.25 + input.power / 100);
      obstacle.broken = penetration >= obstacle.resistance; obstacle.time = t - FIXED_STEP + entry * FIXED_STEP; obstacles.push(obstacle);
      effects.push({ type: 'impact', name: obstacle.broken ? 'BREAK!' : 'BONK!', x: previousX + (x - previousX) * entry, y: atY, time: obstacle.time, obstacleId: id });
      if (obstacle.broken) {
        breaks++; combo++; maxBreakCombo = Math.max(maxBreakCombo, combo); vx *= .97; vy *= .985;
        if (obstacle.type === 'wall') addSpecial('WALL BREAK', obstacle.x, atY, obstacle.time);
        if (combo >= 3 && route === 'ground' && Math.abs(input.spin) >= .7 && input.power >= 85) addSpecial('DRILL THROUGH', obstacle.x, atY, obstacle.time);
      } else { combo = 0; vx *= .33; vy = Math.max(vy * .6, 12); }
    }
    maxHeight = Math.max(maxHeight, y);
    for (const [height, name, eligible] of [[550, 'CLOUD NINE', route === 'sky'], [2200, 'AIRPLANE BREAK', route === 'sky' && input.power >= 85], [6500, 'UFO INCIDENT', route === 'sky' && input.power >= 97], [25000, 'ORBITAL SHOE', route === 'sky' && launch.justMax]] as const) {
      if (eligible && previousY < height && y >= height) { const fraction = (height - previousY) / (y - previousY); addSpecial(name, previousX + (x - previousX) * fraction, height, t - FIXED_STEP + fraction * FIXED_STEP); }
    }
    if (y <= 0) {
      if (route === 'ground' && input.power >= 65 && bounces < 3 && vx > 160) { y = -y * .25; vy = Math.max(24, Math.abs(vy) * .48); vx *= .79; bounces++; }
      else {
        const fraction = previousY / Math.max(1e-9, previousY - y);
        x = previousX + (x - previousX) * clamp(fraction, 0, 1); y = 0; t -= FIXED_STEP * (1 - clamp(fraction, 0, 1)); vx = vy = angularVelocity = 0;
        samples.push({ t, x, y, vx, vy, rotation, angularVelocity, maxHeight, breaks }); break;
      }
    }
    samples.push({ t, x, y, vx, vy, rotation, angularVelocity, maxHeight, breaks });
  }
  // The launch cap and positive effective gravity bound every supported input below120s.
  if (y > 0) throw new Error('Flight exceeded the bounded deterministic simulation horizon');
  effects.sort((a, b) => a.time - b.time);
  const physicalDuration = t, motionDuration = input.power < 25 ? clamp(physicalDuration * .7, 4, 9) : clamp(12 + physicalDuration * .13 + specialNames.size * .6, 12, 24);
  const replayScale = motionDuration / Math.max(FIXED_STEP, physicalDuration), holds: ReplayHold[] = [];
  for (const effect of effects) if (['AIRPLANE BREAK', 'UFO INCIDENT', 'ORBITAL SHOE'].includes(effect.name)) {
    const start = effect.time * replayScale + holds.length * .55;
    holds.push({ name: effect.name, physicalTime: effect.time, start, end: start + .55, x: effect.x, y: effect.y });
  }
  const replayTime = (physicalTime: number) => physicalTime * replayScale + holds.filter(hold => hold.physicalTime < physicalTime - 1e-9).length * .55;
  for (const effect of effects) effect.time = replayTime(effect.time);
  for (const obstacle of obstacles) obstacle.time = replayTime(obstacle.time);
  const duration = motionDuration + holds.length * .55;
  const spinRating = Math.abs(input.spin) >= .7 ? 'GREAT' : Math.abs(input.spin) >= .25 ? 'GOOD' : 'LOW';
  const score = { distance: Math.floor(x * 4), height: Math.floor(maxHeight * 2), breaks: breaks * 1200, spin: Math.min(10000, Math.floor(Math.abs(rotation) / (Math.PI * 2) * (input.shoeType === 'zori' ? 125 : 80))), justMax: launch.justMax ? 2500 : 0, special: [...specialNames].reduce((total, name) => total + (name === 'ORBITAL SHOE' ? 10000 : name.startsWith('IRON') ? 5000 : 1000), 0), total: 0 };
  score.total = score.distance + score.height + score.breaks + score.spin + score.justMax + score.special;
  if (practice) for (const key of Object.keys(score) as (keyof typeof score)[]) score[key] = 0;
  const result: Result = { distance: x, height: maxHeight, breaks, maxBreakCombo, spinRating, powerRating: launch.justMax ? 'JUST MAX' : input.power >= 98 ? 'PERFECT' : 'NORMAL', specials: [...specialNames], score, inputs: { ...input }, duration: duration + .6 + .65 + (launch.justMax ? .38 : 0), practice };
  return { samples, effects, obstacles, duration, motionDuration, physicalDuration, holds, result };
}
export function activeReplayHold(trajectory: Trajectory, elapsed: number): ReplayHold | null {
  return trajectory.holds.find(hold => elapsed >= hold.start && elapsed <= hold.end) ?? null;
}
export function replayPhysicalTime(trajectory: Trajectory, elapsed: number): number {
  const time = clamp(elapsed, 0, trajectory.duration);
  if (time >= trajectory.duration) return trajectory.physicalDuration;
  let pausedDuration = 0;
  for (const hold of trajectory.holds) {
    if (time < hold.start) break;
    if (time <= hold.end) return hold.physicalTime;
    pausedDuration += hold.end - hold.start;
  }
  return clamp((time - pausedDuration) / trajectory.motionDuration, 0, 1) * trajectory.physicalDuration;
}
export function sampleTrajectory(trajectory: Trajectory, elapsed: number): Sample {
  const physicalTime = replayPhysicalTime(trajectory, elapsed);
  let low = 0, high = trajectory.samples.length - 1;
  while (low < high) { const middle = (low + high) >> 1; if (trajectory.samples[middle].t < physicalTime) low = middle + 1; else high = middle; }
  const b = trajectory.samples[low], a = trajectory.samples[Math.max(0, low - 1)], fraction = b.t === a.t ? 0 : clamp((physicalTime - a.t) / (b.t - a.t), 0, 1);
  const interpolate = (start: number, end: number) => start + (end - start) * fraction;
  return { t: physicalTime, x: interpolate(a.x, b.x), y: interpolate(a.y, b.y), vx: interpolate(a.vx, b.vx), vy: interpolate(a.vy, b.vy), rotation: interpolate(a.rotation, b.rotation), angularVelocity: interpolate(a.angularVelocity, b.angularVelocity), maxHeight: Math.max(a.maxHeight, interpolate(a.y, b.y)), breaks: a.breaks };
}
