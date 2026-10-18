export type Lane = 0 | 1 | 2;
export const WET_LIMIT = 3;
export const SPEED = 2;
export const RUN_SECONDS = 90;
export const KINDS = [
  { id: 'elegant', name: 'おねぇさん', points: 150, sprite: 'elegant' },
  { id: 'tough', name: 'こわもて', points: -120, sprite: 'tough' },
  { id: 'office-man', name: '会社員', points: 20, sprite: 'office-man' },
  { id: 'office-woman', name: '会社員', points: 30, sprite: 'office-woman' },
  { id: 'student', name: '学生', points: 50, sprite: 'student' },
  { id: 'elderly', name: 'おじいさん', points: 10, sprite: 'elderly' },
  { id: 'family', name: '親子', points: 90, sprite: 'family' },
  { id: 'rare', name: '芸術家', points: 250, sprite: 'rare' },
] as const;
export interface Pedestrian { id: string; lane: Lane; x: number; kind: number; radius: number; direction: 1 | -1; guide: boolean }
const ROUTE: readonly Lane[] = [1, 0, 1, 2, 1, 2, 0, 1];
/** A chain of co-walking umbrellas overlaps1.6s; ordinary traffic adds choices. */
export function pedestriansAt(seconds: number): Pedestrian[] {
  const result: Pedestrian[] = [], phase = Math.floor(seconds / 3);
  for (let i = Math.max(0, phase - 1); i <= phase + 1; i++) {
    if (seconds >= i * 3 - .8 && seconds < (i + 1) * 3 + .8) result.push({ id: `route-${i}`, lane: ROUTE[i % ROUTE.length], x: SPEED * seconds, kind: (i * 3) % KINDS.length, radius: .62, direction: 1, guide: true });
  }
  const cohort = Math.floor(seconds / .85);
  for (let i = Math.max(0, cohort - 14); i <= cohort; i++) {
    const born = i * .85, age = seconds - born, direction = i % 3 === 0 ? 1 : -1;
    const x = SPEED * born + 8 + direction * (.65 + (i % 4) * .12) * age;
    if (x - SPEED * seconds < -7 || x - SPEED * seconds > 13) continue;
    result.push({ id: `crowd-${i}`, lane: (i % 3) as Lane, x, kind: (i * 5 + 2) % KINDS.length, radius: .62, direction, guide: false });
  }
  return result;
}
export function shelterAt(lane: Lane, x: number, people: readonly Pedestrian[]): Pedestrian | null {
  return people.filter(p => p.lane === lane && Math.abs(p.x - x) <= p.radius + 1e-9)
    .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x) || a.id.localeCompare(b.id))[0] ?? null;
}
export class RainJourney {
  elapsed = 0; wet = 0; lane: Lane = 1; score = 0; paused = false;
  outcome: 'playing' | 'won' | 'lost' = 'playing'; entries = 0; lastEntry = '';
  private visited = new Set<string>();
  constructor(readonly duration = RUN_SECONDS, readonly practice = false) {
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('Positive duration required');
  }
  get distance(): number { return this.elapsed * SPEED; }
  get remaining(): number { return Math.max(0, (this.duration - this.elapsed) * SPEED); }
  get people(): Pedestrian[] { return pedestriansAt(this.elapsed); }
  get shelter(): Pedestrian | null { return shelterAt(this.lane, this.distance, this.people); }
  move(lane: number): boolean {
    if (this.paused || this.outcome !== 'playing' || !Number.isInteger(lane) || lane < 0 || lane > 2) return false;
    this.lane = lane as Lane; return true;
  }
  advance(seconds: number): void {
    if (this.paused || this.outcome !== 'playing' || !Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = Math.min(seconds, this.duration - this.elapsed);
    // Integrate all elapsed foreground time; no silent frame-time truncation.
    while (remaining > 1e-10 && this.outcome === 'playing') {
      const step = Math.min(1 / 120, remaining);
      const t = this.elapsed + step / 2;
      const owner = shelterAt(this.lane, SPEED * t, pedestriansAt(t));
      const dt = owner ? step : Math.min(step, WET_LIMIT - this.wet);
      if (!owner) this.wet = Math.min(WET_LIMIT, this.wet + dt);
      else if (!this.visited.has(owner.id)) {
        this.visited.add(owner.id); this.entries++;
        const kind = KINDS[owner.kind]; if (!this.practice) this.score += kind.points;
        this.lastEntry = `${kind.name} ${kind.points >= 0 ? '+' : ''}${kind.points}`;
      }
      this.elapsed += dt; remaining -= dt;
      if (this.wet >= WET_LIMIT - 1e-9) { this.wet = WET_LIMIT; this.outcome = 'lost'; }
      else if (this.elapsed >= this.duration - 1e-9) { this.elapsed = this.duration; this.outcome = 'won'; }
    }
  }
}
