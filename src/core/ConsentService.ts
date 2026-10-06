export type AnalyticsConsent = 'unknown' | 'granted' | 'denied';
export const CONSENT_KEY = 'game100garage:analytics-consent:v1';
type ConsentStorage = Pick<Storage, 'getItem' | 'setItem'>;
/** Consent settings are allowed before analytics; they contain no identity. */
export class ConsentService {
  private state: AnalyticsConsent = 'unknown';
  private listeners = new Set<(state: AnalyticsConsent) => void>();
  constructor(private backend?: ConsentStorage) {
    try { this.backend ??= typeof window === 'undefined' ? undefined : window.localStorage; this.acceptStored(this.backend?.getItem(CONSENT_KEY)); } catch { /* optional */ }
  }
  getState(): AnalyticsConsent { return this.state; }
  private acceptStored(value: string | null | undefined): void { this.state = value === 'granted' || value === 'denied' ? value : 'unknown'; }
  setState(state: 'granted' | 'denied'): void {
    try { this.backend?.setItem(CONSENT_KEY, state); } catch { /* memory choice still works */ }
    this.publish(state);
  }
  synchronize(value: string | null): void { this.publish(value === 'granted' || value === 'denied' ? value : 'unknown'); }
  private publish(state: AnalyticsConsent): void { if (state === this.state) return; this.state = state; for (const listener of this.listeners) listener(state); }
  subscribe(listener: (state: AnalyticsConsent) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}
