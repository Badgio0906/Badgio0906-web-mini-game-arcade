/** Presentation derived only from the authoritative match/phase; never advances a turn. */
export interface TurnViewInput {
  phase: string; mode:'cpu'|'two'; turn:number; winner:number|null; training:boolean; ballInHand:boolean; cpuReady:boolean;
}
export function turnView(s:TurnViewInput):{title:string;detail:string;tone:string} {
  const name=(n:number)=>s.training?'あなた':s.mode==='cpu'?(n===0?'あなた':'CPU'):`プレイヤー${n+1}`;
  const who=name(s.turn), cpu=!s.training&&s.mode==='cpu'&&s.turn===1;
  if(s.phase==='result')return {title:s.winner===null?'練習できました':`${name(s.winner)}の勝利`,detail:'結果を確認して、もう一局。',tone:'result'};
  if(['paused','explanation','confirm'].includes(s.phase))return {title:'一時停止中',detail:`${who}の番 · ${s.ballInHand?'白球配置から':s.phase==='paused'?'続きは再開ボタンから':'球と時計は停止中'}`,tone:'paused'};
  if(s.phase==='title')return {title:'ねらって、一球ずつ。',detail:'CPU戦 ／ 同じ端末2人戦',tone:'idle'};
  if(s.phase==='moving')return {title:'球が止まるまでお待ちください',detail:`${who}のショット · 停止後に判定します`,tone:'moving'};
  if(cpu)return {title:s.cpuReady?'CPUがショットします…':'CPUのターンです…',detail:s.cpuReady?'まもなく打ちます':s.ballInHand?'CPUが白球を配置します':'CPUが照準を考えています',tone:s.cpuReady?'ready':'cpu'};
  if(s.phase==='placing')return {title:'白球を配置してください',detail:`${who}の番 · 位置を選んで「白球をここへ置く」`,tone:s.turn===1?'player-two':'human'};
  return {title:`${who}のターンです！`,detail:s.training?'練習 · ねらいと強さを決めてショット':'ねらいと強さを決めてショット',tone:s.turn===1?'player-two':'human'};
}
