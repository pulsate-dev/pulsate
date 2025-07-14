import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 2 * 60 * 1000,
  },
});
