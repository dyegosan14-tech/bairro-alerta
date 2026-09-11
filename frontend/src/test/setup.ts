import { expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { toHaveNoViolations } from 'jest-axe';

// jest-axe funciona normalmente com Vitest apesar do nome — a única parte "Jest" é o
// registro do matcher via expect.extend, que o Vitest também suporta.
expect.extend(toHaveNoViolations);

/**
 * Config padrão para as chamadas a axe() nos testes: restringe às regras WCAG 2.x A/AA
 * de verdade, excluindo regras "best-practice" (ex.: heading-order) que são heurísticas
 * de boa prática e não requisitos de conformidade — corrigi-las é válido, mas travar o
 * teste nelas sem ter rodado o axe manualmente para calibrar cada uma seria arriscado.
 */
export const AXE_WCAG_CONFIG = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
};

// O jsdom não implementa ResizeObserver, mas o Recharts (usado no DashboardPage) depende
// dele para o <ResponsiveContainer> — sem este stub, qualquer teste que renderize um
// gráfico lançaria "ResizeObserver is not defined".
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
