import './onboarding.css';
import { PracticeSession, type PracticeAction, type PracticeSnapshot } from './PracticeSession';
import type { StorageService } from '../core/StorageService';
import type { TelemetryService } from '../core/TelemetryService';
import { arcadeConfig } from './config';
interface Options { gameId: string; storage: StorageService; telemetry: TelemetryService; practicePaint?: (canvas: HTMLCanvasElement, snapshot: PracticeSnapshot) => void; }
const lessons: Record<string, [string, string, string]> = {
  game001: ['タップで軌道をズラせ！', '赤い障害を避けて、長く回り続けよう。Space・Enter・タップで内側と外側を切り替えます。', '赤い障害は内側。タイミングを見て、外側へ。'],
  game002: ['前を見て、左右へひょいっ。', '前から来る人を避けて進もう。← → / A D、画面の左・右をタップすると1レーン動きます。', '真ん中に人が来ます。左右へ動いて、2人かわそう。'],
  game003: ['土台の上で、DROP。', '動いているブロックを、下のブロックに重ねよう。Space・クリック・タップで落とせます。', 'ブロックが土台の上に来たら、DROP！'],
  game004: ['光った順番を、もう一度。', 'WATCH中は見るだけ。光が終わったら、同じ順番で押そう。タップ・クリック、PCは1〜9。', 'WATCH · 左上、次に真ん中。光が終わったらあなたの番。'],
  game005: ['今のルールで、左か右へ。', '荷物と画面のルールを見比べて仕分けよう。← → / A D / 左右タップ。途中でルールが変わるので、そのたびに確認！', '練習のルール：丸いものは左、角ばったものは右。'],
  game006: ['角度と強さを、2回で決める。', '最初の入力で角度、次で強さを決めると車が動きます。Space・クリック・タップで枠にぴたりと駐車しよう。', 'ゆっくり練習。まず角度、次に強さを決めよう。'],
  game007: ['乗せる前に、重さを確認。', '上限は450 kg。現在の重さ＋NEXTの重さが上限以内なら乗せられます。← / Aで見送る、→ / Dで乗せる。', '200 kg乗車中。NEXTは60 kg。乗せても260 kgです。'],
  game008: ['水面を見て、小さく補正。', 'コーヒーをこぼさず運ぼう。左へ傾いたら右、右へ傾いたら左。← → / A D / 左右ボタンを短く押す・離す。', '左の水面が高くなっています。右→で中央へ戻そう。'],
  game009: ['探している印鑑を、見つけよう。', '依頼の色と形を見て、机の中から選ぼう。PCはクリック、スマホはタップ。今回は赤い印鑑だけ探します。', '探すもの：赤い印鑑。机の物を見比べて選ぼう。'],
  game010: ['聞くふりをして、こっそり内職。', 'Space・タップでLISTENとSIDE WORKを切り替えます。内職中は得点。上司が質問しそうなら、聞く姿勢へ戻ろう。', '内職を始めよう。「ところで…」が聞こえたらLISTENへ。'],
  game015: ['上を目指すな。うまく落ちろ。', 'DROPで足場を通り抜け、下へ降りよう。← → / A Dで空中移動、↓ / S / SpaceでDROP。長く落ちすぎると、着地衝撃に耐えられません。', '1 / 4 · DROPして、下の大きな足場へ。'],
  game011: ['ウンコ？ ウコン？ 文字を見て選ぼう。', '画像を見て、同じ名前のボタンを選びます。← → / A D または左右のボタン。ボタンの位置は毎回変わります。', '時間制限なしの練習。これはどちら？'],
};
const asset = (path: string): string => `${import.meta.env.BASE_URL}assets/${path}`;
const imageCache = new Map<string, HTMLImageElement>();
function image(path: string): HTMLImageElement { let i = imageCache.get(path); if (!i) { i = new Image(); i.src = asset(path); imageCache.set(path, i); } return i; }

export function createOnboarding({ gameId, storage, telemetry, practicePaint }: Options): { intercept: (start: () => void) => boolean; practiceAgain: () => void; destroy: () => void } {
  const listeners = new AbortController(); const options = { signal: listeners.signal };
  const dialog = document.createElement('dialog'); dialog.id = 'arcade-training'; dialog.dataset.game = gameId;
  dialog.setAttribute('aria-labelledby', 'tutorial-heading'); document.body.append(dialog);
  const app = document.getElementById('app')!;
  document.body.dataset.arcadeGame = gameId;
  let callback: (() => void) | undefined; let session: PracticeSession | undefined;
  let frame = 0, previous = 0, reportedStep = 0, active = false;
  let returnFocus: HTMLElement | null = null;
  const fallPointers = new Map<number, -1 | 1>(); const fallKeys = new Map<string, -1 | 1>();
  const fallInput = (): void => { const directions = [...fallPointers.values(), ...fallKeys.values()]; session?.setInput(directions.includes(-1) === directions.includes(1) ? 0 : directions.includes(1) ? 1 : -1); };
  const clearFallInput = (): void => { fallPointers.clear(); fallKeys.clear(); session?.setInput(0); };
  let fallStep = -1;
  const english = (): boolean => gameId === 'game005' && document.documentElement.lang === 'en';
  const labels = (ja: string, en: string): string => english() ? en : ja;
  const close = (): void => { active = false; cancelAnimationFrame(frame); session?.setInput(0); clearFallInput(); dialog.close(); callback = undefined; returnFocus?.focus({ preventScroll: true }); };
  const head = (): string => `<div class="training-head"><span>${labels('操作練習', 'PRACTICE')} / ${gameId.slice(4)}</span><button type="button" class="training-close" id="tutorial-close-button" aria-label="${labels('タイトルへ戻る', 'Return to title')}">×</button></div>`;
  function explanation(start?: () => void): void {
    if (active) return;
    active = true; callback = start; session = undefined; returnFocus = document.activeElement as HTMLElement;
    dialog.dataset.phase = 'explanation';
    const [title, text] = lessons[gameId];
    dialog.innerHTML = `${head()}<h2 id="tutorial-heading">${english() ? 'Use the rule. Left or right?' : title}</h2><p>${english() ? 'Read the parcel and the rule above. Round goes LEFT, angular goes RIGHT. Use ← → / A D or tap either side. The rule changes during the real run.' : text}</p><p class="training-input-note">${labels('まずは短い練習。まちがえても大丈夫です。', 'Try a short practice. Mistakes are OK.')}</p><button class="training-primary" type="button" id="tutorial-practice-button">${labels('操作を練習する', 'Try the controls')}</button>`;
    dialog.showModal(); telemetry.trackEvent('tutorial_start', { practiceAgain: storage.readBoolean('tutorialCompleted', false) });
    dialog.querySelector<HTMLButtonElement>('#tutorial-practice-button')!.focus();
  }
  function controls(s: PracticeSnapshot): string {
    const button = (action: PracticeAction, label: string): string => `<button type="button" data-practice-action="${action}">${label}</button>`;
    switch (gameId) {
      case 'game001': return button('action', '⇄ 軌道切替 · Space');
      case 'game002': return button('left', '← 左へ · A') + button('right', '右へ → · D');
      case 'game003': return button('action', 'DROP · Space');
      case 'game005': return button('left', labels('← 左：丸い', '← LEFT: ROUND')) + button('right', labels('角ばった：右 →', 'ANGULAR: RIGHT →'));
      case 'game006': return button('action', s.step === 0 ? '角度を決める · Space' : '強さを決める · Space');
      case 'game007': return button('reject', '← 見送る · A') + button('board', '乗せる → · D');
      case 'game008': return button('left', '← 左へ · 押す／離す') + button('right', '右へ → · 押す／離す');
      case 'game015': return button('left', '← 左 · 押す／離す') + button('action', 'DROP ↓') + button('right', '右 → · 押す／離す');
      case 'game010': return button('action', 'LISTEN ⇄ SIDE WORK · Space');
      case 'game011': return button(s.choiceLeft, s.choiceLeft === 'unko' ? 'ウンコ' : 'ウコン') + button(s.choiceLeft === 'unko' ? 'ukon' : 'unko', s.choiceLeft === 'unko' ? 'ウコン' : 'ウンコ');
      default: return '';
    }
  }
  function practice(): void {
    clearFallInput(); fallStep = -1; session = new PracticeSession(gameId); reportedStep = 0; previous = performance.now();
    dialog.dataset.phase = 'practice';
    const s = session.snapshot();
    const board = gameId === 'game004'
      ? `<div class="practice-grid">${Array.from({ length: 9 }, (_, i) => `<button type="button" data-practice-action="cell-${i}" aria-label="${i + 1}">${i + 1}</button>`).join('')}</div>`
      : gameId === 'game009'
        ? `<div class="practice-desk">${['desk-paper', 'stamp-round-red', 'desk-pen', 'stamp-square-blue', 'desk-stapler', 'stamp-round-blue'].map((name, i) => `<button type="button" data-practice-action="${i === 1 ? 'stamp-red' : 'stamp-other'}" aria-label="${['書類', '赤い丸印鑑', 'ペン', '青い角印鑑', 'ホチキス', '青い丸印鑑'][i]}"><img src="${asset(`game009/${name}.webp`)}" alt="${['書類', '赤い丸印鑑', 'ペン', '青い角印鑑', 'ホチキス', '青い丸印鑑'][i]}"></button>`).join('')}</div>`
        : `<canvas width="${gameId === 'game015' ? 256 : 1200}" height="${gameId === 'game015' ? 448 : 640}" id="tutorial-canvas" tabindex="0" aria-label="練習のゲーム画面"></canvas>`;
    dialog.innerHTML = `${head()}<h2 id="tutorial-heading">${labels('まずは、やってみよう。', 'Let’s try it.')}</h2><p id="practice-prompt">${english() ? 'Practice rule: ROUND → LEFT, ANGULAR → RIGHT.' : lessons[gameId][2]}</p><div class="practice-window">${gameId === 'game008' ? '<div class="practice-hud"><span>運んだ距離 <strong>0 m</strong></span><span id="practice-tilt">左 ← 傾き</span><span>残り <strong>100%</strong></span></div>' : ''}${board}</div><div class="practice-controls" style="--control-cols:${['game001', 'game003', 'game006', 'game010'].includes(gameId) ? 1 : gameId === 'game015' ? 3 : 2}">${controls(s)}</div><p class="practice-feedback" id="practice-feedback" role="status" aria-live="polite">${labels('まちがえても練習は続けられます。', 'Take your time. Mistakes are OK.')}</p><small class="training-input-note">${labels('練習の得点は記録されません。', 'Practice does not affect your score or BEST.')}</small>`;
    dialog.querySelector<HTMLCanvasElement>('canvas')?.focus({ preventScroll: true });
    if (!dialog.querySelector('canvas')) dialog.querySelector<HTMLButtonElement>('[data-practice-action]')?.focus();
    draw(); frame = requestAnimationFrame(tick);
  }
  function tick(now: number): void {
    if (!active || !session || dialog.dataset.phase !== 'practice') return;
    if (!document.hidden && document.hasFocus()) session.update((now - previous) / 1000);
    previous = now; draw(); frame = requestAnimationFrame(tick);
  }
  function draw(): void {
    if (!session) return;
    const s = session.snapshot();
    if (s.step > reportedStep) { telemetry.trackEvent('tutorial_step_complete', { step: s.step }); reportedStep = s.step; }
    if (s.complete) { success(); return; }
    const feedback = dialog.querySelector<HTMLElement>('#practice-feedback')!;
    if (s.feedback && feedback.textContent !== s.feedback) feedback.textContent = english() ? s.step === 1 ? 'Correct! Now send the angular parcel RIGHT.' : 'Try again: ROUND goes LEFT, ANGULAR goes RIGHT.' : s.feedback;
    if (gameId === 'game004') {
      dialog.querySelectorAll<HTMLButtonElement>('[data-practice-action]').forEach((b, i) => { b.classList.toggle('lit', i === s.light); b.disabled = s.phase === 'watch'; });
      dialog.querySelector<HTMLElement>('#practice-prompt')!.textContent = s.phase === 'watch' ? lessons[gameId][2] : 'YOUR TURN · 左上 → 真ん中。同じ順番で押そう。';
    }
    if (gameId === 'game006') dialog.querySelector<HTMLButtonElement>('[data-practice-action]')!.textContent = s.step === 0 ? '角度を決める · Space' : s.step === 1 ? '強さを決める · Space' : '駐車中…';
    if (gameId === 'game007') dialog.querySelector<HTMLElement>('#practice-prompt')!.textContent = s.step === 0 ? lessons[gameId][2] : s.phase === 'boarding' ? '乗せました！ 200 + 60 = 260 kg。' : '410 kg乗車中。NEXTは80 kg。乗せると490 kg、40 kg超過！';
    if (gameId === 'game008') dialog.querySelector<HTMLElement>('#practice-tilt')!.textContent = `${s.tilt > .055 ? '← 左に傾き ／ 右→で戻す' : s.tilt < -.055 ? '右に傾き → ／ ←左で戻す' : '中央'} ${Math.round(Math.abs(s.tilt) * 180 / Math.PI)}°`;
    if (gameId === 'game015') {
      if (fallStep !== s.step) { clearFallInput(); fallStep = s.step; }
      dialog.dataset.step = String(s.step);
      const prompt = dialog.querySelector<HTMLElement>('#practice-prompt')!;
      const copy = ['1 / 4 · DROPで下の足場へ。', '2 / 4 · DROPして右へ。離すと慣性、左でブレーキ。', '3 / 4 · FALL 5.2 m以内で、安全に着地。', '4 / 4 · ゴーストが長く落ちると…'];
      if (prompt.textContent !== copy[s.step]) prompt.textContent = copy[s.step];
      dialog.querySelectorAll<HTMLButtonElement>('[data-practice-action]').forEach(b => { b.disabled = s.step === 3 || b.dataset.practiceAction === 'action' && s.fall?.phase !== 'grounded'; });
      const canvas = dialog.querySelector<HTMLCanvasElement>('canvas'); if (canvas && practicePaint) practicePaint(canvas, s);
    } else paintPractice(dialog.querySelector<HTMLCanvasElement>('canvas'), s, session.phaseSeconds());
  }
  function success(): void {
    if (dialog.dataset.phase === 'success') return;
    cancelAnimationFrame(frame); session?.setInput(0); dialog.dataset.phase = 'success';
    const message = gameId === 'game015' ? '操作はOK！ なるべく深くまで落ちてください。' : gameId === 'game006' ? '入りました。本番はもう少し狭いです。' : gameId === 'game005' ? labels('できました。途中でルールが変わります。', 'Ready! The rule changes during the real run.') : labels('これで操作はOK。次は本番で試そう。', 'You know the controls. Try the real run.');
    dialog.innerHTML = `${head()}<div class="training-success"><strong id="tutorial-heading">${labels('できました！', 'Ready!')}</strong><p>${message}</p><small>${labels('練習のスコアは自己ベストに含まれません。', 'Practice does not affect your BEST.')}</small></div><button class="training-primary" id="tutorial-start-button" type="button">${callback ? labels('本番へ', 'Start real run') : labels('タイトルへ戻る', 'Back to title')}</button>`;
    dialog.querySelector<HTMLButtonElement>('#tutorial-start-button')!.focus({ preventScroll: true });
  }
  function action(value: PracticeAction): void { session?.action(value); draw(); }
  dialog.addEventListener('click', e => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button'); if (!b || b.disabled) return;
    if (b.id === 'tutorial-close-button') { telemetry.trackEvent('tutorial_skip', { completedBefore: storage.readBoolean('tutorialCompleted', false) }); close(); }
    else if (b.id === 'tutorial-practice-button') practice();
    else if (b.id === 'tutorial-start-button' && session?.snapshot().complete) {
      storage.writeBoolean('tutorialCompleted', true); telemetry.trackEvent('tutorial_complete');
      const start = callback; close(); start?.();
    } else if (b.dataset.practiceAction) {
      if (gameId === 'game008') { session?.setInput(0); return; }
      if (gameId === 'game015' && (e.detail > 0 || b.dataset.practiceAction !== 'action')) return;
      action(b.dataset.practiceAction as PracticeAction);
    }
  }, options);
  dialog.addEventListener('pointerdown', e => {
    if ((!e.isPrimary && !(gameId === 'game015' && e.pointerType === 'touch')) || e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || dialog.dataset.phase !== 'practice') return;
    const surface = (e.target as Element).closest<HTMLCanvasElement>('canvas');
    if (surface && gameId !== 'game011') {
      e.preventDefault(); const bounds = surface.getBoundingClientRect();
      const side = e.clientX < bounds.left + bounds.width / 2 ? 'left' : 'right';
      if (gameId === 'game008' || gameId === 'game015') { if (gameId === 'game015') { fallPointers.set(e.pointerId, side === 'right' ? 1 : -1); fallInput(); } else session?.setInput(side === 'right' ? 1 : -1); try { surface.setPointerCapture(e.pointerId); } catch { /* global release */ } }
      else action(['game002', 'game005'].includes(gameId) ? side : 'action');
      return;
    }
    if (gameId === 'game015') {
      const b = (e.target as Element).closest<HTMLButtonElement>('[data-practice-action]');
      if (b && !b.disabled) { e.preventDefault(); if (b.dataset.practiceAction === 'action') action('action'); else { fallPointers.set(e.pointerId, b.dataset.practiceAction === 'right' ? 1 : -1); fallInput(); try { b.setPointerCapture(e.pointerId); } catch { /* release globally */ } } }
      return;
    }
    if (gameId !== 'game008') return;
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-practice-action]');
    if (b) { e.preventDefault(); session?.setInput(b.dataset.practiceAction === 'right' ? 1 : -1); try { b.setPointerCapture(e.pointerId); } catch { /* global release */ } }
  }, options);
  const release = (): void => { session?.setInput(0); };
  const releasePointer = (e: PointerEvent): void => { if (gameId === 'game015') { fallPointers.delete(e.pointerId); fallInput(); } else release(); };
  window.addEventListener('pointerup', releasePointer, options); window.addEventListener('pointercancel', releasePointer, options); dialog.addEventListener('lostpointercapture', releasePointer, options); window.addEventListener('blur', () => { release(); clearFallInput(); }, options);
  document.addEventListener('keyup', e => { if (active) { e.stopImmediatePropagation(); if (gameId === 'game015' && [' ', 'Enter', 'ArrowDown', 's', 'S'].includes(e.key)) e.preventDefault(); if (gameId === 'game015') { fallKeys.delete(e.key.toLowerCase()); fallInput(); } else release(); } }, { capture: true, ...options });
  document.addEventListener('keydown', e => {
    if (!active) return;
    e.stopImmediatePropagation();
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    // A held practice key must not activate the success button after focus moves.
    if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); return; }
    if (!session || dialog.dataset.phase !== 'practice') return;
    const key = e.key.toLowerCase(); const left = key === 'arrowleft' || key === 'a', right = key === 'arrowright' || key === 'd';
    if ((gameId === 'game008' || gameId === 'game015') && (left || right)) { e.preventDefault(); if (gameId === 'game015') { fallKeys.set(key, right ? 1 : -1); fallInput(); } else session.setInput(right ? 1 : -1); return; }
    if (gameId === 'game015' && [' ', 'enter', 'arrowdown', 's'].includes(key)) {
      const native = (e.target as Element).closest('button'); if (native && !native.hasAttribute('data-practice-action')) return;
      e.preventDefault(); const target = (e.target as Element).closest<HTMLButtonElement>('[data-practice-action]');
      if (target?.dataset.practiceAction === 'left' || target?.dataset.practiceAction === 'right') { fallKeys.set(key, target.dataset.practiceAction === 'right' ? 1 : -1); fallInput(); }
      else action('action'); return;
    }
    if (gameId === 'game004' && /^[1-9]$/.test(key)) { e.preventDefault(); action(`cell-${Number(key) - 1}`); return; }
    if (left || right) {
      e.preventDefault();
      action(gameId === 'game007' ? left ? 'reject' : 'board' : gameId === 'game011' ? (left ? session.snapshot().choiceLeft : session.snapshot().choiceLeft === 'unko' ? 'ukon' : 'unko') : left ? 'left' : 'right');
    } else if ((key === ' ' || key === 'enter') && !(e.target as Element)?.closest('button')) { e.preventDefault(); action('action'); }
  }, { capture: true, ...options });
  dialog.addEventListener('cancel', e => { e.preventDefault(); close(); }, options);

  // Stable chrome outside the play surface; only the title offers repeated training.
  function installNavigation(): void {
    const header = app.querySelector('header');
    if (!header) return;
    const existing = header.querySelector<HTMLAnchorElement>('.arcade-portal-back,#portal-link');
    if (existing) {
      existing.classList.add('arcade-portal-back');
      // Game011 owns telemetry on its existing portal link.
      if (existing.id !== 'portal-link' && !existing.dataset.arcadeNavInstalled) { existing.dataset.arcadeNavInstalled = 'true'; existing.addEventListener('click', () => telemetry.trackEvent('return_to_portal'), options); }
      return;
    }
    const back = document.createElement('a'); back.className = 'arcade-portal-back'; back.href = `${import.meta.env.BASE_URL}index.html`; back.textContent = '← ゲームセンターへ';
    back.dataset.arcadeNavInstalled = 'true'; back.addEventListener('click', () => telemetry.trackEvent('return_to_portal'), options); header.prepend(back);
  }
  if (!arcadeConfig.creditsEnabled) document.body.classList.add('arcade-unlimited');
  const again = document.createElement('button'); again.id = 'tutorial-again-button'; again.className = 'arcade-practice-again'; again.type = 'button'; again.textContent = labels('もう一度練習', 'Practice again'); again.addEventListener('click', () => explanation());
  const updateChrome = (): void => {
    installNavigation();
    const againText = labels('もう一度練習', 'Practice again'); if (again.textContent !== againText) again.textContent = againText;
    const play = app.querySelector('#play-button');
    if (app.dataset.state === 'title' && play) { if (again.parentElement !== play.parentElement) play.after(again); }
    else again.remove();
    if (!arcadeConfig.creditsEnabled) {
      app.querySelectorAll('dt').forEach(dt => { if (dt.textContent?.trim() === 'CREDIT') (dt.parentElement as HTMLElement).dataset.creditInfo = ''; });
      app.querySelectorAll<HTMLElement>('.start-hint,.stub-note,p.result-note,small.result-note,.manual-credit').forEach(p => { if (/CREDIT|Reward|広告/.test(p.textContent ?? '')) p.dataset.creditInfo = ''; });
    }
  };
  const observer = new MutationObserver(updateChrome);
  observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] });
  updateChrome();
  if (import.meta.env.DEV) (window as unknown as { __tutorialDebug: unknown }).__tutorialDebug = Object.freeze({ snapshot: () => Object.freeze({ active, phase: dialog.dataset.phase, completed: storage.readBoolean('tutorialCompleted', false), practice: session?.snapshot() }) });
  return { intercept(start) { if (active) return true; if (storage.readBoolean('tutorialCompleted', false)) return false; explanation(start); return true; }, practiceAgain() { explanation(); }, destroy() { active = false; cancelAnimationFrame(frame); listeners.abort(); observer.disconnect(); dialog.remove(); again.remove(); const nav = app.querySelector<HTMLElement>('.arcade-portal-back'); if (nav?.id === 'portal-link') delete nav.dataset.arcadeNavInstalled; else nav?.remove(); } };
}

function paintPractice(canvas: HTMLCanvasElement | null, s: PracticeSnapshot, phaseTime: number): void {
  if (!canvas) return;
  const c = canvas.getContext('2d')!; c.setTransform(2, 0, 0, 2, 0, 0);
  const W = 600, H = 320; c.clearRect(0, 0, W, H); c.fillStyle = '#eeeade'; c.fillRect(0, 0, W, H);
  const text = (label: string, x: number, y: number, size = 20, color = '#34453c'): void => { c.fillStyle = color; c.font = `700 ${size}px 'Arcade Rounded',system-ui,sans-serif`; c.textAlign = 'center'; c.fillText(label, x, y); };
  const rect = (x: number, y: number, w: number, h: number, color: string): void => { c.fillStyle = color; c.fillRect(x, y, w, h); };
  const artwork = (path: string, x: number, y: number, w: number, h: number): boolean => { const i = image(path); if (i.complete && i.naturalWidth) { c.drawImage(i, x, y, w, h); return true; } return false; };
  switch (s.gameId) {
    case 'game001': {
      rect(0, 0, W, H, '#0c171d'); const radius = s.lane === 1 ? 83 : 124;
      for (const r of [83, 124]) { c.strokeStyle = '#507264'; c.lineWidth = 2; c.beginPath(); c.arc(300, 160, r, 0, Math.PI * 2); c.stroke(); }
      c.save(); c.translate(300 + Math.cos(.65) * 83, 160 + Math.sin(.65) * 83); c.rotate(.65); rect(-9, -28, 18, 56, '#f16c6c'); c.restore();
      c.fillStyle = '#baf397'; c.beginPath(); c.arc(300 + Math.cos(s.angle) * radius, 160 + Math.sin(s.angle) * radius, 8, 0, Math.PI * 2); c.fill(); text(s.lane === 1 ? 'INNER' : 'OUTER', 300, 165, 17, '#dcf3dd'); break;
    }
    case 'game002': {
      rect(85, 0, 430, 320, '#8596a0'); for (const x of [228, 372]) rect(x, 0, 3, 320, '#d1d8cf');
      const x = [155, 300, 445][s.lane], enemy = [155, 300, 445][s.enemyLane]; const y = 35 + Math.min(1, phaseTime / 2.2) * 215;
      artwork('game002/hero.webp', x - 25, 243, 50, 68); c.fillStyle = '#324741'; c.beginPath(); c.arc(x, 255, 12, 0, Math.PI * 2); c.fill(); rect(x - 17, 270, 34, 35, '#486755');
      if (!artwork('game002/commuter-broad.webp', enemy - 28, y - 42, 56, 80)) { c.fillStyle = '#e2b791'; c.beginPath(); c.arc(enemy, y - 25, 12, 0, Math.PI * 2); c.fill(); rect(enemy - 20, y - 10, 40, 44, '#9d6251'); }
      text(`${s.step + 1} / 2`, 560, 34, 20); break;
    }
    case 'game003': rect(110, 240, 380, 60, '#497e8b'); rect(s.x - 50, s.moving ? 30 + Math.min(1, phaseTime / .75) * 150 : 30, 100, 60, '#e6a66c'); text(s.moving ? 'DROP!' : 'ゆっくり、土台の上へ。', 300, 140, 22); break;
    case 'game005': {
      rect(0, 0, W, H, '#ffeeb7'); text('← ROUND', 100, 45); text('ANGULAR →', 490, 45);
      c.fillStyle = '#e49549'; if (s.step === 0) { c.beginPath(); c.arc(300, 175, 60, 0, Math.PI * 2); c.fill(); } else { c.save(); c.translate(300, 175); c.rotate(.15); rect(-60, -55, 120, 110, '#e49549'); c.restore(); } text(s.step === 0 ? 'ROUND' : 'ANGULAR', 300, 285, 18); break;
    }
    case 'game006': {
      rect(0, 0, W, H, '#767d74'); c.strokeStyle = '#f6e8b3'; c.lineWidth = 5; c.strokeRect(338, 125, 155, 140);
      const progress = s.moving ? Math.min(1, phaseTime / 1.1) : 0; const x = 125 + progress * (235 + (s.power - .75) * 60), y = 190 + progress * (-25 + s.angle * 50);
      c.save(); c.translate(x + 50, y + 27.5); c.rotate(s.angle * progress);
      if (!artwork('game006/car-compact.webp', -50, -27.5, 100, 55)) rect(-50, -27.5, 100, 55, '#efce6d'); c.restore();
      text(s.step === 0 ? 'ANGLE ／ 角度' : s.step === 1 ? 'POWER ／ 強さ' : '駐車中', 300, 38, 22, '#fff5d7');
      rect(120, 66, 360, 15, '#474f48'); rect(120 + (s.step === 0 ? (s.angle / .18 + 1) / 2 : (s.power - .6) / .3) * 345, 61, 15, 25, '#ffe47f'); text(`角度 ${Math.round(s.angle * 180 / Math.PI)}° ／ 強さ ${Math.round(s.power * 100)}%`, 300, 110, 18, '#fff5d7'); break;
    }
    case 'game007': {
      const current = s.step === 0 ? 200 : s.phase === 'boarding' ? 260 : 410, next = s.step === 0 ? 60 : s.phase === 'boarding' ? 0 : 80;
      rect(28, 68, 270, 205, '#bac6b8'); rect(45, 80, 235, 190, '#dbe0d6');
      text(`${current} / 450 kg`, 165, 40, 28); rect(45, 279, 235, 14, '#bbc2b4'); rect(45, 279, 235 * current / 450, 14, current > 400 ? '#c88652' : '#6b9168');
      artwork('game007/passenger-office.webp', 346, 92, 76, 126); text(`NEXT ${next} kg`, 440, 67, 26);
      text(`空き ${450 - current} kg`, 170, 130, 25); text(`${current} + ${next} = ${current + next} kg`, 440, 245, 20);
      text(current + next > 450 ? '40 kg 超過 → 見送る' : '乗せられます', 440, 285, 20, current + next > 450 ? '#9c443a' : '#397b50'); break;
    }
    case 'game008': {
      artwork('game008/morning-walk.webp', 0, 0, 600, 320); rect(180, 135, 240, 175, '#f5e8cb'); rect(190, 148, 220, 140, '#dbc7a7');
      c.save(); c.beginPath(); c.rect(193, 150, 214, 130); c.clip(); c.fillStyle = '#6b3e27'; c.beginPath(); c.moveTo(190, 190 - Math.tan(s.tilt) * 110); c.lineTo(410, 190 + Math.tan(s.tilt) * 110); c.lineTo(410, 290); c.lineTo(190, 290); c.closePath(); c.fill(); c.restore();
      rect(150, 30, 300, 10, '#bbac90'); rect(298 - s.tilt * 200, 21, 5, 29, '#70452e'); text('← 左 ／ 中央 ／ 右 →', 300, 75, 18); text('右→で、水面を中央へ。', 300, 116, 21); break;
    }
    case 'game010': {
      rect(0, 0, W, H, '#dde2db'); artwork('game010/boss-talk.webp', 200, -15, 200, 260); rect(0, 240, 600, 80, '#80614e');
      artwork(`game010/foreground-${s.mode}.webp`, 0, 170, 600, 150);
      text(s.step === 1 && phaseTime >= 1.7 ? '上司「ところで…」 → LISTENへ！' : '上司「今月の進捗について…」', 300, 33, 20);
      text(s.mode === 'work' ? `SIDE WORK · 練習 ${Math.floor(s.practicePoints)}点` : 'LISTEN · 聞いています', 300, 194, 22); break;
    }
    case 'game011': rect(0, 0, W, H, '#fffbe8'); artwork('game011/icons/unko-01.webp', 180, 35, 240, 240); break;
  }
}
