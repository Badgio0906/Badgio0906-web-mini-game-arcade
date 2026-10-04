import { defineConfig } from '@playwright/test';
const baseURL=process.env.FOURTEEN_ARCADE_URL??'http://127.0.0.1:4193/';
const remote=!['127.0.0.1','localhost','[::1]'].includes(new URL(baseURL).hostname);
const proxy=remote?(process.env.HTTPS_PROXY??process.env.HTTP_PROXY):undefined;
export default defineConfig({
  testDir:'../e2e',testMatch:['legacy-migration.spec.ts','arcade-portal.spec.ts'],workers:1,timeout:150_000,
  outputDir:process.env.FOURTEEN_OUTPUT_DIR??'../../artifacts/fourteen-game-migration',reporter:'list',
  use:{baseURL,trace:'retain-on-failure',screenshot:'only-on-failure',
    launchOptions:{...(proxy?{proxy:{server:proxy}}:{}),executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']}},
  projects:[{name:'legacy-desktop',use:{viewport:{width:1440,height:900}}},{name:'legacy-mobile-landscape',use:{viewport:{width:844,height:390},isMobile:true,hasTouch:true}}],
});
