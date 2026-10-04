import { EchoRun } from './EchoRun';
import type { EchoController, EchoHooks, EchoResult } from './contracts';

/** Native buttons keep real pointer/keyboard activation and do not load a game engine. */
export function createEchoGame(parent: HTMLElement, hooks: EchoHooks): EchoController {
  const listeners = new AbortController();
  const grid = document.createElement('div'); grid.className = 'echo-grid'; grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', '記憶パネル 3 行 3 列');
  const cells: HTMLButtonElement[] = [];
  let paused = false; let destroyed = false; let reported = false;
  let replay: EchoResult | null = null; let replayAge = 0; let cueCell: number | null = null;
  let lastStamp = performance.now(); let frame = 0;
  let renderKey = '';
  let primaryPointer: { id: number; cell: number; level: number } | null = null;
  const run = new EchoRun(event => hooks.onEvent(event));
  for (let cell = 0; cell < 9; cell++) {
    const button = document.createElement('button'); button.type = 'button'; button.id = `cell-${cell}`; button.className = 'echo-cell'; button.dataset.cell = String(cell);
    button.setAttribute('aria-label', `${cell + 1} 番のパネル`);
    const number = document.createElement('span'); number.className = 'cell-number'; number.textContent = String(cell + 1); number.setAttribute('aria-hidden', 'true');
    const pip = document.createElement('span'); pip.className = 'cell-pip'; pip.setAttribute('aria-hidden', 'true');
    button.append(number, pip);
    button.addEventListener('pointerdown', event => {
      if (button.disabled || paused || !run.alive || run.phase !== 'recall' || !event.isPrimary || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) { event.preventDefault(); return; }
      primaryPointer = { id: event.pointerId, cell, level: run.level };
    }, { signal: listeners.signal });
    button.addEventListener('pointercancel', event => { if (primaryPointer?.id === event.pointerId) primaryPointer = null; }, { signal: listeners.signal });
    button.addEventListener('click', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      // Chromium click.isPrimary is false even after a genuine primary pointerdown.
      const pointerClick = event.detail > 0 || (event instanceof PointerEvent && !!event.pointerType);
      if (pointerClick && (primaryPointer?.cell !== cell || primaryPointer.level !== run.level || (event instanceof PointerEvent && primaryPointer.id !== event.pointerId))) return;
      primaryPointer = null;
      accept(cell);
    }, { signal: listeners.signal });
    button.addEventListener('keydown', event => { if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault(); }, { signal: listeners.signal });
    grid.append(button); cells.push(button);
  }
  parent.append(grid);
  function accept(cell: number): boolean {
    if (destroyed || paused) return false;
    const accepted = run.input(cell);
    if (accepted) {
      hooks.onUpdate(run.snapshot());
      if (!run.alive && !reported) {
        const result = run.result();
        if (result) { reported = true; replay = result; replayAge = 0; cueCell = null; hooks.onEnd(result); }
      }
      draw();
    }
    return accepted;
  }
  document.addEventListener('keydown', event => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || document.querySelector('dialog[open]')) return;
    if (/^[1-9]$/.test(event.key) && !paused && run.alive && run.phase === 'recall') { event.preventDefault(); accept(Number(event.key) - 1); }
  }, { signal: listeners.signal });
  function draw(): void {
    const snapshot = run.snapshot();
    let replayCell: number | null = null;
    if (replay && replayAge >= 0.4) {
      const elapsed = replayAge - 0.4; const index = Math.floor(elapsed / 0.3);
      if (index < replay.sequence.length && elapsed % 0.3 < 0.18) replayCell = replay.sequence[index];
      if (replayCell !== null && replayCell !== cueCell) hooks.onEvent({ type: 'cue', cell: replayCell });
      cueCell = replayCell;
    }
    const key = `${snapshot.phase}:${snapshot.highlightedCell}:${snapshot.alive}:${paused}:${replayCell}:${!!replay && replayAge < 0.45}`;
    if (key === renderKey) return;
    renderKey = key; grid.dataset.phase = snapshot.phase; grid.dataset.paused = String(paused);
    for (let cell = 0; cell < cells.length; cell++) {
      const button = cells[cell];
      button.disabled = paused || !run.alive || snapshot.phase !== 'recall';
      button.classList.toggle('is-lit', snapshot.phase === 'watch' && snapshot.highlightedCell === cell);
      button.classList.toggle('is-correct', (snapshot.phase === 'recall' || snapshot.phase === 'between') && snapshot.highlightedCell === cell);
      button.classList.toggle('is-wrong', !!replay && replay.actualCell === cell && replayAge < 0.45);
      button.classList.toggle('is-expected', !!replay && replay.expectedCell === cell && replayAge < 0.45);
      button.classList.toggle('is-replay', replayCell === cell);
      button.setAttribute('aria-pressed', String(snapshot.highlightedCell === cell || replayCell === cell));
    }
  }
  function tick(stamp: number): void {
    if (destroyed) return;
    const dt = Math.min(0.05, Math.max(0, (stamp - lastStamp) / 1000)); lastStamp = stamp;
    if (!paused) {
      if (run.alive) { run.step(dt); hooks.onUpdate(run.snapshot()); }
      if (replay) replayAge += dt;
    }
    draw(); frame = requestAnimationFrame(tick);
  }
  draw(); frame = requestAnimationFrame(tick);
  return {
    start: () => { if (destroyed) return; paused = false; reported = false; replay = null; replayAge = 0; cueCell = null; primaryPointer = null; lastStamp = performance.now(); run.start(); hooks.onUpdate(run.snapshot()); draw(); },
    title: () => { if (destroyed) return; paused = false; reported = true; replay = null; replayAge = 0; cueCell = null; primaryPointer = null; run.reset(); draw(); },
    input: accept,
    pause: value => { paused = value; if (paused) primaryPointer = null; lastStamp = performance.now(); draw(); },
    snapshot: () => run.snapshot(), inspection: () => run.inspection(),
    destroy: () => { if (destroyed) return; destroyed = true; cancelAnimationFrame(frame); listeners.abort(); grid.remove(); },
  };
}
