import {defineConfig} from 'vite';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
// Isolated Game038 build/preview: does not touch the shared vite.config.ts or catalog.
export default defineConfig({base:'./',build:{outDir:process.env.GAME038_BUILD_DIR||resolve(tmpdir(),'game038-build'),emptyOutDir:true,rollupOptions:{input:{game038:resolve(process.cwd(),'game038.html')}}}});
