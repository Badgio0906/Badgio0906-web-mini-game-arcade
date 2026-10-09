import{build,mergeConfig}from'vite';import config from'../../vite.config.ts';import{resolve}from'node:path';
const out=process.env.LEGACY_HARNESS_DIST;if(!out)throw Error('isolated LEGACY_HARNESS_DIST required');
await build(mergeConfig(config,{build:{outDir:out,rollupOptions:{input:{legacyFixture:resolve('tests/legacy-records/harness.html')}}}}));
