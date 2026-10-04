import type { StorageService } from './StorageService';

export type EventName = 'game_open' | 'run_start' | 'run_end' | 'score' | 'credit_used' | 'credit_zero' |
  'reward_offer_shown' | 'reward_requested' | 'reward_granted' | 'reward_failed' | 'retry' | 'quit' | 'pause' | 'resume' |
  'run_duration' | 'distance_reached' | 'office_clear' | 'tower_height' | 'perfect_count' |
  'memory_level' | 'sequence_length' | 'sorted_count' | 'rule_change_count' |
  'milestone_reached' | 'escalation_offered' | 'escalation_accepted' | 'safe_exit' |
  'tutorial_start' | 'tutorial_step_complete' | 'tutorial_complete' | 'tutorial_skip' |
  'portal_open' | 'game_card_click' | 'game_launch' | 'return_to_portal';
export interface TelemetryEvent { name: EventName; at: string; data: Record<string, string | number | boolean>; }

/** Console adapter, with a bounded in-memory history. Replace this one method for an SDK. */
export class TelemetryService {
  private events: TelemetryEvent[] = [];
  constructor(_storage?: StorageService, private readonly gameId = 'game001') { /* console stub */ }
  trackEvent(name: EventName, data: TelemetryEvent['data'] = {}): void {
    const event = { name, at: new Date().toISOString(), data: { game: this.gameId === 'game001' ? 'orbit-shift' : this.gameId, ...data, game_id: this.gameId } };
    this.events.push(event);
    if (this.events.length > 200) this.events.shift();
    console.debug('[ARCADE]', event);
  }
  getEvents(): TelemetryEvent[] { return this.events.map(event => ({ ...event, data: { ...event.data } })); }
}
