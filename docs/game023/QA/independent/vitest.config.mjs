import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root=fileURLToPath(new URL('../../../../',import.meta.url));
export default defineConfig({root,resolve:{alias:{'@game023':process.env.GAME023_SOURCE??join(root,'src/games/game023')}},test:{include:['docs/game023/QA/independent/source-review.test.ts']}});
