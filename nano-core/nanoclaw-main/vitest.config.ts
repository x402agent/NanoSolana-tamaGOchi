import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    globals: false,
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
});
