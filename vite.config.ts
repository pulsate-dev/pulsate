import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'build/**'],
    coverage: {
      include: ['pkg/**/*.ts'],
      exclude: [
        ...configDefaults.exclude,
        'build/**',
        'pkg/adaptors/prisma/**',
        'pkg/adaptors/prisma.ts',
        'pkg/adaptors/valkey.ts',
        'pkg/**/type.ts',
        'pkg/**/mod.ts',
        'pkg/**/adaptor/logger.ts',
        'pkg/**/testData/**',
        'pkg/**/router.ts',
        'pkg/notification/routes.ts',
        'pkg/**/adaptor/presenter/**',
        'pkg/**/adaptor/validator/**',
      ],
      reporter: ['text', 'json', 'html'],
    },
    testTimeout: 2 * 60 * 1000,
  },
});
