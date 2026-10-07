import {defineConfig} from 'vite';
import {resolve} from 'node:path';
if(!process.env.GAME026_DIST)throw new Error('Set a new unique GAME026_DIST output directory for this run');
export default defineConfig({base:'./',build:{outDir:resolve(process.env.GAME026_DIST),emptyOutDir:false,rollupOptions:{input:resolve('game026.html')}}});
