import './style.css';
import { AudioService } from '../../core/AudioService';
import { StorageService } from '../../core/StorageService';
import { TelemetryService, type EventName } from '../../core/TelemetryService';
import { analyticsConfig } from '../../analytics/config';
import { Klondike, SUITS, dailySeed, jstDate, originalSolvableDeck, practiceGame, red, type Source, type Destination, type Draw, type DealMode, type Move } from './Klondike';
import { cardFace, cardLabel, plantBack, suitSymbols } from './cards';
import { SolitaireStore } from './persistence';

type State = 'title' | 'explanation' | 'playing' | 'practice' | 'paused' | 'result' | 'confirm';
type RunBridge = { getActiveRunId?: () => string | null; restoreRun?: (id: string) => boolean };
const el = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = el('app'), board = el('card-board'), menu = el<HTMLDialogElement>('menu');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game022:');
const audio = new AudioService(storage), telemetry = new TelemetryService(storage, 'game022', undefined, {remoteCollectionEnabled:false});
const bridge = telemetry as TelemetryService & RunBridge;
const store = new SolitaireStore();
let stats = store.read().stats;
let game = new Klondike('title-preview');
// Displaying an explanation does not turn the preview or practice board into a saved RUN.
let normalRunLoaded = false;
let state: State = 'title', returnState: 'playing' | 'practice' = 'playing';
let selected: Source | null = null, hinted: Move | null = null;
let drawMode: Draw = storage.readNumber('draw',1,1,3) === 3 ? 3 : 1;
let dealMode: DealMode = storage.readBoolean('daily',false) ? 'daily' : 'random';
let startedAt = 0, dragEnabled = false, suppressClickUntil = 0;
let practiceStep = 0;
let message = '札を選び、移動先をタップ。';
let drag: { source: Source; pointerId: number; x: number; y: number; element: HTMLElement; moving: boolean; ghost: HTMLElement | null } | null = null;
const active = () => state === 'playing' || state === 'practice';
const training = () => state === 'practice' || returnState === 'practice' && ['paused','explanation','confirm'].includes(state);
const same = (a: Source | null, b: Source): boolean => !!a && a.pile === b.pile && (a.pile === 'waste' || b.pile !== 'waste' && a.column === b.column && (a.pile !== 'tableau' || b.pile === 'tableau' && a.index === b.index));
function trainingEvent(name: EventName, data: Record<string,string|number|boolean> = {}): void { if (analyticsConfig.environment !== 'production') telemetry.trackEvent(name, { ...data, mode: 'practice' }); }
function actionEvent(event: string, data: Record<string,string|number|boolean> = {}): void {
 if (state === 'playing') telemetry.trackEvent('specific_game_events', { event, draw: game.draw, deal_mode: game.mode, daily_id: game.dailyId, moves: game.position.moves, foundation_count: game.foundationCount, ...data });
}
function accumulate(): void { if (startedAt) { game.elapsedMs += Math.max(0,performance.now() - startedAt); startedAt = 0; } }
function save(): void { if (normalRunLoaded && !training() && state !== 'title') store.save(game.snapshot(),stats); }
function clearDrag(): void {
 const pending = drag; drag = null; pending?.ghost?.remove();
 if (pending?.element.hasPointerCapture(pending.pointerId)) { try { pending.element.releasePointerCapture(pending.pointerId); } catch { /* stale capture */ } }
}
function mode(next: State): void {
 if (state === 'playing' && next !== 'playing') accumulate();
 clearDrag(); selected = null; hinted = null; state = next; app.dataset.state = next;
 board.inert = !active();
 if (next === 'playing' && !game.cleared) startedAt = performance.now();
 if (active() && menu.open) menu.close();
 sync();
}
function show(html: string, next: State): void {
 mode(next); menu.innerHTML = html + '<p class="menu-return"><a id="menu-portal-link" href="./index.html" class="arcade-portal-return">← ゲーム一覧へ</a></p>';
 if (!menu.open) menu.show();
 el('menu-portal-link').onclick = returnToPortal;
 // A nonmodal dialog and inert board leave shared consent and privacy reachable.
 menu.querySelector<HTMLElement>('button,select,a')?.focus({preventScroll:true});
}
function sourceOf(target: HTMLElement): Source | null {
 const pile = target.dataset.source;
 if (pile === 'waste') return { pile };
 if (pile === 'foundation') return { pile, column: Number(target.dataset.column) };
 if (pile === 'tableau') return { pile, column: Number(target.dataset.column), index: Number(target.dataset.index) };
 return null;
}
function destinationOf(target: Element | null): Destination | null {
 const pile = target?.closest<HTMLElement>('[data-destination]');
 const kind = pile?.dataset.destination;
 return pile && (kind === 'tableau' || kind === 'foundation') ? { pile: kind, column: Number(pile.dataset.column) } : null;
}
function sourceAttributes(source: Source): string { return `data-source="${source.pile}"${source.pile !== 'waste' ? ` data-column="${source.column}"` : ''}${source.pile === 'tableau' ? ` data-index="${source.index}"` : ''}`; }
function cardButton(card: number, source: Source, top = 0, faceUp = true): string {
 const movable = faceUp && game.stack(source).length > 0;
 const label = faceUp ? `${cardLabel(card)}${source.pile === 'tableau' ? `、場札${source.column + 1}列` : source.pile === 'waste' ? '、捨て札の一番上' : '、組札'}${movable ? '、選択して移動' : ''}` : `場札${source.pile === 'tableau' ? source.column + 1 : ''}列、裏向き`;
 return `<button type="button" class="card ${faceUp ? red(card) ? 'red' : 'black' : 'back'}" data-game-interaction ${faceUp ? sourceAttributes(source) : ''} data-selected="${same(selected,source)}" data-hint="${hinted ? same(hinted.source,source) : false}" aria-label="${label}" aria-pressed="${same(selected,source)}"${!movable ? ' aria-disabled="true" tabindex="-1"' : ''} style="top:${top}px">${faceUp ? cardFace(card) : plantBack}</button>`;
}
function sync(): void {
 const focused = document.activeElement instanceof HTMLElement && board.contains(document.activeElement) ? document.activeElement : null;
 const focusedStock = focused?.hasAttribute('data-stock') ?? false;
 const focusSource = focused ? sourceOf(focused) : null;
 const focusDestination = focused?.classList.contains('empty-pile') ? destinationOf(focused) : null;
 const p = game.position;
 const topWaste = p.waste.at(-1);
 let waste = '';
 const visibleWaste = p.waste.slice(-3);
 visibleWaste.slice(0,-1).forEach((card,i) => { waste += `<span class="card ${red(card) ? 'red' : 'black'} waste-lower" aria-hidden="true" style="top:${i*5}px;transform:translateX(calc(-50% - ${(visibleWaste.length - i - 1)*3}px))">${cardFace(card)}</span>`; });
 waste += topWaste === undefined ? '<span class="empty-pile" aria-label="捨て札なし">—</span>' : cardButton(topWaste,{pile:'waste'},(visibleWaste.length-1)*5);
 const foundationHtml = p.foundations.map((col,i) => `<div class="pile" data-destination="foundation" data-column="${i}" data-hint="${hinted?.destination.pile === 'foundation' && hinted.destination.column === i}"><span class="pile-label">組札 ${suitSymbols[i]}</span><button type="button" class="empty-pile foundation" data-game-interaction aria-label="${SUITS[i]}の組札へ移動" data-destination="foundation" data-column="${i}">${suitSymbols[i]}</button>${col.length ? cardButton(col.at(-1)!,{pile:'foundation',column:i}) : ''}</div>`).join('');
 const columns = p.tableau.map((col,column) => {
  // Keep each exposed suffix selectable across a full 44px strip; long columns scroll.
  let y = 0; const html = col.map((c,index) => { const result = cardButton(c.card,{pile:'tableau',column,index},y,c.faceUp); y += c.faceUp ? 44 : 18; return result; }).join('');
  return `<div class="tableau-column" data-destination="tableau" data-column="${column}" data-hint="${hinted?.destination.pile === 'tableau' && hinted.destination.column === column}" style="height:${Math.max(145,y+(innerWidth<=650?84:110))}px"><span class="pile-label">${column + 1}</span><button type="button" class="empty-pile tableau-target" data-game-interaction data-destination="tableau" data-column="${column}" aria-label="場札${column+1}列へ移動。空列はKのみ">${col.length ? '' : 'K'}</button>${html}</div>`;
 }).join('');
 board.innerHTML = `<div class="top-row"><div class="pile"><span class="pile-label">山札 ${p.stock.length}</span><button id="stock-button" class="${p.stock.length ? 'card back' : 'empty-pile'}" type="button" data-stock data-game-interaction aria-label="${p.stock.length ? `${game.draw}枚めくる・山札${p.stock.length}枚` : p.waste.length ? '捨て札を山札へ戻す。札順は変わりません' : '山札なし'}">${p.stock.length ? plantBack : '↻'}</button></div><div class="pile"><span class="pile-label">捨て札 ${p.waste.length}</span>${waste}</div><div aria-hidden="true"></div>${foundationHtml}</div><div class="tableau">${columns}</div>`;
 board.classList.toggle('drag-enabled',dragEnabled);
 if (focusedStock && active()) el('stock-button').focus({preventScroll:true});
 else if (focusSource && active()) { const button = [...board.querySelectorAll<HTMLElement>('[data-source]')].find(b=>same(sourceOf(b),focusSource)); button?.focus({preventScroll:true}); }
 else if (focusDestination && active()) board.querySelector<HTMLElement>(`.empty-pile[data-destination="${focusDestination.pile}"][data-column="${focusDestination.column}"]`)?.focus({preventScroll:true});
 el('foundation-count').textContent = `${game.foundationCount} / ${training() ? '練習' : '52'}`;
 el('move-count').textContent = String(p.moves); el('clear-count').textContent = String(stats.clears);
 el('deal-caption').textContent = training() ? `練習 ${practiceStep + 1} / 3 · 6枚だけの専用盤面 · 記録には入りません` : `${game.mode === 'daily' ? `今日の配札 ${game.dailyId}` : 'ランダム配札'} · ${game.draw}枚めくり · 再循環は無制限`;
 el('live-status').textContent = message;
 for (const id of ['hint-button','assist-button','drag-button','help-button','restart-button','title-button','pause-button']) el<HTMLButtonElement>(id).disabled = !active();
 el<HTMLButtonElement>('undo-button').disabled = !active() || !game.history.length || game.reported;
 el<HTMLButtonElement>('finish-button').disabled = !active() || training() || !game.finishPlan();
 el('drag-button').textContent = `指ドラッグ ${dragEnabled ? 'ON' : 'OFF'}`; el('drag-button').setAttribute('aria-pressed',String(dragEnabled));
 updateClock();
}
function updateClock(): void { const seconds = Math.floor((game.elapsedMs + (startedAt ? performance.now() - startedAt : 0))/1000); el('elapsed').textContent = `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`; }
function focusBoard(): void { el('stock-button').focus({preventScroll:true}); }
function abandoned(): void {
 const previous = store.read().snapshot;
 if (!previous || previous.reported) return;
 if (previous.analytics_run_id) bridge.restoreRun?.(previous.analytics_run_id);
 telemetry.trackEvent('run_end',{outcome:'restart',draw:previous.draw,deal_mode:previous.mode,daily_id:previous.daily_id,moves:previous.position.moves,foundation_count:previous.position.foundations.flat().length,seconds:previous.elapsed_ms/1000});
}
function newDeal(source = 'direct', repeat = false): void {
 if (state === 'playing') { accumulate(); save(); }
 const previous = store.read().snapshot;
 abandoned();
 const date = jstDate();
 const seed = repeat && previous ? previous.seed : dealMode === 'daily' ? dailySeed(date,drawMode) : `random-${crypto.randomUUID()}`;
 const selectedMode = repeat && previous ? previous.mode : dealMode;
 const selectedDraw = repeat && previous ? previous.draw : drawMode;
 const dailyId = repeat && previous ? previous.daily_id : selectedMode === 'daily' ? date : '';
 const fixture = import.meta.env.DEV && new URLSearchParams(location.search).get('fixture') === 'solvable';
 game = new Klondike(seed,selectedDraw,selectedMode,dailyId,fixture ? originalSolvableDeck() : undefined);
 normalRunLoaded = true;
 returnState = 'playing'; practiceStep = 0;
 message = '札を選び、移動先をタップ。解ける配札の保証はありません。';
 telemetry.trackEvent('run_start',{source,draw:game.draw,deal_mode:game.mode,daily_id:game.dailyId,rules_version:game.snapshot().rules_version});
 game.analyticsRunId = bridge.getActiveRunId?.() ?? null;
 mode('playing'); save(); focusBoard(); void audio.unlock();
}
function restore(): void {
 const saved = store.read().snapshot;
 const resumed = Klondike.restore(saved);
 if (!resumed) return;
 game = resumed; normalRunLoaded = true; drawMode = game.draw; dealMode = game.mode; returnState = 'playing';
 if (game.analyticsRunId) bridge.restoreRun?.(game.analyticsRunId);
 telemetry.trackEvent('specific_game_events',{event:'state_restored',draw:game.draw,deal_mode:game.mode,daily_id:game.dailyId,moves:game.position.moves,foundation_count:game.foundationCount});
 message = '続きから再開しました。';
 if (game.cleared) result(); else { mode('playing'); focusBoard(); }
}
function title(): void {
 if (state === 'playing') { accumulate(); save(); }
 returnState = 'playing';
 const saved = store.read().snapshot;
 show(`<p class="eyebrow">ONE CARD. ONE BREATH.</p><h1 id="menu-title">ひと息ソリティア</h1><p>一枚ずつ、すっきり。<br>いつものカードで、ひと息。</p><div class="deal-settings"><label>配札<select id="deal-mode"><option value="random"${dealMode==='random'?' selected':''}>ランダム</option><option value="daily"${dealMode==='daily'?' selected':''}>今日の配札</option></select></label><label>めくり方式<select id="draw-mode"><option value="1"${drawMode===1?' selected':''}>1枚めくり</option><option value="3"${drawMode===3?' selected':''}>3枚めくり</option></select></label></div><div class="menu-actions">${saved?`<button id="resume-saved-button" class="primary" type="button">${saved.position.foundations.flat().length===52?'前のクリアを見る':'続きから'}</button>`:''}<button id="play-button" class="${saved?'':'primary'}" type="button">${saved?'新しく始める':'すぐ遊ぶ'}</button><button id="explain-button" type="button">説明を見る</button><button id="practice-button" type="button">練習する</button></div><p class="save-note">途中の札・戻す履歴をこの端末に保存。クリア ${stats.clears}回。<br>今日の配札は日本時間の日付で同じ札。解ける保証はありません。めくり方式の変更は新しい配札になります。</p>`,'title');
 el<HTMLSelectElement>('deal-mode').onchange=e=>{dealMode=(e.target as HTMLSelectElement).value as DealMode;storage.writeBoolean('daily',dealMode==='daily');};
 el<HTMLSelectElement>('draw-mode').onchange=e=>{drawMode=Number((e.target as HTMLSelectElement).value) as Draw;storage.writeNumber('draw',drawMode);};
 el('play-button').onclick=()=>newDeal('title');el('explain-button').onclick=()=>explain(false);el('practice-button').onclick=startPractice;
 if(saved)el('resume-saved-button').onclick=restore;
}
function explain(inRun: boolean): void {
 if(inRun){returnState=state==='practice'?'practice':'playing'; if(state==='playing'){accumulate();save();}}
 if(!training())telemetry.trackEvent('tutorial_view',{source:inRun?'playing':'title'});
 show(`<p class="eyebrow">HOW TO PLAY</p><h2 id="menu-title">赤と黒を、ひとつずつ。</h2><ol><li>場札は<b>赤黒交互、数字が1つ小さくなる順</b>。続いた表札は途中からまとめて動かせます。空いた列へはKだけ。</li><li>組札は<b>同じスートでA → K</b>。組札の上の1枚を場札へ戻すこともできます。</li><li>山札を押して1枚／3枚めくる。捨て札は一番上だけ使えます。山札が空なら同じ順で戻せます。</li><li><b>札を選び → 移動先をタップ</b>。選び直しは別の札、解除は同じ札。PCはドラッグ、TabとEnter／Space。矢印キーでも盤面のボタンを移れます。</li><li>指ドラッグONで札を12px以上動かすとドラッグ。OFFでは盤面をスクロール。ONでも札の間からスクロールできます。</li><li>ヒントは見えている札だけの合法手で、クリア保証ではありません。「組札へ1枚」は押すたび1枚だけ。全札が表向きで、組札だけで終われる証明ができた時に「残りを整理」を使えます。</li></ol><p>時間制限・時間減点なし。戻すは直近1000手まで。日替わりの同じ日・めくり方式のクリア数は1回だけ。52枚すべてを組札へ移すとクリアです。</p><div class="menu-actions"><button id="continue-button" class="primary" type="button">${inRun?'盤面へ戻る':'すぐ遊ぶ'}</button><button id="help-practice-button" type="button">練習する</button>${inRun?'':'<button id="help-title-button" type="button">タイトルへ</button>'}</div>`,'explanation');
 el('continue-button').onclick=()=>{if(inRun){mode(returnState);focusBoard();}else newDeal('explanation');};el('help-practice-button').onclick=startPractice;if(!inRun)el('help-title-button').onclick=title;
}
function startPractice(): void {
 if(state==='playing'){accumulate();save();}
 game=practiceGame();normalRunLoaded=false;returnState='practice';practiceStep=0;message='練習1：赤の5を選び、黒の6がある1列へ移動。';trainingEvent('practice_start');mode('practice');focusBoard();void audio.unlock();
}
function advancePractice(move: Move): void {
 const expected = practiceStep===0 ? move.source.pile==='tableau'&&move.source.column===1&&move.destination.pile==='tableau'&&move.destination.column===0 : practiceStep===1 ? move.source.pile==='tableau'&&move.source.column===2&&move.destination.pile==='tableau'&&move.destination.column===3 : move.destination.pile==='foundation';
 if(!expected)return;
 practiceStep++;trainingEvent('tutorial_step_complete',{step:practiceStep});
 if(practiceStep===1)message='練習2：黒のKを選び、空いた4列へ移動。';
 else if(practiceStep===2)message='練習3：Aを選び、同じスートの組札へ移動。';
 else {trainingEvent('practice_complete',{steps:3});show('<p class="eyebrow">PRACTICE COMPLETE</p><h2 id="menu-title">準備ができました。</h2><p>赤黒を交互に。空列はK。組札はAから。</p><div class="menu-actions"><button id="practice-play-button" class="primary" type="button">本番を遊ぶ</button><button id="practice-title-button" type="button">タイトルへ</button></div>','result');el('practice-play-button').onclick=()=>newDeal('practice');el('practice-title-button').onclick=title;}
}
function result(): void {
 accumulate();
 if(!game.reported){const report=store.reportClear(game.snapshot(),stats);game.reported=report.snapshot.reported;stats=report.stats;telemetry.trackEvent('run_end',{outcome:'clear',draw:game.draw,deal_mode:game.mode,daily_id:game.dailyId,moves:game.position.moves,foundation_count:52,seconds:Math.floor(game.elapsedMs)/1000,hints:game.hints,undos:game.undos,assists:game.assists,record_added:report.added});}
 show(`<p class="eyebrow">ALL FOUR SUITS</p><h2 id="menu-title">すっきり、ひと息。</h2><p>52枚が組札にそろいました。<br>${game.position.moves}手 · ${Math.floor(game.elapsedMs/60000)}分${Math.floor(game.elapsedMs/1000)%60}秒<br>ヒント ${game.hints}回 · 戻す ${game.undos}回 · 組札補助 ${game.assists}回</p><p>クリア ${stats.clears}回${game.mode==='daily'?'<br>この日・めくり方式の記録は1回だけ。':''}</p><div class="menu-actions"><button id="next-deal-button" class="primary" type="button">${game.mode==='daily'?'今日の配札をもう一度':'もう一度遊ぶ'}</button><button id="result-title-button" type="button">タイトルへ</button></div>`,'result');
 el('next-deal-button').onclick=()=>{telemetry.trackEvent('retry',{draw:game.draw,deal_mode:game.mode});dealMode=game.mode;drawMode=game.draw;newDeal('retry',game.mode==='daily');};el('result-title-button').onclick=title;
}
function perform(source: Source, destination: Destination): boolean {
 if(!active())return false;
 if(training()) {
  const expected = practiceStep===0 ? source.pile==='tableau'&&source.column===1&&destination.pile==='tableau'&&destination.column===0 : practiceStep===1 ? source.pile==='tableau'&&source.column===2&&destination.pile==='tableau'&&destination.column===3 : destination.pile==='foundation';
  if(!expected){message='案内の札と移動先を使ってみましょう。';sync();return false;}
 }
 if(!game.move(source,destination)){message='そこへは置けません。赤黒と数字の順を確認。';sync();return false;}
 selected=null;hinted=null;message='移動しました。';audio.tone(360,420,.06,'sine',0,.012);actionEvent('card_move',{source_pile:source.pile,destination_pile:destination.pile});
 if(state==='practice')advancePractice({source,destination});else{save();if(game.cleared){result();return true;}}
 sync();return true;
}
function clickBoard(target: HTMLElement): void {
 if(!active())return;
 void audio.unlock();
 if(target.closest('[data-stock]')){if(training()){message='まずは案内の札を動かしてみましょう。';sync();return;}const result=game.drawStock();selected=null;hinted=null;message=result==='recycle'?'札順を変えずに山札へ戻しました。':result?'山札をめくりました。':'山札はありません。';if(result){actionEvent(result);save();}sync();return;}
 const button=target.closest<HTMLElement>('[data-source]');const source=button?sourceOf(button):null;
 const destination=destinationOf(target);
 if(selected&&source&&same(selected,source)){selected=null;message='選択を解除しました。';sync();return;}
 if(selected&&destination&&game.legal(selected,destination)){perform(selected,destination);return;}
 if(source&&game.stack(source).length){selected=source;hinted=null;message=`${cardLabel(game.stack(source)[0])}を選択。移動先をタップ。`;sync();return;}
 if(selected&&destination){message='そこへは置けません。別の移動先を選べます。';sync();}
}
board.addEventListener('click',event=>{if(performance.now()<suppressClickUntil){event.preventDefault();return;}clickBoard(event.target as HTMLElement);});
board.addEventListener('pointerdown',event=>{
 if(!active()||event.button!==0||!event.isPrimary)return;
 const element=(event.target as HTMLElement).closest<HTMLElement>('[data-source]');const source=element?sourceOf(element):null;
 if(!element||!source||!game.stack(source).length)return;
 clearDrag();drag={source,pointerId:event.pointerId,x:event.clientX,y:event.clientY,element,moving:false,ghost:null};
});
board.addEventListener('pointermove',event=>{
 const pending=drag;if(!pending||pending.pointerId!==event.pointerId)return;
 const distance=Math.hypot(event.clientX-pending.x,event.clientY-pending.y);
 if(!pending.moving&&distance<12)return;
 if(event.pointerType==='touch'&&!dragEnabled){suppressClickUntil=performance.now()+500;clearDrag();return;}
 if(!pending.moving){pending.moving=true;pending.element.setPointerCapture(event.pointerId);pending.ghost=pending.element.cloneNode(true) as HTMLElement;pending.ghost.removeAttribute('id');pending.ghost.classList.add('drag-ghost');pending.ghost.setAttribute('aria-hidden','true');pending.ghost.style.top='0';pending.ghost.style.left='0';document.body.append(pending.ghost);}
 event.preventDefault();if(pending.ghost)pending.ghost.style.transform=`translate(${event.clientX-25}px,${event.clientY-15}px)`;
});
board.addEventListener('pointerup',event=>{const pending=drag;if(!pending||pending.pointerId!==event.pointerId)return;const moving=pending.moving;const destination=moving?destinationOf(document.elementFromPoint(event.clientX,event.clientY)):null;clearDrag();if(moving){suppressClickUntil=performance.now()+500;if(destination)perform(pending.source,destination);else{message='移動を取り消しました。';sync();}}});
for(const name of ['pointercancel','lostpointercapture'])board.addEventListener(name,event=>{
 const pending=drag;
 if(!pending || (event as PointerEvent).pointerId!==pending.pointerId)return;
 // A touch can initially capture an inner span. Transferring capture to its card
 // emits loss for that old target while the current card still owns the pointer.
 if(name==='lostpointercapture' && pending.element.hasPointerCapture(pending.pointerId))return;
 suppressClickUntil=performance.now()+500;clearDrag();
});
board.addEventListener('keydown',event=>{
 if(!active())return;
 if(event.repeat&&['Enter',' '].includes(event.key)){event.preventDefault();return;}
 if(event.key==='Escape'){event.preventDefault();selected=null;hinted=null;sync();return;}
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
 event.preventDefault();const buttons=[...board.querySelectorAll<HTMLButtonElement>('button:not([aria-disabled="true"])')];const index=buttons.indexOf(document.activeElement as HTMLButtonElement);const delta=['ArrowLeft','ArrowUp'].includes(event.key)?-1:1;buttons[(index+delta+buttons.length)%buttons.length]?.focus();
});
function pause(): void { if(!active())return;returnState=state==='practice'?'practice':'playing';if(state==='playing'){accumulate();save();}show('<p class="eyebrow">TAKE A BREATH</p><h2 id="menu-title">ひと休み。</h2><p>時計も休憩中。ゆっくりどうぞ。</p><div class="menu-actions"><button id="resume-button" class="primary" type="button">続ける</button><button id="pause-title-button" type="button">タイトルへ</button></div>','paused');if(training())trainingEvent('pause');else telemetry.trackEvent('pause');el('resume-button').onclick=()=>{if(training())trainingEvent('resume');else telemetry.trackEvent('resume');mode(returnState);focusBoard();};el('pause-title-button').onclick=title; }
function confirmDeal(): void {returnState=state==='practice'?'practice':'playing';if(state==='playing'){accumulate();save();}show('<p class="eyebrow">NEW DEAL</p><h2 id="menu-title">配り直しますか？</h2><p>現在の札と戻す履歴は、新しい配札に置き換わります。</p><div class="menu-actions"><button id="confirm-deal-button" type="button">配り直す</button><button id="cancel-deal-button" class="primary" type="button">今の札を続ける</button></div>','confirm');el('confirm-deal-button').onclick=()=>{if(returnState==='practice')startPractice();else{telemetry.trackEvent('retry',{draw:game.draw,deal_mode:game.mode});newDeal('restart',game.mode==='daily');}};el('cancel-deal-button').onclick=()=>{mode(returnState);focusBoard();};}
function returnToPortal(): void { if(state==='playing')accumulate();if(!training()&&state!=='title')save();telemetry.trackEvent('return_to_portal',{source:state});clearDrag(); }
el('mute-button').onclick=()=>{el('mute-button').textContent=audio.toggle()?'音 OFF':'音 ON';};el('mute-button').textContent=audio.muted?'音 OFF':'音 ON';
el('pause-button').onclick=pause;el('title-button').onclick=title;el('help-button').onclick=()=>explain(true);el('restart-button').onclick=confirmDeal;el('portal-link').onclick=returnToPortal;
el('drag-button').onclick=()=>{clearDrag();dragEnabled=!dragEnabled;selected=null;message=dragEnabled?'札を12px以上動かしてドラッグ。札の間からはスクロールできます。':'札を選んで移動先をタップ。盤面はスクロールできます。';sync();};
el('hint-button').onclick=()=>{if(!active())return;hinted=game.hint();selected=null;message=hinted?'点線の札を、点線の置き場へ。見える札だけの合法手です。':'見える札の有効な移動が見つかりません。山札・戻す・配り直すも使えます。';actionEvent('hint');save();sync();};
el('undo-button').onclick=()=>{if(!active())return;if(game.undo()){hinted=null;selected=null;message='1手戻しました。札の表裏と山札も戻ります。';if(training()){practiceStep=0;game=practiceGame();message='練習1：赤の5を選び、黒の6がある1列へ移動。';}actionEvent('undo');save();sync();}};
el('assist-button').onclick=()=>{if(!active())return;if(training()){message='練習では札を選んで移動先をタップしてみましょう。';sync();return;}if(game.assistFoundation()){selected=null;hinted=null;message='組札へ1枚だけ移しました。';actionEvent('foundation_assist');save();if(game.cleared)result();else sync();}else{message='いま組札へ移せる札はありません。';sync();}};
el('finish-button').onclick=()=>{if(state!=='playing'||!game.finishPlan())return;if(game.finishVisible()){actionEvent('visible_finish');save();result();}};
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('pagehide',()=>{if(state==='playing')accumulate();if(!training()&&state!=='title')save();clearDrag();audio.destroy();},{once:true});
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&event.target!==board&&!(event.target instanceof HTMLElement&&board.contains(event.target))){if(active())pause();else if(state==='paused')el('resume-button').click();}});
setInterval(()=>{if(state==='playing'){updateClock();accumulate();startedAt=performance.now();save();}},1000);
telemetry.trackEvent('game_open');title();
if(import.meta.env.DEV)Object.defineProperty(window,'__game022',{get:()=>({state,snapshot:game.snapshot(),selected:selected?{...selected}:null,hint:hinted?structuredClone(hinted):null,stats:structuredClone(stats),practiceStep,drag:drag?{moving:drag.moving}:null,storePersistent:store.persistent,telemetry:telemetry.getEvents(),visibleMoves:game.visibleMoves()})});
