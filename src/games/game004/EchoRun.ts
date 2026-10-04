import type { EchoEvent, EchoInspection, EchoPhase, EchoResult, EchoSnapshot } from './contracts';

export const sequenceLengthAt = (level: number): number => Math.min(9, Math.max(2, level + 1));
export const flashSecondsAt = (level: number): number => Math.max(0.28, 0.6 - Math.max(0, level - 1) * 0.026);
export const gapSecondsAt = (level: number): number => Math.max(0.12, 0.18 - Math.max(0, level - 1) * 0.005);
export const PREPARE_SECONDS = 0.6;
export const BETWEEN_SECONDS = 0.7;

/** No input deadline: the challenge is remembering, rather than racing a hidden timer. */
export class EchoRun {
  level = 1;
  correctInputs = 0;
  time = 0;
  phase: EchoPhase = 'ended';
  highlightedCell: number | null = null;
  alive = false;
  private sequence: number[] = [];
  private index = 0;
  private watchIndex = -1;
  private lit = false;
  private remaining = 0;
  private feedbackRemaining = 0;
  private ending: EchoResult | null = null;
  constructor(private readonly emit: (event: EchoEvent) => void = () => {}, private readonly random: () => number = Math.random) {}
  start(): void { this.reset(); this.alive = true; this.prepareRound(); }
  reset(): void {
    this.level = 1; this.correctInputs = this.time = this.index = this.remaining = this.feedbackRemaining = 0;
    this.phase = 'ended'; this.highlightedCell = null; this.alive = false; this.sequence.length = 0;
    this.watchIndex = -1; this.lit = false; this.ending = null;
  }
  input(cell: number): boolean {
    if (!this.alive || this.phase !== 'recall' || !Number.isInteger(cell) || cell < 0 || cell > 8) return false;
    const expected = this.sequence[this.index];
    if (cell !== expected) {
      this.alive = false; this.phase = 'ended'; this.highlightedCell = expected;
      this.ending = { level: this.level, correctInputs: this.correctInputs, time: this.time,
        expectedCell: expected, actualCell: cell, sequence: [...this.sequence], reason: `次は ${expected + 1} 番のパネルでした。` };
      this.emit({ type: 'mistake', expected, actual: cell });
      return true;
    }
    this.correctInputs++; this.index++;
    this.highlightedCell = cell; this.feedbackRemaining = 0.16;
    this.emit({ type: 'correct', cell });
    if (this.index === this.sequence.length) {
      this.phase = 'between'; this.remaining = BETWEEN_SECONDS;
      this.emit({ type: 'level_clear', level: this.level });
    }
    return true;
  }
  step(seconds: number): void {
    if (!this.alive || !Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = Math.min(0.05, seconds);
    while (remaining > 0 && this.alive) {
      if (this.phase === 'recall') {
        this.time += remaining;
        this.feedbackRemaining = Math.max(0, this.feedbackRemaining - remaining);
        if (!this.feedbackRemaining) this.highlightedCell = null;
        break;
      }
      const dt = Math.min(remaining, this.remaining);
      this.time += dt; remaining -= dt; this.remaining -= dt;
      if (this.remaining > 1e-9) break;
      if (this.phase === 'between') { this.level++; this.prepareRound(); continue; }
      if (this.phase === 'watch') {
        if (this.lit) {
          // Explicit darkness between every cue, including repetitions of the same panel.
          this.lit = false; this.highlightedCell = null; this.remaining = gapSecondsAt(this.level);
        } else {
          this.watchIndex++;
          if (this.watchIndex >= this.sequence.length) {
            this.phase = 'recall'; this.index = 0; this.highlightedCell = null; this.feedbackRemaining = 0;
          } else {
            this.lit = true; this.highlightedCell = this.sequence[this.watchIndex]; this.remaining = flashSecondsAt(this.level);
            this.emit({ type: 'cue', cell: this.highlightedCell });
          }
        }
      }
    }
  }
  snapshot(): EchoSnapshot {
    return { level: this.level, correctInputs: this.correctInputs, time: this.time, phase: this.phase,
      totalLength: this.sequence.length, index: this.phase === 'watch' ? Math.max(0, this.watchIndex) : this.index,
      highlightedCell: this.highlightedCell, alive: this.alive };
  }
  inspection(): EchoInspection {
    return { ...this.snapshot(), sequence: [...this.sequence], expectedCell: this.phase === 'recall' ? this.sequence[this.index] : null,
      flashSeconds: flashSecondsAt(this.level), gapSeconds: gapSecondsAt(this.level), remaining: this.remaining };
  }
  result(): EchoResult | null { return this.ending ? { ...this.ending, sequence: [...this.ending.sequence] } : null; }
  private prepareRound(): void {
    this.sequence = [];
    for (let i = 0; i < sequenceLengthAt(this.level); i++) {
      const value = this.random();
      let cell = Number.isFinite(value) ? Math.min(8, Math.max(0, Math.floor(value * 9))) : 0;
      const previous = this.sequence[i - 1];
      if ((this.level < 4 && cell === previous) || (cell === previous && cell === this.sequence[i - 2])) cell = (cell + 1) % 9;
      this.sequence.push(cell);
    }
    this.phase = 'watch'; this.highlightedCell = null; this.index = 0; this.watchIndex = -1;
    this.lit = false; this.remaining = PREPARE_SECONDS; this.feedbackRemaining = 0;
  }
}
