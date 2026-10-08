import{build,mergeConfig}from'vite';
import config from'../../vite.config.ts';
import{resolve}from'node:path';
// The explicit QA-only HTML input is excluded from the normal Vite build.
await build(mergeConfig(config,{build:{outDir:process.env.RECORDS_HARNESS_DIST||'/tmp/records-enabled-fixture',rollupOptions:{input:{recordsFixture:resolve('tests/records/harness.html')}}}}));
