import { answerLabel, IMAGE_POOL, UnkoRun } from './UnkoRun';
import type { QuizAnswer, QuizPhase, QuizSide, UnkoController, UnkoHooks } from './contracts';

type Action = 'advance' | 'ready' | QuizAnswer;
interface Approval { roundId: number; phase: QuizPhase; action: Action }
const timed = (phase: QuizPhase): boolean => phase === 'image_answer' || phase === 'text_answer' || phase === 'final_answer';

export function createUnkoGame(parent: HTMLElement, hooks: UnkoHooks): UnkoController {
  const root = document.createElement('div'); root.className = 'unko-board';
  root.innerHTML = `<div class="question-top"><span class="question-phase"></span><strong class="question-progress"></strong></div><div class="question-timer"><div class="timer-track"><i></i></div><span></span></div><div class="question-stage"><div class="icon-spot"><img alt="" draggable="false" /><span class="image-fallback" hidden></span></div><div class="question-copy"><small></small><h2></h2><p></p></div></div><div class="question-status" role="status"></div><div class="answer-choices"><button type="button" id="left-button" class="answer-button"><small>← / A</small><strong></strong></button><button type="button" id="right-button" class="answer-button"><small>→ / D</small><strong></strong></button></div><div class="question-actions"><button type="button" id="continue-button">続ける <small>Space / Enter / タップ</small></button><button type="button" id="ready-button">準備OK、答える！ <small>離すと回答が始まります</small></button></div><div class="final-choices"><button type="button" id="unko-mode-button">ウンコMODE</button><button type="button" id="ukon-mode-button">ウコンMODE</button></div>`;
  parent.append(root);
  const phaseLabel = root.querySelector<HTMLElement>('.question-phase')!; const progress = root.querySelector<HTMLElement>('.question-progress')!;
  const stage = root.querySelector<HTMLElement>('.question-stage')!; const spot = root.querySelector<HTMLElement>('.icon-spot')!;
  const image = root.querySelector<HTMLImageElement>('.icon-spot img')!; const fallback = root.querySelector<HTMLElement>('.image-fallback')!;
  const kicker = root.querySelector<HTMLElement>('.question-copy small')!; const question = root.querySelector<HTMLElement>('.question-copy h2')!; const description = root.querySelector<HTMLElement>('.question-copy p')!;
  const status = root.querySelector<HTMLElement>('.question-status')!;
  const choices = root.querySelector<HTMLElement>('.answer-choices')!; const actions = root.querySelector<HTMLElement>('.question-actions')!; const finalChoices = root.querySelector<HTMLElement>('.final-choices')!;
  const fill = root.querySelector<HTMLElement>('.timer-track i')!; const seconds = root.querySelector<HTMLElement>('.question-timer span')!;
  const left = root.querySelector<HTMLButtonElement>('#left-button')!; const right = root.querySelector<HTMLButtonElement>('#right-button')!;
  const continueButton = root.querySelector<HTMLButtonElement>('#continue-button')!; const readyButton = root.querySelector<HTMLButtonElement>('#ready-button')!;
  const unkoButton = root.querySelector<HTMLButtonElement>('#unko-mode-button')!; const ukonButton = root.querySelector<HTMLButtonElement>('#ukon-mode-button')!;
  const cache = IMAGE_POOL.map(asset => { const img = new Image(); img.decoding = 'async'; img.src = import.meta.env.BASE_URL + asset.asset; return img; });
  let assetsReady = false;
  const assetReadiness = Promise.all(cache.map(img => img.decode().catch(() => undefined))).then(() => { assetsReady = true; });
  const abort = new AbortController(); const options = { signal: abort.signal };
  const run = new UnkoRun(event => hooks.onEvent(event));
  let title = true; let paused = false; let loading = false; let loadEpoch = 0; let destroyed = false; let notified = false; let frame = 0; let last = performance.now();
  let signature = ''; let timerSignature = ''; const keys = new Set<string>();
  let pendingKey: (Approval & { key: string }) | null = null;
  const pointers = new Map<number, Approval & { target: EventTarget | null }>();
  const modifiers = (event: MouseEvent | KeyboardEvent): boolean => event.altKey || event.ctrlKey || event.shiftKey || event.metaKey;
  const available = (): boolean => !destroyed && !title && !paused && !loading && run.snapshot().alive && !document.querySelector('dialog[open]');
  function clearInput(): void { keys.clear(); pendingKey = null; pointers.clear(); }
  function sync(now = performance.now()): void {
    const elapsed = Math.max(0, (now - last) / 1000); last = now;
    if (!title && !paused && !loading && !destroyed) run.step(elapsed);
  }
  function input(side: QuizSide): boolean {
    sync(); const epoch = run.snapshot().roundId;
    const accepted = available() && run.input(side, epoch); publish(); return accepted;
  }
  function action(action: Action, approval?: Approval): boolean {
    sync(); const s = run.snapshot();
    if (!available() || approval && (approval.roundId !== s.roundId || approval.phase !== s.phase)) { publish(); return false; }
    const accepted = action === 'advance' ? run.advance() : action === 'ready' ? run.ready() : run.chooseFinal(action);
    if (accepted) { pendingKey = null; pointers.clear(); }
    publish(); return accepted;
  }
  function nextAction(): Action | null {
    const phase = run.snapshot().phase;
    return phase === 'speed_warning' || phase === 'text_intro' ? 'advance' : phase === 'text_read' ? 'ready' : null;
  }
  function approval(action: Action): Approval { const s = run.snapshot(); return { action, roundId: s.roundId, phase: s.phase }; }
  function draw(): void {
    const s = run.snapshot(); const key = [title, paused, loading, s.phase, s.roundId, s.score].join('|');
    if (key !== signature) {
      signature = key; root.dataset.phase = title ? 'title' : s.phase; root.dataset.paused = String(paused); root.dataset.roundId = String(s.roundId);
      root.dataset.loading = String(loading);
      choices.hidden = title || !timed(s.phase); actions.hidden = title || !['speed_warning', 'text_intro', 'text_read'].includes(s.phase); finalChoices.hidden = title || s.phase !== 'final_choice';
      continueButton.hidden = s.phase !== 'speed_warning' && s.phase !== 'text_intro'; readyButton.hidden = s.phase !== 'text_read';
      spot.hidden = !title && s.question?.kind !== 'image';
      phaseLabel.textContent = title ? '二択。たった二択。' : s.finalMode ? `FINAL · ${answerLabel(s.finalMode)}MODE` : s.phase === 'final_choice' ? '20問 CLEAR · 次は？' : s.imageCorrect < 10 ? 'PHASE 1 · 画像' : 'PHASE 2 · 文章';
      progress.textContent = title ? 'UNKO or UKON' : s.finalMode ? `${s.finalStreak}連続` : s.phase === 'final_choice' ? '10 + 10' : s.imageCorrect < 10 ? `${Math.min(10, s.imageCorrect + 1)} / 10` : `${Math.min(10, s.textCorrect + 1)} / 10`;
      const asset = title ? IMAGE_POOL[0].asset : s.question?.image;
      if (asset && image.dataset.asset !== asset) { image.dataset.asset = asset; image.src = import.meta.env.BASE_URL + asset; image.alt = title ? 'ポップなウンコのゲームアイコン' : `${answerLabel(s.question!.answer)}のゲームアイコン`; fallback.hidden = true; }
      kicker.textContent = title ? '見ればわかる。' : s.phase === 'text_read' ? 'まずは読む · 時間制限なし' : s.phase === 'text_answer' ? 'さあ、どっち？' : s.phase === 'final_answer' ? '選んだ言葉を、ずっと。' : '';
      question.textContent = title ? 'ウンコ？ ウコン？' : s.phase === 'speed_warning' ? '正解です。' : s.phase === 'text_intro' ? '画像では余裕でしたね。' : s.phase === 'final_choice' ? '20問正解。' : s.question?.text ?? '';
      description.textContent = title ? '出てきたものを、左右で答えるだけ。' : s.phase === 'speed_warning' ? 'ここから先は1秒です。考えている暇はありません。' : s.phase === 'text_intro' ? 'では、文章でいきます。読んでから「準備OK」。' : s.phase === 'final_choice' ? 'もうウンコとウコンを見間違えることはないでしょう。たぶん。' : s.phase === 'text_read' ? '読み終えたら準備OK。選択肢が出てから0.8秒。' : '';
      if (s.choices) { left.querySelector('strong')!.textContent = answerLabel(s.choices[0]); right.querySelector('strong')!.textContent = answerLabel(s.choices[1]); }
      status.textContent = title ? 'クリック / タップ / ← → / A D' : loading ? '画像の準備中…時計はまだ動きません。' : paused ? 'PAUSE · 時計停止' : s.phase === 'ended' ? `${run.result()?.reason} 正解は「${answerLabel(run.result()!.expected)}」` : s.phase === 'text_read' ? '読む時間は、たっぷり。' : s.phase === 'final_choice' ? '選ぶ時間は無制限。開始すると0.5秒。' : timed(s.phase) ? '左右の位置は毎回ランダム。' : '押して離すと、次へ。';
    }
    const disabled = !available(); for (const b of [left, right, continueButton, readyButton, unkoButton, ukonButton]) if (b.disabled !== disabled) b.disabled = disabled;
    const remaining = s.remaining; const percent = !title && remaining !== null && s.deadline ? remaining / s.deadline * 100 : 0;
    const text = title ? '最初は5秒' : loading ? 'LOADING' : paused ? 'PAUSE' : s.phase === 'ended' ? 'END' : remaining === null ? '時間制限なし' : `${remaining.toFixed(2)} s`;
    const meterKey = percent.toFixed(2) + text;
    if (meterKey !== timerSignature) { timerSignature = meterKey; fill.style.width = `${percent}%`; seconds.textContent = text; }
  }
  image.addEventListener('error', () => { const s = run.snapshot(); fallback.textContent = `画像代替：${answerLabel(s.question?.answer ?? 'unko')}`; fallback.hidden = false; }, options);
  image.addEventListener('load', () => { fallback.hidden = true; }, options);
  function publish(): void {
    draw(); hooks.onUpdate(run.snapshot());
    if (!title && !notified && !run.snapshot().alive) { const result = run.result(); if (result) { notified = true; clearInput(); hooks.onEnd(result); } }
  }
  for (const [button, side] of [[left, 'left'], [right, 'right']] as const) {
    button.addEventListener('pointerdown', event => { if (!event.isPrimary || event.button !== 0 || modifiers(event)) return; event.preventDefault(); button.focus({ preventScroll: true }); input(side); }, options);
    button.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault(); if (event.repeat || modifiers(event) || keys.has(event.code)) return; keys.add(event.code); input(side);
    }, options);
    button.addEventListener('keyup', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); keys.delete(event.code); } }, options);
    button.addEventListener('click', event => { if (event.detail || (event as PointerEvent).pointerType || modifiers(event)) return; input(side); }, options);
  }
  function releaseControl(element: HTMLElement, assigned?: Action): void {
    element.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || modifiers(event) || !available()) return;
      const selected = assigned ?? nextAction(); if (!selected) return;
      pointers.set(event.pointerId, { ...approval(selected), target: element });
    }, options);
    element.addEventListener('pointercancel', event => { pointers.delete(event.pointerId); }, options);
    element.addEventListener('click', event => {
      if (modifiers(event)) return;
      const pointer = event as PointerEvent;
      const selected = assigned ?? nextAction(); if (!selected) return;
      if (event.detail || pointer.pointerType) {
        const permitted = pointers.get(pointer.pointerId); pointers.delete(pointer.pointerId);
        if (!permitted || permitted.target !== element) return; action(permitted.action, permitted);
      } else action(selected);
    }, options);
    if (element instanceof HTMLButtonElement) {
      element.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault(); if (event.repeat || modifiers(event) || keys.has(event.code) || !available()) return;
        keys.add(event.code); const selected = assigned ?? nextAction(); if (selected) pendingKey = { ...approval(selected), key: event.code };
      }, options);
      element.addEventListener('keyup', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault(); keys.delete(event.code); const permitted = pendingKey; pendingKey = null;
        if (permitted?.key === event.code && !modifiers(event)) action(permitted.action, permitted);
      }, options);
    }
  }
  releaseControl(continueButton, 'advance'); releaseControl(readyButton, 'ready'); releaseControl(unkoButton, 'unko'); releaseControl(ukonButton, 'ukon'); releaseControl(stage);
  document.addEventListener('keydown', event => {
    const control = (event.target as Element)?.closest('button,a,input,textarea,select,[contenteditable="true"]');
    if (modifiers(event) || control && control !== left && control !== right || !available()) return;
    const key = event.key.toLowerCase(); const side = key === 'arrowleft' || key === 'a' ? 'left' : key === 'arrowright' || key === 'd' ? 'right' : null;
    if (side) { event.preventDefault(); if (event.repeat || keys.has(event.code)) return; keys.add(event.code); input(side); return; }
    if (key !== ' ' && key !== 'enter' || control) return;
    event.preventDefault(); if (event.repeat || keys.has(event.code)) return; keys.add(event.code);
    const selected = nextAction(); if (selected) pendingKey = { ...approval(selected), key: event.code };
  }, options);
  document.addEventListener('keyup', event => {
    keys.delete(event.code); const permitted = pendingKey;
    if (permitted?.key !== event.code || (event.target as Element)?.closest('button')) return;
    event.preventDefault(); pendingKey = null; if (!modifiers(event)) action(permitted.action, permitted);
  }, options);
  window.addEventListener('blur', clearInput, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearInput(); }, options);
  function tick(now: number): void { sync(now); publish(); if (!destroyed) frame = requestAnimationFrame(tick); }
  draw(); frame = requestAnimationFrame(tick);
  return {
    start() {
      title = false; paused = false; notified = false; loading = !assetsReady; const epoch = ++loadEpoch;
      clearInput(); run.start(); last = performance.now(); signature = ''; publish();
      if (loading) void assetReadiness.then(() => { if (destroyed || title || epoch !== loadEpoch) return; loading = false; last = performance.now(); signature = ''; publish(); });
    },
    title() { title = true; paused = false; loading = false; loadEpoch++; clearInput(); run.reset(); last = performance.now(); signature = ''; publish(); },
    input, advance: () => action('advance'), ready: () => action('ready'), chooseFinal: mode => action(mode),
    pause(value) { sync(); paused = value; clearInput(); last = performance.now(); signature = ''; publish(); },
    snapshot: () => run.snapshot(), inspection: () => run.inspection(),
    destroy() { if (destroyed) return; destroyed = true; loadEpoch++; abort.abort(); cancelAnimationFrame(frame); clearInput(); cache.length = 0; root.remove(); },
  };
}
