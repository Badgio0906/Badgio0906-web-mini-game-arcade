import ts from 'typescript';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const cache=new Map();
function load(file){file=resolve(file);if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(name=>load(resolve(dirname(file),name+'.ts')),m,m.exports);return m.exports;}
const a=load('src/games/game015/art.ts'),t=load('src/games/game015/types.ts'),g=load('src/games/game015/generation.ts');
assert.deepEqual([a.KING_WIDTH,a.KING_HEIGHT,t.PLAYER_WIDTH,t.PLAYER_HEIGHT,g.START_Y],[24,36,18,33,112]);assert.deepEqual(a.KING_ANCHOR,{x:12,y:36});
const frames=[];
for(const [state,images] of Object.entries(a.KING_FRAMES))for(const [index,pixels] of images.entries()){
 assert.equal(pixels.length,36);assert.ok(pixels.every(row=>row.length===24));const opaque=[];for(let y=0;y<36;y++)for(let x=0;x<24;x++)if(pixels[y][x]!=='.')opaque.push([x,y]);assert.ok(opaque.length);
 frames.push({state,index,width:24,height:36,opaqueBounds:{left:Math.min(...opaque.map(p=>p[0])),top:Math.min(...opaque.map(p=>p[1])),right:Math.max(...opaque.map(p=>p[0]))+1,bottom:Math.max(...opaque.map(p=>p[1]))+1}});
}
let cursor={y:g.START_Y,center:128,nextId:2,chunks:0},count=0,paired=0,birds=0,needles=0,maxWidth=0;const patterns=new Set();
for(let i=0;i<240;i++){
 const chunk=g.generateChunk(cursor,()=>((i%g.AUTHORED_PATTERNS.length)+.01)/g.AUTHORED_PATTERNS.length);cursor=chunk.cursor;
 for(const p of chunk.platforms){assert.ok(p.width<256,'production contains no full-width floor');assert.ok(p.originX-p.amplitude>=0&&p.originX+p.width+p.amplitude<=256);maxWidth=Math.max(maxWidth,p.width);patterns.add(p.pattern);count++;}
 for(const h of chunk.hazards){if(h.kind==='bird')birds++;if(h.kind==='wall_needle')needles++;}
 for(const p of chunk.platforms)if(chunk.hazards.filter(h=>h.kind==='spikes'&&h.anchorPlatformId===p.id).length===2)paired++;
}
assert.ok(paired>0&&birds>0&&needles>0);
const result={checkedUtc:new Date().toISOString(),status:'passed',scope:'Independent source/frame and authored-generator audit. No browser, live-model writes, physics policy or human-play evidence.',geometry:{art:[24,36],physical:[18,33],anchor:a.KING_ANCHOR,feet:g.START_Y},frames,generation:{chunks:240,platforms:count,maxWidth,pairedRows:paired,birds,needles,patterns:[...patterns]}};
writeFileSync('docs/game015/revision-01/INDEPENDENT_ART_GENERATION_AUDIT.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.generation));
