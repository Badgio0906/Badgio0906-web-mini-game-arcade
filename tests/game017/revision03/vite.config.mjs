// Isolated local preview: does not publish or replace the current017 in the production catalog or build.
import {defineConfig} from 'vite';import {resolve,join} from 'node:path';import {tmpdir} from 'node:os';import fs from 'node:fs';
const root=process.cwd(),stage=process.env.RAIN017_R3_PUBLIC||join(tmpdir(),'rain017-r3-public');
fs.mkdirSync(join(stage,'assets/game017/revision03'),{recursive:true});fs.cpSync(resolve(root,'public/assets/game017/revision03'),join(stage,'assets/game017/revision03'),{recursive:true});
fs.mkdirSync(join(stage,'assets/game017/reorganization'),{recursive:true});fs.copyFileSync(resolve(root,'public/assets/game017/reorganization/rain-city.webp'),join(stage,'assets/game017/reorganization/rain-city.webp'));
for(const f of ['arcade-navigation.js','arcade-navigation.css'])fs.copyFileSync(resolve(root,'public',f),join(stage,f));
export default defineConfig({base:'./',publicDir:stage,server:{host:'127.0.0.1'},preview:{host:'127.0.0.1'},build:{outDir:process.env.RAIN017_R3_BUILD||join(tmpdir(),'rain017-r3-dist'),emptyOutDir:true,rollupOptions:{input:{game017revision03:resolve(root,'game017-revision03.html')}}}});
