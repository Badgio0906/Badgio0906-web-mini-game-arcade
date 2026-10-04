import type { StorageService } from './StorageService';
import type { TelemetryService } from './TelemetryService';
import { arcadeConfig } from '../arcade/config';

export type RewardAdapter = () => Promise<{ granted: boolean }>;

export class CreditService {
  private count: number;
  private consumed = new Set<string>();
  private pending = false;
  constructor(private storage: StorageService, private telemetry: TelemetryService, readonly enabled: boolean = arcadeConfig.creditsEnabled) {
    this.count = storage.readNumber('credits', 3, 0, 3);
  }
  get credits(): number { return this.count; }
  get canPlay(): boolean { return !this.enabled || this.count > 0; }
  get rewardPending(): boolean { return this.pending; }

  consume(runId: string): boolean {
    if (!this.enabled) return false;
    if (this.consumed.has(runId) || this.count === 0) return false;
    this.consumed.add(runId);
    if (this.consumed.size > 64) this.consumed.delete(this.consumed.values().next().value!);
    this.count -= 1;
    this.storage.writeNumber('credits', this.count);
    this.telemetry.trackEvent('credit_used', { runId, credits: this.count });
    if (this.count === 0) this.telemetry.trackEvent('credit_zero', { runId });
    return true;
  }

  async requestRewardedCredit(adapter: RewardAdapter): Promise<boolean> {
    if (!this.enabled) return false;
    if (this.count !== 0 || this.pending) return false;
    this.pending = true;
    this.telemetry.trackEvent('reward_requested');
    try {
      const reward = await adapter();
      if (!reward.granted) { this.telemetry.trackEvent('reward_failed'); return false; }
      this.count = 3;
      this.storage.writeNumber('credits', this.count);
      this.telemetry.trackEvent('reward_granted', { credits: 3 });
      return true;
    } catch {
      this.telemetry.trackEvent('reward_failed');
      return false;
    } finally { this.pending = false; }
  }
  reset(): void { if (this.enabled && !this.pending) { this.count = 3; this.consumed.clear(); this.storage.writeNumber('credits', 3); } }
}
