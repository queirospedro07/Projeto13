import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules', 'data'] },
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: globals.node },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  { files: ['tests/**/*.js'], languageOptions: { sourceType: 'module' } },
];
