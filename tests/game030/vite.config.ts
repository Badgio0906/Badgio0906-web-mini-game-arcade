import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({root:fileURLToPath(new URL('../../',import.meta.url)),base:'./',publicDir:false,build:{outDir:'dist-game030',emptyOutDir:true,rollupOptions:{input:fileURLToPath(new URL('../../game030.html',import.meta.url))}},server:{host:'0.0.0.0',port:4930},preview:{host:'0.0.0.0',port:4930}});
