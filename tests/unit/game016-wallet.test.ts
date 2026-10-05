import { describe, expect, it, vi } from 'vitest';
import { createRunWallet } from '../../src/games/game016/runWallet';
import { CreditService } from '../../src/core/CreditService';
import { StorageService } from '../../src/core/StorageService';
import { TelemetryService } from '../../src/core/TelemetryService';
import { LoseRun } from '../../src/games/game016/LoseRun';

describe('Game016 realrun start-only CREDIT boundary', () => {
  it('spends exactlyonce atstart, never on correct/wrong/end; retry uses a newrunID and zeroblocks untilStub refill', async () => {
    const log = vi.spyOn(console,'debug').mockImplementation(()=>{});
    try {
      const storage=new StorageService(undefined,'test-game016:'), telemetry=new TelemetryService(storage,'game016'), credits=new CreditService(storage,telemetry,true);
      const wallet=createRunWallet(credits); expect(wallet.creditsEnabled).toBe(true);
      expect(credits.credits).toBe(3); expect(wallet.start('run-1')).toBe(true); expect(credits.credits).toBe(2);
      expect(wallet.start('run-1')).toBe(false); expect(credits.credits).toBe(2);
      const run=new LoseRun();run.start(0);run.settle(2000);expect(run.result()?.outcome).toBe('timeout');expect(credits.credits).toBe(2);
      expect(wallet.start('run-2')).toBe(true);expect(wallet.start('run-3')).toBe(true);expect(credits.credits).toBe(0);
      expect(wallet.start('run-4')).toBe(false);expect(telemetry.getEvents().filter(e=>e.name==='credit_used')).toHaveLength(3);
      expect(await credits.requestRewardedCredit(async()=>({granted:true}))).toBe(true);expect(credits.credits).toBe(3);
      expect(wallet.start('run-4')).toBe(true);expect(wallet.start('run-1')).toBe(false);expect(credits.credits).toBe(2);
      expect(wallet.start('')).toBe(false);expect(credits.credits).toBe(2);
    } finally {log.mockRestore();}
  });
  it('disabledprototype isunlimited even storedzero, consumesnothing and guards duplicate callbacks across100retries', () => {
    const storage=new StorageService(undefined,'test-game016-disabled:');storage.writeNumber('credits',0);
    const telemetry=new TelemetryService(storage,'game016'),credits=new CreditService(storage,telemetry,false),wallet=createRunWallet(credits);
    expect(wallet.creditsEnabled).toBe(false);
    for(let i=0;i<100;i++)expect(wallet.start(`retry-${i}`)).toBe(true);
    expect(wallet.start('retry-0')).toBe(false);expect(credits.credits).toBe(0);expect(telemetry.getEvents()).toEqual([]);
  });
});
