import{defineConfig}from'vite';import{resolve}from'node:path';
export default defineConfig({base:'./',build:{outDir:'dist-game028',emptyOutDir:true,rollupOptions:{input:resolve(process.cwd(),'game028.html')}}});
