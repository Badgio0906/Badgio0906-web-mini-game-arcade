import {build} from 'vite';
import {mkdirSync,copyFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {prototypeCandidates} from '../src/data/prototypeCandidates';
import{gameCatalog}from'../src/data/gameCatalog';
/** Builds each native trial in isolation; existing games and save contracts are untouched. */
export async function buildPrototypeGames(destination:string){
 const selected=prototypeCandidates.filter(x=>gameCatalog.some(g=>g.id===x.id));
 for(const game of selected){
  const id=game.id.slice(4),output=resolve(destination,'games',game.slug),config=`tests/${game.id}/vite.config.${id==='040'?'ts':'mjs'}`;
  if(existsSync(config)){
   const variable=`GAME${id}_OUT`,previous=process.env[variable];process.env[variable]=output;
   try{await build({configFile:resolve(config),mode:'production'});}finally{if(previous===undefined)delete process.env[variable];else process.env[variable]=previous;}
   copyFileSync(resolve(output,game.id+'.html'),resolve(output,'index.html'));
  }
  if(!existsSync(resolve(output,'index.html')))throw Error('Missing published route '+game.id);
 }
 mkdirSync(resolve(destination,'games'),{recursive:true});
 writeFileSync(resolve(destination,'games','trial-build.json'),JSON.stringify({schema:1,scope:'040-062;048 on-hold',trialCount:selected.length,entries:selected.map(({id,route})=>({id,route}))},null,2));
}
