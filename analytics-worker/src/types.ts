import type { AnalyticsEnvelope } from '../../src/data/analyticsEnvelope';
export interface D1Result<T = unknown> { results: T[]; meta?: { changes?: number }; success?: boolean; }
export interface D1Statement { bind(...values: unknown[]): D1Statement; all<T = unknown>(): Promise<D1Result<T>>; run(): Promise<D1Result>; }
export interface Database { prepare(sql: string): D1Statement; batch<T = unknown>(statements: D1Statement[]): Promise<D1Result<T>[]>; }
export interface Env { DB: Database; RECORDS_ENABLED?: string; ENVIRONMENT?: 'production' | 'development'; ANALYTICS_ADMIN_TOKEN?: string; ANALYTICS_CODEX_TOKEN?: string; RAW_RETENTION_DAYS?: string; AGGREGATE_RETENTION_MONTHS?: string; RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> }; }
export interface StoredEvent extends Omit<AnalyticsEnvelope,'data'> { received_at: string; data_json: string; }
export interface Ratio { numerator: number; denominator: number; rate: number | null; sample_size_small: boolean; }
export interface Metrics {
  observed_browser_count: number; visit_count: number; portal_view_count: number;
  game_card_impressions: number; game_card_clicks: number; ctr: Ratio; game_starts: number; run_count: number;
  run1: number; run2: number; run3: number; second_run_rate: Ratio; third_run_rate: Ratio;
  browser_second_run_rate: Ratio; browser_third_run_rate: Ratio; launch_to_run_rate: Ratio;
  average_runs_per_visit: number | null; median_runs_per_visit: number | null; median_run_duration: number | null;
  measured_duration_count: number; best_updates: number; best_update_rate: Ratio;
  return_to_portal_count: number; return_to_portal_rate: Ratio; cross_game_rate: Ratio; client_error_count: number;
  retry_count: number; failure_retry_rate: Ratio; large_fall_count: number; large_fall_recovery_rate: Ratio;
  next_day_return_rate: Ratio; seven_day_return_rate: Ratio;
  device_split: Record<string,number>; traffic_source_split: Record<string,number>;
  top_failure_reasons: { label: string; count: number }[]; top_exit_phases: { label: string; count: number }[];
}
/** Only interval session_summary deltas are summed; run_end never repeats them. */
export interface SandboxSummary {
  summary_count: number; active_seconds: number; blocks_mined: number; blocks_placed: number;
  return_to_surface_count: number; max_depth: number | null; maximum_material_types_found: number | null;
  quality_summary_counts: Record<string, number>; save_error_summary_counts: Record<string, number>;
  coverage: 'observed-interval-deltas-only';
}
/** Coarse observations only; no raw identities or guessed fish appearances. */
export interface FishingSummary {
  cast_count:number; spot_cast_counts:Record<string,number>; cast_distance_counts:Record<string,number>;
  hook_fail_reason_counts:Record<string,number>; fish_hooked_counts:Record<string,number>; fish_landed_counts:Record<string,number>;
  landed_event_count:number; escaped_event_count:number; completed_outing_count:number;
  measured_fish_outing_count:number; average_fish_per_completed_outing:number|null;
  measured_score_outing_count:number; average_score:number|null; sample_size_small:boolean;
  coverage:'observed-standard-events-only';
}
export interface GameMetrics extends Metrics { game_id: string; status: 'active' | 'retired'; versions: { game_version: string; rules_version: string; presentation_version: string; event_count: number }[]; funnel: ({step:string} & Ratio)[]; measurement_coverage: string; sandbox_summary?: SandboxSummary; fishing_summary?: FishingSummary; }
export interface Period { from: string; to: string; }
export interface AggregateDay { day: string; game_id: string; environment: string; game_version: string; rules_version: string; presentation_version: string; metrics: Record<string,number>; }
