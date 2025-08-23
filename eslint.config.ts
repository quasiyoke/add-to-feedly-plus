import { globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  js.configs.recommended,
  tsEslint.configs.strictTypeChecked,
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
      '@stylistic/max-len': ['error', { code: 120 }],
      '@stylistic/multiline-comment-style': ['error', 'separate-lines'],
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  globalIgnores(['dist/', 'web-ext-artifacts/']),
);
