import './style.css';
import { StorageService } from '../../core/StorageService';
import { AudioService } from '../../core/AudioService';
import { TelemetryService, type EventName } from '../../core/TelemetryService';
import { analyticsConfig } from '../../analytics/config';
import { categories, kanaGroups, wordById } from './words';
import { createQuestion, guess, letterHint, nextQuestion, visibleLetters, wrongCount, type QuestionState } from './model';
import { questionTelemetry } from './telemetry';
import { emptySave, markReported, QuestionStore, type SaveData } from './persistence';

type State = 'title' | 'playing' | 'practice' | 'paused' | 'explanation' | 'result';
const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = el('app'), menu = el<HTMLDialogElement>('menu'), keyboard = el('keyboard'), tabs = el('kana-tabs'), answerControls = el('answer-controls');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game023:');
const audio = new AudioService(storage), telemetry = new TelemetryService(storage, 'game023', undefined, { remoteCollectionEnabled: false });
let backend: Storage | undefined;
try { backend = window.localStorage; } catch { /* Page-memory saves remain available. */ }
const store = new QuestionStore(backend);
const initialSeed = crypto.getRandomValues(new Uint32Array(1))[0];
let save: SaveData = store.read() ?? emptySave(initialSeed);
let question: QuestionState = save.current?.question ?? createQuestion('w_food_001', save.seed);
let state: State = 'title', returnState: 'playing' | 'practice' = 'playing', group = 0, practiceStep = 0;
let message = 'カテゴリを手がかりに、かなを選ぼう。', epoch = 0, blockUntil = 0;
const pointerEpoch = new WeakMap<Element, number>();
const playing = () => state === 'playing' || state === 'practice';
const practice = () => state === 'practice' || returnState === 'practice' && ['paused', 'explanation', 'result'].includes(state);
function trainingEvent(name: EventName, data: Record<string, string | number | boolean> = {}): void {
  if (analyticsConfig.environment !== 'production') telemetry.trackEvent(name, { ...data, mode: 'practice' });
}
function data(): Record<string, string | number | boolean> {
  return questionTelemetry(question);
}
function actionEvent(event: string): void {
  if (!save.current || practice()) return;
  telemetry.trackEvent('specific_game_events', { event, ...data() });
}
function persist(): void {
  // Practice never replaces a saved production question. Overlays persist as paused.
  if (practice()) return;
  if (save.current) {
    save.current.question = question;
    save.state = question.outcome !== 'playing' ? 'result' : state === 'playing' ? 'playing' : 'paused';
  } else save.state = 'title';
  store.write(save);
}
function mode(next: State): void {
  state = next; app.dataset.state = state; epoch++; blockUntil = performance.now() + 180;
  answerControls.inert = !playing();
  if (playing() && menu.open) menu.close();
  sync(); persist();
}
function focusKey(): void { keyboard.querySelector<HTMLButtonElement>('[aria-disabled="false"]')?.focus({ preventScroll: true }); }
function show(html: string, next: State): void {
  mode(next);
  menu.innerHTML = html + '<p class="menu-return"><a id="menu-portal-link" href="./index.html" class="arcade-portal-return">← ゲーム一覧へ</a></p>';
  if (!menu.open) menu.show();
  el('menu-portal-link').onclick = returnToPortal;
  // Native opening may scroll to the first action; show the heading/answer first.
  const heading = menu.querySelector<HTMLElement>('#menu-title');
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  menu.scrollTop = 0;
}
function sync(): void {
  const focused = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.kana : undefined;
  const focusedTab = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.group : undefined;
  const word = wordById.get(question.word_id)!, visible = visibleLetters(question);
  el('category').textContent = categories[word.category]; el('word-length').textContent = `${[...word.reading].length}文字`;
  el('word').innerHTML = visible.map((kana, i) => `<span class="letter ${kana ? 'revealed' : 'hidden-letter'}" aria-label="${i + 1}文字目 ${kana ?? '伏せ字'}">${kana ?? '＿'}</span>`).join('');
  el('word').setAttribute('aria-label', visible.map(kana => kana ?? '伏せ字').join('、'));
  el('remaining').textContent = `${question.remaining}回`;
  el('dots').innerHTML = Array.from({ length: 8 }, (_, i) => `<i class="dot ${i >= question.remaining ? 'used' : ''}"></i>`).join('');
  el('feedback').textContent = message;
  el('question-caption').textContent = practice() ? `練習 ${practiceStep + 1} / 2 · 記録には入りません` : '時間制限なし · かなをひとつ選ぼう';
  tabs.innerHTML = kanaGroups.map((item, i) => `<button type="button" role="tab" id="tab-${item.id}" data-game-control data-group="${i}" aria-selected="${group === i}" aria-controls="keyboard" tabindex="${group === i ? 0 : -1}">${item.label}</button>`).join('');
  keyboard.setAttribute('aria-labelledby', `tab-${kanaGroups[group].id}`);
  const slots: readonly string[] = group === 0 ? [...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもや　ゆ　よらりるれろわ　　　をん'] : kanaGroups[group].keys;
  keyboard.innerHTML = slots.map(kana => {
    if (kana === '　') return '<span class="kana-gap" aria-hidden="true"></span>';
    const used = question.guessed.includes(kana), hit = used && word.reading.includes(kana), status = used ? hit ? '正解・選択済み' : 'はずれ・選択済み' : '未選択';
    return `<button class="kana-key" type="button" data-game-interaction data-kana="${kana}" data-result="${used ? hit ? 'hit' : 'miss' : 'unselected'}" aria-disabled="${used}" aria-label="${kana}、${status}">${kana}<span class="mark" aria-hidden="true">${used ? hit ? '○' : '－' : ''}</span></button>`;
  }).join('');
  el<HTMLButtonElement>('hint-button').disabled = !playing() || question.hintUsed || question.outcome !== 'playing';
  el('hint-button').textContent = question.hintUsed ? 'ヒント使用済み' : '1文字ヒント';
  el<HTMLButtonElement>('help-button').disabled = !playing(); el<HTMLButtonElement>('pause-button').disabled = !playing();
  el('practice-actions').hidden = state !== 'practice';
  if (playing() && focused) keyboard.querySelector<HTMLButtonElement>(`[data-kana="${focused}"]`)?.focus({ preventScroll: true });
  if (playing() && focusedTab) tabs.querySelector<HTMLButtonElement>(`[data-group="${focusedTab}"]`)?.focus({ preventScroll: true });
}
function finishRun(outcome: 'correct' | 'ended' | 'quit'): void {
  if (!save.current || !markReported(save)) return;
  // Flag and ledger become durable together, before a one-time report. No totals/BEST.
  if (outcome !== 'quit') { save.current.question = question; save.state = 'result'; }
  else { save.current = null; save.state = 'title'; }
  store.write(save);
  telemetry.trackEvent('run_end', { ...data(), outcome, completed: outcome === 'correct' });
}
function start(source = 'direct'): void {
  if (save.current && !save.current.reported) finishRun('quit');
  const cycle = nextQuestion(save.seed, save.history);
  question = cycle.question; save.history = cycle.history; save.seed = cycle.seed; returnState = 'playing'; group = 0;
  telemetry.trackEvent('run_start', { source, ...data() });
  const runId = telemetry.getActiveRunId();
  // The shared TelemetryService always creates a UUID for new runs, including denied consent.
  if (!runId) throw new Error('Run context missing');
  save.current = { question, run_id: runId, reported: false };
  message = 'カテゴリを手がかりに、かなを選ぼう。'; mode('playing'); focusKey(); void audio.unlock();
}
function title(): void {
  if (save.current && !save.current.reported) finishRun('quit');
  save.current = null; returnState = 'playing'; message = 'カテゴリを手がかりに、かなを選ぼう。';
  show('<p class="eyebrow">KANA GUESS</p><h2 id="menu-title">伏字ことば</h2><p>一文字わかると、ことばが見える。<br>カテゴリを手がかりに、かなを選ぼう。</p><div class="menu-actions"><button id="play-button" class="primary" type="button" data-game-control>すぐ遊ぶ</button><button id="explain-button" type="button" data-game-control>説明を見る</button><button id="practice-button" type="button" data-game-control>練習する</button></div><p class="save-note">制限時間なし。間違いは8回まで。<br>途中の問題はこの端末に保存します。</p>', 'title');
  el('play-button').onclick = () => { telemetry.trackEvent('tutorial_skip', { source: 'title' }); start(); };
  el('explain-button').onclick = () => explain(false); el('practice-button').onclick = startPractice;
}
function explain(inQuestion: boolean): void {
  if (inQuestion) returnState = state === 'practice' ? 'practice' : 'playing';
  if (!practice()) telemetry.trackEvent('tutorial_view', { source: inQuestion ? 'playing' : 'title' });
  show(`<p class="eyebrow">HOW TO PLAY</p><h2 id="menu-title">かなを、ひとつずつ。</h2><ol><li>カテゴリと文字数を見て、かなを選びます。</li><li>含まれていたら、同じ文字の場所が全部開きます。</li><li>含まれない時だけ残り回数が減ります。同じ文字を選び直しても減りません。</li><li>全部開くと正解。8回間違えたら答えを見て、次のことばへ。</li><li>「が」と「か」、「っ」と「つ」は別の文字。区分を切り替えて探せます。</li></ol><p>1文字ヒントは1問に1回。残り回数は減りません。時間制限・広告・CREDITはありません。</p><div class="menu-actions"><button id="continue-button" class="primary" data-game-control>${inQuestion ? '問題へ戻る' : 'すぐ遊ぶ'}</button><button id="practice-button" data-game-control>練習する</button>${inQuestion ? '' : '<button id="title-button" data-game-control>タイトルへ</button>'}</div>`, 'explanation');
  el('continue-button').onclick = () => { if (inQuestion) { mode(returnState); focusKey(); } else start('explanation'); };
  el('practice-button').onclick = startPractice; if (!inQuestion) el('title-button').onclick = title;
}
const practiceWords = ['w_food_001', 'w_food_002'];
function practiceQuestion(): void {
  question = createQuestion(practiceWords[practiceStep], 23); group = 0;
  message = practiceStep === 0 ? '練習：答えは「おにぎり」。まず「お」を選ぼう。濁音の「ぎ」も探してみよう。' : '練習：答えは「きゃべつ」。小文字の「ゃ」と濁音の「べ」を探してみよう。';
  mode('practice'); focusKey(); void audio.unlock();
}
function startPractice(): void {
  if (save.current && !save.current.reported) finishRun('quit');
  save.current = null; save.state = 'title'; store.write(save);
  returnState = 'practice'; practiceStep = 0; trainingEvent('practice_start'); practiceQuestion();
}
function result(): void {
  const training = practice(), word = wordById.get(question.word_id)!, correct = question.outcome === 'correct';
  if (training && correct) trainingEvent('tutorial_step_complete', { step: practiceStep + 1 });
  if (training && correct && practiceStep === 1) { trainingEvent('practice_complete', { count: 2 }); storage.writeBoolean('practiceCompleted', true); }
  if (!training) finishRun(correct ? 'correct' : 'ended');
  const nextLabel = training ? correct ? practiceStep === 0 ? '次の練習' : '本番を遊ぶ' : 'この練習をもう一度' : '次のことば';
  show(`<p class="eyebrow">${training ? 'PRACTICE' : 'KANA GUESS'}</p><h2 id="menu-title">${correct ? training && practiceStep === 1 ? '練習できました。' : 'ことばが、見えました。' : '答えを見て、ひと息。'}</h2><p class="answer-word">${word.reading}</p><p class="result-detail">${categories[word.category]} · ${[...word.reading].length}文字<br>間違い ${wrongCount(question)}回 / 8回 · ヒント ${question.hintUsed ? '使用' : 'なし'}<br>${word.clue}</p><div class="menu-actions"><button id="next-button" class="primary" data-game-control>${nextLabel}</button><button id="result-title-button" data-game-control>タイトルへ</button></div>`, 'result');
  el('next-button').onclick = () => {
    if (training) { if (correct && practiceStep === 1) start('practice'); else { if (correct) practiceStep++; practiceQuestion(); } }
    else { telemetry.trackEvent('retry', { source: 'next' }); start('next'); }
  };
  el('result-title-button').onclick = title;
}
function choose(kana: string): void {
  if (!playing() || performance.now() < blockUntil) return;
  const outcome = guess(question, kana);
  if (!outcome.changed) return;
  question = outcome.question; message = outcome.hit ? `「${kana}」が開きました。` : `「${kana}」は含まれていません。`;
  if (state === 'playing') { actionEvent('kana_guess'); if (question.outcome === 'playing') persist(); }
  audio.tone(outcome.hit ? 460 : 310, outcome.hit ? 540 : 290, .055, 'sine', 0, .012);
  sync(); if (question.outcome !== 'playing') result();
}
keyboard.addEventListener('click', event => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-kana]'); if (button) choose(button.dataset.kana!); });
function switchGroup(index: number, focus = true): void { if (!playing()) return; group = index; sync(); if (focus) tabs.querySelector<HTMLButtonElement>(`[data-group="${group}"]`)?.focus({ preventScroll: true }); }
tabs.addEventListener('click', event => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-group]'); if (button) switchGroup(Number(button.dataset.group)); });
tabs.addEventListener('keydown', event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); switchGroup(event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (group + (event.key === 'ArrowLeft' ? 2 : 1)) % 3); });
keyboard.addEventListener('keydown', event => {
  if (!playing() || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault(); const keys = [...keyboard.children] as HTMLElement[], current = Math.max(0, keys.indexOf(document.activeElement as HTMLElement));
  const columns = innerWidth <= 620 ? 5 : 10, delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' ? -columns : columns;
  let target = event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1 : (current + delta + keys.length) % keys.length;
  for (let attempt = 0; attempt < keys.length && !keys[target]?.dataset.kana; attempt++) target = (target + (delta < 0 ? -1 : 1) + keys.length) % keys.length;
  keys[target]?.focus();
});
el('hint-button').onclick = () => {
  if (!playing() || performance.now() < blockUntil) return;
  const outcome = letterHint(question); if (!outcome.changed) return;
  question = outcome.question; message = `ヒントで「${question.hintLetter}」が開きました。`;
  if (state === 'playing') { actionEvent('kana_hint'); if (question.outcome === 'playing') persist(); }
  sync(); if (question.outcome !== 'playing') result();
};
function pause(restored = false): void {
  if (!playing() && !restored) return;
  returnState = state === 'practice' ? 'practice' : 'playing';
  if (!practice()) telemetry.trackEvent('pause', { source: restored ? 'restore' : 'button' });
  show(`<h2 id="menu-title">${restored ? '保存したことばから。' : 'ひと休み。'}</h2><p>問題はそのまま。いつでも続けられます。<br>${store.memoryOnly ? '保存できないため、この画面を閉じると途中の問題は失われます。' : 'この端末に途中の問題を保存しています。'}</p><div class="menu-actions"><button id="resume-button" class="primary" data-game-control>続ける</button><button id="pause-title-button" data-game-control>タイトルへ</button></div>`, 'paused');
  if (!practice() && save.current) actionEvent('question_saved');
  el('resume-button').onclick = resume; el('pause-title-button').onclick = title;
}
function resume(): void { if (!practice()) telemetry.trackEvent('resume', { source: 'pause', ...data(), resumed: true }); mode(returnState); focusKey(); void audio.unlock(); }
el('pause-button').onclick = () => pause(); el('help-button').onclick = () => explain(true);
el('practice-play-button').onclick = () => start('practice_skip'); el('practice-title-button').onclick = title;
el('mute-button').onclick = () => { el('mute-button').textContent = audio.toggle() ? '音 OFF' : '音 ON'; el('mute-button').setAttribute('aria-pressed', String(audio.muted)); };
el('mute-button').textContent = audio.muted ? '音 OFF' : '音 ON'; el('mute-button').setAttribute('aria-pressed', String(audio.muted));
function returnToPortal(): void { if (save.current && !save.current.reported) { save.current.question = question; save.state = 'paused'; store.write(save); } telemetry.trackEvent('return_to_portal', { source: state }); }
el('portal-link').addEventListener('click', returnToPortal);
// Guard native clicks across overlays without replacing native tap/click semantics.
document.addEventListener('pointerdown', event => { const target = (event.target as HTMLElement).closest('button, a'); if (target) pointerEpoch.set(target, epoch); }, true);
document.addEventListener('click', event => {
  const target = (event.target as HTMLElement).closest('button');
  if (target && app.contains(target) && event.detail > 0 && (performance.now() < blockUntil || pointerEpoch.get(target) !== epoch)) { event.preventDefault(); event.stopImmediatePropagation(); }
}, true);
document.addEventListener('keydown', event => {
  const gameTarget = event.target instanceof HTMLElement && app.contains(event.target);
  if (gameTarget && event.repeat && ['Enter', ' '].includes(event.key)) { event.preventDefault(); return; }
  if (event.key === 'Escape') { if (playing()) { event.preventDefault(); pause(); } else if (['paused', 'explanation'].includes(state) && (save.current || returnState === 'practice')) { event.preventDefault(); resume(); } }
}, true);
menu.addEventListener('cancel', event => { event.preventDefault(); if (['paused', 'explanation'].includes(state) && (save.current || returnState === 'practice')) resume(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }); window.addEventListener('blur', () => pause());
window.addEventListener('pagehide', () => { persist(); if (save.current && !save.current.reported && !practice()) actionEvent('question_saved'); audio.destroy(); }, { once: true });
telemetry.trackEvent('game_open');
if (save.current) {
  question = save.current.question;
  telemetry.restoreRun(save.current.run_id);
  actionEvent('question_restored');
  if (question.outcome !== 'playing') result(); else pause(true);
} else title();
if (import.meta.env.DEV) Object.defineProperty(window, '__game023', { get: () => ({ state, group, question: structuredClone(question), save: structuredClone(save), practiceStep, telemetry: telemetry.getEvents() }) });
