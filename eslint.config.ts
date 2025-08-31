import { globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tsEslint from 'typescript-eslint';
import vitest from 'eslint-plugin-vitest';

export default tsEslint.config(
  js.configs.recommended,
  tsEslint.configs.strictTypeChecked,
  {
    files: ['**/*.test.ts'],
    plugins: { vitest },
    rules: vitest.configs.all.rules,
  },
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],
      'vitest/max-expects': 'off',
      'vitest/no-hooks': 'off',
      'vitest/prefer-expect-assertions': 'off',
      'vitest/prefer-to-be-truthy': 'off',
      'vitest/require-hook': 'off',
      '@stylistic/max-len': ['error', { code: 120, ignoreUrls: true }],
      '@stylistic/multiline-comment-style': ['error', 'separate-lines'],
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  globalIgnores(['dist/']),
);
