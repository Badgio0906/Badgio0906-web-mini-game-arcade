/** Only a completed five-minute standard outing can write a record. No fish inventory
 * or player identifiers are stored in this small Portal-readable local BEST. */
export const MAX_FISHING_SCORE = 100_000;
export const FISHING_BEST_KEY = 'web-mini-arcade:v1:game032:best:standard:r1';
export interface FishingBest { game_id:'game032'; rules_version:'1'; save_version:1; mode_id:'standard'; score:number; }
export function validateFishingBest(input:unknown):FishingBest|null {
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  const value=input as Record<string,unknown>;
  if(Object.keys(value).length!==5||value.game_id!=='game032'||value.rules_version!=='1'||value.save_version!==1||value.mode_id!=='standard'||typeof value.score!=='number'||!Number.isSafeInteger(value.score)||value.score<0||value.score>MAX_FISHING_SCORE)return null;
  return {game_id:'game032',rules_version:'1',save_version:1,mode_id:'standard',score:value.score};
}
export class FishingBestStore {
  private backend?:Pick<Storage,'getItem'|'setItem'>;
  private memory:FishingBest|null=null;
  constructor(backend?:Pick<Storage,'getItem'|'setItem'>) {
    try{this.backend=backend??window.localStorage;}catch{/* denied storage: page-memory only */}
  }
  best():number|null {
    try{
      const raw=this.backend?.getItem(FISHING_BEST_KEY);
      if(raw&&raw.length<=1024){const parsed=validateFishingBest(JSON.parse(raw));if(parsed&&(!this.memory||parsed.score>this.memory.score))this.memory=parsed;}
    }catch{/* corrupt/unavailable: retain this page's verified best */}
    return this.memory?.score??null;
  }
  record(score:number,mode:'standard'|'practice',completed:boolean):boolean {
    if(mode!=='standard'||!completed)return false;
    const candidate=validateFishingBest({game_id:'game032',rules_version:'1',save_version:1,mode_id:'standard',score});
    if(!candidate)return false;
    const prior=this.best();if(prior!==null&&score<=prior)return false;
    this.memory=candidate;
    try{this.backend?.setItem(FISHING_BEST_KEY,JSON.stringify(candidate));}catch{/* gameplay and page-memory best survive denied writes */}
    return true;
  }
}
