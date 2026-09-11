// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Flat config (ESLint 9+). Este projeto nunca teve lint real configurado no backend
// (o .gitlab-ci.yml rodava "npm run lint || true" sem nem existir o script) — começamos
// pelas regras "recommended" para não afogar a base em centenas de avisos de uma vez;
// endureça gradualmente (ex.: trocar por configs["recommended-type-checked"]) depois que
// o time tiver corrigido os avisos iniciais.
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'uploads/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // O projeto já usa `any` deliberadamente em pontos pontuais (ex.: erros customizados
      // com `error.statusCode`) — manter como aviso em vez de erro evita travar o CI numa
      // adoção inicial, mas ainda torna o uso visível para revisão.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  }
);
