export type Lane = 0 | 1 | 2;
export type Direction = -1 | 1;
export type EnemyType = 'A' | 'B' | 'C' | 'D';
export type WorkdayMilestone = 'company' | 'bike';
export type WorkdayChoice = 'office' | 'journey' | 'safe_exit' | 'walk' | 'bike';
export type WorkdayMode = 'commute' | 'journey' | 'bike';
export type WorkdayOutcome = 'collision' | 'clear' | 'safe_exit';
export const MOVE_SECONDS = 0.13;
export const PLAYER_Y = 494;
export const PREVIEW_SECONDS = 3.9;
/** NICE eligibility: a real move starts in the same enemy's ±27px horizontal contact band,
 * 0 < lead <= .65s before its existing ±32px vertical collision zone begins.
 * Actual movement must cross out before entry, without re-entering that band.
 * The run must survive until every enemy in the wave passes PLAYER_Y+35; one award per wave.
 * Spawn, movement, the swept collision test and the RNG sequence are independent of this tracker.
 */
export const NICE_DODGE_WINDOW_SECONDS = 0.65;
export const laneX = (lane: number): number => 180 + lane * 120;
export const speedAt = (distance: number): number => 9 + Math.min(1000, distance) * 0.003;
export const districtAt = (distance: number): string => distance > 1000 ? distance < 1600 ? '郊外' : '知らない街' : ['住宅街', '商店街', '駅周辺', 'オフィス街'][Math.min(3, Math.floor(distance / 250))];
export interface Wave {
  id: number;
  type: EnemyType;
  encounterTime: number;
  blockedLanes: Lane[];
  safeLane: Lane;
}
export interface Enemy {
  id: number;
  waveId: number;
  type: EnemyType;
  fromLane: Lane;
  finalLane: Lane;
  x: number;
  y: number;
  encounterTime: number;
  warningStart: number;
  changeStart: number;
  changeEnd: number;
  feintDirection: Direction;
  passed: boolean;
}
export interface WorkdaySnapshot {
  distance: number;
  time: number;
  worldTime: number;
  pending: WorkdayMilestone | null;
  mode: WorkdayMode;
  travel: 'walk' | 'bike';
  speedMultiplier: 1 | 2;
  lane: Lane;
  targetLane: Lane;
  moving: boolean;
  queuedDirection: Direction | null;
  dodges: number;
  alive: boolean;
  outcome: WorkdayOutcome | null;
  district: string;
  difficulty: 'TUTORIAL' | 'EASY' | 'NORMAL' | 'HARD';
}
export interface WorkdayResult { distance: number; time: number; worldTime: number; mode: WorkdayMode; travel: 'walk' | 'bike'; outcome: WorkdayOutcome; cleared: boolean; dodges: number; bonusPercent: number; score: number; reason: string }
export type WorkdayEvent = { type: 'move' | 'dodge' | 'collision' | 'clear' | 'safe_exit' | 'district' }
  | { type: 'milestone'; milestone: WorkdayMilestone }
  | { type: 'choice'; milestone: WorkdayMilestone; choice: WorkdayChoice };
const ease = (t: number): number => t * t * (3 - 2 * t);
const clamp01 = (t: number): number => Math.max(0, Math.min(1, t));

/** Verify a visible route with time for a reaction and TWO adjacent lane moves between waves. */
export function validateWaves(waves: readonly Pick<Wave, 'encounterTime' | 'blockedLanes'>[], speedMultiplier: 1 | 2 = 1): boolean {
  for (let i = 0; i < waves.length; i++) {
    const wave = waves[i];
    if (!Number.isFinite(wave.encounterTime) || wave.blockedLanes.length < 1 || wave.blockedLanes.length > 2
      || new Set(wave.blockedLanes).size !== wave.blockedLanes.length
      || wave.blockedLanes.some(lane => lane < 0 || lane > 2 || !Number.isInteger(lane))) return false;
    // Opponent occupies the player row for ~0.5s. Keep .6s reaction + two complete moves.
    if (i && wave.encounterTime - waves[i - 1].encounterTime < 0.5 + 0.6 * speedMultiplier + MOVE_SECONDS * 2) return false;
  }
  return true;
}

export class WorkdayRun {
  time = 0;
  worldTime = 0;
  distance = 0;
  pending: WorkdayMilestone | null = null;
  mode: WorkdayMode = 'commute';
  playerX = laneX(1);
  lane: Lane = 1;
  targetLane: Lane = 1;
  alive = false;
  queuedDirection: Direction | null = null;
  readonly enemies: Enemy[] = [];
  readonly waves: Wave[] = [];
  private moveTime = MOVE_SECONDS;
  private moveFrom = laneX(1);
  private dodges = 0;
  private niceCandidates = new Map<number, { waveId: number; escaped: boolean }>();
  private pendingNiceWaves = new Set<number>();
  private awardedNiceWaves = new Set<number>();
  private nextEncounter = 9;
  private nextWaveId = 0;
  private nextEnemyId = 0;
  private lastFeintWave = -8;
  private previousSafeLane: Lane = 1;
  private districtIndex = 0;
  private ending: WorkdayResult | null = null;
  private companyOffered = false;
  private bikeOffered = false;

  constructor(private readonly emit: (event: WorkdayEvent) => void = () => {}, private readonly random: () => number = Math.random) {}

  start(): void { this.reset(); this.alive = true; this.generateAhead(true); }
  reset(): void {
    this.time = this.worldTime = this.distance = 0;
    this.pending = null; this.mode = 'commute'; this.companyOffered = this.bikeOffered = false;
    this.playerX = this.moveFrom = laneX(1);
    this.lane = this.targetLane = 1;
    this.alive = false;
    this.queuedDirection = null;
    this.moveTime = MOVE_SECONDS;
    this.dodges = 0;
    this.niceCandidates.clear(); this.pendingNiceWaves.clear(); this.awardedNiceWaves.clear();
    this.nextEncounter = 9;
    this.nextWaveId = this.nextEnemyId = 0;
    this.lastFeintWave = -8;
    this.previousSafeLane = 1;
    this.districtIndex = 0;
    this.ending = null;
    this.enemies.length = this.waves.length = 0;
  }

  move(direction: Direction): boolean {
    if (!this.alive || this.pending || (direction !== -1 && direction !== 1)) return false;
    const next = this.targetLane + direction;
    if (next < 0 || next > 2) return false;
    if (this.moveTime < MOVE_SECONDS) {
      // Only one pending step: double tap crosses two lanes naturally, never teleports.
      if (this.queuedDirection !== null) return false;
      this.queuedDirection = direction;
      return true;
    }
    this.beginMove(direction);
    return true;
  }

  get speedMultiplier(): 1 | 2 { return this.mode === 'bike' ? 2 : 1; }
  choose(choice: WorkdayChoice): boolean {
    const milestone = this.pending;
    if (!this.alive || !milestone || (milestone === 'company' ? choice !== 'office' && choice !== 'journey' : choice !== 'safe_exit' && choice !== 'walk' && choice !== 'bike')) return false;
    this.pending = null; this.queuedDirection = null;
    this.emit({ type: 'choice', milestone, choice });
    if (choice === 'office') this.finish('clear');
    else if (choice === 'safe_exit') this.finish('safe_exit');
    else {
      this.mode = choice === 'bike' ? 'bike' : 'journey';
      this.depart();
    }
    return true;
  }

  /** A checkpoint starts a fresh visible road segment, preserving player position, RNG state,
   * IDs, distance, NICE count and both clocks. Buffered hazards and unfinished NICE claims
   * are discarded, never rewarded. First collision entry is 3.666 world seconds away:
   * 3.666 real seconds walking or 1.833 riding. No collision immunity is used.
   */
  private depart(): void {
    this.enemies.length = this.waves.length = 0;
    this.niceCandidates.clear(); this.pendingNiceWaves.clear(); this.awardedNiceWaves.clear();
    this.nextEncounter = this.worldTime + PREVIEW_SECONDS;
    this.generateAhead();
  }

  private offer(milestone: WorkdayMilestone): void {
    this.pending = milestone; this.queuedDirection = null;
    if (milestone === 'company') this.companyOffered = true;
    else this.bikeOffered = true;
    this.emit({ type: 'milestone', milestone });
  }

  private beginMove(direction: Direction): void {
    // Arm only a real threatening enemy, within .65s of the unchanged collision-zone entry.
    // Late-window B/C enemies have finished their lateral change, so idle avoidance cannot qualify.
    for (const enemy of this.enemies) {
      const lead = enemy.encounterTime - this.worldTime - 32 * PREVIEW_SECONDS / (PLAYER_Y + 40);
      if (!enemy.passed && !this.awardedNiceWaves.has(enemy.waveId) && Math.abs(this.playerX - enemy.x) <= 27
        && lead > 0 && lead <= NICE_DODGE_WINDOW_SECONDS && this.worldTime >= enemy.changeEnd) {
        this.niceCandidates.set(enemy.id, { waveId: enemy.waveId, escaped: false });
      }
    }
    this.moveFrom = this.playerX;
    this.targetLane = (this.lane + direction) as Lane;
    this.moveTime = 0;
    this.emit({ type: 'move' });
  }

  step(seconds: number): void {
    if (!this.alive || this.pending || !Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = Math.min(0.05, seconds);
    while (remaining > 0 && this.alive && !this.pending) {
      const dt = Math.min(remaining, 1 / 240);
      remaining -= dt;
      const previousPlayerX = this.playerX;
      this.time += dt;
      const worldDt = dt * this.speedMultiplier;
      this.worldTime += worldDt;
      const nextMilestone = !this.companyOffered ? 1000 : !this.bikeOffered ? 2000 : Infinity;
      this.distance = Math.min(nextMilestone, this.distance + speedAt(this.distance) * worldDt);
      this.moveTime = Math.min(MOVE_SECONDS, this.moveTime + worldDt);
      this.playerX = this.moveFrom + (laneX(this.targetLane) - this.moveFrom) * ease(this.moveTime / MOVE_SECONDS);
      if (this.moveTime === MOVE_SECONDS) {
        this.lane = this.targetLane;
        if (this.queuedDirection !== null) {
          const direction = this.queuedDirection;
          this.queuedDirection = null;
          if (this.lane + direction >= 0 && this.lane + direction <= 2) this.beginMove(direction);
        }
      }
      for (const enemy of this.enemies) {
        const oldX = enemy.x;
        const oldY = enemy.y;
        this.positionEnemy(enemy);
        if (enemy.passed) continue;
        const xCross = Math.min(previousPlayerX, this.playerX) - 27 <= Math.max(oldX, enemy.x)
          && Math.max(previousPlayerX, this.playerX) + 27 >= Math.min(oldX, enemy.x);
        const yCross = Math.min(oldY, enemy.y) - 32 <= PLAYER_Y && Math.max(oldY, enemy.y) + 32 >= PLAYER_Y;
        if (xCross && yCross) { this.finish('collision'); break; }
        const nice = this.niceCandidates.get(enemy.id);
        if (nice) {
          const beforeInside = Math.abs(previousPlayerX - oldX) <= 27;
          const afterInside = Math.abs(this.playerX - enemy.x) <= 27;
          if (nice.escaped && afterInside) this.niceCandidates.delete(enemy.id);
          else if (beforeInside && !afterInside && enemy.y < PLAYER_Y - 32) nice.escaped = true;
        }
        if (enemy.y > PLAYER_Y + 35) {
          enemy.passed = true;
          if (this.niceCandidates.get(enemy.id)?.escaped) this.pendingNiceWaves.add(enemy.waveId);
          this.niceCandidates.delete(enemy.id);
        }
      }
      if (!this.alive) break;
      // Wait for the entire wave to pass; a collision can never earn a same-frame bonus.
      for (const waveId of this.pendingNiceWaves) {
        if (this.enemies.some(enemy => enemy.waveId === waveId && !enemy.passed)) continue;
        if (!this.awardedNiceWaves.has(waveId)) {
          this.awardedNiceWaves.add(waveId); this.dodges++; this.emit({ type: 'dodge' });
        }
        this.pendingNiceWaves.delete(waveId);
      }
      if (!this.companyOffered && this.distance >= 1000) { this.offer('company'); break; }
      if (!this.bikeOffered && this.distance >= 2000) { this.offer('bike'); break; }
      const newDistrict = Math.min(3, Math.floor(this.distance / 250));
      if (newDistrict !== this.districtIndex) { this.districtIndex = newDistrict; this.emit({ type: 'district' }); }
      this.generateAhead();
    }
    while (this.enemies[0] && this.enemies[0].y > 665) { const enemy = this.enemies.shift()!; this.niceCandidates.delete(enemy.id); }
    while (this.waves[0] && this.waves[0].encounterTime < this.worldTime - 1.5) { const wave = this.waves.shift()!; this.awardedNiceWaves.delete(wave.id); this.pendingNiceWaves.delete(wave.id); }
  }

  snapshot(): WorkdaySnapshot {
    return {
      distance: Math.floor(this.distance), time: this.time, worldTime: this.worldTime, pending: this.pending, mode: this.mode,
      travel: this.mode === 'bike' ? 'bike' : 'walk', speedMultiplier: this.speedMultiplier, lane: this.lane, targetLane: this.targetLane,
      moving: this.moveTime < MOVE_SECONDS, queuedDirection: this.queuedDirection, dodges: this.dodges, alive: this.alive,
      outcome: this.ending?.outcome ?? null,
      district: districtAt(this.distance), difficulty: this.distance < 150 ? 'TUTORIAL' : this.distance < 400 ? 'EASY' : this.distance < 700 ? 'NORMAL' : 'HARD',
    };
  }
  result(): WorkdayResult | null { return this.ending ? { ...this.ending } : null; }
  inspection() {
    return { ...this.snapshot(), playerX: this.playerX, playerY: PLAYER_Y,
      enemies: this.enemies.map(e => ({ ...e })), waves: this.waves.map(w => ({ ...w, blockedLanes: [...w.blockedLanes] })) };
  }

  private positionEnemy(enemy: Enemy): void {
    enemy.y = PLAYER_Y + (this.worldTime - enemy.encounterTime) * (PLAYER_Y + 40) / PREVIEW_SECONDS;
    if (enemy.type === 'B') {
      const t = ease(clamp01((this.worldTime - enemy.changeStart) / (enemy.changeEnd - enemy.changeStart)));
      enemy.x = laneX(enemy.fromLane) + (laneX(enemy.finalLane) - laneX(enemy.fromLane)) * t;
    } else if (enemy.type === 'C') {
      const t = clamp01((this.worldTime - enemy.changeStart) / (enemy.changeEnd - enemy.changeStart));
      enemy.x = laneX(enemy.fromLane) + Math.sin(t * Math.PI) * 25 * enemy.feintDirection;
    } else enemy.x = laneX(enemy.finalLane);
  }

  private generateAhead(first = false): void {
    while (this.nextEncounter <= this.worldTime + (first ? 9.01 : 5.8)) {
      const id = this.nextWaveId++;
      const roll = this.random();
      let type: EnemyType = 'A';
      if (this.distance >= 150) {
        if (roll < (this.distance >= 700 ? 0.38 : 0.22)) type = 'D';
        else if (roll < 0.57) type = 'B';
        else if (this.distance >= 400 && roll > 0.89 && id - this.lastFeintWave >= 5) { type = 'C'; this.lastFeintWave = id; }
      }
      const blocked: Lane = id === 0 ? 1 : Math.min(2, Math.floor(this.random() * 3)) as Lane;
      const blockedLanes: Lane[] = type === 'D'
        ? ([0, 1, 2] as Lane[]).filter(lane => lane !== blocked)
        : [blocked];
      const safeLanes = ([0, 1, 2] as Lane[]).filter(lane => !blockedLanes.includes(lane));
      const safeLane = safeLanes.reduce((best, lane) => Math.abs(lane - this.previousSafeLane) < Math.abs(best - this.previousSafeLane) ? lane : best, safeLanes[0]);
      const wave: Wave = { id, type, encounterTime: this.nextEncounter, blockedLanes, safeLane };
      const previous = this.waves[this.waves.length - 1];
      if (!validateWaves(previous ? [previous, wave] : [wave], this.speedMultiplier)) throw new Error('Unsafe commute wave rejected');
      this.waves.push(wave);
      for (const finalLane of blockedLanes) {
        const adjacent = finalLane === 1 ? (this.random() < 0.5 ? 0 : 2) : 1;
        const fromLane = type === 'B' ? adjacent as Lane : finalLane;
        const enemy: Enemy = {
          id: this.nextEnemyId++, waveId: id, type, fromLane, finalLane,
          x: laneX(fromLane), y: -40, encounterTime: this.nextEncounter,
          warningStart: this.nextEncounter - (type === 'B' ? 2.7 : 2.5),
          changeStart: this.nextEncounter - (type === 'B' ? 1.5 : 1.9),
          changeEnd: this.nextEncounter - (type === 'B' ? 1.26 : 1.2),
          feintDirection: finalLane === 2 ? -1 : 1, passed: false,
        };
        this.positionEnemy(enemy);
        this.enemies.push(enemy);
      }
      this.previousSafeLane = safeLane;
      this.nextEncounter += this.distance < 150 ? 3.1 : this.distance < 400 ? 2.85 : this.distance < 700 ? 2.55 : 2.25;
    }
  }

  private finish(outcome: WorkdayOutcome): void {
    if (!this.alive) return;
    this.alive = false;
    this.queuedDirection = null; this.pending = null;
    this.ending = { ...calculateWorkdayScore(Math.floor(this.distance), this.dodges), time: this.time, worldTime: this.worldTime,
      mode: this.mode, travel: this.mode === 'bike' ? 'bike' : 'walk', outcome, cleared: outcome === 'clear',
      reason: outcome === 'clear' ? '出社成功！' : outcome === 'safe_exit' ? '旅はここまで。月曜日は、まだ長い。' : this.mode === 'bike' ? '45歳、旅の途中でぶつかりました。' : 'ぶつかって、出勤失敗……' };
    this.emit({ type: outcome });
  }
}
import { calculateWorkdayScore } from './scoring';
