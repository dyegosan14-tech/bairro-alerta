import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Configuração de testes separada de vite.config.ts (usada só para dev/build) para não
// precisar do plugin de tipos do Vitest ali. Rode com `npm test` (= `vitest run`).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'src/test/'],
    },
  },
});
