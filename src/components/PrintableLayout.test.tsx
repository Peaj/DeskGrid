import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrintableLayout } from './PrintableLayout';

describe('PrintableLayout', () => {
  it('renders assigned student names inside printable seats', () => {
    render(
      <PrintableLayout
        grid={{ width: 2, height: 2, frontEdge: 'bottom' }}
        seats={[
          { id: 'seat-a', x: 0, y: 0 },
          { id: 'seat-b', x: 1, y: 1 },
        ]}
        students={[
          { id: 's1', name: 'Alice Example' },
          { id: 's2', name: 'Bob Example' },
        ]}
        assignments={[
          { seatId: 'seat-a', studentId: 's1' },
          { seatId: 'seat-b', studentId: 's2' },
        ]}
        tone="color"
        orientation="portrait"
        repoUrl="https://github.com/Peaj/DeskGrid"
      />,
    );

    expect(screen.getByText('Alice Example')).toBeInTheDocument();
    expect(screen.getByText('Bob Example')).toBeInTheDocument();
  });

  it('keeps front/back orientation labels but omits rule UI', () => {
    render(
      <PrintableLayout
        grid={{ width: 2, height: 1, frontEdge: 'bottom' }}
        seats={[{ id: 'seat-a', x: 0, y: 0 }]}
        students={[{ id: 's1', name: 'Alice Example' }]}
        assignments={[{ seatId: 'seat-a', studentId: 's1' }]}
        tone="bw"
        orientation="landscape"
        repoUrl="https://github.com/Peaj/DeskGrid"
      />,
    );

    expect(screen.getByTestId('print-back-label')).toHaveTextContent('Back');
    expect(screen.getByTestId('print-front-label')).toHaveTextContent('Front');
    expect(screen.queryByText('Must sit next to')).toBeNull();
  });

  it('renders empty seats when there are no assignments', () => {
    render(
      <PrintableLayout
        grid={{ width: 2, height: 2, frontEdge: 'bottom' }}
        seats={[
          { id: 'seat-a', x: 0, y: 0 },
          { id: 'seat-b', x: 1, y: 0 },
        ]}
        students={[]}
        assignments={[]}
        tone="color"
        orientation="portrait"
        repoUrl="https://github.com/Peaj/DeskGrid"
      />,
    );

    expect(screen.getAllByTestId('print-seat')).toHaveLength(2);
    expect(screen.queryByText('Seat')).toBeNull();
  });

  it('renders the DeskGrid footer with the project url', () => {
    render(
      <PrintableLayout
        grid={{ width: 1, height: 1, frontEdge: 'bottom' }}
        seats={[{ id: 'seat-a', x: 0, y: 0 }]}
        students={[]}
        assignments={[]}
        tone="color"
        orientation="portrait"
        repoUrl="https://github.com/Peaj/DeskGrid"
      />,
    );

    expect(screen.getByTestId('print-footer')).toHaveTextContent('Created with DESKGRID');
    expect(screen.getByRole('link', { name: 'https://github.com/Peaj/DeskGrid' })).toHaveAttribute(
      'href',
      'https://github.com/Peaj/DeskGrid',
    );
  });
});
