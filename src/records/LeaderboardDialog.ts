import { gameCatalog } from '../data/gameCatalog';
import type { RecordDefinition } from '../data/recordDefinitions';
import { readLocalRecord } from './localRecords';
import { Leaderboards, type LeaderboardState } from './Leaderboards';
import { formatRecordValue, localRecordLabel } from './PortalRecords';
import type { PublicBests } from './PublicBests';

/** One native modal and one set of subscriptions for all game cards. */
export function createLeaderboardDialog(api: PublicBests, refreshCards: () => void) {
  const client = new Leaderboards(), dialog = document.createElement('dialog');
  dialog.className = 'leaderboard-dialog';
  dialog.setAttribute('aria-labelledby','leaderboard-title');
  dialog.setAttribute('aria-describedby','leaderboard-condition');
  const header = document.createElement('header'), title = document.createElement('h2'), close = document.createElement('button');
  header.className = 'leaderboard-header'; title.id = 'leaderboard-title'; title.tabIndex = -1;
  close.type = 'button'; close.className = 'leaderboard-close'; close.textContent = '閉じる';
  close.addEventListener('click',() => dialog.close()); header.append(title,close);
  const content = document.createElement('div'); content.className = 'leaderboard-content';
  const condition = document.createElement('p'); condition.id = 'leaderboard-condition';
  const personal = document.createElement('p'); personal.className = 'leaderboard-personal';
  const status = document.createElement('p'); status.className = 'leaderboard-status'; status.setAttribute('role','status');
  const list = document.createElement('ol'); list.className = 'leaderboard-list'; list.setAttribute('role','list'); list.setAttribute('aria-label','歴代TOP10');
  const note = document.createElement('p'); note.className = 'leaderboard-note';
  note.textContent = '同じ共有資格情報を持つブラウザは1枠。別端末やブラウザデータ削除後は別参加者になることがあります。同点は先に記録された順です。';
  content.append(condition,personal,status,list,note); dialog.append(header,content); document.body.append(dialog);
  let origin: HTMLButtonElement | undefined, active: RecordDefinition | undefined, generation = 0, openGeneration = 0;
  let previousOverflow = '';
  dialog.addEventListener('close',() => {generation++;openGeneration++;active=undefined;document.body.style.overflow=previousOverflow;origin?.focus({preventScroll:true});});
  const render = (state: LeaderboardState, definition: RecordDefinition) => {
    list.replaceChildren();
    status.textContent = state.status === 'preparing' ? 'ランキング準備中' : state.status === 'failed' ? 'ランキングを取得できませんでした' :
      state.status === 'stale' ? '前回取得したランキング' : state.board?.entries.length ? '' : 'まだ記録はありません';
    if (!state.board) return;
    state.board.entries.forEach((entry,i,entries) => {
      const row = document.createElement('li'), rank = document.createElement('span'), name = document.createElement('span'), value = document.createElement('span');
      rank.className='leaderboard-rank';rank.textContent=`${entry.rank}位`;
      name.className='leaderboard-name';name.textContent=entry.public_label;
      value.className='leaderboard-value';value.textContent=formatRecordValue(entry.value,definition);
      const tied = entries[i-1]?.value===entry.value || entries[i+1]?.value===entry.value;
      if(tied){const tie=document.createElement('small');tie.textContent='（同点）';value.append(tie);}
      row.append(rank,name,value);list.append(row);
    });
  };
  const load = async (definition: RecordDefinition, serial: number) => {
    const state = await client.load(definition.boardId,api.getState().boards.get(definition.boardId)?.revision??0);
    if(serial!==generation || !dialog.open)return;
    if(state.board && !api.acceptLeaderboardSnapshot(definition.boardId,state.board.revision,state.board.entries[0]?.value??null,state.board.generated_at)) {
      render({status:'failed'},definition);return;
    }
    render(state,definition);if(state.board)refreshCards();
  };
  return {
    open(definition: RecordDefinition, button: HTMLButtonElement) {
      origin=button;active=definition;const serial=++generation, openSerial=++openGeneration;
      title.textContent=`${gameCatalog.find(g=>g.id===definition.gameId)?.titleJa??definition.gameId} — 歴代TOP10`;
      condition.textContent=`${definition.metricLabel} · ${definition.modeLabel} · ルール ${definition.rulesetId}`;
      personal.textContent='あなたのBEST：読み込み中';status.textContent='ランキングを読み込み中';list.replaceChildren();
      content.scrollTop=0;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();title.focus({preventScroll:true});
      void readLocalRecord(definition.gameId).then(record=>{if(openSerial===openGeneration&&dialog.open)personal.textContent=`${definition.localLabel}：${localRecordLabel(record,definition)}（このブラウザ内）`;});
      void load(definition,serial);
    },
    reconcile() {
      if (!active || !dialog.open) return;
      // Clear a displayed old ranking immediately when the batch BEST advances.
      const serial=++generation;list.replaceChildren();status.textContent='ランキングを読み込み中';void load(active,serial);
    },
  };
}
