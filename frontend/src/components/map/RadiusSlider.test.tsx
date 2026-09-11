import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadiusSlider } from './RadiusSlider.js';

describe('RadiusSlider', () => {
  it('mostra o valor atual do raio', () => {
    render(<RadiusSlider radiusKm={5} onChange={() => {}} />);
    expect(screen.getByText('5 km')).toBeInTheDocument();
  });

  it('chama onChange ao clicar em um preset', () => {
    const onChange = vi.fn();
    render(<RadiusSlider radiusKm={5} onChange={onChange} />);
    fireEvent.click(screen.getByText('10km'));
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('chama onChange ao mover o slider', () => {
    const onChange = vi.fn();
    render(<RadiusSlider radiusKm={5} onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '15' } });
    expect(onChange).toHaveBeenCalledWith(15);
  });
});
