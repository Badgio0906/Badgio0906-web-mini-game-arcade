import {it,expect} from 'vitest';
import {rack,shoot,step,placeCue,respot,type World} from '../../src/games/game027/physics';
import {newMatch,beginShot,adjudicate} from '../../src/games/game027/rules';
import {chooseShot,cpuPlacement,type Difficulty} from '../../src/games/game027/cpu';
function random(seed:number){return ()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}
function contactDistance(w:World){const a=w.balls.filter(b=>!b.pocketed);return Math.min(...a.flatMap((b,i)=>a.slice(i+1).map(c=>Math.hypot(b.x-c.x,b.y-c.y))));}
it('all three CPU levels run repeated settled shots with unique adjudication and valid ball-in-hand',()=>{
 for(const level of ['easy','normal','strong'] as Difficulty[]){const w=rack();let m=newMatch();const rng=random(27);let applied=0;
  for(let j=0;j<40&&m.winner===null;j++){
   if(m.ballInHand){w.balls[0].pocketed=true;const p=cpuPlacement(w);expect(placeCue(w,p.x,p.y)).toBe(true);m.ballInHand=false;}
   const choice=chooseShot(w,m,level,rng),t=beginShot(m,w.balls.filter(b=>!b.pocketed).map(b=>b.id));expect(shoot(w,choice.angle,choice.power,t)).toBe(true);let ticks=0;while(w.moving&&ticks++<2500)step(w);
   expect(w.moving).toBe(false);expect(contactDistance(w)).toBeGreaterThan(23.9);const result=adjudicate(m,w.shot!);w.shot=null;m=result.match;applied++;if(result.respotEight)respot(w,8);
   expect(m.shots[0]+m.shots[1]).toBe(applied);expect(m.fouls[0]).toBeLessThanOrEqual(m.shots[0]);expect(m.fouls[1]).toBeLessThanOrEqual(m.shots[1]);
  }
  expect(applied).toBeGreaterThan(1);
 }
});
