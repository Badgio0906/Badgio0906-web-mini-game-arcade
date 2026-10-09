import { defineConfig } from 'vitest/config';
export default defineConfig({test:{include:['tests/leaderboards/independent*.test.ts'],environment:'node'}});
