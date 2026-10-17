/**
 * Game036 (pilot, unregistered) — minimal UI / input skeleton.
 *
 * Intentionally not finished: no art, no sound, no saved BEST, no telemetry,
 * no records, no portal navigation component. It imports nothing outside
 * src/games/game036 so nothing can be sent externally or overwrite a record.
 */
import './style.css';
import {
  MAX_POSITION,
  ROUNDS,
  createTiming,
  isValidDt,
  nextRound,
  setPaused,
  stepTiming,
  stopTiming,
  targetOf,
  type TimingState,
} from './model';

type Screen = 'title' | 'playing' | 'paused' | 'round' | 'result';

const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = el('app');
const stage = el('stage');
const marker = el('marker');
const targetMark = el('target');
const status = el('status');
const results = el('results');

const buttonsByScreen: Record<Screen, string[]> = {
  title: ['play', 'practice'],
  playing: [],
  paused: ['resume', 'retry', 'title'],
  round: ['next', 'title'],
  result: ['retry', 'title'],
};
const allButtons = ['play', 'practice', 'resume', 'next', 'retry', 'title'];

let game: TimingState = createTiming();
let screen: Screen = 'title';
let previous: number | null = null;

function setScreen(next: Screen): void {
  screen = next;
  previous = null; // never carry a frame timestamp across screens
  app.dataset.screen = next;
  render();
  if (next === 'playing') stage.focus({preventScroll: true});
}

function start(practice: boolean): void {
  game = createTiming(practice); // fresh state: nothing carries over from the previous run
  setScreen('playing');
}

function pause(): void {
  if (screen !== 'playing') return;
  setPaused(game, true);
  setScreen('paused');
}

function resume(): void {
  setPaused(game, false);
  setScreen('playing');
}

function onStop(): void {
  if (screen !== 'playing') return;
  if (!stopTiming(game)) return;
  setScreen(game.outcome === 'complete' ? 'result' : 'round');
}

function onNext(): void {
  if (!nextRound(game)) return;
  setScreen('playing');
}

function render(): void {
  marker.style.left = `${(game.position / MAX_POSITION) * 100}%`;
  targetMark.style.left = `${(targetOf(game) / MAX_POSITION) * 100}%`;
  el('round').textContent = game.practice ? 'PRACTICE' : `ROUND ${Math.min(game.round + 1, ROUNDS)} / ${ROUNDS}`;
  el('score').textContent = String(game.total);

  const last = game.last;
  const detail = last
    ? `目標 ${last.target} / 停止 ${last.position.toFixed(1)} / 差 ${last.distance.toFixed(1)} → ${last.score}点`
    : '';
  switch (screen) {
    case 'title':
      status.textContent = '赤い目標にぴったり止める。3ラウンド、最大3000点。';
      break;
    case 'playing':
      status.textContent = 'クリック・タップ・Spaceで止める';
      break;
    case 'paused':
      status.textContent = '一時停止中（時間も停止しています）';
      break;
    case 'round':
      status.textContent = game.practice ? `${detail}（練習は記録されません）` : detail;
      break;
    case 'result':
      status.textContent = `${detail} / 合計 ${game.total} 点`;
      break;
  }
  el('next').textContent = game.practice ? '次の目標へ' : `ROUND ${game.round + 2} へ`;
  results.replaceChildren(
    ...game.results.map((r) => {
      const li = document.createElement('li');
      li.textContent = `ROUND ${r.round + 1}：${r.score}点（目標 ${r.target} / 停止 ${r.position.toFixed(1)}）`;
      return li;
    }),
  );
  for (const id of allButtons) el<HTMLButtonElement>(id).hidden = !buttonsByScreen[screen].includes(id);
  el<HTMLButtonElement>('pause').disabled = screen !== 'playing';
}

function frame(now: number): void {
  if (screen === 'playing' && game.phase === 'running' && !game.paused) {
    if (previous !== null) {
      const dt = (now - previous) / 1000;
      if (isValidDt(dt)) {
        stepTiming(game, dt);
        render();
      } else {
        pause(); // clock jumped or tab was suspended: stop time instead of jumping the marker
      }
    }
    previous = now;
  } else {
    previous = null;
  }
  requestAnimationFrame(frame);
}

stage.addEventListener('pointerdown', (e) => {
  if (!e.isPrimary || e.button !== 0) return;
  e.preventDefault();
  onStop();
});
document.addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).closest('button,a')) return; // Space on a button activates that button
  if (e.key === 'Escape') {
    pause();
    return;
  }
  if (e.key === ' ') {
    e.preventDefault();
    if (!e.repeat) onStop(); // holding Space never repeats a stop
  }
});
el('play').onclick = () => start(false);
el('practice').onclick = () => start(true);
el('resume').onclick = resume;
el('next').onclick = onNext;
el('retry').onclick = () => start(game.practice);
el('title').onclick = () => {
  game = createTiming();
  setScreen('title');
};
el('pause').onclick = pause;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
});
window.addEventListener('blur', pause);

setScreen('title');
requestAnimationFrame(frame);
