import type { StorageService } from './StorageService';
import { isTelemetryEvent, validatedEvents, TELEMETRY_SCHEMA_VERSION, type EventName, type TelemetryEvent } from '../data/telemetrySchema.ts';
import { gameCatalog } from '../data/gameCatalog.ts';
import { summarizeEvents } from '../data/telemetryAnalytics.ts';
export type { EventName, TelemetryEvent } from '../data/telemetrySchema.ts';
export const TELEMETRY_KEY = 'web-mini-game-arcade:telemetry:v1';
export const RETAINED_EVENTS = 400;

/** Bounded device-local records. No SDK, identity, external request or gameplay gate. */
export class TelemetryService {
  private events: TelemetryEvent[] = [];
  private persisted: TelemetryEvent[] = [];
  private backend?: Pick<Storage, 'getItem' | 'setItem'>;
  private readonly sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  private memoryOnly = false;
  private lastPhase = 'title';
  constructor(_storage?: StorageService, private readonly gameId = 'game001', backend?: Pick<Storage, 'getItem' | 'setItem'>) {
    try { this.backend = backend ?? window.localStorage; } catch { /* optional storage */ }
    this.persisted = this.readRecords();
    if (typeof window !== 'undefined') window.addEventListener('pagehide', () => {
      const training = typeof document === 'undefined' ? null : document.querySelector<HTMLDialogElement>('#arcade-training[open]');
      const screen = typeof document === 'undefined' ? undefined : document.getElementById('app')?.dataset.state;
      this.trackEvent('page_exit', { phase: training?.dataset.phase ?? screen ?? (this.gameId === 'portal' ? 'portal' : this.lastPhase) });
    }, { once: true });
  }
  private readRecords(): TelemetryEvent[] {
    if (this.memoryOnly) return this.persisted;
    try {
      const raw = this.backend?.getItem(TELEMETRY_KEY);
      if (!raw || raw.length > 800000) return this.persisted;
      return validatedEvents(JSON.parse(raw), RETAINED_EVENTS);
    } catch { return this.persisted; }
  }
  trackEvent(name: EventName, data: TelemetryEvent['data'] = {}): void {
    const event: TelemetryEvent = { name, at: new Date().toISOString(), data: { ...data, game: this.gameId === 'game001' ? 'orbit-shift' : this.gameId, game_id: this.gameId, session_id: this.sessionId } };
    if (!isTelemetryEvent(event)) return;
    if (name === 'tutorial_view' || name === 'tutorial_start') this.lastPhase = 'explanation';
    if (name === 'practice_start') this.lastPhase = 'practice';
    if (name === 'run_start') this.lastPhase = 'playing';
    if (name === 'phase_reached' && typeof data.phase === 'string') this.lastPhase = data.phase;
    if (name === 'run_end') this.lastPhase = data.outcome === 'quit' ? this.lastPhase : 'result';
    this.events.push(event);
    if (this.events.length > 200) this.events.shift();
    this.persisted = [...this.readRecords(), event].slice(-RETAINED_EVENTS);
    try { this.backend?.setItem(TELEMETRY_KEY, JSON.stringify(this.persisted)); } catch { this.memoryOnly = true; /* preserve current memory rather than reread stale backend */ }
    console.debug('[ARCADE]', event);
  }
  getEvents(): TelemetryEvent[] { return validatedEvents(this.events, 200); }
  exportRecords() {
    const events = validatedEvents(this.readRecords(), RETAINED_EVENTS);
    return { schemaVersion: TELEMETRY_SCHEMA_VERSION, exportedAt: new Date().toISOString(), provenance: 'device-local-observed-events', retention: { maximumEvents: RETAINED_EVENTS, windowLimited: true },
      scope: 'This browser only; not global analytics. Missing measurements remain unknown. No automatic external transmission.',
      gameCatalog, events, analytics: summarizeEvents(events) };
  }
}
