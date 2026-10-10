import {describe,it,expect} from 'vitest';
import {aquariumPose,displayedCatches,AQUARIUM_LIMIT,aquariumFishWidth} from '../../src/games/game032/Aquarium';
import type {FishCatch} from '../../src/games/game032/FishingModel';
describe('run-local bounded aquarium view',()=>{
 const fish=(n:number):FishCatch=>({fishId:'oikawa',name:'オイカワ',sizeCm:8+n/10,points:30,rare:false,big:false,spotId:'shallows',distance:'near',method:'bait'});
 it('mobilefish stayvisible without growingbeyond their water window',()=>{for(const w of [64,76,100,230])for(const big of [false,true]){const fw=aquariumFishWidth(w,big);expect(fw).toBeGreaterThanOrEqual(Math.min(28,w*.44));expect(fw).toBeLessThanOrEqual(w*.44);const margin=fw/(2*w)+.025;for(let i=0;i<12;i++)for(let time=0;time<40;time+=.7){const pose=aquariumPose(i,time),x=margin+(1-2*margin)*(pose.x-.19)/.62;expect(x-fw/(2*w)).toBeGreaterThanOrEqual(.0249);expect(x+fw/(2*w)).toBeLessThanOrEqual(.9751);}}});
 it('empty aquarium does not invent fish',()=>expect(displayedCatches([])).toEqual([]));
 it('large catches retain the total inventory while displaying only latest12',()=>{const all=Array.from({length:80},(_,i)=>fish(i)),view=displayedCatches(all);expect(view).toHaveLength(AQUARIUM_LIMIT);expect(view[0]).toEqual(all[68]);expect(all).toHaveLength(80);expect(view).not.toBe(all);});
 it('fish remain inside glass window with turning paths for every active time',()=>{for(let i=0;i<12;i++)for(let t=0;t<300;t+=.21){const p=aquariumPose(i,t);expect(p.x).toBeGreaterThanOrEqual(.19);expect(p.x).toBeLessThanOrEqual(.81);expect(p.y).toBeGreaterThan(.25);expect(p.y).toBeLessThan(.75);}});
 it('same frozen active clock gives the same paused poses',()=>{const before=aquariumPose(3,22);expect(aquariumPose(3,22)).toEqual(before);expect(aquariumPose(3,24)).not.toEqual(before);});
 it('nonfinite clock falls back to safe start position',()=>{for(const time of [NaN,Infinity,-Infinity,-8])expect(aquariumPose(0,time)).toEqual(aquariumPose(0,0));});
});
