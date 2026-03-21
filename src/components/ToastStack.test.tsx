import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastStack } from './ToastStack';

describe('ToastStack', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto dismisses notices after showing them briefly', () => {
    const onDismiss = vi.fn();

    render(<ToastStack notices={[{ id: 'notice-1', message: 'Imported project.' }]} onDismiss={onDismiss} />);

    expect(screen.getByText('Imported project.')).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(3200);
    });

    expect(screen.getByRole('status')).toHaveClass('is-exiting');
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(220);
    });

    expect(onDismiss).toHaveBeenCalledWith('notice-1');
  });

  it('dismisses immediately when the close button is pressed', () => {
    const onDismiss = vi.fn();

    render(<ToastStack notices={[{ id: 'notice-1', message: 'Imported layout.' }]} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));

    expect(screen.getByRole('status')).toHaveClass('is-exiting');

    act(() => {
      vi.advanceTimersByTime(220);
    });

    expect(onDismiss).toHaveBeenCalledWith('notice-1');
  });
});
