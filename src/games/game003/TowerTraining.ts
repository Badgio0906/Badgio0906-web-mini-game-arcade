import { TowerRun, FOUNDATION, ART_MIN_RATIO } from './TowerRun';
import type { StorageService } from '../../core/StorageService';
import type { TelemetryService } from '../../core/TelemetryService';
import { arcadeConfig } from '../../arcade/config';

/** Isolated actual physics, no production records, score updates or credits. */
export function createTowerTraining(storage: StorageService, telemetry: TelemetryService) {
  const app = document.getElementById('app')!;
  const dialog = document.createElement('dialog'); dialog.id = 'arcade-training'; dialog.dataset.game = 'game003';
  dialog.setAttribute('aria-labelledby', 'tutorial-heading'); document.body.append(dialog);
  const events = new AbortController(), options = { signal: events.signal };
  let active = false, mode = 'explanation', frame = 0, previous = 0, practice: TowerRun | null = null;
  let complete = false, returnFocus: HTMLElement | null = null, attempted = false;
  const textures = ['cafe', 'apartment', 'office'].map(name => { const i = new Image(); i.src = `${import.meta.env.BASE_URL}assets/game003/module-${name}.webp`; return i; });
  const head = () => '<div class="tower-training-head"><span>建築練習 · 003</span><button id="tutorial-close-button" type="button" aria-label="タイトルへ戻る">×</button></div>';
  const close = () => { active = false; practice = null; cancelAnimationFrame(frame); dialog.close(); returnFocus?.focus({ preventScroll: true }); };
  function openExplanation() {
    if (active) return; active = true; mode = 'explanation'; returnFocus = document.activeElement as HTMLElement;
    dialog.dataset.phase = mode;
    dialog.innerHTML = `${head()}<h2 id="tutorial-heading">まっすぐも、張り出しも。</h2><p>Space / Enter / クリック / タップでDROP。中心を重ねるとPERFECT。大きく張り出したら、次は反対側へ。重心を戻して釣り合うと芸術点です。</p><p>全ての継ぎ目が支えます。同じ側へ寄せ続けると崩壊。三角印が危険な支持面、下の印が基礎重心です。</p><p>旧ルールのBESTは保持。新ルールの記録は分けています。</p><button id="tutorial-practice-button" class="primary" type="button">練習する</button><button id="tutorial-skip-button" class="secondary" type="button">タイトルへ戻る</button>`;
    dialog.showModal(); telemetry.trackEvent('tutorial_view', { rulesVersion: 2 });
  }
  function restartPractice() {
    complete = false; attempted = false;
    practice = new TowerRun(event => {
      if (event.type === 'land') {
        telemetry.trackEvent('tutorial_step_complete', { step: practice!.snapshot().floors, rulesVersion: 2 });
        const s = practice!.inspection();
        if (s.floors === 1 && !s.recentlyAccepted?.perfect || s.floors === 2 && s.recentlyAccepted && (s.recentlyAccepted.x - s.stack[0].x) / Math.min(s.stack[0].width, s.stack[1].width) < ART_MIN_RATIO) attempted = true;
      }
      if (event.type === 'art' && practice!.snapshot().floors === 3) { complete = true; storage.writeBoolean('tutorialCompletedRules2', true); telemetry.trackEvent('practice_complete', { rulesVersion: 2 }); }
    }, () => .5);
    practice.start();
  }
  function openPractice() {
    if (!active) { active = true; returnFocus = document.activeElement as HTMLElement; dialog.showModal(); }
    mode = 'practice'; dialog.dataset.phase = mode;
    dialog.innerHTML = `${head()}<h2 id="tutorial-heading">3つの着地で、釣り合い。</h2><p id="practice-prompt"></p><canvas id="tutorial-canvas" width="600" height="320" tabindex="0" aria-label="中央、右の張り出し、反対側へ戻す建築練習"></canvas><p id="practice-feedback" role="status"></p><div class="tower-training-actions"><button id="practice-drop-button" class="primary" type="button">DROP ↓</button><button id="practice-reset-button" class="secondary" type="button">練習をやり直す</button><button id="tutorial-skip-button" class="secondary" type="button">練習を終了</button></div><small>練習の点は本番・BESTへ入りません。</small>`;
    restartPractice(); previous = performance.now(); telemetry.trackEvent('practice_start', { rulesVersion: 2 }); tick(previous);
    dialog.querySelector<HTMLCanvasElement>('canvas')?.focus({ preventScroll: true });
  }
  function tick(now: number) {
    if (!active || mode !== 'practice' || !practice) return;
    if (!document.hidden && document.hasFocus() && !complete && !attempted) practice.step(Math.max(0, (now - previous) / 1000));
    previous = now;
    const s = practice.inspection(), canvas = dialog.querySelector<HTMLCanvasElement>('canvas')!, c = canvas.getContext('2d')!;
    c.clearRect(0, 0, 600, 320); c.fillStyle = '#b8dadd'; c.fillRect(0, 0, 600, 320);
    const y = (v: number) => v * .5 - 60;
    c.fillStyle = '#344b60'; c.fillRect(195, y(639), 210, 21);
    for (const box of [...s.stack, ...(s.cargo ? [s.cargo] : [])]) {
      const img = textures[box.id % textures.length], top = y(box.y - box.height / 2), h = box.height * .5;
      if (img.complete && img.naturalWidth) c.drawImage(img, box.x - box.width / 2, top, box.width, h);
      else { c.fillStyle = '#d6a366'; c.fillRect(box.x - box.width / 2, top, box.width, h); }
      c.strokeStyle = '#344b60'; c.lineWidth = 2; c.strokeRect(box.x - box.width / 2, top, box.width, h);
    }
    const target = s.floors === 0 ? 300 : s.floors === 1 ? s.topCenter + 36 : s.topCenter - 56;
    c.fillStyle = '#dcb451'; c.fillRect(target - (s.floors ? 4 : 6), y(s.topY) - 4, s.floors ? 8 : 12, 5);
    if (s.floors) { const weak = s.interfaces[s.weakJointIndex], lower = s.weakJointIndex ? s.stack[s.weakJointIndex - 1] : FOUNDATION;
      c.strokeStyle = '#9e542c'; c.lineWidth = 3; c.beginPath(); c.moveTo(weak.left, y(lower.y - lower.height / 2)); c.lineTo(weak.right, y(lower.y - lower.height / 2)); c.stroke();
      c.fillStyle = '#9e542c'; c.beginPath(); c.moveTo(weak.loadCenter, y(lower.y - lower.height / 2)-3); c.lineTo(weak.loadCenter-5, y(lower.y - lower.height / 2)-13); c.lineTo(weak.loadCenter+5, y(lower.y - lower.height / 2)-13); c.fill(); }
    const prompt = complete ? '釣り合った！ 3つの実着地を成功。' : ['1 / 3 · 中央の印で落とし、PERFECT。', '2 / 3 · 右の印まで張り出して、DROP。', '3 / 3 · 反対の左の印へ。支持の余裕を戻そう。'][Math.min(2, s.floors)];
    dialog.querySelector('#practice-prompt')!.textContent = prompt;
    dialog.querySelector('#practice-feedback')!.textContent = complete ? `芸術ペア +${s.artScore} · 本番では左右を自由に選べます。` : attempted || !s.alive || s.floors >= 3 ? '条件がまだ揃っていません。練習をやり直してもう一度。' : s.phase === 'hanging' ? '金色の印を狙って、DROP。' : '実際に着地するまで待とう。';
    dialog.querySelector<HTMLButtonElement>('#practice-drop-button')!.disabled = complete || attempted || !s.alive || s.phase !== 'hanging' || s.floors >= 3;
    if (complete) dialog.dataset.phase = 'success';
    frame = requestAnimationFrame(tick);
  }
  const drop = () => { if (active && mode === 'practice' && practice && !complete && !attempted && practice.snapshot().floors < 3) practice.drop(); };
  dialog.addEventListener('click', e => { const id = (e.target as HTMLElement).closest('button')?.id;
    if (id === 'tutorial-close-button' || id === 'tutorial-skip-button') close();
    else if (id === 'tutorial-practice-button') openPractice(); else if (id === 'practice-reset-button') restartPractice(); else if (id === 'practice-drop-button') drop();
  }, options);
  dialog.addEventListener('pointerdown', e => { if ((e.target as Element).closest('canvas') && e.isPrimary && e.button === 0 && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); drop(); } }, options);
  document.addEventListener('keydown', e => {
    if (!active) return; e.stopImmediatePropagation();
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (![' ', 'Enter'].includes(e.key)) return;
    if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) { e.preventDefault(); return; }
    if (!(e.target as Element).closest('button,a')) { e.preventDefault(); drop(); }
  }, { capture: true, ...options });
  document.addEventListener('keyup', e => { if (active) e.stopImmediatePropagation(); }, { capture: true, ...options });
  dialog.addEventListener('cancel', e => { e.preventDefault(); close(); }, options);
  const nav = document.createElement('a'); nav.className = 'arcade-portal-back'; nav.href = `${import.meta.env.BASE_URL}index.html`; nav.textContent = '← ゲームセンターへ';
  nav.addEventListener('click', () => telemetry.trackEvent('return_to_portal'), options); app.querySelector('header')!.prepend(nav);
  if (!arcadeConfig.creditsEnabled) document.body.classList.add('arcade-unlimited');
  const choices = document.createElement('div'); choices.className = 'tower-start-options';
  choices.innerHTML = '<button type="button" id="tutorial-explain-button" class="secondary">説明を見る</button><button type="button" id="tutorial-again-button" class="secondary">練習する</button>';
  choices.addEventListener('click', e => { const id = (e.target as Element).closest('button')?.id; if (id === 'tutorial-again-button') openPractice(); else if (id === 'tutorial-explain-button') openExplanation(); }, options);
  const chrome = () => { const play = app.querySelector<HTMLButtonElement>('#play-button'); if (app.dataset.state === 'title' && play) { if (play.textContent !== 'すぐ遊ぶ') play.textContent = 'すぐ遊ぶ'; if (choices.parentElement !== play.parentElement) play.after(choices); } else choices.remove(); };
  const observer = new MutationObserver(chrome); observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] }); chrome();
  if (import.meta.env.DEV) (window as unknown as { __towerTraining: unknown }).__towerTraining = Object.freeze({ inspection: () => practice?.inspection() ?? null, state: () => ({ active, mode, complete, attempted }) });
  return { intercept() { if (active) return true; if (app.dataset.state === 'title') telemetry.trackEvent('tutorial_skip', { rulesVersion: 2, startMethod: 'immediate' }); return false; }, practiceAgain: openPractice,
    destroy() { close(); observer.disconnect(); events.abort(); dialog.remove(); choices.remove(); nav.remove(); } };
}
