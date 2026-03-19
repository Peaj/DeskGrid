import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConstraintOverlay } from './ConstraintOverlay';

describe('ConstraintOverlay', () => {
  it('renders adjacent pair constraints as straight paths', () => {
    const { container } = render(
      <svg>
        <ConstraintOverlay
          width={180}
          height={120}
          cellSize={60}
          seats={[
            { id: 'seat-a', x: 0, y: 1 },
            { id: 'seat-b', x: 1, y: 1 },
          ]}
          assignments={[
            { seatId: 'seat-a', studentId: 'student-a' },
            { seatId: 'seat-b', studentId: 'student-b' },
          ]}
          pairConstraints={[
            {
              id: 'pair-1',
              type: 'must_next_to',
              studentAId: 'student-a',
              studentBId: 'student-b',
              hard: true,
            },
          ]}
          positionConstraints={[]}
        />
      </svg>,
    );

    const pairPath = container.querySelector('.pair-next');
    expect(pairPath?.tagName.toLowerCase()).toBe('path');
    expect(pairPath).toHaveAttribute('d');
    expect(pairPath?.getAttribute('d')).toContain('L');
    expect(pairPath?.getAttribute('d')).not.toContain('Q');
    expect(container.querySelector('[aria-label="Together rule"]')).toBeInTheDocument();
  });

  it('renders pair constraints as curved paths', () => {
    const { container } = render(
      <svg>
        <ConstraintOverlay
          width={240}
          height={180}
          cellSize={60}
          seats={[
            { id: 'seat-a', x: 0, y: 1 },
            { id: 'seat-b', x: 3, y: 1 },
          ]}
          assignments={[
            { seatId: 'seat-a', studentId: 'student-a' },
            { seatId: 'seat-b', studentId: 'student-b' },
          ]}
          pairConstraints={[
            {
              id: 'pair-1',
              type: 'must_not_next_to',
              studentAId: 'student-a',
              studentBId: 'student-b',
              hard: true,
            },
          ]}
          positionConstraints={[]}
        />
      </svg>,
    );

    const pairPath = container.querySelector('.pair-not-next');
    expect(pairPath?.tagName.toLowerCase()).toBe('path');
    expect(pairPath).toHaveAttribute('d');
    expect(pairPath?.getAttribute('d')).toContain('Q');
    expect(container.querySelector('[aria-label="Avoid rule"]')).toBeInTheDocument();
  });

  it('renders position rule icons on the line midpoint', () => {
    const { container } = render(
      <svg>
        <ConstraintOverlay
          width={240}
          height={180}
          cellSize={60}
          seats={[{ id: 'seat-a', x: 1, y: 1 }]}
          assignments={[{ seatId: 'seat-a', studentId: 'student-a' }]}
          pairConstraints={[]}
          positionConstraints={[
            {
              id: 'position-1',
              type: 'prefer_front',
              studentId: 'student-a',
              hard: false,
            },
          ]}
        />
      </svg>,
    );

    expect(container.querySelector('[aria-label="Front preference"]')).toBeInTheDocument();
  });
});
