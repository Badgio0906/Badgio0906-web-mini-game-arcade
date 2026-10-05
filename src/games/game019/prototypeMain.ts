import { ChargeRun } from './ChargeRun';
import { ChargeInput } from './ChargeInput';
import { ChargeBoard } from './ChargeBoard';
import { createFlatPrototype, createStagePrototype } from './prototypeLevel';
import type { ChargeEvent } from './chargeTypes';
const canvas = document.querySelector<HTMLCanvasElement>('#trial-canvas')!;
const board = new ChargeBoard(canvas), output = document.querySelector<HTMLElement>('#trial-status')!;
let events: ChargeEvent[] = [], weak = false, peek = false, stage = false;
let run = new ChargeRun(createFlatPrototype(), e => events.push(e));
const input = new ChargeInput(document.querySelector<HTMLButtonElement>('#jump-button')!, document.querySelector<HTMLButtonElement>('#left-button')!, document.querySelector<HTMLButtonElement>('#right-button')!, { enabled: () => run.alive, begin: () => run.beginCharge(), release: () => { run.releaseCharge(); }, cancel: () => run.cancelCharge(), direction: d => run.setDirection(d), peek: p => { peek = p; }, focus: () => canvas.focus({ preventScroll: true }) }, document.querySelector<HTMLButtonElement>('#peek-button')!);
function restart(): void { input.reset(); events = []; run = new ChargeRun(stage ? createStagePrototype() : createFlatPrototype(), e => events.push(e), weak ? 24 : 0); board.resetCamera(); canvas.focus(); }
document.querySelector<HTMLButtonElement>('#restart-button')!.addEventListener('click', restart);
document.querySelector<HTMLButtonElement>('#assist-button')!.addEventListener('click', () => { weak = !weak; (document.querySelector<HTMLButtonElement>('#assist-button') as HTMLElement).textContent = weak ? '比較：弱い空中補正' : '比較：空中補正なし'; restart(); });
document.querySelector<HTMLButtonElement>('#stage-button')!.addEventListener('click', () => { stage = !stage; document.querySelector<HTMLButtonElement>('#stage-button')!.textContent = stage ? '平地へ' : '20m試験地形へ'; restart(); });
let last = performance.now();
function frame(now: number): void { const dt = Math.min(.05, (now - last) / 1000); last = now; run.update(dt); const s = run.snapshot(); board.draw(s, { dt, peek, practice: true }); output.textContent = `${weak ? '弱補正を比較中' : '空中補正なし'} / ${s.height.toFixed(1)}m / 最大 ${s.maxHeight.toFixed(1)}m / ${s.feedback}`; requestAnimationFrame(frame); }
requestAnimationFrame(frame);
window.addEventListener('pagehide', () => input.destroy(), { once: true });
if (import.meta.env.DEV) Object.defineProperty(window, '__chargeTrial', { get: () => ({ run: run.snapshot(), events: structuredClone(events), weak, stage }) });
if (import.meta.env.DEV) Object.defineProperty(window, '__chargeForecasts', { get: () => ( [60, 80, 100, 120, 150, 200, 250, 300, 325, 350, 375, 400, 425, 450, 475, 500, 525, 550, 575, 600, 625, 650, 675, 700].flatMap(ms => ([-1, 0, 1] as const).map(d => run.forecast(ms, d)))) });
