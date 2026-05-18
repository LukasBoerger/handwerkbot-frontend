/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    pool: 'forks',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  ssr: {
    noExternal: true,
  },
  define: {
    ngDevMode: true,
    ngJitMode: true,
  },
});
