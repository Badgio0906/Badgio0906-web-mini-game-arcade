import { ElevatorRun } from './ElevatorRun';
import type { ElevatorController, ElevatorHooks, ElevatorItem, ElevatorParty, ElevatorSide } from './contracts';

const assetFile = (item: ElevatorItem): string => `./assets/game007/${item.people ? 'passenger' : 'cargo'}-${item.kind}.webp`;
const partyText = (party: ElevatorParty): string => `${party.label} · ${party.kg}kg →${party.destination}F · ${party.value}点`;

/** Native presentation and input; model time is bounded RAF time, independent of CSS animations. */
export function createElevatorGame(parent: HTMLElement, hooks: ElevatorHooks): ElevatorController {
  const root = document.createElement('div'); root.className = 'elevator-board';
  root.innerHTML = `<div class="load-readout"><span>現在の重量</span><strong id="load-value">0</strong><b>/ 450 kg</b><div class="free-readout">あと <strong class="free-kg">450</strong> kg</div><div class="load-track" aria-label="最大450kgに対する現在重量"><i class="load-fill"></i></div></div>
    <div class="cab-layout"><div class="cab-frame"><div class="floor-plaque"></div><div class="mode-plaque" hidden></div><div class="cab-inner"><div class="cab-occupants"></div><div class="door-left" aria-hidden="true"></div><div class="door-right" aria-hidden="true"></div></div><div class="unload-note" aria-live="polite"></div></div>
      <div class="boarding-manifest"><section class="party-current"><span class="party-heading">今回、乗せる？</span><div class="party-art" aria-hidden="true"></div><b class="party-name"></b><strong class="party-kg"></strong><div class="party-destination"></div><small class="party-value"></small></section>
        <div class="weight-projection"><span class="projection-label">乗せると</span><div class="weight-equation"><span class="equation-current">0</span><span class="equation-plus">＋</span><span class="equation-party">0</span><span class="equation-equal">＝</span><strong class="projected-kg">0</strong><small>/ 450 kg</small></div><b class="projection-over" hidden></b></div>
        <div class="next-party"><small>NEXT · 次の階の乗客</small><b></b><span></span></div><div class="next-unload"></div><ul class="aboard-roster" aria-label="乗車名簿"></ul></div></div>
    <div class="decision-meter"><div class="decision-track"><i class="decision-fill"></i></div><span class="decision-time"></span></div>
    <div class="elevator-controls"><button type="button" id="left-button" aria-label="見送る">← 見送る<small>← / A</small></button><button type="button" id="right-button" aria-label="乗せる">乗せる →<small>→ / D</small></button></div>
    <div class="overload-banner" role="alert" hidden></div>`;
  parent.append(root);
  const find = <T extends HTMLElement = HTMLElement>(selector: string): T => root.querySelector<T>(selector)!;
  const load = find('#load-value'); const loadFill = find('.load-fill'); const floor = find('.floor-plaque'); const mode = find('.mode-plaque');
  const free = find('.free-kg'); const projection = find('.weight-projection'); const projectionLabel = find('.projection-label');
  const equationCurrent = find('.equation-current'); const equationParty = find('.equation-party'); const projectedKg = find('.projected-kg'); const projectionOver = find('.projection-over');
  const occupants = find('.cab-occupants'); const leftDoor = find('.door-left'); const rightDoor = find('.door-right'); const unloaded = find('.unload-note');
  const art = find('.party-art'); const name = find('.party-name'); const weight = find('.party-kg'); const destination = find('.party-destination'); const value = find('.party-value');
  const nextName = find('.next-party b'); const nextInfo = find('.next-party span'); const nextUnload = find('.next-unload'); const roster = find('.aboard-roster');
  const meter = find('.decision-fill'); const seconds = find('.decision-time'); const warning = find('.overload-banner');
  const leftButton = find<HTMLButtonElement>('#left-button'); const rightButton = find<HTMLButtonElement>('#right-button');
  const abort = new AbortController(); const options = { signal: abort.signal };
  const run = new ElevatorRun(event => hooks.onEvent(event));
  let paused = false; let title = true; let destroyed = false; let notified = false;
  let frame = 0; let last = performance.now(); let signature = ''; let motionSignature = ''; let guardUntil = 0;
  let approval: { id: number; side: ElevatorSide; party: number } | null = null;
  let keyboardStarted = false; let keyboardApproval: { side: ElevatorSide; party: number } | null = null;
  const modifiers = (event: MouseEvent | KeyboardEvent): boolean => event.altKey || event.ctrlKey || event.shiftKey || event.metaKey;
  const available = (): boolean => {
    const s = run.snapshot();
    return !destroyed && !title && !paused && s.alive && !s.pending && s.phase === 'boarding' && performance.now() >= guardUntil && !document.querySelector('dialog[open]');
  };
  const clearInput = (): void => { approval = null; keyboardApproval = null; };
  function picture(item: ElevatorItem, className: string): HTMLElement {
    const wrapper = document.createElement('span'); wrapper.className = className; wrapper.dataset.kind = item.kind;
    const image = document.createElement('img'); image.src = assetFile(item); image.alt = item.label; image.draggable = false; image.decoding = 'async';
    image.addEventListener('error', () => { image.hidden = true; wrapper.classList.add('asset-fallback'); wrapper.textContent = item.label; }, { once: true });
    wrapper.append(image); return wrapper;
  }
  function draw(): void {
    const s = run.inspection();
    const key = [title, paused, s.phase, s.floor, s.load, s.currentParty.id, s.nextParty.id, s.mode, s.pending, s.lastSide,
      s.aboard.map(p => p.id).join(','), s.lastUnloaded.map(p => p.id).join(',')].join('|');
    if (key !== signature) {
      signature = key; root.dataset.phase = title ? 'title' : s.phase; root.dataset.paused = String(paused); root.dataset.mode = s.mode;
      root.dataset.decision = s.lastSide ?? ''; root.dataset.turn = String(s.currentParty.id);
      load.textContent = String(s.load); loadFill.style.width = `${Math.min(100, s.load / s.capacity * 100)}%`;
      free.textContent = String(Math.max(0, s.capacity - s.load));
      root.classList.toggle('is-near-capacity', s.load / s.capacity >= 0.8);
      floor.textContent = `${s.floor} F`; mode.hidden = s.mode !== 'fast'; mode.textContent = '業務用高速 · ×1.5';
      const candidate = s.currentParty;
      const prospective = title || s.phase === 'boarding'; const projected = prospective ? s.load + candidate.kg : s.load;
      projection.dataset.prospective = String(prospective); projection.classList.toggle('is-over', projected > s.capacity);
      projectionLabel.textContent = prospective ? '乗せると' : '現在の荷重'; equationCurrent.textContent = String(s.load); equationParty.textContent = String(candidate.kg); projectedKg.textContent = String(projected);
      projectionOver.hidden = projected <= s.capacity; projectionOver.textContent = `${projected - s.capacity} kgオーバー！`;
      name.textContent = candidate.label; weight.textContent = `${candidate.kg} kg`; destination.textContent = `行先 ${candidate.destination}F`;
      value.textContent = `届けると ${Math.round(candidate.value * s.scoreMultiplier)}点 ＋積載効率`;
      art.replaceChildren(...candidate.items.map(i => picture(i, 'candidate-item')));
      nextName.textContent = s.nextParty.label;
      nextInfo.textContent = `${s.nextParty.kg}kg →${s.nextParty.destination}F · ${Math.round(s.nextParty.value * s.scoreMultiplier)}点`;
      nextUnload.textContent = s.nextUnload ? `次の降車 ${s.nextUnload.floor}F：−${s.nextUnload.kg}kg` : '降車予定：なし';
      roster.replaceChildren(...s.aboard.map(p => { const li = document.createElement('li'); li.textContent = `${p.label} ${p.kg}kg →${p.destination}F`; return li; }));
      if (!s.aboard.length) { const li = document.createElement('li'); li.className = 'roster-empty'; li.textContent = 'かごは空です'; roster.append(li); }
      const items = s.aboard.flatMap(p => p.items);
      occupants.replaceChildren(...items.slice(0, 6).map(i => picture(i, 'aboard-item')));
      if (items.length > 6) { const more = document.createElement('span'); more.className = 'occupants-more'; more.textContent = `＋${items.length - 6}（名簿参照）`; occupants.append(more); }
      if (items.length > 3) { const more = document.createElement('span'); more.className = 'occupants-more-mobile'; more.textContent = `＋${items.length - 3}（名簿参照）`; occupants.append(more); }
      const unloadedKg = s.lastUnloaded.reduce((sum, p) => sum + p.kg, 0); const unloadedPeople = s.lastUnloaded.flatMap(p => p.items).reduce((sum, i) => sum + i.people, 0); const unloadedCargo = s.lastUnloaded.flatMap(p => p.items).reduce((sum, i) => sum + i.cargo, 0);
      unloaded.textContent = s.lastUnloaded.length ? `${s.floor}F · ${unloadedPeople}人${unloadedCargo ? `・荷物${unloadedCargo}点` : ''}降りました\n−${unloadedKg} kg · お届け完了` : s.phase === 'departing' ? s.lastSide === 'accept' ? '乗車完了。次の階へ。' : '今回は見送り。次の階へ。' : '行き先の階で降ります';
      warning.hidden = s.phase !== 'overload'; warning.textContent = s.phase === 'overload' ? `重量オーバー！\n${s.load} / 450 kg · ${s.excessKg}kg 超過` : '';
      leftButton.disabled = rightButton.disabled = !available();
      leftButton.setAttribute('aria-label', `見送る：${partyText(candidate)}`); rightButton.setAttribute('aria-label', `乗せる：${partyText(candidate)}`);
    }
    const door = title ? 1 : s.doorOpen;
    const percent = s.phase === 'boarding' && !title ? Math.max(0, s.decisionRemaining / s.decisionSeconds * 100) : 0;
    const timer = title ? '左右で乗降を判断' : s.pending ? '乗り換えを選んでください' : s.phase === 'boarding' ? `${s.decisionRemaining.toFixed(1)}s` : s.phase === 'overload' ? '過積載。運転を停止しました。' : s.phase === 'travel' ? '上昇中' : s.phase === 'departing' ? '扉が閉まります' : '降車中';
    const motionKey = [door.toFixed(3), percent.toFixed(1), timer].join('|');
    if (motionKey !== motionSignature) {
      motionSignature = motionKey; leftDoor.style.transform = `translateX(${-door * 100}%)`; rightDoor.style.transform = `translateX(${door * 100}%)`;
      meter.style.width = `${percent.toFixed(1)}%`; seconds.textContent = timer;
    }
    // The short post-choice guard may expire while the visual state is unchanged.
    const disabled = !available(); if (leftButton.disabled !== disabled) leftButton.disabled = rightButton.disabled = disabled;
  }
  function publish(): void {
    draw(); hooks.onUpdate(run.snapshot());
    if (!title && !notified && !run.snapshot().alive) { const result = run.result(); if (result) { notified = true; clearInput(); hooks.onEnd(result); } }
  }
  function input(side: ElevatorSide): boolean {
    if (!available() || !run.input(side)) return false;
    clearInput(); publish(); return true;
  }
  const stage = parent.closest<HTMLElement>('#stage') ?? parent;
  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || modifiers(event) || (event.target as Element).closest('button,a') || !available()) return;
    event.preventDefault(); const rect = stage.getBoundingClientRect(); input(event.clientX < rect.left + rect.width / 2 ? 'refuse' : 'accept');
  }, options);
  for (const [button, side] of [[leftButton, 'refuse'], [rightButton, 'accept']] as const) {
    button.addEventListener('pointerdown', event => {
      if (event.isPrimary && event.button === 0 && !modifiers(event) && available()) approval = { id: event.pointerId, side, party: run.snapshot().currentParty.id };
    }, options);
    button.addEventListener('pointercancel', event => { if (approval?.id === event.pointerId) approval = null; }, options);
    button.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.repeat || modifiers(event)) { event.preventDefault(); return; }
      keyboardStarted = true; keyboardApproval = available() ? { side, party: run.snapshot().currentParty.id } : null;
    }, options);
    button.addEventListener('click', event => {
      if (modifiers(event)) return;
      const pointer = event as PointerEvent;
      if (event.detail > 0 || pointer.pointerType) {
        if (!approval || approval.id !== pointer.pointerId || approval.side !== side || approval.party !== run.snapshot().currentParty.id) return;
      } else if (keyboardStarted && (keyboardApproval?.side !== side || keyboardApproval.party !== run.snapshot().currentParty.id)) {
        keyboardStarted = false; keyboardApproval = null; return;
      }
      approval = null; keyboardStarted = false; keyboardApproval = null; input(side);
    }, options);
  }
  document.addEventListener('keydown', event => {
    if (event.repeat || modifiers(event) || !available() || (event.target as Element)?.closest('input,textarea,select,[contenteditable="true"]')) return;
    const key = event.key.toLowerCase(); const side = key === 'arrowleft' || key === 'a' ? 'refuse' : key === 'arrowright' || key === 'd' ? 'accept' : null;
    if (!side) return; event.preventDefault(); input(side);
  }, options);
  function tick(now: number): void {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if (!paused && !title) run.step(dt);
    publish(); if (!destroyed) frame = requestAnimationFrame(tick);
  }
  draw(); frame = requestAnimationFrame(tick);
  return {
    start() { title = false; paused = false; notified = false; clearInput(); run.start(); last = performance.now(); signature = ''; publish(); },
    title() { title = true; paused = false; clearInput(); run.reset(); signature = ''; publish(); },
    input,
    choose(choice) {
      if (destroyed || paused || title || !run.choose(choice)) return false;
      clearInput(); guardUntil = performance.now() + 350; last = performance.now(); publish(); return true;
    },
    pause(value) { paused = value; clearInput(); last = performance.now(); signature = ''; publish(); },
    snapshot: () => run.snapshot(), inspection: () => run.inspection(),
    destroy() { if (destroyed) return; destroyed = true; abort.abort(); cancelAnimationFrame(frame); clearInput(); root.remove(); },
  };
}
