import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
// Isolated Game036 build/preview: does not touch the shared vite.config.ts or catalog.
export default defineConfig({base:'./',build:{outDir:process.env.GAME036_BUILD_DIR||resolve(tmpdir(),'game036-build'),emptyOutDir:true,rollupOptions:{input:{game036:resolve(process.cwd(),'game036.html')}}}});
