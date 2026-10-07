import { defineConfig } from 'vite';
export default defineConfig({root: process.cwd(),publicDir:false,base:'./',build:{outDir:process.env.GAME025_QA_OUT_DIR??'docs/game025/QA/compiled',emptyOutDir:true,rollupOptions:{input:{game025:process.cwd()+'/game025.html'}}}});
