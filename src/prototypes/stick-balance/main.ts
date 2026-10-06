import { CONFIG, Simulation } from './model';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
<main class="shell">
<header><a href="https://game100garage.com/" aria-label="100ガレの一覧へ">100<span>ガレ</span><small>GAME100 GARAGE</small></a><span class="lab">試作室 / 008候補</span><button id="sound" aria-pressed="false">音 OFF</button></header>
<section class="intro"><div><p class="eyebrow">PALM BALANCE</p><h1>のせて、たてて。</h1></div><p class="tagline">倒れるほうへ、手をすっと。<br>戻ったら、いったん止めよう。</p></section>
<section class="game" aria-label="棒バランスゲーム">
<div class="hud"><div><small>たてた時間</small><strong id="score">0.0<span> s</span></strong></div><div class="stage"><small id="stage-label">ながい棒</small><div id="steps" aria-label="長さの段階">● ○ ○ ○ ○</div></div><button id="pause" disabled>一時停止</button></div>
<div class="scene">
<svg id="art" viewBox="0 0 600 570" role="img" aria-label="開いた手のひらの上に、細い伸縮式の棒が立っています">
<defs>
<linearGradient id="sky" x2="0" y2="1"><stop stop-color="#f7f1df"/><stop offset="1" stop-color="#fffaf0"/></linearGradient>
<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#c7c5ad" opacity=".36"/></pattern>
<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
</defs>
<rect width="600" height="570" fill="url(#sky)"/><rect width="600" height="570" fill="url(#dots)"/>
<circle cx="300" cy="236" r="183" fill="#fffdf6" opacity=".85"/>
<g fill="none" stroke="#cbd6bf" stroke-width="2" opacity=".7"><path d="M40 151h55m-27-27v54M502 262h30m-15-15v30"/><circle cx="492" cy="77" r="8"/><circle cx="100" cy="318" r="5"/></g>
<text x="300" y="51" text-anchor="middle" class="scene-caption">ちいさな手のひら、大きな集中。</text>
<path d="M0 501Q300 464 600 501V570H0" fill="#e4ebd7"/><path d="M0 516Q300 479 600 516" fill="none" stroke="#c6d8bd" stroke-width="2"/>
<g id="floor" stroke="#b4c9af" stroke-width="2" opacity=".7"></g>
<ellipse id="ground-shadow" cx="300" cy="519" rx="76" ry="10" fill="#647b62" opacity=".16" filter="url(#shadow)"/>
<g id="assembly" transform="translate(300 379)">
<g id="hand">
<!-- Original flat vector, revision 2: relaxed upturned palm, staggered fingers.
     Contact stays at (0,0); wrist animation and physics are unchanged. -->
<path d="M-91 170L-88 88Q-87 73-76 61L-43 76Q-52 91-51 111L-47 170Z" fill="#439b8b" stroke="#34574d" stroke-width="3.2" stroke-linejoin="round"/>
<path d="M-88 88L-82 69L-43 80L-48 100Z" fill="#f3f3df" stroke="#34574d" stroke-width="3" stroke-linejoin="round"/>
<path d="M-81 70Q-75 44-56 23Q-35 1-10 0L12 0L53-10Q64-13 67-6Q70 1 61 5L42 12L66 7Q77 5 79 13Q80 19 70 22L46 28L62 25Q72 25 72 32Q71 38 62 40L41 43L49 42Q58 43 56 49Q54 54 44 55L16 55Q32 60 31 68Q29 76 20 73L-13 57Q-30 62-43 80Z" fill="#f5c69e" stroke="#735943" stroke-width="3.2" stroke-linejoin="round"/>
<path d="M-42 18Q-27 5-10 3L13 3L44-4L50 1Q24 13 2 17Q-24 22-42 18Z" fill="#ffdab6"/>
<!-- Only three short finger separations; no nails, knuckles or flesh shading. -->
<path d="M42 12L30 15M46 28L33 30M41 43L31 44" fill="none" stroke="#b78a68" stroke-width="2.1" stroke-linecap="round"/>
<!-- A single open crease describes the thumb root; no enclosed raised finger. -->
<path d="M-47 43Q-26 34-10 45L16 55" fill="none" stroke="#b78a68" stroke-width="2.1" stroke-linecap="round"/>

</g>
<ellipse cx="0" cy="2" rx="13" ry="4" fill="#805232" opacity=".26"/>
<g id="rod"></g>
<g id="save-effect" opacity="0" fill="none" stroke="#df9950" stroke-width="3" stroke-linecap="round"><path d="M-27-24l-8-8M27-24l8-8M-36-2h-8M36-2h8"/></g>
</g>
<g id="danger" opacity="0" stroke="#dc7758" stroke-width="3" fill="none" stroke-linecap="round"><path d="M454 326l7-14m-1 28 13-4"/></g>
<text id="feedback" x="430" y="474" text-anchor="middle"></text>
</svg>
<div id="notice" aria-live="polite"></div>
<div id="overlay"><div class="card"><p class="eyebrow">手のひらチャレンジ</p><h2 id="message">何秒、たてられる？</h2><p id="description">左右で支えるだけ。<br>12秒ごとに、棒がすこし短くなる。</p><button id="start">やってみる <span>→</span></button><p class="hint">← → / A・D ／ 下の左右ボタン</p></div></div>
</div>
<div class="controls" aria-label="左右操作"><button id="left" aria-label="手を左へ">←<span>左へ</span></button><p>倒れるほうへ<br><b>動かして、離す</b></p><button id="right" aria-label="手を右へ"><span>右へ</span>→</button></div>
</section>
<footer>長いほど、ゆっくり。短いほど、どきどき。<span>独立試作 · 記録はこの画面だけ</span></footer>
</main>`;
const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const sim = new Simulation();
let mode: 'ready' | 'playing' | 'paused' | 'over' = 'ready';
let last = performance.now(), sound = false, audio: AudioContext | undefined;
let cameraX = 0;
let fallen = 0, dangerSeen = false, effect = 0, run = 0;
const keys = new Set<string>();
const pointers = new Map<number, number>();
const clearInput = () => { keys.clear(); pointers.clear(); $('#left').classList.remove('held'); $('#right').classList.remove('held'); };
function input(): number {
  const left = keys.has('ArrowLeft') || keys.has('a') || [...pointers.values()].includes(-1);
  const right = keys.has('ArrowRight') || keys.has('d') || [...pointers.values()].includes(1);
  return Number(right) - Number(left);
}
function beep(): void {
  if (!sound) return;
  audio ??= new AudioContext();
  const osc = audio.createOscillator(), gain = audio.createGain();
  osc.type = 'sine'; osc.frequency.setValueAtTime(650, audio.currentTime); osc.frequency.exponentialRampToValueAtTime(980, audio.currentTime + .09);
  gain.gain.setValueAtTime(.035, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .16);
  osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime + .17);
}
function begin(): void {
  clearInput(); sim.reset(++run % 2 ? 1 : -1); mode = 'playing'; cameraX = 0; fallen = 0; dangerSeen = false; effect = 0; last = performance.now();
  $('#overlay').classList.add('hidden'); $('#pause').removeAttribute('disabled'); $('#pause').textContent = '一時停止';
  if (sound) { audio ??= new AudioContext(); void audio.resume(); }
}
function pause(): void {
  if (mode !== 'playing') return;
  mode = 'paused'; clearInput(); $('#overlay').classList.remove('hidden'); $('#message').textContent = 'ひと息、どうぞ。';
  $('#description').textContent = '続けるまで、時間も棒も止まっています。'; $('#start').textContent = 'つづける →'; $('#pause').setAttribute('disabled', '');
}
$('#start').addEventListener('click', () => {
  if (mode === 'paused') { mode = 'playing'; clearInput(); last = performance.now(); $('#overlay').classList.add('hidden'); $('#pause').removeAttribute('disabled'); }
  else begin();
});
$('#pause').addEventListener('click', pause);
$('#sound').addEventListener('click', () => { sound = !sound; $('#sound').textContent = sound ? '音 ON' : '音 OFF'; $('#sound').setAttribute('aria-pressed', String(sound)); if (sound) { audio ??= new AudioContext(); void audio.resume(); } });
window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase().startsWith('arrow') ? e.key : e.key.toLowerCase();
  if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(key)) { e.preventDefault(); if (mode === 'playing') keys.add(key); }
  if (e.key === 'Escape') pause();
  if (e.code === 'Space' && mode === 'over' && !e.repeat && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); begin(); }
});
window.addEventListener('keyup', e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
for (const [selector, direction] of [['#left', -1], ['#right', 1]] as const) {
  const button = $<HTMLButtonElement>(selector);
  button.addEventListener('pointerdown', e => { e.preventDefault(); if (mode !== 'playing') return; button.setPointerCapture(e.pointerId); pointers.set(e.pointerId, direction); button.classList.add('held'); });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, e => { pointers.delete((e as PointerEvent).pointerId); button.classList.remove('held'); });
  button.addEventListener('contextmenu', e => e.preventDefault());
}
window.addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('resize', pause);
const colors = ['#eeb84e', '#3d9c91', '#ed9277', '#5caca2', '#edba57'];
function draw(): void {
  const s = sim.state;
  const palmX = 300 + Math.tanh((s.x - cameraX) / 1.8) * 72; // Tracking view, no invisible world walls.
  $('#assembly').setAttribute('transform', `translate(${palmX} 379)`);
  $('#hand').setAttribute('transform', `rotate(${Math.max(-4, Math.min(4, s.v * 1.3))})`);
  $('#ground-shadow').setAttribute('cx', String(palmX - 28));
  const fallAngle = mode === 'over' ? Math.sign(s.angle) * fallen * 1.1 : 0;
  const fallY = mode === 'over' ? fallen * fallen * 230 : 0;
  $('#rod').setAttribute('transform', `translate(0 ${fallY}) rotate(${(s.angle + fallAngle) * 180 / Math.PI})`);
  let rod = '', bottom = 0;
  for (let i = 0; i < 5; i++) {
    const length = Math.max(0, Math.min(i === 0 ? 70 : 50, s.length * 90 - bottom));
    if (length <= 0) break;
    const width = 18 - i * 2;
    rod += `<rect x="${-width / 2}" y="${-bottom - length}" width="${width}" height="${length + 1}" rx="3" fill="${colors[i]}" stroke="#524638" stroke-width="2.5"/><path d="M${-width / 2 + 4} ${-bottom - 5}v${-Math.max(0, length - 11)}" stroke="#fff6cd" stroke-width="2" opacity=".65"/><rect x="${-width / 2 - 1.5}" y="${-bottom - 5}" width="${width + 3}" height="5" rx="2" fill="#675c4b"/>`;
    bottom += length;
  }
  $('#rod').innerHTML = rod + '<ellipse cx="0" cy="0" rx="9" ry="3" fill="#453e32"/>';
  $('#score').innerHTML = `${s.time.toFixed(1)}<span> s</span>`;
  $('#stage-label').textContent = ['ながい棒', 'ちょっと短い', 'はんぶんへ', '短い棒', 'さいごの集中'][s.stage];
  $('#steps').textContent = CONFIG.stages.map((_, i) => i <= s.stage ? '●' : '○').join(' ');
  const next = CONFIG.stages[s.stage + 1];
  $('#notice').textContent = mode === 'playing' && next && next.at - s.time <= CONFIG.warning ? `あと ${Math.ceil(next.at - s.time)} 秒で、すこし短く` : mode === 'playing' && s.stage > 0 && s.time - CONFIG.stages[s.stage].at < CONFIG.shrinkDuration ? 'すーっと、短く…' : '';
  const danger = Math.abs(s.angle) > .52;
  $('#danger').setAttribute('opacity', danger && mode === 'playing' ? '.8' : '0');
  $('#danger').setAttribute('transform', s.angle < 0 ? 'translate(600 0) scale(-1 1)' : '');
  $('#save-effect').setAttribute('opacity', String(Math.min(1, effect * 2)));
  $('#feedback').textContent = effect > 0 ? 'いい立て直し！' : mode === 'playing' && s.time < 4 ? '傾いたほうへ、ちょん。' : '';
  let floor = '';
  for (let i = -1; i < 10; i++) { const x = i * 80 - ((s.x * 24) % 80); floor += `<path d="M${x} 518l-10 17"/>`; }
  $('#floor').innerHTML = floor;
  app.dataset.mode = mode;
}
function frame(now: number): void {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (mode === 'playing') {
    sim.advance(dt, input());
    cameraX += (sim.state.x - cameraX) * (1 - Math.exp(-1.8 * dt));
    const s = sim.state;
    if (Math.abs(s.angle) > .55) dangerSeen = true;
    if (dangerSeen && Math.abs(s.angle) < .18 && Math.abs(s.omega) < .6) { dangerSeen = false; effect = .7; beep(); }
    if (s.over) {
      mode = 'over'; clearInput(); $('#pause').setAttribute('disabled', '');
      $('#message').textContent = `${s.time.toFixed(1)} 秒、たてた！`;
      $('#description').textContent = '動かしたあとに、離して止めるのがコツ。'; $('#start').textContent = 'もう一回 →';
    }
  }
  if (mode === 'over') { fallen = Math.min(.75, fallen + dt); if (fallen > .55) $('#overlay').classList.remove('hidden'); }
  effect = Math.max(0, effect - dt); draw(); requestAnimationFrame(frame);
}
// Read-only diagnostics in dev only. No state setter, cheat, or production telemetry.
if (import.meta.env.DEV) Object.defineProperty(window, '__stick', { get: () => ({ ...sim.state, mode, input: input() }) });
draw(); requestAnimationFrame(frame);
