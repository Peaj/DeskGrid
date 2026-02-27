import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GridCanvas } from './GridCanvas';

describe('GridCanvas', () => {
  it('toggles a seat when clicking in layout layer', () => {
    const onToggleSeat = vi.fn();

    const { container } = render(
      <GridCanvas
        grid={{ width: 6, height: 6, frontEdge: 'bottom' }}
        seats={[]}
        students={[]}
        assignments={[]}
        pairConstraints={[]}
        positionConstraints={[]}
        onToggleSeat={onToggleSeat}
        onAddPairConstraint={vi.fn()}
        onAddPositionConstraint={vi.fn()}
      />,
    );

    const cell = container.querySelector('.grid-cell');
    expect(cell).not.toBeNull();

    fireEvent.click(cell as HTMLElement, { clientX: 40, clientY: 40 });

    expect(onToggleSeat).toHaveBeenCalled();
  });

  it('does not toggle seats in student layer', () => {
    const onToggleSeat = vi.fn();

    const { container } = render(
      <GridCanvas
        grid={{ width: 6, height: 6, frontEdge: 'bottom' }}
        seats={[]}
        students={[]}
        assignments={[]}
        pairConstraints={[]}
        positionConstraints={[]}
        onToggleSeat={onToggleSeat}
        onAddPairConstraint={vi.fn()}
        onAddPositionConstraint={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Student Layer' }));

    const cell = container.querySelector('.grid-cell');
    expect(cell).not.toBeNull();

    fireEvent.click(cell as HTMLElement, { clientX: 40, clientY: 40 });

    expect(onToggleSeat).not.toHaveBeenCalled();
  });
});
