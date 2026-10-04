import type { DeskKind, DeskLayout, DeskObject, StampChoice, StampEvent, StampInspection, StampRequest, StampResult, StampSnapshot } from './contracts';

export const FEEDBACK_SECONDS = 0.3;
export const MAX_CLUTTER_LEVEL = 24;
export const deadlineAt = (correct: number): number => Math.max(4.5, 9 - Math.max(0, correct) * 0.08);
export const matchesRequest = (object: DeskObject, request: StampRequest): boolean => object.kind === 'stamp' && object.color === request.color && object.shape === request.shape;
const variants: Pick<DeskObject, 'color' | 'shape'>[] = [{ color: 'red', shape: 'round' }, { color: 'blue', shape: 'round' }, { color: 'red', shape: 'square' }, { color: 'blue', shape: 'square' }];
const tools: DeskKind[] = ['paper', 'pen', 'clip', 'memo', 'calculator', 'cup', 'stapler'];
const requestFor = (variant: Pick<DeskObject, 'color' | 'shape'>): StampRequest => ({ color: variant.color!, shape: variant.shape!, text: `${variant.color === 'red' ? '赤い' : '青い'}${variant.shape === 'round' ? '丸' : '四角'}印を押してください` });

/** Coordinates are actual CSS pixels. Buttons stay >=64x72 even on narrow phones; artwork rotates inside them. */
export function calculateDeskLayout(objects: readonly DeskObject[], availableWidth: number): DeskLayout {
  const width = Math.max(92, Number.isFinite(availableWidth) ? availableWidth : 300);
  const desktop = width >= 600; const hitWidth = desktop ? 80 : 64; const hitHeight = desktop ? 96 : 72;
  const padding = desktop ? 10 : 6;
  // Count the final column without an unnecessary trailing gap: four 64px targets fit at 280px.
  const pitchY = hitHeight + 8; const columns = Math.max(1, Math.min(6, Math.floor((width - padding * 2 + 4) / (hitWidth + 4))));
  const pitchX = (width - padding * 2) / columns; const rows = Math.ceil(objects.length / columns);
  const jitterX = Math.min(12, Math.max(0, (pitchX - hitWidth - 2) / 2));
  const bounds = objects.map((object, index) => {
    const column = index % columns; const row = Math.floor(index / columns);
    const seed = (object.id * 37 + object.placement * 19) % 101;
    return { id: object.id, left: padding + column * pitchX + (pitchX - hitWidth) / 2 + (seed / 100 * 2 - 1) * jitterX,
      top: 10 + row * pitchY + ((seed * 7) % 5 - 2), width: hitWidth, height: hitHeight };
  });
  return { width, height: Math.max(100, rows * pitchY + 20), bounds };
}

export class StampRun {
  private correct = 0;
  private score = 0;
  private time = 0;
  private alive = false;
  private phase: StampSnapshot['phase'] = 'searching';
  private pending: 'cleanup' | null = null;
  private multiplier = 1;
  private clutterLevel = 0;
  private phaseTime = 0;
  private roundId = 0;
  private nextObjectId = 0;
  private request = requestFor(variants[0]);
  private objects: DeskObject[] = [];
  private lastPicked: number | null = null;
  private lastPoints = 0;
  private ending: StampResult | null = null;
  constructor(private readonly emit: (event: StampEvent) => void = () => {}, private readonly random: () => number = Math.random) { this.reset(); }
  reset(): void {
    this.correct = this.score = this.time = this.phaseTime = this.roundId = this.nextObjectId = this.clutterLevel = this.lastPoints = 0;
    this.alive = false; this.phase = 'searching'; this.pending = null; this.multiplier = 1; this.lastPicked = null; this.ending = null;
    this.request = requestFor(variants[0]); this.generate(() => 0.5);
  }
  start(): void { this.reset(); this.alive = true; this.nextRound(); }
  pick(id: number): boolean {
    if (!this.alive || this.pending || this.phase !== 'searching') return false;
    const object = this.objects.find(o => o.id === id); if (!object) return false;
    this.lastPicked = id;
    if (!matchesRequest(object, this.request)) { this.finish('wrong', object); return true; }
    const remaining = Math.max(0, deadlineAt(this.correct) - this.phaseTime);
    const base = 100 + Math.floor(50 * remaining / deadlineAt(this.correct));
    this.lastPoints = Math.round(base * this.multiplier); this.score += this.lastPoints; this.correct++;
    this.clutterLevel = Math.min(MAX_CLUTTER_LEVEL, this.clutterLevel + 1); this.phase = 'feedback'; this.phaseTime = 0;
    this.emit({ type: 'correct', objectId: id, points: this.lastPoints, correct: this.correct }); return true;
  }
  choose(choice: StampChoice): boolean {
    if (!this.alive || !this.pending || (choice !== 'clean' && choice !== 'continue')) return false;
    this.pending = null;
    if (choice === 'clean') { this.clutterLevel = Math.max(0, this.clutterLevel - 6); this.multiplier = 1; }
    else { this.clutterLevel = Math.min(MAX_CLUTTER_LEVEL, this.clutterLevel + 3); this.multiplier = Math.min(3, this.multiplier + 0.25); }
    this.emit({ type: 'choice', milestone: 'cleanup', choice, multiplier: this.multiplier, clutterLevel: this.clutterLevel }); this.nextRound(); return true;
  }
  step(seconds: number): void {
    if (!this.alive || this.pending || !Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = Math.min(0.05, seconds);
    while (remaining > 1e-10 && this.alive && !this.pending) {
      const dt = Math.min(1 / 240, remaining); remaining -= dt; this.time += dt; this.phaseTime += dt;
      if (this.phase === 'searching' && this.phaseTime >= deadlineAt(this.correct)) this.finish('timeout', null);
      else if (this.phase === 'feedback' && this.phaseTime >= FEEDBACK_SECONDS) {
        if (this.correct % 5 === 0) { this.phase = 'choice'; this.pending = 'cleanup'; this.emit({ type: 'milestone', milestone: 'cleanup', correct: this.correct }); }
        else this.nextRound();
      }
    }
  }
  private generate(random: () => number): void {
    const count = 4 + (this.clutterLevel >= 8 ? 1 : 0) + (this.clutterLevel >= 16 ? 1 : 0);
    const toolCount = Math.min(6, 3 + Math.floor(this.clutterLevel / 3));
    const objects: DeskObject[] = [];
    for (let i = 0; i < count; i++) {
      const variant = variants[i < 4 ? i : Math.min(3, Math.floor(random() * 4))];
      objects.push({ id: this.nextObjectId++, kind: 'stamp', ...variant, rotation: (random() * 2 - 1) * 6, stackCount: 1, placement: i });
    }
    for (let i = 0; i < toolCount; i++) objects.push({ id: this.nextObjectId++, kind: tools[(i + this.roundId) % tools.length], color: null, shape: null,
      rotation: (random() * 2 - 1) * 6, stackCount: Math.min(4, 1 + Math.floor(Math.max(0, this.clutterLevel - 12) / 4)), placement: count + i });
    for (let i = objects.length - 1; i > 0; i--) { const j = Math.min(i, Math.floor(random() * (i + 1))); [objects[i], objects[j]] = [objects[j], objects[i]]; }
    this.objects = objects;
  }
  private nextRound(): void {
    this.roundId++; this.phase = 'searching'; this.phaseTime = 0; this.lastPicked = null; this.lastPoints = 0;
    this.request = requestFor(variants[Math.min(3, Math.floor(this.random() * 4))]); this.generate(this.random);
  }
  private finish(outcome: 'wrong' | 'timeout', picked: DeskObject | null): void {
    if (!this.alive) return;
    this.alive = false; this.phase = 'ended';
    this.ending = { round: this.correct + 1, correct: this.correct, score: this.score, time: this.time, multiplier: this.multiplier, clutterLevel: this.clutterLevel,
      outcome, reason: outcome === 'timeout' ? `時間切れ。${this.request.text}` : `押した物が違います。${this.request.text}`,
      request: { ...this.request }, picked: picked ? { ...picked } : null, matchingIds: this.objects.filter(o => matchesRequest(o, this.request)).map(o => o.id) };
    this.emit(outcome === 'wrong' ? { type: 'mistake', objectId: picked!.id } : { type: 'timeout' });
  }
  snapshot(): StampSnapshot {
    return { round: this.correct + 1, roundId: this.roundId, correct: this.correct, score: this.score, time: this.time, alive: this.alive, phase: this.phase, pending: this.pending,
      multiplier: this.multiplier, clutterLevel: this.clutterLevel, clutterCount: this.objects.filter(o => o.kind !== 'stamp').reduce((sum, o) => sum + o.stackCount, 0),
      objectCount: this.objects.reduce((sum, o) => sum + o.stackCount, 0), request: { ...this.request }, objects: this.objects.map(o => ({ ...o })),
      remaining: this.phase === 'searching' ? Math.max(0, deadlineAt(this.correct) - this.phaseTime) : 0, deadline: deadlineAt(this.correct), lastPicked: this.lastPicked, lastPoints: this.lastPoints };
  }
  inspection(): StampInspection { return { ...this.snapshot(), matchingIds: this.objects.filter(o => matchesRequest(o, this.request)).map(o => o.id), phaseTime: this.phaseTime, layout: null }; }
  result(): StampResult | null { return this.ending ? { ...this.ending, request: { ...this.ending.request }, picked: this.ending.picked ? { ...this.ending.picked } : null, matchingIds: [...this.ending.matchingIds] } : null; }
}
