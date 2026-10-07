import {defineConfig} from 'vite';import {resolve} from 'node:path';
export default defineConfig({base:'./',build:{outDir:process.env.GAME027_BUILD_DIR||'/tmp/game027-compiled',emptyOutDir:true,rollupOptions:{input:{game027:resolve(process.cwd(),'game027.html')}}}});
