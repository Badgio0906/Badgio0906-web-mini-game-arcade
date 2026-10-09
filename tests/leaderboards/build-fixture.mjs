import {build,mergeConfig} from 'vite';
import config from '../../vite.config.ts';
// Standalone QA directory; no extra HTML inputs or fixture scores enter production.
await build(mergeConfig(config,{build:{outDir:process.env.LEADERBOARDS_FIXTURE_DIST||'/tmp/leaderboards-fixture'}}));
