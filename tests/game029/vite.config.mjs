import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({base:'./',build:{outDir:'dist-game029',rollupOptions:{input:{game029:resolve(process.cwd(),'game029.html')}}}});
