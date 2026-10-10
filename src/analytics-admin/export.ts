type Data = Record<string, unknown>;
const counts = ['observed_browser_count','visit_count','portal_view_count','game_card_impressions','game_card_clicks','game_starts','run_count','run1','run2','run3','average_runs_per_visit','median_runs_per_visit','median_run_duration','measured_duration_count','best_updates','return_to_portal_count','client_error_count','retry_count','large_fall_count'];
const rates = ['ctr','second_run_rate','third_run_rate','browser_second_run_rate','browser_third_run_rate','launch_to_run_rate','best_update_rate','return_to_portal_rate','cross_game_rate','failure_retry_rate','large_fall_recovery_rate','next_day_return_rate','seven_day_return_rate'];
function object(value: unknown): Data { return value && typeof value === 'object' && !Array.isArray(value) ? value as Data : {}; }
function number(value: unknown): number | null { return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null; }
function text(value: unknown, max = 160): string | null { return typeof value === 'string' ? value.slice(0, max) : null; }
function list(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function ratio(value: unknown): Data {
  const data = object(value), n = number(data.numerator), d = number(data.denominator);
  return { numerator: n, denominator: d, rate: n !== null && d !== null && d > 0 ? n / d : null, sample_size_small: d === null || d < 20 };
}
function split(value: unknown, allowed: readonly string[]): Data {
  return Object.fromEntries(Object.entries(object(value)).filter(([key]) => allowed.includes(key)).map(([key, n]) => [key, number(n)]));
}
function metrics(value: unknown): Data {
  const data = object(value), result: Data = {};
  for (const key of counts) result[key] = number(data[key]);
  for (const key of rates) result[key] = ratio(data[key]);
  result.device_split = split(data.device_split, ['desktop','mobile','tablet','unknown']);
  result.traffic_source_split = split(data.traffic_source_split, ['instagram','tiktok','x','youtube','direct','other','unknown']);
  for (const key of ['top_failure_reasons','top_exit_phases']) result[key] = list(data[key]).map(value => { const entry = object(value); return { label: text(entry.label), count: number(entry.count) }; });
  return result;
}
function fishingSummary(value:unknown):Data {
  const summary=object(value),safeCounts=(field:string,allowed:string[])=>split(summary[field],allowed);
  return {cast_count:number(summary.cast_count),spot_cast_counts:safeCounts('spot_cast_counts',['shallows','rocks','shade','pool']),cast_distance_counts:safeCounts('cast_distance_counts',['near','medium','far']),
    hook_fail_reason_counts:safeCounts('hook_fail_reason_counts',['early','late']),fish_hooked_counts:safeCounts('fish_hooked_counts',['oikawa','ugui','yamame','amago','nijimasu','iwana','lord']),fish_landed_counts:safeCounts('fish_landed_counts',['oikawa','ugui','yamame','amago','nijimasu','iwana','lord']),
    ...Object.fromEntries(['landed_event_count','escaped_event_count','completed_outing_count','measured_fish_outing_count','average_fish_per_completed_outing','measured_score_outing_count','average_score'].map(key=>[key,number(summary[key])])),
    sample_size_small:typeof summary.sample_size_small==='boolean'?summary.sample_size_small:null,coverage:summary.coverage==='observed-standard-events-only'?summary.coverage:null};
}
/** Explicit aggregate projection: unknown nested properties and raw event/identity fields never survive. */
export function aggregateExport(value: unknown): Data {
  const source = object(value);
  if (source.schema_version !== 1 || !Array.isArray(source.games) || !['production','synthetic','qa','development'].includes(String(source.environment))) throw new Error('Unsupported aggregate summary. Expected schema_version=1 and an explicit data environment.');
  const period = object(source.period), coverage = object(source.coverage), history = object(source.history);
  return {
    schema_version: 1, export_version: 1, generated_at: text(source.generated_at), period: { from: text(period.from), to: text(period.to) }, environment: source.environment,
    interpretation: 'Consented observed browsers only; not people or all visitors. Missing values are null, not zero. Game/rules/presentation versions must be compared separately. No automatic Jev decisions.',
    coverage: { scope: text(coverage.scope, 1000), raw_retention_days: number(coverage.raw_retention_days), aggregate_retention_months: number(coverage.aggregate_retention_months), event_count: number(coverage.event_count), duration_unit: coverage.duration_unit === 'seconds' ? 'seconds' : null, raw_window_from: text(coverage.raw_window_from), raw_period_complete: typeof coverage.raw_period_complete === 'boolean' ? coverage.raw_period_complete : null, cohort_limits: text(coverage.cohort_limits, 2000), history_limits: text(coverage.history_limits, 2000), query_truncated: coverage.query_truncated === true, missing: list(coverage.missing).map(item => text(item, 1000)) },
    summary: metrics(source.summary),
    history: { granularity: history.granularity === 'UTC-calendar-day' ? 'UTC-calendar-day' : null, partial_edge_days: typeof history.partial_edge_days === 'boolean' ? history.partial_edge_days : null, daily: list(history.daily).map(value => { const day = object(value); return { day: text(day.day), game_id: /^game\d{3}$/.test(String(day.game_id)) ? day.game_id : null, environment: ['production','synthetic','qa','development'].includes(String(day.environment)) ? day.environment : null, game_version: text(day.game_version), rules_version: text(day.rules_version), presentation_version: text(day.presentation_version), metrics: Object.fromEntries(['event_count','observed_browser_count','visit_count','portal_view_count','game_card_impressions','game_card_clicks','game_starts','run_count','run_end_count','best_updates','client_error_count'].map(key => [key, number(object(day.metrics)[key])])) }; }) },
    games: list(source.games).filter(value => /^game\d{3}$/.test(String(object(value).game_id))).map(value => {
      const game = object(value);
      return { ...(game.game_id==='game032'&&game.fishing_summary?{fishing_summary:fishingSummary(game.fishing_summary)}:{}), game_id: game.game_id, status: game.status === 'retired' ? 'retired' : 'active', ...metrics(game), measurement_coverage: text(game.measurement_coverage, 1000), versions: list(game.versions).map(value => { const version = object(value); return { game_version: text(version.game_version), rules_version: text(version.rules_version), presentation_version: text(version.presentation_version), event_count: number(version.event_count) }; }), funnel: list(game.funnel).map(value => { const step = object(value); return { step: text(step.step), ...ratio(step) }; }) };
    }),
  };
}
