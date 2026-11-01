import{it,expect}from'vitest';import{createGraze,grazeTick}from'../../src/games/game043/model';
it('six grazes without a hit earn a phase medal once',()=>{const s=createGraze();s.next=9999;s.phaseGrazes[0]=6;s.t=9.999;grazeTick(s);expect(s.medals).toBe(1);expect(s.score).toBe(1000);grazeTick(s);expect(s.score).toBe(1000);const q=createGraze();q.next=9999;q.phaseGrazes[0]=6;q.phaseHits[0]=1;q.t=9.999;grazeTick(q);expect(q.medals).toBe(0);});

import{spawns}from'../../src/games/game043/content';
it('every authored spawn fits the120 cap even without any FEVER clearing',()=>{let peak=0;for(const at of spawns.map(p=>p.t)){const alive=spawns.filter(p=>{const age=at-p.t,x=p.x+p.vx*age,y=p.y+p.vy*age;return age>=0&&age<8&&x>=-50&&x<=530&&y>=-50&&y<=530;}).length;peak=Math.max(peak,alive);}expect(peak).toBeLessThanOrEqual(120);});
