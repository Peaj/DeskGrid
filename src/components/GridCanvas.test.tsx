import { fireEvent, render, screen } from '@testing-library/react';
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

  it('shows pair rule chooser in a popup portal anchored to the canvas', () => {
    const onAddPairConstraint = vi.fn();

    const { container } = render(
      <GridCanvas
        activeLayer="student"
        grid={{ width: 4, height: 2, frontEdge: 'bottom' }}
        seats={[
          { id: 'seat-a', x: 0, y: 0 },
          { id: 'seat-b', x: 2, y: 0 },
        ]}
        students={[
          { id: 'student-a', name: 'Alice' },
          { id: 'student-b', name: 'Bob' },
        ]}
        assignments={[
          { seatId: 'seat-a', studentId: 'student-a' },
          { seatId: 'seat-b', studentId: 'student-b' },
        ]}
        pairConstraints={[]}
        positionConstraints={[]}
        onToggleSeat={vi.fn()}
        onAddPairConstraint={onAddPairConstraint}
        onAddPositionConstraint={vi.fn()}
        onMoveStudentToSeat={vi.fn()}
        onUnassignStudent={vi.fn()}
      />,
    );

    const canvas = container.querySelector('.grid-canvas') as HTMLDivElement | null;
    const studentChips = Array.from(container.querySelectorAll('.student-chip')) as HTMLDivElement[];
    const [sourceChip, targetChip] = studentChips;

    expect(canvas).not.toBeNull();
    expect(sourceChip).toBeDefined();
    expect(targetChip).toBeDefined();

    vi.spyOn(canvas as HTMLDivElement, 'getBoundingClientRect').mockReturnValue({
      x: 24,
      y: 40,
      left: 24,
      top: 40,
      right: 200,
      bottom: 128,
      width: 176,
      height: 88,
      toJSON: () => ({}),
    });

    vi.spyOn(sourceChip, 'getBoundingClientRect').mockReturnValue({
      x: 30,
      y: 46,
      left: 30,
      top: 46,
      right: 68,
      bottom: 84,
      width: 38,
      height: 38,
      toJSON: () => ({}),
    });

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn((x: number) => {
        if (x >= 100) {
          return targetChip;
        }
        return sourceChip;
      }),
    });

    fireEvent.pointerDown(sourceChip, { clientX: 40, clientY: 56, button: 0 });
    fireEvent.pointerMove(window, { clientX: 120, clientY: 56 });
    fireEvent.pointerUp(window, { clientX: 120, clientY: 56 });

    expect(container.querySelector('.constraint-popover')).toBeNull();
    const popup = document.body.querySelector('.constraint-popover');
    expect(screen.getByText('Create pair rule')).toBeInTheDocument();
    expect(popup).toBeInTheDocument();
    expect(popup).toHaveTextContent('Alice');
    expect(popup).toHaveTextContent('Bob');
    expect(onAddPairConstraint).not.toHaveBeenCalled();
  });
});
