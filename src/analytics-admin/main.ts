import './style.css';
import { aggregateExport } from './export';
import { historicalGameCatalog } from '../data/gameCatalog';
import { dateRange, formatValue, summaryUrl, coverageWarnings, type DatePreset } from './model';
import { mountRecordsAdmin } from './records';

type RecordData = Record<string, unknown>;
const host = document.querySelector<HTMLElement>('#admin')!;
host.innerHTML = `<h1>GAME100 GARAGE Analytics</h1>
<p class="hint">解析に同意したブラウザから観測できたデータだけを表示します。人数とは異なります。GA4の集計とは別です。日本時間・終了日を含む期間（今日は現在まで）。</p>
<form id="query"><label>期間<select name="preset"><option value="today">今日</option><option value="7" selected>7日</option><option value="30">30日</option><option value="custom">任意</option></select></label>
<label id="start-label" hidden>開始日<input name="start" type="date"></label><label id="end-label" hidden>終了日<input name="end" type="date"></label>
<label>データ区分<select name="environment"><option value="production">production（本番）</option><option value="synthetic">synthetic（fixture）</option><option value="qa">qa（自動検証）</option><option value="development">development（開発）</option></select></label>
<label class="check"><input type="checkbox" name="retired">退役作品を含める</label>
<label>管理トークン<input name="token" type="password" autocomplete="off" spellcheck="false" placeholder="Bearer token" required></label>
<button type="submit">集計を取得</button><button id="clear" type="button">トークン・表示を消去</button><button id="export" type="button" disabled>集計JSONを保存</button></form>
<p id="status" role="status" aria-live="polite"></p><section id="results" hidden></section>`;
const form = host.querySelector<HTMLFormElement>('form')!;
const status = host.querySelector<HTMLElement>('#status')!;
const results = host.querySelector<HTMLElement>('#results')!;
const exportButton = host.querySelector<HTMLButtonElement>('#export')!;
const tokenInput = form.elements.namedItem('token') as HTMLInputElement;
const recordsAdmin = mountRecordsAdmin(host, import.meta.env.VITE_RECORDS_ENDPOINT ?? '', () => tokenInput.value);
tokenInput.addEventListener('input', () => recordsAdmin.clear());
let current: unknown = null;
let pending: AbortController | null = null;
const endpoint = import.meta.env.VITE_TELEMETRY_ENDPOINT as string | undefined;
if (!endpoint) status.textContent = 'Telemetry endpointは未設定です。MANUAL_SETUPの設定・Worker配備後に利用できます。';
(form.elements.namedItem('preset') as HTMLSelectElement).addEventListener('change', () => {
  const custom = (form.elements.namedItem('preset') as HTMLSelectElement).value === 'custom';
  host.querySelector<HTMLElement>('#start-label')!.hidden = !custom;
  host.querySelector<HTMLElement>('#end-label')!.hidden = !custom;
});
function clear() {
  pending?.abort(); pending = null;
  recordsAdmin.clear();
  (form.elements.namedItem('token') as HTMLInputElement).value = '';
  current = null; results.replaceChildren(); results.hidden = true; exportButton.disabled = true;
  status.textContent = 'トークンと集計を消去しました。';
}
host.querySelector('#clear')!.addEventListener('click', clear);
window.addEventListener('pagehide', clear);
form.addEventListener('submit', async event => {
  event.preventDefault(); pending?.abort();
  current = null; exportButton.disabled = true; results.hidden = true;
  const input = new FormData(form);
  let token = String(input.get('token') ?? '').trim();
  const controller = new AbortController(); pending = controller;
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    if (!token) throw new Error('管理トークンを入力してください。');
    const range = dateRange(String(input.get('preset')) as DatePreset, String(input.get('start') ?? ''), String(input.get('end') ?? ''));
    const url = summaryUrl(endpoint ?? '', range, String(input.get('environment')), input.has('retired'));
    status.className = ''; status.textContent = '集計を取得しています…';
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
    // The token is never put in a URL, file, localStorage, or console.
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? '認証できません。管理トークンを確認してください。' : `管理APIが応答できませんでした（HTTP ${response.status}）。`);
    const summary: unknown = await response.json();
    if (!summary || typeof summary !== 'object' || !Array.isArray((summary as RecordData).games)) throw new Error('集計APIの形式が一致しません。Workerと画面の版を確認してください。');
    if (pending !== controller) return;
    current = aggregateExport(summary); render(summary as RecordData); exportButton.disabled = false;
    status.textContent = '集計を取得しました。母数20未満は「少数」と表示します。欠測を0件と解釈しないでください。';
  } catch (error) {
    if (pending !== controller) return;
    status.className = 'error'; status.textContent = error instanceof Error && error.name !== 'AbortError' ? error.message : '取得を中断しました。接続状態を確認してください。';
  } finally { token = ''; window.clearTimeout(timeout); if (pending === controller) pending = null; }
});
exportButton.addEventListener('click', () => {
  if (!current) return;
  const blob = new Blob([JSON.stringify(current, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'analytics-summary.json'; anchor.click(); URL.revokeObjectURL(url);
});
function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node;
}
const metricLabels: Record<string, string> = { observed_browser_count: '観測ブラウザ', visit_count: '訪問', portal_view_count: 'ポータル閲覧', game_card_impressions: 'カード表示', game_card_clicks: 'カードクリック', game_starts: 'ゲーム開始', run_count: 'RUN', second_run_rate: '2RUN率（1→2）', third_run_rate: '3RUN率（2→3）', median_run_duration: 'RUN中央値（秒）', measured_duration_count: '有効RUN時間の母数', return_to_portal_rate: 'ポータル帰還率', cross_game_rate: '別ゲーム移動率', client_error_count: 'エラー', launch_to_run_rate: '開始→RUN率', best_update_rate: 'BEST更新率', failure_retry_rate: '失敗後再挑戦率', large_fall_recovery_rate: '大落下後継続率', next_day_return_rate: '翌日再訪率', seven_day_return_rate: '7日以内再訪率' };
function render(summary: RecordData) {
  results.replaceChildren(); results.hidden = false;
  const meta = element('p', `期間: ${JSON.stringify(summary.period)} / 区分: ${String(summary.environment ?? '欠測')} / schema: ${String(summary.schema_version ?? summary.schemaVersion ?? '欠測')}`); results.append(meta);
  for (const message of coverageWarnings(summary)) { const notice = element('p', message); notice.className = 'note'; results.append(notice); }
  const overall = (summary.overall ?? summary.summary ?? {}) as RecordData;
  results.append(element('h2', '全体'));
  const cards = element('div'); cards.className = 'cards';
  for (const [key, label] of Object.entries(metricLabels)) { const card = element('div', label); card.className = 'card'; card.append(element('strong', formatValue(overall[key]))); cards.append(card); }
  results.append(cards);
  const splits = element('div'); splits.className = 'pair';
  splits.append(dataBlock('端末別', overall.device_split), dataBlock('流入別', overall.traffic_source_split)); results.append(splits);
  results.append(element('h2', 'ゲーム一覧'));
  const scroller = element('div'); scroller.className = 'scroll';
  const table = element('table'); const head = element('tr');
  ['ゲーム / 詳細', '表示', 'クリック', 'CTR', '開始', '2RUN率（1→2）', '3RUN率（2→3）', 'RUN中央値（秒）', '再訪', '主な離脱', 'エラー'].forEach(label => head.append(element('th', label))); table.append(head);
  const detail = element('section'); detail.id = 'game-detail';
  for (const game of summary.games as RecordData[]) {
    const row = element('tr'); const id = String(game.game_id ?? game.id ?? '不明');
    const entry = historicalGameCatalog.find(item => item.id === id);
    const button = element('button', `${id} ${entry?.titleJa ?? ''}${entry?.status === 'retired' ? '（退役）' : ''}`);
    button.addEventListener('click', () => renderDetail(detail, game, button.textContent!)); const name = element('td'); name.append(button); row.append(name);
    const values = [game.game_card_impressions, game.game_card_clicks, game.ctr, game.game_starts, game.second_run_rate, game.third_run_rate, game.median_run_duration ?? game.median_duration, game.seven_day_return_rate, JSON.stringify(game.top_exit_phases ?? null), game.client_error_count];
    values.forEach(value => row.append(element('td', formatValue(value)))); table.append(row);
  }
  scroller.append(table); results.append(scroller, detail);
  results.append(dataBlock('欠測・計測範囲', summary.coverage ?? summary.missing_data), dataBlock('日別履歴（ブラウザ数・訪問数は日をまたいで合算不可）', summary.history));
}
function dataBlock(title: string, data: unknown): HTMLElement {
  const section = element('section'); section.append(element('h3', title), element('pre', data == null ? '欠測' : JSON.stringify(data, null, 2))); return section;
}
function renderDetail(host: HTMLElement, game: RecordData, title: string) {
  host.replaceChildren(element('h2', title));
  const table = element('table'); const head = element('tr'); head.append(element('th', '到達地点'), element('th', '到達率 / 母数')); table.append(head);
  const funnel = game.funnel;
  if (Array.isArray(funnel)) for (const step of funnel as RecordData[]) { const row = element('tr'); row.append(element('td', String(step.step ?? step.name ?? step.label)), element('td', formatValue(step))); table.append(row); }
  else if (funnel && typeof funnel === 'object') for (const [name, value] of Object.entries(funnel)) { const row = element('tr'); row.append(element('td', name), element('td', formatValue(value))); table.append(row); }
  else host.append(element('p', 'このゲームの到達計測は欠測です。'));
  host.append(table, dataBlock('失敗理由', game.top_failure_reasons), dataBlock('離脱フェーズ', game.top_exit_phases), metricBlock('継続 / 回復 / 再訪', game, ['run1','run2','run3','second_run_rate','third_run_rate','measured_duration_count','failure_retry_rate','large_fall_recovery_rate','next_day_return_rate','seven_day_return_rate']), dataBlock('端末・流入・版・欠測', { device_split: game.device_split, traffic_source_split: game.traffic_source_split, versions: game.versions, measurement_coverage: game.measurement_coverage }));
}

function metricBlock(title: string, data: RecordData, keys: readonly string[]): HTMLElement {
  const section = element('section'); section.append(element('h3', title));
  const table = element('table');
  for (const key of keys) { const row = element('tr'); row.append(element('th', metricLabels[key] ?? key), element('td', formatValue(data[key]))); table.append(row); }
  section.append(table); return section;
}
