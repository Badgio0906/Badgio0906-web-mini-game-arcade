import { describe, expect, it, vi } from 'vitest';
import { createLoseOnboarding } from '../../src/games/game016/onboarding';
import { StorageService } from '../../src/core/StorageService';
import { TelemetryService } from '../../src/core/TelemetryService';
import { CreditService } from '../../src/core/CreditService';
import { LoseRun } from '../../src/games/game016/LoseRun';

describe('Game016 isolated optional three-question practice', () => {
  it('wrong/draw attempts remain untimed on the samequestion; onlythreecorrect losing hands complete', () => {
    const log=vi.spyOn(console,'debug').mockImplementation(()=>{});
    try{
      const storage=new StorageService(undefined,'practice016:'),telemetry=new TelemetryService(storage,'game016'),practice=createLoseOnboarding(storage,telemetry);
      expect(practice.needed()).toBe(true);practice.explain();expect(practice.finish()).toBe(false);practice.practice();
      expect(practice.snapshot()).toMatchObject({phase:'practice',step:0,opponentHand:'rock'});
      expect(practice.answer('paper')).toBe(false);expect(practice.snapshot()).toMatchObject({step:0,phase:'practice'});
      expect(practice.answer('rock')).toBe(false);expect(practice.snapshot().feedback).toContain('あいこ');
      expect(practice.answer('scissors')).toBe(true);expect(practice.snapshot()).toMatchObject({step:1,opponentHand:'scissors'});
      expect(practice.answer('rock')).toBe(false);expect(practice.snapshot().step).toBe(1);
      expect(practice.answer('paper')).toBe(true);expect(practice.snapshot()).toMatchObject({step:2,opponentHand:'paper'});
      expect(practice.answer('rock')).toBe(true);expect(practice.snapshot()).toMatchObject({step:3,phase:'complete',complete:true});
      expect(practice.needed()).toBe(true);expect(practice.finish()).toBe(true);expect(practice.needed()).toBe(false);
      expect(practice.finish()).toBe(false);expect(telemetry.getEvents().filter(e=>e.name==='tutorial_step_complete')).toHaveLength(3);
      expect(telemetry.getEvents().filter(e=>e.name==='tutorial_complete')).toHaveLength(1);
      const reopened=createLoseOnboarding(storage,telemetry);expect(reopened.needed()).toBe(false);
    }finally{log.mockRestore();}
  });
  it('practice never mutates realrun, score/BEST/CREDIT or RUNevents; closing early leaves completionfalse', () => {
    const log=vi.spyOn(console,'debug').mockImplementation(()=>{});
    try{
      const storage=new StorageService(undefined,'practice016-isolation:');storage.writeNumber('bestScore',1234);
      const telemetry=new TelemetryService(storage,'game016'),credits=new CreditService(storage,telemetry,true),events:unknown[]=[];
      const real=new LoseRun(e=>events.push(e)),practice=createLoseOnboarding(storage,telemetry),before=real.snapshot();
      practice.explain();practice.practice();for(let i=0;i<100;i++)practice.answer('rock');practice.close();
      expect(storage.readBoolean('tutorialCompleted',false)).toBe(false);expect(real.snapshot()).toEqual(before);expect(events).toEqual([]);
      expect(credits.credits).toBe(3);expect(storage.readNumber('bestScore',0)).toBe(1234);
      expect(telemetry.getEvents().every(e=>e.name.startsWith('tutorial_') || e.name.startsWith('practice_'))).toBe(true);
    }finally{log.mockRestore();}
  });
  it('deniedstorage doesnotbreak practice or completion within the currentpage', () => {
    const log=vi.spyOn(console,'debug').mockImplementation(()=>{});
    try{
      const blocked={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');}} as unknown as Storage;
      const storage=new StorageService(blocked,'practice016-denied:'),practice=createLoseOnboarding(storage,new TelemetryService(storage,'game016'));
      practice.explain();practice.practice();practice.answer('scissors');practice.answer('paper');practice.answer('rock');
      expect(practice.finish()).toBe(true);expect(practice.needed()).toBe(false);
    }finally{log.mockRestore();}
  });
});
