import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { AuthModal } from './AuthModal.js';
import { AuthProvider } from '../contexts/AuthContext.js';
import { AXE_WCAG_CONFIG } from '../test/setup.js';

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      interceptors: { request: { use: vi.fn() } },
    })),
    isAxiosError: () => false,
  },
}));

describe('AuthModal — regressão do bug de hooks condicionais', () => {
  // Terceira ocorrência do mesmo bug encontrado em IncidentDetailModal e
  // NewIncidentModal: `return null` antes de useAuth/useState. App.tsx sempre mantém
  // este componente montado (só a prop `isOpen` muda), então abrir o modal de login pela
  // primeira vez ia de 0 para ~8 hooks chamados e derrubava a SPA inteira.

  it('não lança ao re-renderizar de isOpen=false para isOpen=true (mesmo componente montado)', () => {
    const { rerender } = render(
      <AuthProvider>
        <AuthModal isOpen={false} onClose={() => {}} />
      </AuthProvider>
    );

    expect(() =>
      rerender(
        <AuthProvider>
          <AuthModal isOpen={true} onClose={() => {}} />
        </AuthProvider>
      )
    ).not.toThrow();
  });

  it('renderiza null quando fechado', () => {
    const { container } = render(
      <AuthProvider>
        <AuthModal isOpen={false} onClose={() => {}} />
      </AuthProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('exibe o formulário de login quando aberto', () => {
    const { getByText } = render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={() => {}} />
      </AuthProvider>
    );
    expect(getByText('Acessar o Voz do Bairro')).toBeInTheDocument();
  });

  it('expõe role="dialog" e um botão de fechar com nome acessível', () => {
    const { getByRole } = render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={() => {}} />
      </AuthProvider>
    );
    expect(getByRole('dialog')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });

  it('fecha ao pressionar Esc', () => {
    const onClose = vi.fn();
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={onClose} />
      </AuthProvider>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('não tem violações de acessibilidade detectáveis automaticamente (axe-core)', async () => {
    const { container } = render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={() => {}} />
      </AuthProvider>
    );
    expect(await axe(container, AXE_WCAG_CONFIG)).toHaveNoViolations();
  });
});
