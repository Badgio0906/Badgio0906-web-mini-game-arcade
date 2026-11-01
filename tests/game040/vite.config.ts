import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import {cpSync,existsSync,mkdirSync} from 'node:fs';
const root=resolve(import.meta.dirname,'../..');
const out=process.env.GAME040_OUT||'/tmp/game040-build';
export default defineConfig({root,base:'./',publicDir:false,server:{host:'127.0.0.1',port:4970,strictPort:true},build:{outDir:out,emptyOutDir:true,rollupOptions:{input:resolve(root,'game040.html')}},plugins:[{name:'game040-assets-only',closeBundle(){const src=resolve(root,'public/assets/game040');if(existsSync(src)){mkdirSync(resolve(out,'assets'),{recursive:true});cpSync(src,resolve(out,'assets/game040'),{recursive:true});}}}]});
