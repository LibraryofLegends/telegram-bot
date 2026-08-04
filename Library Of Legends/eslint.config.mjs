import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'dist/**',
      'build/**',
      'coverage/**',
      '.turbo/**',
      'node_modules/**',
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    rules: {
      'no-console': 'warn',
      'no-debugger': 'error',

      'prefer-const': 'error',

      'no-var': 'error',

      'no-unused-vars': 'off',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/consistent-type-imports': 'warn',

      'object-shorthand': 'error',

      eqeqeq: ['error', 'always'],

      curly: ['error', 'all'],
    },
  },
];