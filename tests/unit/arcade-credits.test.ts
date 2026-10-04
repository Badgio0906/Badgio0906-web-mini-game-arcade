import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreditService } from '../../src/core/CreditService';
import { StorageService } from '../../src/core/StorageService';
import { TelemetryService } from '../../src/core/TelemetryService';

class WalletStorage implements Storage {
  readonly values = new Map<string,string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key:string) { return this.values.get(key) ?? null; }
  key(index:number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key:string) { this.values.delete(key); }
  setItem(key:string,value:string) { this.values.set(key,value); }
}
beforeEach(()=>{vi.spyOn(console,'debug').mockImplementation(()=>{});});
afterEach(()=>vi.restoreAllMocks());

describe('unlimited prototype preserves the future wallet without restricting real play',()=>{
  it.each([0,1,3])('stored %i credits permits unlimited runs without consuming or rewriting saved data',count=>{
    const backend=new WalletStorage();
    backend.setItem('web-mini-arcade:v1:game011:credits',String(count));
    backend.setItem('web-mini-arcade:v1:game011:best','7350');
    const storage=new StorageService(backend,'web-mini-arcade:v1:game011:');
    const telemetry=new TelemetryService(storage,'game011');
    const writes=vi.spyOn(backend,'setItem');
    const credits=new CreditService(storage,telemetry);
    expect(credits.canPlay).toBe(true);
    for(let run=0;run<200;run++){expect(credits.consume(`actual-run-${run}`)).toBe(false);expect(credits.canPlay).toBe(true);}
    credits.reset();
    expect(credits.credits).toBe(count);
    expect(backend.getItem('web-mini-arcade:v1:game011:credits')).toBe(String(count));
    expect(backend.getItem('web-mini-arcade:v1:game011:best')).toBe('7350');
    expect(writes).not.toHaveBeenCalled();
    expect(telemetry.getEvents()).toEqual([]);
  });

  it('disabled rewards never call a real or stub adapter and leave no reward events or pending state',async()=>{
    const backend=new WalletStorage();backend.setItem('web-mini-arcade:v1:game008:credits','0');
    const storage=new StorageService(backend,'web-mini-arcade:v1:game008:');
    const telemetry=new TelemetryService(storage,'game008');
    const credits=new CreditService(storage,telemetry,false);
    const adapter=vi.fn(async()=>({granted:true}));
    const requested=await Promise.all(Array.from({length:20},()=>credits.requestRewardedCredit(adapter)));
    expect(requested.every(result=>result===false)).toBe(true);
    expect(adapter).not.toHaveBeenCalled();expect(credits.rewardPending).toBe(false);
    expect(credits.credits).toBe(0);expect(credits.canPlay).toBe(true);expect(telemetry.getEvents()).toEqual([]);
  });

  it('re-enabling the same saved wallet restores its zero restriction without changing unrelated records',()=>{
    const backend=new WalletStorage();backend.setItem('orbit-shift:v1:credits','0');
    backend.setItem('web-mini-arcade:v1:game002:credits','2');
    const storage=new StorageService(backend);const telemetry=new TelemetryService(storage);
    const unlimited=new CreditService(storage,telemetry,false);
    expect(unlimited.canPlay).toBe(true);unlimited.consume('prototype-death');
    const limited=new CreditService(new StorageService(backend),telemetry,true);
    expect(limited.credits).toBe(0);expect(limited.canPlay).toBe(false);
    expect(limited.consume('enabled-death')).toBe(false);
    expect(backend.getItem('web-mini-arcade:v1:game002:credits')).toBe('2');
  });
});
