// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

// Flat config (ESLint 9+). O script "lint" do frontend era um `echo` — não existia lint
// de verdade. O plugin react-hooks/rules-of-hooks é o item mais importante desta config:
// é exatamente a regra que teria detectado, em tempo de lint (antes de qualquer usuário
// clicar em algo), os 3 componentes que chamavam useState/useAuth DEPOIS de um `return
// null` condicional (IncidentDetailModal, NewIncidentModal, AuthModal) — bug que derrubava
// a SPA inteira com "Rendered more hooks than during the previous render".
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  }
);
