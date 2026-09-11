import { useEffect } from 'react';

/**
 * Fecha um modal ao pressionar Esc. Nenhum dos três modais da aplicação tinha isso —
 * navegação por teclado em modais é um requisito básico de acessibilidade (WCAG 2.1.2).
 */
export function useEscapeToClose(isOpen: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
}
