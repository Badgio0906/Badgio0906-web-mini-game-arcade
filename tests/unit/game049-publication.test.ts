import{it,expect}from'vitest';import{createSong,strike}from'../../src/games/game049/model';
it('keeps a combo with a150ms late hit and still misses beyond180ms',()=>{const s=createSong();const a=s.notes[0];expect(strike(s,a.kind,a.t+.15)).toBe('GOOD');expect(s.combo).toBe(1);const b=s.notes[1];expect(strike(s,b.kind,b.t+.181)).toBe('EMPTY');expect(s.combo).toBe(0);});
it('reveals the first special costume at8 successful notes',()=>{const s=createSong();for(const n of s.notes.slice(0,8))strike(s,n.kind,n.t);expect(s.formLog).toHaveLength(1);expect(s.form).not.toBe('base');});
