import path from 'path';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'build/**'],
    coverage: {
      include: ['pkg/**'],
      exclude: [...configDefaults.exclude, 'build/**'],
      reporter: ['text', 'json', 'html'],
    },
    alias: {
      '~': path.resolve(__dirname, './pkg'),
    },
  },
});
