import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ScaleConfig } from '../config/scale';
import { VerticalSlider } from './VerticalSlider';

const scale: ScaleConfig = {
  min: 0,
  max: 8,
  steps: 9,
  lowerLabel: 'Very negative',
  upperLabel: 'Very positive',
  axisLabel: 'Valence',
  paletteId: 'blueGreyOrange',
  orientation: 'vertical',
};

describe('<VerticalSlider />', () => {
  it('exposes ARIA slider semantics for the current value', () => {
    render(<VerticalSlider config={scale} value={4} onChange={() => {}} />);
    const slider = screen.getByRole('slider', { name: 'Valence' });
    expect(slider).toHaveAttribute('aria-orientation', 'vertical');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '8');
    expect(slider).toHaveAttribute('aria-valuenow', '4');
  });

  it('nudges up and down by one step with the arrow keys', async () => {
    const onChange = vi.fn();
    render(<VerticalSlider config={scale} value={4} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    slider.focus();

    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(5);

    await userEvent.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it('jumps to min/max with Home/End (ARIA convention)', async () => {
    const onChange = vi.fn();
    render(<VerticalSlider config={scale} value={4} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    slider.focus();

    await userEvent.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith(0);

    await userEvent.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith(8);
  });

  it('clamps at the boundaries', async () => {
    const onChange = vi.fn();
    render(<VerticalSlider config={scale} value={8} onChange={onChange} />);
    screen.getByRole('slider').focus();

    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(8);
  });

  it('renders the configured labels and value readout', () => {
    const { container } = render(<VerticalSlider config={scale} value={6} onChange={() => {}} />);
    expect(screen.getByText('Very positive')).toBeInTheDocument();
    expect(screen.getByText('Very negative')).toBeInTheDocument();
    // The bubble shows the current value over the maximum ("6" also appears as a
    // tick number, so scope the readout query to the bubble.)
    expect(container.querySelector('.slider-bubble-value')?.textContent).toBe('6');
    expect(screen.getByText('/ 8')).toBeInTheDocument();
  });
});
