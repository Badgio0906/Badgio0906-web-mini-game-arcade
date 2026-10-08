import { historicalGameCatalog } from '../data/gameCatalog';
import { recordBoards } from '../data/recordDefinitions';

export type ReviewDecision = 'accept' | 'reject' | 'revoke' | 'restore';
type SubmissionStatus = 'pending' | 'accepted' | 'rejected' | 'revoked' | 'withdrawn';
type Submission = { id: string; board_id: string; value: number; received_at: string; status: SubmissionStatus; inspection_reason: string | null; metadata_json: string };
type PublicBoard = { board_id: string; game_id: string; value: number | null; unit: string; mode_label: string; ruleset_id: string; collected_since: string | null; revision: number };
const statuses: SubmissionStatus[] = ['pending', 'accepted', 'rejected', 'revoked', 'withdrawn'];
const labels: Record<SubmissionStatus, string> = { pending: '確認中', accepted: '受付済み', rejected: '拒否', revoked: '取消済み', withdrawn: '本人撤回済み' };
const decisions: Record<ReviewDecision, string> = { accept: '承認', reject: '拒否', revoke: '取消', restore: '再審査へ戻す' };

/** This feature has a separate endpoint switch; the Telemetry endpoint never enables writes. */
export function recordsAdminUrl(endpoint: string, path: string, query?: Record<string, string>): URL {
  if (!endpoint.trim()) throw new Error('共有記録管理は準備中です。');
  const url = new URL(endpoint);
  if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) throw new Error('共有記録の接続設定を確認してください。');
  if (url.pathname !== '/' && !/^\/v1\/records\/?$/.test(url.pathname)) throw new Error('共有記録の接続設定を確認してください。');
  if (!/^\/(public\/bests|admin\/submissions|admin\/submissions\/[0-9a-f-]{36}\/review|admin\/boards\/[a-zA-Z0-9_.:-]{1,160}\/recalculate)$/.test(path)) throw new Error('記録管理の経路が一致しません。');
  url.pathname = '/v1/records' + path;
  if (query) url.search = new URLSearchParams(query).toString();
  return url;
}
export function reviewChoices(status: string): ReviewDecision[] {
  if (status === 'pending') return ['accept', 'reject'];
  if (status === 'accepted') return ['revoke'];
  if (status === 'revoked' || status === 'rejected') return ['restore'];
  return [];
}
export function reviewReason(value: string): string {
  const reason = value.trim();
  if (!reason || reason.length > 240 || /[\x00-\x1f]/.test(reason)) throw new Error('理由を1〜240文字で入力してください（改行不可）。');
  return reason;
}
export function adminRecordValue(boardId: string, value: number): string {
  const definition = recordBoards.find(item => item.boardId === boardId);
  if (!definition) return `${new Intl.NumberFormat('ja-JP').format(value)}（保存単位・条件未対応）`;
  return `${new Intl.NumberFormat('ja-JP', { minimumFractionDigits: definition.displayPrecision, maximumFractionDigits: definition.displayPrecision }).format(value / definition.storageScale)} ${definition.unit}`;
}
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag); if (text !== undefined) result.textContent = text; return result;
}
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function parseSubmissions(value: unknown): Submission[] {
  if (!object(value) || !Array.isArray(value.submissions) || value.submissions.length > 100) throw new Error('記録管理APIの形式が一致しません。');
  return value.submissions.map(item => {
    if (!object(item) || typeof item.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(item.id) || typeof item.board_id !== 'string' || typeof item.value !== 'number' || !Number.isSafeInteger(item.value) || item.value < 0 || typeof item.received_at !== 'string' || !statuses.includes(item.status as SubmissionStatus)) throw new Error('記録管理APIの形式が一致しません。');
    return { id: item.id, board_id: item.board_id, value: item.value, received_at: item.received_at, status: item.status as SubmissionStatus, inspection_reason: typeof item.inspection_reason === 'string' ? item.inspection_reason : null, metadata_json: typeof item.metadata_json === 'string' ? item.metadata_json : '{}' };
  });
}
function parseBoards(value: unknown): PublicBoard[] {
  if (!object(value) || !Array.isArray(value.boards) || value.boards.length > 200) throw new Error('公開BEST APIの形式が一致しません。');
  return value.boards.map(item => {
    if (!object(item) || typeof item.board_id !== 'string' || !/^[a-zA-Z0-9_.:-]{1,160}$/.test(item.board_id) || typeof item.game_id !== 'string' || item.value !== null && (typeof item.value !== 'number' || !Number.isSafeInteger(item.value) || item.value < 0)) throw new Error('公開BEST APIの形式が一致しません。');
    return { board_id: item.board_id, game_id: item.game_id, value: item.value as number | null, unit: String(item.unit ?? ''), mode_label: String(item.mode_label ?? ''), ruleset_id: String(item.ruleset_id ?? ''), collected_since: typeof item.collected_since === 'string' ? item.collected_since : null, revision: Number(item.revision ?? 0) };
  });
}
function metadataText(raw: string): string {
  try {
    const data: unknown = JSON.parse(raw); if (!object(data)) return '条件情報なし';
    return ['mode_id', 'assistance', 'duration_ms', 'outcome'].filter(key => typeof data[key] === 'string' || typeof data[key] === 'number').map(key => `${key}: ${String(data[key])}`).join(' / ') || '条件情報なし';
  } catch { return '条件情報なし'; }
}

export function mountRecordsAdmin(host: HTMLElement, endpoint: string, getToken: () => string): { clear: () => void } {
  const section = node('section'); section.id = 'records-admin';
  section.append(node('h2', '共有記録管理'), node('p', '共有された候補だけを審査します。数字の新規入力はできません。管理トークンは上の入力欄を使用し、端末へ保存しません。'));
  const controls = node('div'); controls.className = 'records-controls';
  const board = node('select'); board.id = 'records-board'; board.setAttribute('aria-label', '対象board'); board.append(new Option('すべてのboard', ''));
  const state = node('select'); state.id = 'records-state'; state.setAttribute('aria-label', '審査状態'); state.append(new Option('最近の全状態', '')); for (const status of statuses) state.append(new Option(labels[status], status));
  const load = node('button', '共有記録を取得'); load.type = 'button'; load.id = 'records-load';
  const recalculate = node('button', '選択boardのBEST再計算'); recalculate.type = 'button'; recalculate.id = 'records-recalculate';
  controls.append(board, state, load, recalculate);
  const status = node('p', endpoint ? '管理トークンを入力して取得してください。最新100候補まで表示します。' : '共有記録管理は準備中です。記録用接続先が未設定のため取得・更新できません。'); status.id = 'records-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const display = node('div'); display.className = 'records-display';
  const dialog = node('dialog'); dialog.className = 'records-confirm';
  const confirmation = node('form'); confirmation.method = 'dialog';
  const target = node('p'); const reasonLabel = node('label', '操作理由（1〜240文字、改行不可）');
  const reason = node('input'); reason.name = 'reason'; reason.maxLength = 240; reason.required = true; reason.autocomplete = 'off'; reasonLabel.append(reason);
  const cancel = node('button', '中止'); cancel.type = 'button';
  const confirm = node('button', '確認して実行'); confirm.type = 'submit';
  confirmation.append(node('h3', '共有記録の操作確認'), target, reasonLabel, cancel, confirm); dialog.append(confirmation);
  section.append(controls, status, display, dialog); host.append(section);
  let pending: AbortController | null = null;
  let busy = false;
  let boards: PublicBoard[] = [];
  let action: { path: string; decision?: ReviewDecision; boardId: string } | null = null;
  function disabled() { board.disabled = state.disabled = load.disabled = busy || !endpoint; recalculate.disabled = busy || !endpoint || !board.value || !boards.some(item => item.board_id === board.value); for (const button of display.querySelectorAll<HTMLButtonElement>('button')) button.disabled = busy || !endpoint; confirm.disabled = busy; }
  function clear() {
    pending?.abort(); pending = null; busy = false; boards = []; action = null;
    display.replaceChildren(); board.replaceChildren(new Option('すべてのboard', '')); reason.value = ''; if (dialog.open) dialog.close();
    status.className = ''; status.textContent = endpoint ? '共有記録の表示を消去しました。' : '共有記録管理は準備中です。記録用接続先が未設定のため取得・更新できません。'; disabled();
  }
  async function request(path: string, controller: AbortController, token: string | null, body?: unknown, query?: Record<string, string>): Promise<unknown> {
    const headers: Record<string, string> = {}; if (token !== null) headers.Authorization = `Bearer ${token}`; if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(recordsAdminUrl(endpoint, path, query), { method: body === undefined ? 'GET' : 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error' });
    // Use fixed errors: never reflect a server response, token, receipt, or exception into UI/logs.
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? '認証できません。管理トークンを確認してください。' : response.status === 409 ? '候補の状態が変わりました。再取得して確認してください。' : response.status === 503 ? '共有記録サービスは準備中です。' : `共有記録APIが応答できませんでした（HTTP ${response.status}）。`);
    return response.json();
  }
  async function refresh(controller: AbortController, token: string) {
    const query = { limit: '100', ...(board.value ? { board_id: board.value } : {}), ...(state.value ? { status: state.value } : {}) };
    const [publicData, submissionData] = await Promise.all([request('/public/bests', controller, null), request('/admin/submissions', controller, token, undefined, query)]);
    if (pending !== controller) return;
    const nextBoards = parseBoards(publicData), submissions = parseSubmissions(submissionData), selected = board.value;
    boards = nextBoards; board.replaceChildren(new Option('すべてのboard', ''));
    for (const item of boards) board.append(new Option(`${item.game_id} · ${item.mode_label} · ${item.board_id}`, item.board_id));
    board.value = selected; render(submissions);
  }
  async function operate(write = false) {
    if (busy || !endpoint) return;
    let token = getToken().trim(); if (!token) { status.className = 'error'; status.textContent = '管理トークンを入力してください。'; return; }
    let body: Record<string, string> | undefined;
    if (write) {
      if (!action) return;
      try { body = { operation_key: crypto.randomUUID(), reason: reviewReason(reason.value), ...(action.decision ? { decision: action.decision } : {}) }; } catch (error) { status.textContent = error instanceof Error ? error.message : '理由を確認してください。'; return; }
    }
    const selectedAction = action; const controller = new AbortController(); pending = controller; busy = true; disabled();
    const timeout = window.setTimeout(() => controller.abort(), 15000); let written = false;
    status.className = ''; status.textContent = write ? '操作を送信しています…' : '共有記録を取得しています…';
    try {
      if (write && selectedAction) { await request(selectedAction.path, controller, token, body); written = true; if (pending !== controller) return; dialog.close(); reason.value = ''; action = null; }
      await refresh(controller, token); if (pending !== controller) return;
      status.textContent = written ? '操作を受け付け、候補とBESTを再取得しました。公開側のキャッシュは最大60秒程度残る場合があります。' : '共有記録を取得しました（最近100候補まで）。';
    } catch (error) {
      if (pending !== controller) return;
      status.className = 'error';
      status.textContent = written ? '操作は受け付け済みですが再取得に失敗しました。再取得して現在の状態を確認してください。' : error instanceof Error && error.name !== 'AbortError' && /^(認証|候補|共有記録|記録管理|公開BEST)/.test(error.message) ? error.message : write ? '操作結果を確認できません。再送前に再取得してください。' : '共有記録を取得できませんでした。接続を確認してください。';
      // A timed-out write may have completed. Never automatically submit it a second time.
      if (write) { action = null; dialog.close(); reason.value = ''; }
    } finally { token = ''; window.clearTimeout(timeout); if (pending === controller) { pending = null; busy = false; disabled(); } }
  }
  function propose(path: string, boardId: string, description: string, decision?: ReviewDecision) {
    if (busy || !endpoint || dialog.open) return; action = { path, decision, boardId }; target.textContent = description; reason.value = ''; dialog.showModal(); reason.focus();
  }
  function render(submissions: Submission[]) {
    display.replaceChildren(); const bests = node('div'); bests.className = 'records-bests';
    for (const item of boards.filter(item => !board.value || item.board_id === board.value)) {
      const name = historicalGameCatalog.find(entry => entry.id === item.game_id)?.titleJa ?? item.game_id;
      const card = node('div'); card.className = 'card'; card.append(node('h3', `${name} · ${item.mode_label}`), node('p', `board: ${item.board_id} / rules: ${item.ruleset_id}`), node('strong', item.value === null ? 'まだ記録なし' : `現在BEST: ${adminRecordValue(item.board_id, item.value)}`), node('small', `集計開始: ${item.collected_since ?? '準備中'} / revision: ${item.revision}`)); bests.append(card);
    }
    display.append(bests, node('h3', '最近の候補・保留候補'));
    if (!submissions.length) { display.append(node('p', '指定条件の候補はありません。')); return; }
    const scroller = node('div'); scroller.className = 'scroll'; const table = node('table'); const head = node('tr');
    for (const label of ['内部ID / board', '値 / 条件', '受付日時 / 状態', '検査理由', '操作']) head.append(node('th', label)); table.append(head);
    for (const item of submissions) {
      const row = node('tr'); row.append(node('td', `${item.id}\n${item.board_id}`), node('td', `${adminRecordValue(item.board_id, item.value)}\n保存整数: ${item.value}\n${metadataText(item.metadata_json)}`), node('td', `${item.received_at}\n${labels[item.status]}`), node('td', item.inspection_reason ?? '指摘なし'));
      const actions = node('td'); for (const decision of reviewChoices(item.status)) { const button = node('button', decisions[decision]); button.type = 'button'; button.addEventListener('click', () => propose(`/admin/submissions/${item.id}/review`, item.board_id, `${decisions[decision]}: ${item.id} / ${item.board_id} / 値 ${adminRecordValue(item.board_id, item.value)}（保存整数: ${item.value}） / ${labels[item.status]}${decision === 'restore' ? '。即公開せず確認中へ戻します。' : ''}`, decision)); actions.append(button); } row.append(actions); table.append(row);
    }
    scroller.append(table); display.append(scroller);
  }
  load.addEventListener('click', () => { void operate(); }); board.addEventListener('change', disabled);
  recalculate.addEventListener('click', () => { if (board.value && boards.some(item => item.board_id === board.value)) propose(`/admin/boards/${board.value}/recalculate`, board.value, `board ${board.value} の受付済み候補からBESTを再計算します。任意の値を追加しません。`); });
  cancel.addEventListener('click', () => { if (!busy) { action = null; reason.value = ''; dialog.close(); } });
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); else { action = null; reason.value = ''; } });
  confirmation.addEventListener('submit', event => { event.preventDefault(); void operate(true); }); disabled();
  return { clear };
}
