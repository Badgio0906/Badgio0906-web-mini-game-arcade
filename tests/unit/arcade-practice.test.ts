import { describe, expect, it } from 'vitest';
import { PracticeSession } from '../../src/arcade/PracticeSession';

function tick(session:PracticeSession,seconds:number){for(let elapsed=0;elapsed<seconds;elapsed+=.05)session.update(.05);}
const games=Array.from({length:11},(_,i)=>`game${String(i+1).padStart(3,'0')}`);

describe('independent short practice scenarios',()=>{
  it.each(games)('%s never completes merely by waiting or accepting invalid deltas',gameId=>{
    const session=new PracticeSession(gameId,()=>.1);const first=session.snapshot();
    for(const dt of [0,-1,NaN,Infinity])session.update(dt);
    expect(session.snapshot()).toEqual(first);tick(session,30);expect(session.snapshot().complete).toBe(false);
    expect(session.snapshot().phase).not.toBe('ended');expect(session.snapshot().practicePoints).toBe(0);
  });

  it('Orbit requires a genuine lane shift before the slow obstacle is passed',()=>{
    const session=new PracticeSession('game001');tick(session,3);expect(session.snapshot().complete).toBe(false);session.action('action');tick(session,3);expect(session.snapshot()).toMatchObject({complete:true,phase:'success',lane:0});
  });
  it.each(['left','right'] as const)('Workday requires two genuine avoidances after a first %s dodge',firstDirection=>{
    const session=new PracticeSession('game002');tick(session,2.3);expect(session.snapshot()).toMatchObject({step:0,complete:false});
    session.action(firstDirection);tick(session,2.3);
    const firstLane=firstDirection==='left'?0:2;
    expect(session.snapshot()).toMatchObject({step:1,lane:firstLane,enemyLane:firstLane,complete:false});
    tick(session,2.3);expect(session.snapshot()).toMatchObject({step:1,complete:false});
    session.action(firstDirection==='left'?'right':'left');tick(session,2.3);
    expect(session.snapshot()).toMatchObject({step:2,complete:true});
  });
  it('Tower needs one actual drop and its settling animation; a second press cannot queue another drop',()=>{
    const session=new PracticeSession('game003');tick(session,.1);session.action('action');expect(session.snapshot()).toMatchObject({moving:true,complete:false});const falling=session.snapshot();session.action('action');expect(session.snapshot()).toEqual(falling);tick(session,1);expect(session.snapshot().complete).toBe(true);
  });
  it('Echo shows a true two-light sequence with an off gap, ignores watching input and resets a wrong recall',()=>{
    const session=new PracticeSession('game004');tick(session,.6);expect(session.snapshot()).toMatchObject({phase:'watch',light:0});session.action('cell-0');expect(session.snapshot().step).toBe(0);tick(session,.7);expect(session.snapshot().light).toBe(-1);tick(session,.5);expect(session.snapshot().light).toBe(4);tick(session,1);expect(session.snapshot().phase).toBe('recall');session.action('cell-0');expect(session.snapshot().step).toBe(1);session.action('cell-8');expect(session.snapshot()).toMatchObject({step:0,complete:false});session.action('cell-0');session.action('cell-4');expect(session.snapshot()).toMatchObject({step:2,complete:true});
  });
  it('Sort teaches round-left then angular-right, with wrong answers staying in the same sample',()=>{
    const session=new PracticeSession('game005');session.action('right');expect(session.snapshot()).toMatchObject({step:0,complete:false});session.action('left');expect(session.snapshot().step).toBe(1);session.action('left');expect(session.snapshot()).toMatchObject({step:1,complete:false});session.action('right');expect(session.snapshot().complete).toBe(true);
  });
  it('Parking requires separate angle and power actions and actual vehicle movement before success',()=>{
    const session=new PracticeSession('game006');session.action('action');expect(session.snapshot()).toMatchObject({step:1,moving:false,complete:false});session.action('action');expect(session.snapshot()).toMatchObject({step:2,moving:true,complete:false});tick(session,.5);expect(session.snapshot().complete).toBe(false);session.action('action');expect(session.snapshot().step).toBe(2);tick(session,.8);expect(session.snapshot().complete).toBe(true);
  });
  it('Elevator allows boarding the safe passenger, then requires rejecting the overweight passenger',()=>{
    const session=new PracticeSession('game007');session.action('reject');expect(session.snapshot()).toMatchObject({step:0,complete:false});
    session.action('board');expect(session.snapshot()).toMatchObject({step:1,phase:'boarding',complete:false});
    expect(session.snapshot().feedback).toContain('260 kg');
    session.action('reject');tick(session,.8);expect(session.snapshot()).toMatchObject({step:1,phase:'boarding',complete:false});
    tick(session,.4);expect(session.snapshot()).toMatchObject({step:1,phase:'practice',complete:false});
    expect(session.snapshot().feedback).toContain('410 kg');
    session.action('board');expect(session.snapshot()).toMatchObject({step:1,complete:false});session.action('reject');expect(session.snapshot()).toMatchObject({step:2,complete:true});
  });
  it('Coffee counter-steers a visible bias to the center through held input; the wrong direction cannot complete',()=>{
    const wrong=new PracticeSession('game008');wrong.setInput(-1);tick(wrong,3);expect(wrong.snapshot()).toMatchObject({complete:false,tilt:.4});
    const session=new PracticeSession('game008');session.setInput(1);tick(session,1);expect(session.snapshot().complete).toBe(true);expect(Math.abs(session.snapshot().tilt)).toBeLessThan(.055);
  });
  it('Stamp accepts the requested red object and keeps a wrong object in practice',()=>{
    const session=new PracticeSession('game009');session.action('stamp-other');expect(session.snapshot()).toMatchObject({step:0,complete:false});session.action('stamp-red');expect(session.snapshot().complete).toBe(true);
  });
  it('Meeting demonstrates separate practice work points and only succeeds after returning to listen after a real warning delay',()=>{
    const session=new PracticeSession('game010');session.action('action');expect(session.snapshot()).toMatchObject({step:1,mode:'work'});tick(session,2);expect(session.snapshot().practicePoints).toBeGreaterThan(15);expect(session.snapshot().complete).toBe(false);session.action('action');expect(session.snapshot()).toMatchObject({step:2,mode:'listen',complete:true});
  });
  it('Quiz answers by category rather than fixed side, with both independent left/right layouts and no practice timer',()=>{
    for(const roll of [.1,.9]){const session=new PracticeSession('game011',()=>roll);expect(session.snapshot().choiceLeft).toBe(roll<.5?'unko':'ukon');tick(session,100);session.action('ukon');expect(session.snapshot()).toMatchObject({step:0,complete:false});session.action('unko');expect(session.snapshot().complete).toBe(true);}
  });

  it('snapshot edits cannot alter the training scenario and completion absorbs further actions/updates',()=>{
    const session=new PracticeSession('game005');const exposed=session.snapshot();exposed.step=50;exposed.complete=true;expect(session.snapshot()).toMatchObject({step:0,complete:false});session.action('left');session.action('right');const done=session.snapshot();session.action('left');tick(session,10);expect(session.snapshot()).toEqual(done);
  });
});
