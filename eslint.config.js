import js from '@eslint/js';
import globals from 'globals';
import noConsoleLogging from './rules/no-console-logging.js';

export default [
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'ui/'],
  },

  js.configs.recommended,
  
  {
    files: ['**/*.js'],
     plugins: {
      // Create a virtual plugin named 'local'
      local: {
        rules: {
          "no-console-logging": noConsoleLogging
        }
      }
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals:{
        ...globals.node,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      indent: 'off',
      'linebreak-style': 'off',
      quotes: 'off',
      semi: 'off',
      'comma-dangle': 'off',
      'quote-props': 'off',
      camelcase: 'off',
      'no-debugger': 'off',

      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'local/no-console-logging': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-undef': 'error',
    },
  },
];