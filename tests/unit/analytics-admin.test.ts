import { describe, expect, it } from 'vitest';
import { dateRange, formatRate, workerBase, summaryUrl, coverageWarnings } from '../../src/analytics-admin/model';
import { aggregateExport } from '../../src/analytics-admin/export';

describe('manager calendar and endpoint safety', () => {
  it('uses Japan midnight and caps current-day exclusive end at now across UTC date changes', () => {
    const now = new Date('2026-10-05T16:00:00Z');
    expect(dateRange('today', '', '', now)).toEqual({ from: '2026-10-06T00:00:00+09:00', to: '2026-10-05T16:00:00.000Z' });
    expect(dateRange('7', '', '', now).from).toBe('2026-09-30T00:00:00+09:00');
    expect(dateRange('30', '', '', now).from).toBe('2026-09-07T00:00:00+09:00');
    expect(Date.parse(dateRange('7', '', '', now).to)).toBe(now.getTime());
    expect(() => dateRange('custom','2027-01-01','2027-01-02',now)).toThrow();
    expect(dateRange('custom', '2026-09-29', '2026-10-02')).toEqual({ from: '2026-09-29T00:00:00+09:00', to: '2026-10-03T00:00:00+09:00' });
    expect(() => dateRange('custom', '2026-02-30', '2026-03-01')).toThrow();
    expect(() => dateRange('custom', '2026-10-06', '2026-10-01')).toThrow();
  });
  it('derives full upload URL while removing query and forbidding credentialed/nonlocal HTTP', () => {
    expect(workerBase('https://analytics.example/v1/events?secret=hidden#fragment').href).toBe('https://analytics.example/');
    expect(summaryUrl('https://analytics.example/v1/events', { from: '2026-10-01', to: '2026-10-02' }, 'production', false).pathname).toBe('/v1/admin/summary');
    expect(workerBase('http://127.0.0.1:8787/v1/events').origin).toBe('http://127.0.0.1:8787');
    for (const url of ['', 'http://analytics.example/v1/events', 'https://user:pass@analytics.example/v1/events']) expect(() => workerBase(url)).toThrow();
  });
  it('shows rate denominator, small sample and missing rather than guessed zero', () => {
    expect(formatRate({ numerator: 25, denominator: 40, rate: .625 })).toBe('62.5% (25 / 40)');
    expect(formatRate({ numerator: 3, denominator: 4 })).toContain('少数');
    expect(formatRate({ numerator: 0, denominator: 0 })).toContain('欠測');
  });
});

describe('aggregate export boundary', () => {
  it('keeps aggregate denominators/versions/missing/data class while projecting away all unknown raw identity fields', () => {
    const summary = { schema_version: 1, environment: 'synthetic', period: { from: '2026-10-01', to: '2026-10-02' }, browser_id: 'REMOVE_BROWSER', events: [{ run_id: 'REMOVE_RUN' }], coverage: { event_count: 4, query_truncated: false, missing: ['native telemetry unavailable'], duration_unit: 'seconds', cohort_limits: 'follow-up required', raw_window_from: '2026-07-06', history_limits: 'distinct daily counts are not additive', session_id: 'REMOVE_SESSION' }, summary: { observed_browser_count: 2, second_run_rate: { numerator: 1, denominator: 2, browser_id: 'REMOVE_NESTED' }, device_split: { mobile: 2, REMOVE_MAP_BROWSER: 1 } }, games: [{ game_id: 'game019', status: 'active', versions: [{ game_version: '2', rules_version: 'charge-2', event_count: 4, browser_id: 'REMOVE_VERSION' }], funnel: [{ step: '50m', numerator: 1, denominator: 2, run_id: 'REMOVE_FUNNEL' }] }, { game_id: 'game010', status: 'retired' }], history: { daily: [{ browser_id: 'REMOVE_HISTORY' }] } };
    const result = aggregateExport(summary);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('REMOVE_'); expect(serialized).not.toContain('browser_id'); expect(serialized).not.toContain('run_id'); expect(serialized).not.toContain('session_id');
    expect(result.environment).toBe('synthetic');
    expect((result.coverage as Record<string, unknown>).duration_unit).toBe('seconds');
    expect((result.coverage as Record<string, unknown>).cohort_limits).toBe('follow-up required');
    expect((result.summary as Record<string, unknown>).second_run_rate).toEqual({ numerator: 1, denominator: 2, rate: .5, sample_size_small: true });
    expect((result.games as Record<string, unknown>[])[0].versions).toEqual([{ game_version: '2', rules_version: 'charge-2', presentation_version: null, event_count: 4 }]);
    expect((result.games as Record<string, unknown>[])[1].status).toBe('retired');
    expect((result.summary as Record<string, unknown>).median_run_duration).toBeNull();
  });
  it('rejects raw or environmentless data so development cannot silently become production', () => {
    expect(() => aggregateExport({ events: [] })).toThrow();
    expect(() => aggregateExport({ schema_version: 1, games: [] })).toThrow();
    expect(() => aggregateExport({ schema_version: 1, environment: 'production', games: [] })).not.toThrow();
  });
});

describe('retention and archive boundary interpretation', () => {
  it('preserves explicit false/true coverage flags and warns instead of treating retained zero as whole-period zero', () => {
    const source = { schema_version: 1, environment: 'synthetic', games: [], coverage: { raw_period_complete: false }, history: { granularity: 'UTC-calendar-day', partial_edge_days: true, daily: [] } };
    const result = aggregateExport(source);
    expect((result.coverage as Record<string, unknown>).raw_period_complete).toBe(false);
    expect(result.history).toEqual({ granularity: 'UTC-calendar-day', partial_edge_days: true, daily: [] });
    expect(coverageWarnings(result)).toHaveLength(2);
    expect(coverageWarnings(result)[0]).toContain('指定期間全体の0件');
    expect(coverageWarnings(result)[1]).toContain('UTC暦日全体');
    const complete = aggregateExport({ ...source, coverage: { raw_period_complete: true }, history: { granularity: 'UTC-calendar-day', partial_edge_days: false, daily: [] } });
    expect(coverageWarnings(complete)).toEqual([]);
    const unknown = aggregateExport({ schema_version: 1, environment: 'synthetic', games: [] });
    expect((unknown.coverage as Record<string, unknown>).raw_period_complete).toBeNull();
    expect((unknown.history as Record<string, unknown>).partial_edge_days).toBeNull();
  });
});
