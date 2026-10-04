import type { AttentionMode, MeetingChoice, MeetingCue, MeetingEvent, MeetingInspection, MeetingMode, MeetingResult, MeetingSnapshot } from './contracts';

export const MEETING_CLOCK_MULTIPLIER = 5;
export const OVERTIME_MEETING_SECONDS = 300;
export const WORK_POINTS_PER_SECOND = 10;
export const FIRST_QUESTION_SECONDS = 8;
export const ANSWER_SECONDS = 0.65;
export const questionIntervalAt = (time: number, mode: MeetingMode): number => mode === 'normal' ? Math.max(5.2, 8 - time * 0.03) : Math.max(4, 4.8 - Math.max(0, time - 60) * 0.008);
export const warningSecondsAt = (time: number, mode: MeetingMode): number => mode === 'normal' ? Math.max(1.05, 1.5 - time * 0.004) : Math.max(0.9, 1.15 - Math.max(0, time - 60) * 0.002);
const copyCue = (cue: MeetingCue | null): MeetingCue | null => cue ? { ...cue } : null;
const EPSILON = 1e-9;

/** The meeting clock is five times the real simulation clock; scoring always uses real work seconds. */
export class MeetingRun {
  private time = 0;
  private score = 0;
  private workSeconds = 0;
  private alive = false;
  private mode: AttentionMode = 'listen';
  private meetingMode: MeetingMode = 'normal';
  private phase: MeetingSnapshot['phase'] = 'talk';
  private pending: 'overtime' | null = null;
  private milestoneOffered = false;
  private currentCue: MeetingCue | null = null;
  private nextCue: MeetingCue | null = null;
  private nextCueId = 1;
  private answerUntil = 0;
  private answered = 0;
  private ending: MeetingResult | null = null;
  constructor(private readonly emit: (event: MeetingEvent) => void = () => {}, private readonly random: () => number = Math.random) {}
  reset(): void {
    this.time = this.score = this.workSeconds = this.answerUntil = this.answered = 0;
    this.alive = false; this.mode = 'listen'; this.meetingMode = 'normal'; this.phase = 'talk'; this.pending = null;
    this.milestoneOffered = false; this.currentCue = this.nextCue = null; this.nextCueId = 1; this.ending = null;
  }
  start(): void {
    this.reset(); this.alive = true;
    this.nextCue = this.makeCue(FIRST_QUESTION_SECONDS, 'question', 1.5);
  }
  toggle(): boolean {
    if (!this.alive || this.pending) return false;
    this.mode = this.mode === 'listen' ? 'work' : 'listen'; this.emit({ type: 'toggle', mode: this.mode }); return true;
  }
  choose(choice: MeetingChoice): boolean {
    if (!this.alive || !this.pending || (choice !== 'leave' && choice !== 'board')) return false;
    this.pending = null;
    if (choice === 'leave') {
      this.emit({ type: 'choice', milestone: 'overtime', choice, multiplier: 1 }); this.finish('safe_exit');
    } else {
      // Explicitly start listening after the dialog. The existing cue and its remaining time stay intact.
      this.meetingMode = 'board'; this.mode = 'listen'; this.emit({ type: 'choice', milestone: 'overtime', choice, multiplier: 2 });
    }
    return true;
  }
  step(seconds: number): void {
    if (!this.alive || this.pending || !Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = Math.min(0.05, seconds);
    while (remaining > 1e-10 && this.alive && !this.pending) {
      this.transitions(); if (!this.alive || this.pending) break;
      let dt = Math.min(1 / 240, remaining);
      // Split at each real deadline so a nominal 1.05s cue never loses a simulation frame of warning.
      const boundaries = [this.nextCue?.cueStart, this.phase === 'cue' ? this.currentCue?.questionTime : undefined,
        this.phase === 'answer' ? this.answerUntil : undefined, !this.milestoneOffered ? OVERTIME_MEETING_SECONDS / MEETING_CLOCK_MULTIPLIER : undefined];
      for (const boundary of boundaries) if (boundary !== undefined && boundary > this.time + EPSILON) dt = Math.min(dt, boundary - this.time);
      if (this.mode === 'work') { this.workSeconds += dt; this.score += dt * WORK_POINTS_PER_SECOND * (this.meetingMode === 'board' ? 2 : 1); }
      this.time += dt; remaining -= dt; this.transitions();
    }
  }
  private transitions(): void {
    if (this.phase === 'answer' && this.time >= this.answerUntil - EPSILON) { this.phase = 'talk'; this.currentCue = null; }
    if (this.nextCue && this.time >= this.nextCue.cueStart - EPSILON) {
      this.currentCue = this.nextCue; this.nextCue = null; this.phase = 'cue'; this.emit({ type: 'cue', cue: { ...this.currentCue } });
    }
    if (this.phase === 'cue' && this.currentCue && this.time >= this.currentCue.questionTime - EPSILON) {
      if (this.currentCue.kind === 'question') {
        if (this.mode === 'work') { this.finish('caught'); return; }
        this.answered++; this.phase = 'answer'; this.answerUntil = this.time + ANSWER_SECONDS; this.emit({ type: 'answer', answered: this.answered });
      } else { this.currentCue = null; this.phase = 'talk'; this.emit({ type: 'feint_clear' }); }
      this.scheduleNext();
    }
    // A question at exactly the checkpoint is resolved first; a dialog cannot erase a committed failure.
    if (this.alive && !this.milestoneOffered && this.time >= OVERTIME_MEETING_SECONDS / MEETING_CLOCK_MULTIPLIER - EPSILON) {
      this.milestoneOffered = true; this.pending = 'overtime'; this.emit({ type: 'milestone', milestone: 'overtime' });
    }
  }
  private makeCue(questionTime: number, kind: MeetingCue['kind'], warning: number): MeetingCue {
    return { id: this.nextCueId++, kind, questionTime, cueStart: questionTime - warning, warningSeconds: warning,
      text: kind === 'question' ? 'ところで……あなたはどう思いますか？' : '資料確認……少しお待ちください。' };
  }
  private scheduleNext(): void {
    const random = Math.min(1, Math.max(0, this.random()));
    const questionTime = this.time + questionIntervalAt(this.time, this.meetingMode) + random * 0.65;
    const kind = this.answered >= 2 && this.nextCueId % 4 === 0 ? 'feint' : 'question';
    this.nextCue = this.makeCue(questionTime, kind, kind === 'question' ? warningSecondsAt(questionTime, this.meetingMode) : 0.85);
  }
  private finish(outcome: MeetingResult['outcome']): void {
    if (!this.alive) return;
    this.alive = false; this.phase = 'ended';
    this.ending = { score: Math.floor(this.score + EPSILON), time: this.time, meetingSeconds: this.time * MEETING_CLOCK_MULTIPLIER,
      mode: this.mode, meetingMode: this.meetingMode, multiplier: this.meetingMode === 'board' ? 2 : 1,
      answered: this.answered, workSeconds: this.workSeconds, outcome,
      reason: outcome === 'caught' ? 'すみません、聞いてませんでした。' : '本日の会議は、ここまで。', question: outcome === 'caught' ? copyCue(this.currentCue) : null };
    if (outcome === 'caught') this.emit({ type: 'caught' });
  }
  snapshot(): MeetingSnapshot {
    return { score: Math.floor(this.score + EPSILON), time: this.time, meetingSeconds: this.time * MEETING_CLOCK_MULTIPLIER, alive: this.alive,
      mode: this.mode, meetingMode: this.meetingMode, multiplier: this.meetingMode === 'board' ? 2 : 1, phase: this.phase, pending: this.pending,
      currentCue: copyCue(this.currentCue), cueRemaining: this.phase === 'cue' && this.currentCue ? Math.max(0, this.currentCue.questionTime - this.time) : null,
      participants: Math.min(8, 3 + Math.floor(this.time / 30) + (this.meetingMode === 'board' ? 2 : 0)), answered: this.answered, workSeconds: this.workSeconds };
  }
  inspection(): MeetingInspection {
    return { ...this.snapshot(), nextCue: copyCue(this.nextCue), answerRemaining: this.phase === 'answer' ? Math.max(0, this.answerUntil - this.time) : 0,
      milestoneOffered: this.milestoneOffered, exactScore: this.score };
  }
  result(): MeetingResult | null { return this.ending ? { ...this.ending, question: copyCue(this.ending.question) } : null; }
}
