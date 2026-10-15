import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({base:'./',build:{outDir:process.env.GAME035_BUILD_DIR||'/tmp/game035-compiled',emptyOutDir:true,rollupOptions:{input:{game035:resolve(process.cwd(),'game035.html')}}}});
