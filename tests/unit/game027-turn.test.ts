import {describe,it,expect} from 'vitest';
import {turnView,type TurnViewInput} from '../../src/games/game027/turn';
const view=(patch:Partial<TurnViewInput>)=>turnView({phase:'aim',mode:'cpu',turn:0,winner:null,training:false,ballInHand:false,cpuReady:false,...patch});
describe('Game027 authoritative turn presentation',()=>{
  it('identifies both humans and CPU without relying only on color',()=>{expect(view({}).title).toBe('あなたのターンです！');expect(view({turn:1,phase:'cpu'}).title).toBe('CPUのターンです…');expect(view({mode:'two'}).title).toBe('プレイヤー1のターンです！');expect(view({mode:'two',turn:1}).title).toBe('プレイヤー2のターンです！');});
  it('shows the shooter during motion rather than a false next-player turn',()=>{expect(view({phase:'moving',turn:1}).title).toBe('球が止まるまでお待ちください');expect(view({phase:'moving',turn:1}).detail).toContain('CPUのショット');});
  it('distinguishes cue placement, thinking and pre-shot warning',()=>{expect(view({phase:'placing',ballInHand:true}).title).toBe('白球を配置してください');expect(view({phase:'placing',turn:1,ballInHand:true}).detail).toContain('CPUが白球');expect(view({phase:'cpu',turn:1,cpuReady:true}).title).toBe('CPUがショットします…');});
  it('covers pause, help, restart confirmation, result and practice',()=>{for(const phase of ['paused','explanation','confirm'])expect(view({phase}).title).toBe('一時停止中');expect(view({phase:'result',winner:1}).title).toBe('CPUの勝利');expect(view({phase:'result',winner:1,mode:'two'}).title).toBe('プレイヤー2の勝利');expect(view({training:true,turn:1}).title).toBe('あなたのターンです！');expect(view({phase:'title'}).tone).toBe('idle');});
});
