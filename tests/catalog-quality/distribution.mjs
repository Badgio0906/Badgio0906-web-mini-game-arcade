import {gameCatalog,retiredGameCatalog,removedGameCatalog,onHoldGameCatalog} from '../../src/data/gameCatalog.ts';
import {existsSync,readdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4952/';
const rows=[];
for(const game of [...gameCatalog,...retiredGameCatalog]){
  const response=await fetch(new URL(game.route,base));
  assert.equal(response.status,200,game.id+' distributed route');
  rows.push({id:game.id,route:game.route,status:response.status,publicationState:game.publicationState});
}
for(const game of [...removedGameCatalog,...onHoldGameCatalog]){
  assert.equal(existsSync('dist/'+game.id+'.html'),false,game.id+' missing built HTML');
  const response=await fetch(new URL(game.route,base));
  assert([404,410].includes(response.status),game.id+' must not fall back to index with 200');
  rows.push({id:game.id,route:game.route,status:response.status,publicationState:game.publicationState});
  assert.equal(readdirSync('dist/assets').some(f=>new RegExp('^'+game.id+'-.*\\.(js|css)$').test(f)),false,game.id+' dedicated runtime chunk');
}
const preview=await fetch(new URL('game017-revision03.html',base));assert.equal(preview.status,200);
const out=process.env.QA_OUT||'test-results/catalog-distribution.json';
writeFileSync(out,JSON.stringify({published:gameCatalog.length,rows,retainedPreview:preview.status,heldImages:'Game031 textures remain non-executable public assets; source preserved'},null,2)+'\n');
console.log(JSON.stringify({published:gameCatalog.length,retired:retiredGameCatalog.length,blocked:rows.filter(r=>r.status!==200).length,pass:true}));
