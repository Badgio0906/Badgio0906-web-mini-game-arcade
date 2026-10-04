import { attributeText, ruleText, sideText, type SortLanguage } from './localization';
import type { SortController, SortHooks, SortSide } from './contracts';
import { SortRun } from './SortRun';

/** DOM presentation and input boundary. The simulation has no browser dependencies. */
export function createSortGame(parent: HTMLElement, hooks: SortHooks, readLanguage: () => SortLanguage = () => 'ja'): SortController {
  const root = document.createElement('div');
  root.className = 'sort-board';
  root.innerHTML = `<div class="rule-strip"><b class="rule-dimension"></b><div class="rule-routing"><span class="rule-left"></span><span class="rule-right"></span></div></div>
    <div class="conveyor"><div class="belt-lines" aria-hidden="true"></div><div class="parcel"><span class="parcel-symbol"></span><small class="parcel-id"></small></div><div class="rule-banner" hidden></div><div class="correction-label" hidden></div><div class="trait-hint"></div></div>
    <div class="decision-meter"><div class="decision-track"><div class="decision-fill"></div></div><span class="decision-time"></span></div>
    <div class="sort-controls"><button type="button" class="sort-input" id="left-button" aria-label="LEFT に仕分け">← LEFT</button><button type="button" class="sort-input" id="right-button" aria-label="RIGHT に仕分け">RIGHT →</button></div>`;
  parent.append(root);
  const find = <T extends HTMLElement = HTMLElement>(selector: string): T => root.querySelector<T>(selector)!;
  const dimension = find('.rule-dimension'); const left = find('.rule-left'); const right = find('.rule-right');
  const parcel = find('.parcel'); const symbol = find('.parcel-symbol'); const parcelId = find('.parcel-id');
  const banner = find('.rule-banner'); const correction = find('.correction-label'); const traits = find('.trait-hint');
  const fill = find('.decision-fill'); const timer = find('.decision-time');
  const leftButton = find<HTMLButtonElement>('#left-button'); const rightButton = find<HTMLButtonElement>('#right-button');
  const abort = new AbortController(); const options = { signal: abort.signal };
  const run = new SortRun(event => hooks.onEvent(event));
  let paused = false; let destroyed = false; let notified = false; let title = true; let frame = 0; let last = performance.now();
  let signature = ''; let timerSignature = ''; let approval: { id: number; side: SortSide; parcelId: number } | null = null;
  let keyboardStarted = false; let keyboardApproval: { side: SortSide; parcelId: number } | null = null;
  const modifiers = (event: MouseEvent | KeyboardEvent): boolean => event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
  const available = (): boolean => !destroyed && !paused && !title && run.alive && run.phase === 'sorting' && !document.querySelector('dialog[open]');
  function draw(): void {
    const snapshot = run.snapshot(); const language = readLanguage(); const text = ruleText(snapshot.rule, language);
    const current = snapshot.parcel ?? (title ? { id: -1, shape: 'round', brightness: 'light', size: 'large', symbol: 'circle' } as const : null);
    const key = [language, title, paused, snapshot.phase, snapshot.rule.label, current?.id, snapshot.lastSide, snapshot.alive].join('|');
    if (key !== signature) {
      signature = key; root.dataset.phase = title ? 'title' : snapshot.phase; root.dataset.paused = String(paused);
      dimension.textContent = text.dimension;
      left.innerHTML = `<b>${text.left}</b><small>${sideText('left', language)}</small>`; right.innerHTML = `<b>${text.right}</b><small>${sideText('right', language)}</small>`;
      leftButton.textContent = sideText('left', language); rightButton.textContent = sideText('right', language);
      leftButton.setAttribute('aria-label', language === 'ja' ? '左に仕分け' : 'Sort LEFT'); rightButton.setAttribute('aria-label', language === 'ja' ? '右に仕分け' : 'Sort RIGHT');
      parcel.hidden = !current;
      if (current) {
        parcel.className = `parcel ${current.shape} ${current.brightness} ${current.size}${snapshot.phase === 'dispatch' ? ` dispatch-${snapshot.lastSide}` : title ? '' : ' is-arriving'}`;
        symbol.textContent = current.symbol === 'circle' ? '○' : '×'; parcelId.textContent = attributeText(current, 'brightness', language);
        parcel.setAttribute('aria-label', ['shape','brightness','size','symbol'].map(d => attributeText(current, d as 'shape'|'brightness'|'size'|'symbol', language)).join(', '));
        traits.textContent = title ? language === 'ja' ? '形・明るさ・大きさ・記号を見分けよう' : 'Look at shape, light, size and symbol' : attributeText(current, snapshot.rule.dimension, language);
      } else traits.textContent = language === 'ja' ? '新しいルールを確認！' : 'Check the new rule!';
      banner.hidden = title || (snapshot.phase !== 'rule_change' && snapshot.phase !== 'dispatch');
      banner.textContent = snapshot.phase === 'rule_change' ? language === 'ja' ? snapshot.rule.inverted ? 'ルール変更 · 左右反転！' : 'ルール変更 · 条件が変わる！' : snapshot.rule.inverted ? 'RULE CHANGE · REVERSE!' : 'RULE CHANGE · NEW ATTRIBUTE!' : language === 'ja' ? '次の荷物' : 'NEXT PARCEL';
      correction.hidden = title || snapshot.alive;
      const result = run.result(); correction.textContent = result ? `${language === 'ja' ? '正解は ' : 'Correct: '}${sideText(result.expectedSide, language)} · ${attributeText(result.parcel, result.rule.dimension, language)}` : '';
      const disabled = !available(); leftButton.disabled = rightButton.disabled = disabled;
      leftButton.classList.toggle('is-answer', !title && !snapshot.alive && run.result()?.expectedSide === 'left');
      rightButton.classList.toggle('is-answer', !title && !snapshot.alive && run.result()?.expectedSide === 'right');
    }
    const fraction = snapshot.phase === 'sorting' && !title ? snapshot.remaining / snapshot.decisionSeconds : 0;
    const percent = Math.max(0, Math.min(100, fraction * 100)).toFixed(1);
    const seconds = snapshot.phase === 'sorting' && !title ? `${snapshot.remaining.toFixed(1)}s` : '—';
    const meterKey = percent + seconds;
    if (meterKey !== timerSignature) { timerSignature = meterKey; fill.style.width = percent + '%'; timer.textContent = seconds; }
  }
  function publish(): void {
    draw(); hooks.onUpdate(run.snapshot());
    if (!run.alive && !title && !notified) {
      const result = run.result();
      if (result) { notified = true; approval = null; hooks.onEnd(result); }
    }
  }
  function input(side: SortSide): boolean {
    if (!available()) return false;
    const accepted = run.input(side);
    if (accepted) { approval = null; publish(); }
    return accepted;
  }
  const stage = parent.closest<HTMLElement>('#stage') ?? parent;
  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || modifiers(event) || (event.target as Element).closest('button,a') || !available()) return;
    event.preventDefault();
    const bounds = stage.getBoundingClientRect(); input(event.clientX < bounds.left + bounds.width / 2 ? 'left' : 'right');
  }, options);
  for (const [button, side] of [[leftButton, 'left'], [rightButton, 'right']] as const) {
    button.addEventListener('pointerdown', event => {
      if (event.isPrimary && event.button === 0 && !modifiers(event) && available() && run.parcel) approval = { id: event.pointerId, side, parcelId: run.parcel.id };
    }, options);
    button.addEventListener('pointercancel', event => { if (approval?.id === event.pointerId) approval = null; }, options);
    button.addEventListener('click', event => {
      if (modifiers(event)) return;
      const pointer = event as PointerEvent;
      if (event.detail > 0 || pointer.pointerType) {
        const valid = approval && approval.side === side && approval.id === pointer.pointerId && approval.parcelId === run.parcel?.id;
        if (!valid) return;
      } else if (keyboardStarted && (keyboardApproval?.side !== side || keyboardApproval.parcelId !== run.parcel?.id)) {
        keyboardStarted = false; keyboardApproval = null; return;
      }
      approval = null; keyboardStarted = false; keyboardApproval = null; input(side);
    }, options);
    button.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.repeat || modifiers(event)) { event.preventDefault(); return; }
      keyboardStarted = true;
      keyboardApproval = available() && run.parcel ? { side, parcelId: run.parcel.id } : null;
    }, options);
  }
  document.addEventListener('keydown', event => {
    if (event.repeat || modifiers(event) || paused || title || !run.alive || document.querySelector('dialog[open]')) return;
    const key = event.key.toLowerCase();
    const side = key === 'arrowleft' || key === 'a' ? 'left' : key === 'arrowright' || key === 'd' ? 'right' : null;
    if (!side || (event.target as Element)?.closest('input,textarea,select,[contenteditable="true"]')) return;
    event.preventDefault(); input(side);
  }, options);
  function tick(now: number): void {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if (!paused && !title) run.step(dt);
    publish(); if (!destroyed) frame = requestAnimationFrame(tick);
  }
  draw(); frame = requestAnimationFrame(tick);
  return {
    start() { title = false; paused = false; notified = false; approval = null; keyboardApproval = null; run.start(); last = performance.now(); signature = ''; publish(); },
    title() { title = true; paused = false; notified = false; approval = null; keyboardApproval = null; run.reset(); signature = ''; publish(); },
    input,
    pause(value) { paused = value; approval = null; keyboardApproval = null; last = performance.now(); publish(); },
    snapshot: () => run.snapshot(), inspection: () => run.inspection(),
    destroy() { destroyed = true; abort.abort(); cancelAnimationFrame(frame); approval = null; root.remove(); },
  };
}
