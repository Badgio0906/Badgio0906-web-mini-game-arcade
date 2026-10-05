/** Serializable, versioned boundary for a future offline Jev adapter. */
export type EventName = 'game_open' | 'run_start' | 'run_end' | 'score' | 'credit_used' | 'credit_zero' |
  'reward_offer_shown' | 'reward_requested' | 'reward_granted' | 'reward_failed' | 'retry' | 'quit' | 'pause' | 'resume' |
  'depth_reached' | 'fall_distance' | 'landing_type' | 'nice_drop' | 'platform_type' |
  'run_duration' | 'distance_reached' | 'office_clear' | 'tower_height' | 'perfect_count' |
  'memory_level' | 'sequence_length' | 'sorted_count' | 'rule_change_count' |
  'milestone_reached' | 'escalation_offered' | 'escalation_accepted' | 'safe_exit' |
  'phase_reached' | 'round_reached' | 'opponent_hand' | 'player_hand' | 'lose_success' |
  'accidental_win' | 'draw' | 'timeout' | 'response_latency_ms' | 'reflex_streak' |
  'tutorial_start' | 'tutorial_step_complete' | 'tutorial_complete' | 'tutorial_skip' |
  'tutorial_view' | 'practice_start' | 'practice_complete' | 'best_update' | 'death_reason' | 'specific_game_events' | 'page_exit' |
  'portal_open' | 'game_card_click' | 'game_launch' | 'return_to_portal';
export interface TelemetryEvent { name: EventName; at: string; data: Record<string, string | number | boolean>; }


export const TELEMETRY_SCHEMA_VERSION = 1 as const;
export const eventNames: readonly EventName[] = ["game_open", "run_start", "run_end", "score", "credit_used", "credit_zero", "reward_offer_shown", "reward_requested", "reward_granted", "reward_failed", "retry", "quit", "pause", "resume", "depth_reached", "fall_distance", "landing_type", "nice_drop", "platform_type", "run_duration", "distance_reached", "office_clear", "tower_height", "perfect_count", "memory_level", "sequence_length", "sorted_count", "rule_change_count", "milestone_reached", "escalation_offered", "escalation_accepted", "safe_exit", "phase_reached", "round_reached", "opponent_hand", "player_hand", "lose_success", "accidental_win", "draw", "timeout", "response_latency_ms", "reflex_streak", "tutorial_start", "tutorial_step_complete", "tutorial_complete", "tutorial_skip", "tutorial_view", "practice_start", "practice_complete", "best_update", "death_reason", "specific_game_events", "page_exit", "portal_open", "game_card_click", "game_launch", "return_to_portal"];
const nameSet = new Set<string>(eventNames);
export function isTelemetryEvent(value: unknown): value is TelemetryEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<TelemetryEvent>;
  if (typeof event.name !== 'string' || !nameSet.has(event.name) || typeof event.at !== 'string' || !Number.isFinite(Date.parse(event.at))) return false;
  if (!event.data || typeof event.data !== 'object' || Array.isArray(event.data)) return false;
  const pairs = Object.entries(event.data);
  return pairs.length <= 40 && pairs.every(([key, item]) => key.length <= 80 && (typeof item === 'boolean' || (typeof item === 'number' && Number.isFinite(item)) || (typeof item === 'string' && item.length <= 300)));
}
export function validatedEvents(value: unknown, limit = 400): TelemetryEvent[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isTelemetryEvent).slice(-limit).map(event => ({ ...event, data: { ...event.data } }));
}
