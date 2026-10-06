import { defineConfig } from 'vite';
import { resolve } from 'node:path';
// Explicit opt-in build. The public arcade build/catalog do not include this experiment.
export default defineConfig({ base: './', publicDir: false, build: { outDir: 'artifacts/stick-balance', rollupOptions: { input: resolve(process.cwd(), 'prototype-stick.html') } } });
