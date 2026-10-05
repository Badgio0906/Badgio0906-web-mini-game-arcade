import { CAMERA_SECONDS, DASH_SECONDS, GOAL, GOAL_RADIUS, PLAN_SECONDS, START, PLAYER_RADIUS, type Phase, type Point, type RainEvent, type Result, type Scene } from './types';
import { circleEntry, distance, segmentDistance } from './geometry';
import { createScene, practiceScene } from './generation';

export class RainRun {
  phase: Phase = 'warning'; scene: Scene = practiceScene(); route: Point[] = [{ ...START }]; position: Point = { ...START };
  round = 1; score = 0; streak = 0; closeCalls = 0; camera = 0; alive = false; paused = false; practice = false;
  time = 0; dashTime = 0; result: Result | null = null; feedback = '';
  private seed = 1; private lastNow = 0; private phaseStart = 0; private deadline = 0; private pauseStart = 0;
  private lengths: number[] = [0]; private totalLength = 0; private travelled = 0; private finishedRoute = false;
  constructor(private readonly event: (event: RainEvent) => void = () => {}) {}
  start(now: number, seed = 1, practice = false): void {
    this.seed = seed; this.practice = practice; this.round = 1; this.score = this.streak = this.time = 0;
    this.alive = true; this.paused = false; this.result = null; this.lastNow = now; this.nextScene(now);
  }
  private nextScene(now: number): void {
    this.scene = this.practice ? practiceScene() : createScene(this.round, this.seed + this.round * 7919);
    this.route = [{ ...START }]; this.position = { ...START }; this.lengths = [0]; this.totalLength = this.travelled = 0;
    this.finishedRoute = false; this.dashTime = 0; this.camera = 0; this.closeCalls = 0; this.feedback = ''; this.setPhase('warning', now, 1.05);
  }
  private setPhase(phase: Phase, now: number, seconds: number): void {
    this.phase = phase; this.phaseStart = now; this.deadline = now + seconds * 1000; this.event({ type: 'phase', phase });
  }
  settle(now: number): void {
    if (!this.alive || this.paused || !Number.isFinite(now) || now < this.lastNow) return;
    this.time += (now - this.lastNow) / 1000; this.lastNow = now;
    if (this.phase === 'warning' && now >= this.deadline) this.setPhase('rain', now, Math.max(2, 3.6 - this.round * .12));
    else if (this.phase === 'rain' && now >= this.deadline) this.end('activation');
    else if (this.phase === 'rise' || this.phase === 'lower') {
      const progress = Math.min(1, (now - this.phaseStart) / (CAMERA_SECONDS * 1000)), smooth = progress * progress * (3 - 2 * progress);
      this.camera = this.phase === 'rise' ? smooth : 1 - smooth;
      if (now >= this.deadline) { this.camera = this.phase === 'rise' ? 1 : 0; this.setPhase(this.phase === 'rise' ? 'plan' : 'dash', now, this.phase === 'rise' ? PLAN_SECONDS : DASH_SECONDS); }
    } else if (this.phase === 'plan' && now >= this.deadline) this.commit(now);
    else if (this.phase === 'dash') {
      const progress = Math.min(1, (now - this.phaseStart) / (DASH_SECONDS * 1000));
      this.dashTime = progress * DASH_SECONDS;
      this.execute(this.totalLength * progress);
      if (this.alive && now >= this.deadline) {
        if (!this.finishedRoute) this.end('unfinished');
        else {
          let calls = 0, bonus = 0;
          for (const rain of this.scene.rain) if (rain.dangerous) {
            let clearance = Infinity;
            for (let i = 1; i < this.route.length; i++) clearance = Math.min(clearance, segmentDistance(this.route[i - 1], this.route[i], rain.impact) - rain.radius - PLAYER_RADIUS);
            if (clearance > 0 && clearance <= 18 && calls < 3) { calls++; bonus += clearance <= 6 ? 300 : clearance <= 12 ? 200 : 100; }
          }
          this.closeCalls = calls; this.streak++;
          const points = 1000 + Math.min(7, this.streak - 1) * 200 + bonus;
          if (!this.practice) this.score += points;
          this.setPhase('clear', now, 1.2); this.event({ type: 'clear', points: this.practice ? 0 : points, closeCalls: calls, score: this.score, round: this.round });
        }
      }
    } else if (this.phase === 'clear' && now >= this.deadline && !this.practice) { this.round++; this.nextScene(now); }
  }
  activate(now: number): boolean {
    this.settle(now); if (!this.alive || this.paused || this.phase !== 'rain') return false;
    this.setPhase('rise', now, CAMERA_SECONDS); return true;
  }
  append(point: Point, now: number, begin = false): boolean {
    this.settle(now); if (!this.alive || this.paused || this.phase !== 'plan' || !Number.isFinite(point.x) || !Number.isFinite(point.z)) return false;
    const tail = this.route[this.route.length - 1];
    if (begin) { if (distance(point, tail) > 55) { this.feedback = this.route.length === 1 ? '黄色い主人公から描き始めよう。' : '線の先端から続きを描こう。'; return false; } this.feedback = ''; return true; }
    const next = { x: Math.max(30, Math.min(970, point.x)), z: Math.max(40, Math.min(560, point.z)) };
    if (this.route.length >= 2048 || distance(tail, next) < 2) return false;
    this.totalLength += distance(tail, next); this.route.push(next); this.lengths.push(this.totalLength);
    if (((next.x - GOAL.x) / GOAL_RADIUS.x) ** 2 + ((next.z - GOAL.z) / GOAL_RADIUS.z) ** 2 <= 1) { this.finishedRoute = true; this.commit(now); }
    return true;
  }
  resetRoute(now: number): boolean { this.settle(now); if (this.paused || this.phase !== 'plan') return false; this.route = [{ ...START }]; this.lengths = [0]; this.totalLength = 0; this.feedback = ''; return true; }
  private commit(now: number): void { this.setPhase('lower', now, CAMERA_SECONDS); this.travelled = 0; }
  trailingPosition(behind: number): Point {
    const at = Math.max(0, this.travelled - behind);
    for (let i = 1; i < this.route.length; i++) if (this.lengths[i] >= at) {
      const a = this.route[i - 1], b = this.route[i], t = (at - this.lengths[i - 1]) / (this.lengths[i] - this.lengths[i - 1]);
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    }
    return this.position;
  }
  private execute(target: number): void {
    // Walk every crossed polyline segment even if a frame spans the entire dash.
    let from = this.travelled;
    for (let i = 1; i < this.route.length && from < target; i++) {
      if (this.lengths[i] <= from) continue;
      const a = this.route[i - 1], b = this.route[i], length = this.lengths[i] - this.lengths[i - 1];
      const t0 = Math.max(0, (from - this.lengths[i - 1]) / length), t1 = Math.min(1, (target - this.lengths[i - 1]) / length);
      const p = { x: a.x + (b.x - a.x) * t0, z: a.z + (b.z - a.z) * t0 }, q = { x: a.x + (b.x - a.x) * t1, z: a.z + (b.z - a.z) * t1 };
      let hit = Infinity;
      for (const rain of this.scene.rain) if (rain.dangerous) { const entry = circleEntry(p, q, rain.impact, rain.radius + PLAYER_RADIUS); if (entry !== null) hit = Math.min(hit, entry); }
      if (hit !== Infinity) { this.position = { x: p.x + (q.x - p.x) * hit, z: p.z + (q.z - p.z) * hit }; this.end('rain'); return; }
      this.position = q; from = Math.min(target, this.lengths[i]);
    }
    this.travelled = target;
  }
  private end(reason: Result['reason']): void {
    this.alive = false; this.phase = 'over';
    this.result = { reason, score: this.score, round: this.round, streak: this.streak, time: this.time, collision: reason === 'rain' ? { ...this.position } : null };
    this.event({ type: 'end', result: this.result });
  }
  retryPractice(now: number): void { if (!this.practice || this.phase !== 'over') return; this.alive = true; this.paused = false; this.result = null; this.dashTime = 0; this.lastNow = now; this.route = [{ ...START }]; this.position = { ...START }; this.lengths = [0]; this.totalLength = this.travelled = 0; this.finishedRoute = false; this.feedback = '赤い雨の輪を避けて、もう一度。'; this.camera = 1; this.setPhase('plan', now, PLAN_SECONDS); }
  pause(value: boolean, now: number): void {
    if (!this.alive || value === this.paused) return;
    if (value) { this.settle(now); if (!this.alive) return; this.pauseStart = now; this.paused = true; }
    else { const elapsed = now - this.pauseStart; this.phaseStart += elapsed; this.deadline += elapsed; this.lastNow = now; this.paused = false; }
  }
  remaining(now = this.lastNow): number | null { return this.phase === 'plan' ? Math.max(0, (this.deadline - (this.paused ? this.pauseStart : now)) / 1000) : null; }
  snapshot(now = this.lastNow) { return { phase: this.phase, round: this.round, score: this.score, streak: this.streak, closeCalls: this.closeCalls, alive: this.alive, paused: this.paused, practice: this.practice, camera: this.camera, position: { ...this.position }, route: this.route.map(p => ({ ...p })), remaining: this.remaining(now), time: this.time, dashTime: this.dashTime, result: this.result ? { ...this.result } : null, feedback: this.feedback }; }
}
