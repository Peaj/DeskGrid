import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GridCanvas } from './GridCanvas';

describe('GridCanvas', () => {
  it('toggles a seat when pressing in layout layer', () => {
    const onToggleSeat = vi.fn();

    const { container } = render(
      <GridCanvas
        activeLayer="layout"
        grid={{ width: 6, height: 6, frontEdge: 'bottom' }}
        seats={[]}
        students={[]}
        assignments={[]}
        pairConstraints={[]}
        positionConstraints={[]}
        onToggleSeat={onToggleSeat}
        onAddPairConstraint={vi.fn()}
        onAddPositionConstraint={vi.fn()}
        onMoveStudentToSeat={vi.fn()}
        onUnassignStudent={vi.fn()}
      />,
    );

    const cell = container.querySelector('.grid-cell');
    expect(cell).not.toBeNull();

    fireEvent.pointerDown(cell as HTMLElement, { clientX: 40, clientY: 40, button: 0 });

    expect(onToggleSeat).toHaveBeenCalled();
  });

  it('does not toggle seats in student layer', () => {
    const onToggleSeat = vi.fn();

    const { container } = render(
      <GridCanvas
        activeLayer="student"
        grid={{ width: 6, height: 6, frontEdge: 'bottom' }}
        seats={[]}
        students={[]}
        assignments={[]}
        pairConstraints={[]}
        positionConstraints={[]}
        onToggleSeat={onToggleSeat}
        onAddPairConstraint={vi.fn()}
        onAddPositionConstraint={vi.fn()}
        onMoveStudentToSeat={vi.fn()}
        onUnassignStudent={vi.fn()}
      />,
    );

    const cell = container.querySelector('.grid-cell');
    expect(cell).not.toBeNull();

    fireEvent.pointerDown(cell as HTMLElement, { clientX: 40, clientY: 40, button: 0 });

    expect(onToggleSeat).not.toHaveBeenCalled();
  });

  it('paints multiple seats while dragging in layout layer', () => {
    const onToggleSeat = vi.fn();

    const { container } = render(
      <GridCanvas
        activeLayer="layout"
        grid={{ width: 6, height: 6, frontEdge: 'bottom' }}
        seats={[]}
        students={[]}
        assignments={[]}
        pairConstraints={[]}
        positionConstraints={[]}
        onToggleSeat={onToggleSeat}
        onAddPairConstraint={vi.fn()}
        onAddPositionConstraint={vi.fn()}
        onMoveStudentToSeat={vi.fn()}
        onUnassignStudent={vi.fn()}
      />,
    );

    const canvas = container.querySelector('.grid-canvas');
    expect(canvas).not.toBeNull();

    fireEvent.pointerDown(canvas as HTMLElement, { clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerMove(canvas as HTMLElement, { clientX: 80, clientY: 10, buttons: 1 });
    fireEvent.pointerMove(canvas as HTMLElement, { clientX: 140, clientY: 10, buttons: 1 });
    fireEvent.pointerUp(canvas as HTMLElement);

    expect(onToggleSeat).toHaveBeenCalledTimes(3);
  });
});
