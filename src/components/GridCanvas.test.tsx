import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GridCanvas } from './GridCanvas';

describe('GridCanvas', () => {
  it('adds a table when clicking empty canvas cell', () => {
    const onAddTable = vi.fn();

    const { container } = render(
      <GridCanvas
        grid={{ width: 6, height: 6, frontEdge: 'bottom' }}
        tables={[]}
        students={[]}
        assignments={[]}
        pairConstraints={[]}
        positionConstraints={[]}
        onAddTable={onAddTable}
        onMoveTable={vi.fn()}
        onRotateTable={vi.fn()}
        onDeleteTable={vi.fn()}
        onSelectTable={vi.fn()}
        onAddPairConstraint={vi.fn()}
        onAddPositionConstraint={vi.fn()}
      />,
    );

    const canvas = container.querySelector('.grid-canvas');
    expect(canvas).not.toBeNull();

    fireEvent.click(canvas as HTMLElement, { clientX: 120, clientY: 120 });

    expect(onAddTable).toHaveBeenCalled();
  });

  it('adds a table when clicking a rendered grid cell', () => {
    const onAddTable = vi.fn();

    const { container } = render(
      <GridCanvas
        grid={{ width: 6, height: 6, frontEdge: 'bottom' }}
        tables={[]}
        students={[]}
        assignments={[]}
        pairConstraints={[]}
        positionConstraints={[]}
        onAddTable={onAddTable}
        onMoveTable={vi.fn()}
        onRotateTable={vi.fn()}
        onDeleteTable={vi.fn()}
        onSelectTable={vi.fn()}
        onAddPairConstraint={vi.fn()}
        onAddPositionConstraint={vi.fn()}
      />,
    );

    const cell = container.querySelector('.grid-cell');
    expect(cell).not.toBeNull();

    fireEvent.click(cell as HTMLElement, { clientX: 40, clientY: 40 });

    expect(onAddTable).toHaveBeenCalled();
  });
});
