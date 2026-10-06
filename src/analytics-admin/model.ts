export type DatePreset = 'today' | '7' | '30' | 'custom';

// Calendar boundaries use Japan time, independent of the manager's OS timezone.
export function dateRange(preset: DatePreset, start = '', end = '', now = new Date()): { from: string; to: string } {
  const japanToday = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const first = preset === 'custom' ? start : shiftDay(japanToday, preset === 'today' ? 0 : -(Number(preset) - 1));
  const last = preset === 'custom' ? end : japanToday;
  if (!validDay(first) || !validDay(last) || first > last) throw new Error('開始日と終了日を正しい順序で指定してください。');
  const from = `${first}T00:00:00+09:00`;
  const exclusiveEnd = `${shiftDay(last, 1)}T00:00:00+09:00`;
  const to = Date.parse(exclusiveEnd) > now.getTime() ? now.toISOString() : exclusiveEnd;
  if (Date.parse(from) >= Date.parse(to)) throw new Error('未来だけの期間は集計できません。');
  return { from, to };
}
function validDay(day: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day;
}
function shiftDay(day: string, offset: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
}

export function workerBase(endpoint: string): URL {
  if (!endpoint.trim()) throw new Error('Telemetry endpointが未設定です。MANUAL_SETUPの設定後に利用できます。');
  const url = new URL(endpoint);
  if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) throw new Error('HTTPSのTelemetry endpointを指定してください。');
  url.search = ''; url.hash = '';
  url.pathname = url.pathname.replace(/\/v1\/events\/?$/, '').replace(/\/$/, '');
  return url;
}
export function formatRate(value: unknown): string {
  if (!value || typeof value !== 'object') return '欠測';
  const rate = value as Record<string, unknown>;
  const n = rate.numerator; const d = rate.denominator;
  if (typeof n !== 'number' || typeof d !== 'number' || !Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return `欠測 (${typeof n === 'number' ? n : '—'} / ${typeof d === 'number' ? d : '—'})`;
  return `${(100 * n / d).toFixed(1)}% (${n} / ${d})${d < 20 ? ' · 少数' : ''}`;
}
export function formatValue(value: unknown): string {
  if (value == null) return '欠測';
  if (typeof value === 'object') return formatRate(value);
  return typeof value === 'number' && Number.isFinite(value) ? new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 }).format(value) : String(value);
}

export function summaryUrl(endpoint: string, range: { from: string; to: string }, environment: string, retired: boolean): URL {
  if (!['production','synthetic','qa','development'].includes(environment)) throw new Error('データ区分を選択してください。');
  const url = workerBase(endpoint);
  url.pathname = url.pathname.replace(/\/$/, '') + '/v1/admin/summary';
  url.search = new URLSearchParams({ ...range, environment, include_retired: retired ? '1' : '0' }).toString();
  return url;
}

/** Keep retained-event metrics and whole UTC-day archive totals distinct. */
export function coverageWarnings(value: unknown): string[] {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const coverage = source.coverage && typeof source.coverage === 'object' ? source.coverage as Record<string, unknown> : {};
  const history = source.history && typeof source.history === 'object' ? source.history as Record<string, unknown> : {};
  const messages: string[] = [];
  if (coverage.raw_period_complete === false) messages.push('指定期間には保持期限を過ぎた日が含まれます。以下の数値は保持期間内に残るイベント分だけで、指定期間全体の0件や未訪問を意味しません。古い期間の日別集計とは分けて読んでください。');
  if (history.partial_edge_days === true) messages.push('日別履歴はUTC暦日全体の集計です。期間の端の日は指定期間外の時間も含むため、指定期間だけの正確な合計ではありません。');
  return messages;
}
