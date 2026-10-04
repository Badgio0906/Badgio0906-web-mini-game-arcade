import type { Difficulty, GameplayEvent, Lane, RunResult, RunSnapshot } from './contracts';

export const INNER_RADIUS = 146;
export const OUTER_RADIUS = 218;
export const PLAYER_RADIUS = 7;
export const SWITCH_SECONDS = 0.14;
export const MAX_ANGULAR_SPEED = 1.62;
const START_ANGLE = -Math.PI / 2;
const HAZARD_DEPTH = 12;
const ANGULAR_PADDING = (PLAYER_RADIUS + 1) / INNER_RADIUS;
const REACTION_MARGIN_SECONDS = 0.42;

export interface Obstacle {
  id: number;
  angle: number;
  lane: Lane;
  halfWidth: number;
  passed: boolean;
  nearCandidate: boolean;
}
export interface Shard { angle: number; lane: Lane; collected: boolean }
export interface PatternEntry { lane: Lane; offset: number; halfWidth: number }

// Conservative maximum-speed validation also applies at the boundary between templates.
export function validatePattern(entries: readonly PatternEntry[]): boolean {
  for (let i = 1; i < entries.length; i++) {
    const previous = entries[i - 1];
    const next = entries[i];
    const freeAngle = next.offset - previous.offset - previous.halfWidth - next.halfWidth - ANGULAR_PADDING * 2;
    if (freeAngle < 0) return false;
    if (previous.lane !== next.lane && freeAngle / MAX_ANGULAR_SPEED < SWITCH_SECONDS + REACTION_MARGIN_SECONDS) return false;
  }
  return true;
}

export function difficultyAt(time: number): Difficulty {
  return time < 10 ? 'WARM UP' : time < 30 ? 'EASY' : time < 60 ? 'NORMAL' : time < 90 ? 'HARD' : 'VERY HARD';
}

export function speedAt(time: number): number {
  // Continuous, bounded speed; templates, rather than endless acceleration, carry late difficulty.
  return Math.min(MAX_ANGULAR_SPEED, 0.84 + 0.78 * (1 - Math.exp(-time / 58)));
}

export class OrbitRun {
  time = 0;
  theta = START_ANGLE;
  radius = INNER_RADIUS;
  lane: Lane = 'inner';
  alive = false;
  readonly obstacles: Obstacle[] = [];
  readonly shards: Shard[] = [];
  private points = 0;
  private combo = 0;
  private maxCombo = 0;
  private passed = 0;
  private shardCount = 0;
  private nearMisses = 0;
  private lastNearTime = -Infinity;
  private switchTime = SWITCH_SECONDS;
  private switchFrom = INNER_RADIUS;
  private nextAngle = START_ANGLE + 5.3;
  private nextId = 0;
  private nextLane: Lane = 'inner';
  private patternIndex = 0;
  private activePattern: Lane[] = ['inner'];
  private ending: RunResult | null = null;

  constructor(private readonly emit: (event: GameplayEvent) => void = () => {}, private readonly random: () => number = Math.random) {}

  start(): void {
    this.reset();
    this.alive = true;
    this.generateAhead();
  }

  /** Abandon the run without a death event; title transitions cannot consume credit. */
  reset(): void {
    this.time = 0;
    this.theta = START_ANGLE;
    this.radius = INNER_RADIUS;
    this.lane = 'inner';
    this.alive = false;
    this.points = this.combo = this.maxCombo = this.passed = this.shardCount = this.nearMisses = 0;
    this.lastNearTime = -Infinity;
    this.switchTime = SWITCH_SECONDS;
    this.switchFrom = INNER_RADIUS;
    this.nextAngle = START_ANGLE + 5.3;
    this.nextId = 0;
    this.nextLane = 'inner';
    this.patternIndex = 0;
    this.activePattern = ['inner'];
    this.ending = null;
    this.obstacles.length = this.shards.length = 0;
  }

  shift(): boolean {
    if (!this.alive || this.switchTime < SWITCH_SECONDS) return false;
    const source = this.lane;
    // A late switch must leave the actual danger lane just before its leading edge.
    const threat = this.obstacles.find(o => !o.passed && o.lane === source && o.angle - o.halfWidth - ANGULAR_PADDING > this.theta);
    if (threat) {
      const untilImpact = (threat.angle - threat.halfWidth - ANGULAR_PADDING - this.theta) / speedAt(this.time);
      if (untilImpact <= 0.32 && untilImpact >= 0.065) threat.nearCandidate = true;
    }
    this.switchFrom = this.radius;
    this.lane = source === 'inner' ? 'outer' : 'inner';
    this.switchTime = 0;
    this.emit({ type: 'shift' });
    return true;
  }

  step(seconds: number): void {
    if (!this.alive || !Number.isFinite(seconds) || seconds <= 0) return;
    // Real elapsed time is deliberately capped after a long frame; no invisible catch-up deaths.
    let remaining = Math.min(seconds, 0.05);
    while (remaining > 0 && this.alive) {
      const dt = Math.min(remaining, 1 / 240);
      remaining -= dt;
      const oldTheta = this.theta;
      const oldRadius = this.radius;
      this.time += dt;
      this.theta += speedAt(this.time) * dt;
      this.switchTime = Math.min(SWITCH_SECONDS, this.switchTime + dt);
      const t = this.switchTime / SWITCH_SECONDS;
      const ease = t * t * (3 - 2 * t);
      const target = this.lane === 'inner' ? INNER_RADIUS : OUTER_RADIUS;
      this.radius = this.switchFrom + (target - this.switchFrom) * ease;
      for (const obstacle of this.obstacles) {
        if (obstacle.passed) continue;
        const obstacleRadius = obstacle.lane === 'inner' ? INNER_RADIUS : OUTER_RADIUS;
        // Swept radial/angular bounds across tiny substeps cover the entire interpolation path.
        const angularOverlap = this.theta + ANGULAR_PADDING >= obstacle.angle - obstacle.halfWidth
          && oldTheta - ANGULAR_PADDING <= obstacle.angle + obstacle.halfWidth;
        const radialOverlap = Math.max(oldRadius, this.radius) + PLAYER_RADIUS >= obstacleRadius - HAZARD_DEPTH
          && Math.min(oldRadius, this.radius) - PLAYER_RADIUS <= obstacleRadius + HAZARD_DEPTH;
        if (angularOverlap && radialOverlap) {
          this.finish();
          break;
        }
        if (this.theta - ANGULAR_PADDING > obstacle.angle + obstacle.halfWidth) {
          obstacle.passed = true;
          this.passed++;
          this.points += 30;
          this.emit({ type: 'pass', points: 30 });
          if (obstacle.nearCandidate) {
            this.combo++;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.nearMisses++;
            this.lastNearTime = this.time;
            const points = 100 * Math.min(this.combo, 8);
            this.points += points;
            this.emit({ type: 'near_miss', points, combo: this.combo });
          }
        }
      }
      if (!this.alive) break;
      for (const shard of this.shards) {
        if (shard.collected) continue;
        const shardRadius = shard.lane === 'inner' ? INNER_RADIUS : OUTER_RADIUS;
        if (Math.abs(this.theta - shard.angle) < 0.075 && Math.abs(this.radius - shardRadius) < 17) {
          shard.collected = true;
          this.shardCount++;
          this.points += 60;
          this.emit({ type: 'shard', points: 60 });
        }
      }
      if (this.combo && this.time - this.lastNearTime > 7) this.combo = 0;
      this.generateAhead();
    }
    while (this.obstacles[0]?.angle < this.theta - 0.6) this.obstacles.shift();
    while (this.shards[0]?.angle < this.theta - 0.6) this.shards.shift();
  }

  snapshot(): RunSnapshot {
    return {
      time: this.time, score: Math.floor(this.time * 10) + this.points,
      combo: this.combo, maxCombo: this.maxCombo, lane: this.lane,
      difficulty: difficultyAt(this.time), speed: speedAt(this.time),
      shifting: this.switchTime < SWITCH_SECONDS, alive: this.alive,
    };
  }

  result(): RunResult | null { return this.ending; }

  private generateAhead(): void {
    // Each template is a sequence of single-lane blockers; no overlapping double blockage.
    // Include one future obstacle beyond the visible horizon so template boundaries stay predictable.
    while (this.nextAngle < this.theta + 4.3) {
      if (this.patternIndex >= this.activePattern.length) {
        const opposite: Lane = this.nextLane === 'inner' ? 'outer' : 'inner';
        const options: Lane[][] = this.time < 10
          ? [[opposite]]
          : this.time < 30
            ? [[opposite], [this.nextLane, opposite]]
            : this.time < 60
              ? [[opposite, this.nextLane], [this.nextLane, opposite], [opposite, opposite, this.nextLane]]
              : [[opposite, this.nextLane, opposite], [this.nextLane, opposite, opposite], [opposite, opposite, this.nextLane, opposite]];
        this.activePattern = options[Math.min(options.length - 1, Math.floor(this.random() * options.length))];
        this.patternIndex = 0;
      }
      const lane = this.activePattern[this.patternIndex++];
      const halfWidth = this.time < 10 ? 0.085 : this.time < 60 ? 0.10 : 0.12;
      const previous = this.obstacles[this.obstacles.length - 1];
      // Fail closed if a future template change violates safety. Current minimum gap is 1.28 rad.
      if (previous && !validatePattern([
        { lane: previous.lane, offset: previous.angle, halfWidth: previous.halfWidth },
        { lane, offset: this.nextAngle, halfWidth },
      ])) throw new Error('Unsafe orbit pattern rejected');
      this.obstacles.push({ id: this.nextId++, angle: this.nextAngle, lane, halfWidth, passed: false, nearCandidate: false });
      // Some shards entice entry into the blocked lane, but sit well before the required escape.
      if (this.nextId > 1 && this.nextId % 3 === 0) {
        this.shards.push({ angle: this.nextAngle - 0.68, lane, collected: false });
      } else {
        this.shards.push({ angle: this.nextAngle, lane: lane === 'inner' ? 'outer' : 'inner', collected: false });
      }
      this.nextLane = lane;
      const baseGap = this.time < 10 ? 1.92 : this.time < 30 ? 1.64 : this.time < 60 ? 1.46 : this.time < 90 ? 1.36 : 1.28;
      const breathingRoom = this.time >= 30 && this.patternIndex === this.activePattern.length ? 0.36 : 0;
      this.nextAngle += baseGap + breathingRoom;
    }
  }

  private finish(): void {
    if (!this.alive) return;
    this.alive = false;
    this.ending = {
      score: this.snapshot().score, time: this.time, maxCombo: this.maxCombo,
      passed: this.passed, shards: this.shardCount, nearMisses: this.nearMisses,
      reason: '障害物に接触しました',
    };
    this.emit({ type: 'death' });
  }
}
