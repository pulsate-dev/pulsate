import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'build/**', "tests/integration/**"],
    coverage: {
      include: ['pkg/**'],
      exclude: [...configDefaults.exclude, 'build/**'],
      reporter: ['text', 'json', 'html'],
    },
    testTimeout: 2 * 60 * 1000,
  },
});
