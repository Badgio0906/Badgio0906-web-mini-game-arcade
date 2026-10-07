import {it,expect} from 'vitest';
import {rack,shoot,step,placeCue,respot} from '../../src/games/game027/physics';
import {newMatch,beginShot,adjudicate} from '../../src/games/game027/rules';
import {planShot} from '../game027/geometry.mjs';

it('new QA planner opens a fresh deterministic rack through legal native-equivalent actions and reaches a normal terminal',()=>{
 const world=rack();let match=newMatch();const trace=[];
 for(let n=0;n<80&&match.winner===null;n++){
  let plan=match.break?{angle:0,power:95,ball:1,strategy:'break'}:planShot({world,match},match.ballInHand);
  if(match.ballInHand){expect(placeCue(world,plan.start.x,plan.start.y)).toBe(true);match.ballInHand=false;}
  const shot=beginShot(match,world.balls.filter(b=>!b.pocketed).map(b=>b.id));
  expect(shoot(world,plan.angle,plan.power/100,shot)).toBe(true);
  let ticks=0;while(world.moving&&ticks++<2500)step(world);
  expect(world.moving).toBe(false);
  const decision=adjudicate(match,world.shot!);trace.push({n:n+1,strategy:plan.strategy,ball:plan.ball,first:world.shot!.firstContact,pockets:world.shot!.pocketed,legalEight:world.shot!.legalTargets.join(',')==='8',foul:decision.foul});
  if(plan.strategy==='legal-cluster-contact')expect(world.shot!.firstContact).toBe(plan.ball);
  world.shot=null;match=decision.match;if(decision.respotEight)respot(world,8);
 }
 console.log(JSON.stringify({provenance:'new pure-model planner diagnostic; not original failed browser world',trace,winner:match.winner}));
 expect(match.winner).not.toBeNull();
 expect(trace.at(-1)?.legalEight).toBe(true);
 expect(trace.at(-1)?.foul).toBeNull();
 expect(trace.some(s=>s.strategy==='legal-cluster-contact')).toBe(true);
});
