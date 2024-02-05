import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typeScriptESLint from '@typescript-eslint/eslint-plugin';
import typeScriptESLintParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import vitest from 'eslint-plugin-vitest';

const compat = new FlatCompat();

export default [
  {
    files: ['src/**/**.ts']
  },
  {
    ignores: ['build/**', 'coverage/**', 'node_modules/**']
  },
  // eslint:recommended
  js.configs.recommended,
  eslintConfigPrettier,
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  {
    languageOptions: {
      parser: typeScriptESLintParser,
      parserOptions: {
        project: './tsconfig.json'
      },
      globals: {
        ...vitest.environments.env.globals
      }
    }
  },
  {
    plugins: {
      '@typescript-eslint': typeScriptESLint,
      vitest: vitest
    }
  },
  {
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/consistent-test-it': ['error', { fn: 'it' }],
      'vitest/require-top-level-describe': ['error'],
      'no-implicit-coercion': 'error',
      'prefer-template': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports'
        }
      ],
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array',
          readonly: 'array'
        }
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-confusing-non-null-assertion': 'error'
    }
  }
];
