/**
 * Game036 (pilot, unregistered) — TIMING PILOT model.
 *
 * Pure logic only: no DOM, no storage, no telemetry, no shared modules.
 * Spec source: docs/agent-tasks/pilot-game036-handoff-20261018/ASSIGNMENT.md
 */

export const MIN_POSITION = 0;
export const MAX_POSITION = 100;
/** Marker speed in position units per second. */
export const SPEED = 35;
/** Target position for each of the three rounds. */
export const TARGETS = [70, 30, 55] as const;
export const ROUNDS = TARGETS.length;
export const MAX_ROUND_SCORE = 1000;
/** Score lost per position unit of distance from the target. */
export const PENALTY_PER_UNIT = 30;
export const MAX_TOTAL_SCORE = MAX_ROUND_SCORE * ROUNDS;
/**
 * Largest wall-clock delta (seconds) the model accepts for one step.
 * Anything larger (tab suspended, debugger pause, clock jump) is rejected and
 * the caller is expected to pause instead of letting the marker jump.
 */
export const MAX_FRAME_DT = 0.5;

export interface RoundResult {
  round: number;
  target: number;
  position: number;
  distance: number;
  score: number;
}

export interface TimingState {
  /** Zero-based round index. Stays on the last round once the run is complete. */
  round: number;
  position: number;
  direction: 1 | -1;
  /** `running`: marker moves and one stop is accepted. `stopped`: waiting for nextRound(). */
  phase: 'running' | 'stopped';
  paused: boolean;
  /** Seconds of accepted, unpaused, running time. */
  elapsed: number;
  /** Official results only. Always empty in practice mode. */
  results: RoundResult[];
  /** Most recent stop, including practice stops (display feedback only). */
  last: RoundResult | null;
  /** Official total only. Always 0 in practice mode. */
  total: number;
  outcome: 'playing' | 'complete';
  practice: boolean;
}

export function createTiming(practice = false): TimingState {
  return {
    round: 0,
    position: MIN_POSITION,
    direction: 1,
    phase: 'running',
    paused: false,
    elapsed: 0,
    results: [],
    last: null,
    total: 0,
    outcome: 'playing',
    practice,
  };
}

export function targetOf(state: Pick<TimingState, 'round'>): number {
  return TARGETS[state.round % ROUNDS];
}

export function isValidDt(dt: number): boolean {
  return Number.isFinite(dt) && dt >= 0 && dt <= MAX_FRAME_DT;
}

/** max(0, round(1000 - |position - target| * 30)) */
export function roundScore(position: number, target: number): number {
  return Math.max(0, Math.round(MAX_ROUND_SCORE - Math.abs(position - target) * PENALTY_PER_UNIT));
}

/**
 * Advance the marker by `dt` real seconds.
 * Returns true when dt was accepted (dt === 0 is accepted and changes nothing),
 * false when dt is invalid, the round is not running, or the model is paused.
 * A false return never mutates the state.
 */
export function stepTiming(state: TimingState, dt: number): boolean {
  if (!isValidDt(dt) || state.phase !== 'running' || state.paused || state.outcome !== 'playing') {
    return false;
  }
  let remaining = SPEED * dt;
  while (remaining > 0) {
    const room = state.direction === 1 ? MAX_POSITION - state.position : state.position - MIN_POSITION;
    if (remaining <= room) {
      state.position += state.direction * remaining;
      remaining = 0;
    } else {
      state.position = state.direction === 1 ? MAX_POSITION : MIN_POSITION;
      remaining -= room;
      state.direction = state.direction === 1 ? -1 : 1;
    }
  }
  state.elapsed += dt;
  return true;
}

/**
 * Confirm the stop for the current round (exactly one confirmation per round).
 * Returns the round result, or null when the input is not accepted
 * (paused, already stopped, run complete).
 * In practice mode the result is returned as feedback but never recorded in
 * `results`/`total` and never completes the run.
 */
export function stopTiming(state: TimingState): RoundResult | null {
  if (state.phase !== 'running' || state.paused || state.outcome !== 'playing') return null;
  const target = targetOf(state);
  const result: RoundResult = {
    round: state.round,
    target,
    position: state.position,
    distance: Math.abs(state.position - target),
    score: roundScore(state.position, target),
  };
  state.last = result;
  state.phase = 'stopped';
  if (!state.practice) {
    state.results.push(result);
    state.total += result.score;
    if (state.round === ROUNDS - 1) state.outcome = 'complete';
  }
  return result;
}

/**
 * Move from a stopped round to the next one. The marker restarts at 0 moving right.
 * Practice mode cycles through the three targets forever.
 * Returns false when there is no next round to start.
 */
export function nextRound(state: TimingState): boolean {
  if (state.phase !== 'stopped' || state.outcome !== 'playing') return false;
  state.round = state.practice ? (state.round + 1) % ROUNDS : state.round + 1;
  state.position = MIN_POSITION;
  state.direction = 1;
  state.phase = 'running';
  return true;
}

export function setPaused(state: TimingState, paused: boolean): void {
  state.paused = paused;
}
