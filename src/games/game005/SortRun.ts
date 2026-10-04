import type { SortDimension, SortEvent, SortInspection, SortParcel, SortPhase, SortResult, SortRule, SortSide, SortSnapshot } from './contracts';

export const DISPATCH_SECONDS = 0.23;
export const RULE_CHANGE_SECONDS = 0.95;
export const decisionSecondsAt = (sorted: number): number => Math.max(1.3, 4.8 - Math.max(0, sorted) * 0.06);
const dimensions: SortDimension[] = ['shape', 'brightness', 'size', 'symbol'];
const labels: Record<SortDimension, { label: string; positive: string; negative: string }> = {
  shape: { label: 'SHAPE / 形', positive: 'ROUND ○', negative: 'ANGULAR ◇' },
  brightness: { label: 'LIGHT / 明るさ', positive: 'LIGHT ☀', negative: 'DARK ▧' },
  size: { label: 'SIZE / 大きさ', positive: 'SMALL ·', negative: 'LARGE ●' },
  symbol: { label: 'SYMBOL / 記号', positive: '○', negative: '×' },
};
export function ruleAt(sorted: number): SortRule {
  const block = Math.floor(Math.max(0, sorted) / 8) % 8;
  const dimension = dimensions[block % 4]; const inverted = block >= 4; const text = labels[dimension];
  return { dimension, inverted, label: text.label + (inverted ? ' · REVERSE' : ''),
    leftLabel: inverted ? text.negative : text.positive, rightLabel: inverted ? text.positive : text.negative };
}
export function attributeLabel(parcel: SortParcel, dimension: SortDimension): string {
  const positive = parcel.shape === 'round';
  const selected = dimension === 'shape' ? positive : dimension === 'brightness' ? parcel.brightness === 'light' : dimension === 'size' ? parcel.size === 'small' : parcel.symbol === 'circle';
  return selected ? labels[dimension].positive : labels[dimension].negative;
}
export function expectedSide(parcel: SortParcel, rule: SortRule): SortSide {
  const positive = rule.dimension === 'shape' ? parcel.shape === 'round' : rule.dimension === 'brightness' ? parcel.brightness === 'light' : rule.dimension === 'size' ? parcel.size === 'small' : parcel.symbol === 'circle';
  return positive !== rule.inverted ? 'left' : 'right';
}

export class SortRun {
  sorted = 0;
  combo = 0;
  time = 0;
  phase: SortPhase = 'ended';
  alive = false;
  rule: SortRule = ruleAt(0);
  ruleChanges = 0;
  parcel: SortParcel | null = null;
  remaining = 0;
  lastSide: SortSide | null = null;
  private phaseRemaining = 0;
  private nextId = 0;
  private ending: SortResult | null = null;
  constructor(private readonly emit: (event: SortEvent) => void = () => {}, private readonly random: () => number = Math.random) {}
  start(): void { this.reset(); this.alive = true; this.activate(); }
  reset(): void {
    this.sorted = this.combo = this.time = this.ruleChanges = this.remaining = this.phaseRemaining = this.nextId = 0;
    this.phase = 'ended'; this.alive = false; this.rule = ruleAt(0); this.parcel = null; this.lastSide = null; this.ending = null;
  }
  input(side: SortSide): boolean {
    if (!this.alive || this.phase !== 'sorting' || !this.parcel || (side !== 'left' && side !== 'right')) return false;
    const expected = expectedSide(this.parcel, this.rule);
    if (side !== expected) { this.finish('wrong', side); return true; }
    this.sorted++; this.combo++; this.lastSide = side;
    this.phase = 'dispatch'; this.phaseRemaining = DISPATCH_SECONDS; this.remaining = 0;
    this.emit({ type: 'correct', combo: this.combo, side });
    return true;
  }
  step(seconds: number): void {
    if (!this.alive || !Number.isFinite(seconds) || seconds <= 0) return;
    let left = Math.min(0.05, seconds);
    while (left > 0 && this.alive) {
      const duration = this.phase === 'sorting' ? this.remaining : this.phaseRemaining;
      const dt = Math.min(left, duration);
      this.time += dt; left -= dt;
      if (this.phase === 'sorting') {
        this.remaining = Math.max(0, this.remaining - dt);
        if (this.remaining <= 1e-9) this.finish('timeout', null);
      } else {
        this.phaseRemaining = Math.max(0, this.phaseRemaining - dt);
        if (this.phaseRemaining <= 1e-9) {
          if (this.phase === 'dispatch' && this.sorted % 8 === 0) {
            this.rule = ruleAt(this.sorted); this.ruleChanges++;
            this.parcel = null; this.lastSide = null; this.phase = 'rule_change'; this.phaseRemaining = RULE_CHANGE_SECONDS;
            this.emit({ type: 'rule_change', rule: { ...this.rule }, count: this.ruleChanges });
          } else this.activate();
        }
      }
    }
  }
  snapshot(): SortSnapshot {
    return { sorted: this.sorted, combo: this.combo, time: this.time, phase: this.phase, alive: this.alive,
      rule: { ...this.rule }, ruleChanges: this.ruleChanges, parcel: this.parcel ? { ...this.parcel } : null,
      remaining: this.remaining, decisionSeconds: decisionSecondsAt(this.sorted), lastSide: this.lastSide };
  }
  inspection(): SortInspection {
    return { ...this.snapshot(), expectedSide: this.parcel ? expectedSide(this.parcel, this.rule) : null, phaseRemaining: this.phaseRemaining };
  }
  result(): SortResult | null { return this.ending ? { ...this.ending, rule: { ...this.ending.rule }, parcel: { ...this.ending.parcel } } : null; }
  private activate(): void {
    const positive = () => { const value = this.random(); return !Number.isFinite(value) || value < 0.5; };
    this.parcel = { id: this.nextId++, shape: positive() ? 'round' : 'angular', brightness: positive() ? 'light' : 'dark',
      size: positive() ? 'small' : 'large', symbol: positive() ? 'circle' : 'cross' };
    this.phase = 'sorting'; this.remaining = decisionSecondsAt(this.sorted); this.phaseRemaining = 0; this.lastSide = null;
  }
  private finish(outcome: 'wrong' | 'timeout', actualSide: SortSide | null): void {
    if (!this.alive || !this.parcel) return;
    const expected = expectedSide(this.parcel, this.rule);
    const correctSummary = `${attributeLabel(this.parcel, this.rule.dimension)} → ${expected.toUpperCase()}`;
    this.alive = false; this.phase = 'ended';
    this.ending = { sorted: this.sorted, combo: this.combo, time: this.time, ruleChanges: this.ruleChanges, outcome,
      expectedSide: expected, actualSide, parcel: { ...this.parcel }, rule: { ...this.rule }, correctSummary,
      reason: outcome === 'wrong' ? `いまのルールでは ${correctSummary} でした。` : `時間切れ。正解は ${correctSummary} でした。` };
    if (outcome === 'wrong') this.emit({ type: 'mistake', expected, actual: actualSide! });
    else this.emit({ type: 'timeout', expected });
  }
}
