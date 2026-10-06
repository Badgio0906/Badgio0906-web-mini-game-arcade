import type {Inputs} from './types';
import {JUST_MAX_THRESHOLD} from './types';
export type RareId='iron-meteor'|'zori-whirlwind'|'paper-star-mail';
export const RARE_PROBABILITIES={ 'iron-meteor':.2,'zori-whirlwind':.15,'paper-star-mail':.15 } as const;
export const RARE_LABELS={ 'iron-meteor':'鉄下駄、天体になる','zori-whirlwind':'草履の大旋風','paper-star-mail':'紙の靴の流星便' } as const;
export interface RareDraw {id:RareId;seed:number;probability:number;value:number;won:boolean}
/** Independent presentation RNG: never consumed by physical simulation. One draw per eligible ID. */
export class RarePresentation {
  readonly draws:RareDraw[]=[];private state:number;
  constructor(readonly seed:number,private readonly override?:number){let x=(seed+0x9e3779b9)>>>0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);this.state=(x^(x>>>15))>>>0;}
  update(input:Inputs,specials:readonly string[],landed:boolean){
    const just=input.power>=JUST_MAX_THRESHOLD;
    const candidates:RareId[]=[];
    if(input.shoeType==='iron-geta'&&specials.includes('ORBITAL SHOE')&&landed)candidates.push('iron-meteor');
    if(input.shoeType==='zori'&&just&&Math.abs(input.spin)>=.92)candidates.push('zori-whirlwind');
    if(input.shoeType==='paper'&&just&&specials.includes('CLOUD NINE'))candidates.push('paper-star-mail');
    for(const id of candidates){if(this.draws.some(d=>d.id===id))continue;this.state=(Math.imul(this.state,1664525)+1013904223)>>>0;const value=this.state/4294967296;const probability=this.override??RARE_PROBABILITIES[id];const draw={id,seed:this.seed,probability,value,won:value<probability};this.draws.push(draw);}
  }
  get selected():RareId|null{return this.draws.find(d=>d.won)?.id??null;}
}
