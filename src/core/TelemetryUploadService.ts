import { type AnalyticsEnvelope, ANALYTICS_SCHEMA_VERSION, isAnalyticsEnvelope } from '../data/analyticsEnvelope';
import { type ConsentService } from './ConsentService';
export const UPLOAD_QUEUE_KEY = 'game100garage:telemetry-queue:v2';
const MAX_QUEUE = 200, MAX_AGE = 86400000, MAX_BYTES = 32768, MAX_ATTEMPTS = 5;
type QueueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
/** Bounded nonblocking transport; gameplay never awaits this service. */
export class TelemetryUploadService {
  private queue: AnalyticsEnvelope[] = [];
  private inFlight = false;
  private controller?: AbortController;
  private timer?: ReturnType<typeof setTimeout>;
  private attempts = 0;
  constructor(private consent: ConsentService, private endpoint: string, private backend?: QueueStorage,
    private fetcher: typeof fetch = (...args) => fetch(...args), private now = () => Date.now()) {
    if (consent.getState() === 'granted' && endpoint) {
      try { const stored = JSON.parse(backend?.getItem(UPLOAD_QUEUE_KEY) ?? '[]'); if (Array.isArray(stored)) this.queue = stored.filter(row => isAnalyticsEnvelope(row, now())).slice(-MAX_QUEUE); } catch { /* corrupt discarded */ }
    } else this.clear();
    consent.subscribe(state => { if (state !== 'granted') this.clear(); });
    if (this.queue.length) this.schedule(4000);
  }
  enqueue(event: AnalyticsEnvelope): void {
    if (this.consent.getState() !== 'granted' || !this.endpoint || !isAnalyticsEnvelope(event, this.now())) return;
    this.prune(); if (this.queue.some(row => row.event_id === event.event_id)) return;
    this.queue.push(event); this.queue = this.queue.slice(-MAX_QUEUE); this.persist();
    this.schedule(['run_end','return_to_portal'].includes(event.event_name) ? 0 : 4000);
  }
  private prune(): void { this.queue = this.queue.filter(row => this.now() - Date.parse(row.occurred_at) <= MAX_AGE); }
  private persist(): void { try { if (this.queue.length) this.backend?.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(this.queue)); else this.backend?.removeItem(UPLOAD_QUEUE_KEY); } catch { /* memory queue */ } }
  private schedule(ms: number): void { if (this.timer !== undefined) { if (ms !== 0) return; clearTimeout(this.timer); } this.timer = setTimeout(() => { this.timer = undefined; void this.flush(); }, ms); }
  clear(): void { if (this.timer !== undefined) clearTimeout(this.timer); this.timer = undefined; this.queue = []; this.attempts = 0; this.controller?.abort(); this.persist(); }
  pendingCount(): number { this.prune(); return this.queue.length; }
  private batch(): AnalyticsEnvelope[] {
    const batch: AnalyticsEnvelope[] = [];
    for (const row of this.queue.slice(0, 25)) { const next = [...batch,row]; if (new TextEncoder().encode(JSON.stringify({ schema_version: ANALYTICS_SCHEMA_VERSION, events: next })).byteLength > MAX_BYTES) break; batch.push(row); }
    return batch;
  }
  async flush(pagehide = false): Promise<void> {
    if (this.inFlight || this.consent.getState() !== 'granted' || !this.endpoint || this.attempts >= MAX_ATTEMPTS) return;
    this.prune(); const batch = this.batch(); if (!batch.length) { this.persist(); return; }
    const ids = new Set(batch.map(row => row.event_id)); this.inFlight = true; const controller = new AbortController(); this.controller = controller;
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      // keepalive has an acknowledgement; leaving unacknowledged IDs queued makes dedupe meaningful.
      const response = await this.fetcher(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schema_version: ANALYTICS_SCHEMA_VERSION, events: batch }), keepalive: pagehide, credentials: 'omit', signal: controller.signal });
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) { this.queue = this.queue.filter(row => !ids.has(row.event_id)); this.attempts = 0; }
      else this.attempts++;
    } catch { this.attempts++; }
    finally { clearTimeout(timeout); this.inFlight = false; if (this.controller === controller) this.controller = undefined; this.persist();
      if (this.queue.length && this.consent.getState() === 'granted' && this.attempts < MAX_ATTEMPTS) this.schedule(this.attempts ? Math.min(60000, 1000 * 2 ** this.attempts) : 4000);
    }
  }
}
