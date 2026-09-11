import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { useEscapeToClose } from './useEscapeToClose.js';

function Probe({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEscapeToClose(isOpen, onClose);
  return <div>probe</div>;
}

describe('useEscapeToClose', () => {
  it('chama onClose ao pressionar Esc quando aberto', () => {
    const onClose = vi.fn();
    render(<Probe isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('não chama onClose ao pressionar Esc quando fechado', () => {
    const onClose = vi.fn();
    render(<Probe isOpen={false} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignora outras teclas', () => {
    const onClose = vi.fn();
    render(<Probe isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Enter' });

    expect(onClose).not.toHaveBeenCalled();
  });
});
