import { ElevatorRun } from './ElevatorRun';
import type { ElevatorController, ElevatorHooks, ElevatorItem, ElevatorSide } from './contracts';
const file = (item: ElevatorItem) => `./assets/game007/${item.people ? 'passenger' : 'cargo'}-${item.kind}.webp`;
export function createElevatorGame(parent: HTMLElement, hooks: ElevatorHooks): ElevatorController {
  const root = document.createElement('div'); root.className = 'elevator-board';
  root.innerHTML = `<div class="load-readout"><span>現在 / 最大</span><strong id="load-value">0 / 450 kg</strong><b class="free-readout"></b><div class="load-track"><i></i></div></div>
    <div class="cab-layout"><div class="cab-frame"><div class="floor-plaque"></div><div class="cab-inner"><div class="cab-occupants"></div><div class="door-left"></div><div class="door-right"></div></div><div class="unload-note" aria-live="polite"></div></div>
    <section class="party-current"><span class="party-heading">今回、乗せる？</span><div class="party-art"></div><h2 class="party-name"></h2><strong class="party-destination"></strong><div class="party-details"></div><div class="deadline"></div><div class="weight-projection"></div></section></div>
    <div class="future"><h3>次の2階 · 確定の待機情報</h3><div class="future-list"></div></div>
    <div class="aboard"><b>乗車名簿</b><span class="next-unload"></span><div class="aboard-roster"></div></div>
    <div class="elevator-controls"><button id="left-button" type="button">見送る<small>← / A</small></button><button id="right-button" type="button">乗せる<small>→ / D</small></button><button id="depart-button" type="button">出発<small>Space</small></button></div><div class="time-cost">乗車0.7秒 · 見送り0.2秒 · 1階移動1秒＋扉0.4秒 · 降車停車0.8秒</div>`;
  parent.append(root);
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const run = new ElevatorRun(hooks.onEvent); const abort = new AbortController(); const opt = { signal: abort.signal };
  let paused = false, title = true, destroyed = false, notified = false, frame = 0, last = performance.now(), signature = '', guard = 0;
  let pointer: { id: number; side: ElevatorSide; party: number; floor: number } | null = null;
  const buttons = [['#left-button', 'refuse'], ['#right-button', 'accept'], ['#depart-button', 'depart']] as const;
  const available = () => !paused && !title && run.snapshot().alive && run.snapshot().phase === 'boarding' && performance.now() >= guard;
  function picture(item: ElevatorItem) { const image = document.createElement('img'); image.src = file(item); image.alt = item.label; image.draggable = false; return image; }
  function draw() {
    const s = run.inspection();
    const key = [title, s.phase, s.floor, s.currentParty?.id, s.load, s.score, s.lastPoints, s.aboard.map(p => p.id), s.mode].join('|');
    if (signature !== key) {
      signature = key; root.dataset.phase = s.phase; $('.floor-plaque').textContent = `${s.floor}F ↑ ${s.target}F`;
      $('#load-value').textContent = `${s.load} / 450 kg`; $('.free-readout').textContent = `空き ${450 - s.load} kg`; $('.load-track i').style.width = `${s.load / 450 * 100}%`;
      const p = s.currentParty; $('.party-heading').textContent = s.phase === 'boarding' ? `この階の候補 · 残り${s.queue.length}組` : s.phase === 'travel' ? `${s.floor + 1}Fへ上昇中` : '準備中';
      $('.party-art').replaceChildren(...(p?.items ?? []).map(picture));
      $('.party-name').textContent = p?.label ?? (s.phase === 'boarding' ? '候補は終了' : 'お届け中');
      $('.party-destination').textContent = p ? `行先 ${p.destination}F` : `次 ${s.nextStop}F`;
      $('.party-details').textContent = p ? `${p.kg} kg · 配達 ${p.value}点` : '空けたまま出発できます';
      $('.weight-projection').textContent = p ? `乗せると ${s.load + p.kg} / 450 kg${s.load + p.kg > 450 ? ' · 上限超過' : ''}` : `現在 ${s.load} kg`;
      $('.weight-projection').classList.toggle('over', !!p && s.load + p.kg > 450);
      $('.cab-occupants').replaceChildren(...s.aboard.flatMap(p => p.items).slice(0, 5).map(picture));
      $('.unload-note').textContent = s.lastUnloaded.length ? `${s.floor}F：${s.lastUnloaded.length}組降車 −${s.lastUnloaded.reduce((n, p) => n + p.kg, 0)}kg\n${s.phase === 'unloading' ? '降車中…' : `配達 ＋${s.lastPoints}点`}` : s.phase === 'travel' ? '扉が閉じます · 上昇中' : '行先に届けて、初めて得点';
      $('.future-list').replaceChildren(...s.future.map(f => { const div = document.createElement('div'); div.className = 'future-floor'; const b = document.createElement('b'); b.textContent = `${f.floor}F`; div.append(b); const span = document.createElement('span'); span.textContent = f.parties.length ? f.parties.map(p => `${p.label} ${p.kg}kg→${p.destination}F ${p.value}点${p.deadline === null ? '' : ` / 開始${p.deadline}秒まで`}`).join('\n') : '待機なし'; div.append(span); return div; }));
      $('.next-unload').textContent = s.nextUnload ? `次の降車 ${s.nextUnload.floor}F −${s.nextUnload.kg}kg` : '降車予定なし';
      $('.aboard-roster').textContent = s.aboard.length ? s.aboard.map(p => `${p.label} ${p.kg}kg →${p.destination}F${p.deadline === null ? '' : ` / 開始${p.deadline}秒まで`}`).join('　｜　') : 'かごは空です';
    }
    const p = s.currentParty; const deadline = $('.deadline');
    deadline.textContent = s.phase !== 'boarding' ? '準備中 · 次の判断まで待機' : p?.deadline !== null && p ? `締切まで ${Math.max(0, p.deadline - (s.limit - s.remaining)).toFixed(1)}秒 · 最短あと${Math.max(0, s.minimumArrival! - (s.limit - s.remaining)).toFixed(1)}秒${s.minimumArrival! > p.deadline ? ' / 間に合わない' : ' / 今なら間に合う'}` : p ? '締切なし' : '';
    deadline.classList.toggle('late', !!p && p.deadline !== null && s.minimumArrival! > p.deadline);
    $('.door-left').style.transform = `translateX(${-s.doorOpen * 100}%)`; $('.door-right').style.transform = `translateX(${s.doorOpen * 100}%)`;
    for (const [selector, side] of buttons) $(selector).toggleAttribute('disabled', !available() || side !== 'depart' && !p || side === 'accept' && !!p && s.load + p.kg > 450);
  }
  function publish() { draw(); hooks.onUpdate(run.snapshot()); if (!title && !notified && !run.snapshot().alive) { const result = run.result(); if (result) { notified = true; pointer = null; hooks.onEnd(result); } } }
  function input(side: ElevatorSide) { if (!available() || !run.input(side)) return false; guard = performance.now() + 130; pointer = null; publish(); return true; }
  for (const [selector, side] of buttons) {
    $(selector).addEventListener('pointerdown', e => { if (e.button === 0 && e.isPrimary && available()) pointer = { id: e.pointerId, side, party: run.snapshot().currentParty?.id ?? -1, floor: run.snapshot().floor }; }, opt);
    $(selector).addEventListener('click', e => { const event = e as PointerEvent; if (event.detail && (!pointer || pointer.id !== event.pointerId || pointer.side !== side || pointer.party !== (run.snapshot().currentParty?.id ?? -1) || pointer.floor !== run.snapshot().floor)) return; input(side); }, opt);
    $(selector).addEventListener('keydown', e => { if (e.repeat) e.preventDefault(); }, opt);
  }
  document.addEventListener('pointercancel', () => { pointer = null; }, opt);
  document.addEventListener('keydown', e => {
    if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || (e.target as Element)?.closest('button,a,input,textarea,select')) return;
    const key = e.key.toLowerCase(); const side = key === 'arrowleft' || key === 'a' ? 'refuse' : key === 'arrowright' || key === 'd' ? 'accept' : key === ' ' ? 'depart' : null;
    if (side && available()) { e.preventDefault(); input(side); }
  }, opt);
  function tick(now: number) { const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now; if (!paused && !title) run.step(dt); publish(); if (!destroyed) frame = requestAnimationFrame(tick); }
  draw(); frame = requestAnimationFrame(tick);
  return { start(scenario = 0, practice = false) { title = false; paused = false; notified = false; guard = performance.now() + 180; pointer = null; run.start(scenario, practice); last = performance.now(); signature = ''; publish(); },
    title() { title = true; paused = false; pointer = null; run.reset(); signature = ''; publish(); }, input,
    choose(choice) { if (paused || title || !run.choose(choice)) return false; guard = performance.now() + 220; pointer = null; publish(); return true; },
    pause(value) { paused = value; pointer = null; last = performance.now(); publish(); }, snapshot: () => run.snapshot(), inspection: () => run.inspection(),
    destroy() { destroyed = true; abort.abort(); cancelAnimationFrame(frame); root.remove(); } };
}
