import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
const jsxReferences = {
  meta: {
    type: 'problem',
    schema: [],
    messages: { missing: 'O componente {{name}} não foi importado ou definido.' },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        let name = node.name;
        while (name.type === 'JSXMemberExpression') name = name.object;
        if (name.type !== 'JSXIdentifier' || !/^[A-Z]/.test(name.name)) return;
        let scope = context.sourceCode.getScope(node);
        while (scope && !scope.set.has(name.name)) scope = scope.upper;
        if (!scope) context.report({ node: name, messageId: 'missing', data: { name: name.name } });
        else context.sourceCode.markVariableAsUsed(name.name, node);
      },
    };
  },
};
export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    plugins: {
      local: { rules: { 'jsx-references': jsxReferences } },
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      'one-var': ['error', 'never'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: 'block-like', next: '*' },
        { blankLine: 'always', prev: '*', next: ['function', 'class', 'export'] },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: 'expression' },
        { blankLine: 'always', prev: 'expression', next: ['const', 'let', 'var'] },
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
      ],
      'local/jsx-references': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
];
