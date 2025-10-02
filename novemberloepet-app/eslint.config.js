// Flat ESLint config (CommonJS) for ESLint v9+
// Konvertert til CJS for å unngå behov for "type": "module".
/** @type {import('eslint').Linter.FlatConfig[]} */
const globalsLib = require('globals');

module.exports = [
  {
    ignores: ['dist', 'node_modules']
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globalsLib.browser,
        ...globalsLib.node,
        ...globalsLib.es2021,
        ...globalsLib.jest
      }
    },
    plugins: {
      react: require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      'jsx-a11y': require('eslint-plugin-jsx-a11y'),
      import: require('eslint-plugin-import'),
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      'simple-import-sort': require('eslint-plugin-simple-import-sort')
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: { project: ['./tsconfig.json'] },
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] }
      }
    },
    rules: {
      // Base recommended
      ...require('@eslint/js').configs.recommended.rules,
      // React & hooks
      ...require('eslint-plugin-react').configs.recommended.rules,
      ...require('eslint-plugin-react-hooks').configs.recommended.rules,
      // JSX a11y
      ...require('eslint-plugin-jsx-a11y').configs.recommended.rules,
      // TypeScript
      ...require('@typescript-eslint/eslint-plugin').configs.recommended.rules,
      // Disable core no-undef (TypeScript already checks this and it causes false positives for DOM globals/types)
      'no-undef': 'off',
      // Allow empty catch (intentional swallow) but still flag other empty blocks
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Allow CommonJS require (server/config scripts)
      '@typescript-eslint/no-require-imports': 'off',
      // Import / sorting
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      'import/no-unresolved': 'error',
      // TS specifics (ignore unused catch params + underscore conventions)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      // Relax explicit any to warning in implementation files
      '@typescript-eslint/no-explicit-any': 'off',
      // Legacy React off
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off'
    }
  },
  // Overrides / exceptions
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  // Prettier compatibility (disables conflicting stylistic rules)
  {
    rules: {
      ...require('eslint-config-prettier').rules
    }
  }
];