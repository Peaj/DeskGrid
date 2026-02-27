import { describe, expect, it } from 'vitest';
import { buildSeatGraph, toggleSeatAt } from './grid';

describe('grid utilities', () => {
  it('toggles single seats on/off by cell', () => {
    const grid = { width: 5, height: 4, frontEdge: 'bottom' as const };
    const first = toggleSeatAt([], 2, 1, grid);
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ x: 2, y: 1 });

    const second = toggleSeatAt(first, 2, 1, grid);
    expect(second).toHaveLength(0);
  });

  it('classifies orthogonal and diagonal neighbors', () => {
    const seats = [
      { id: 'a', x: 1, y: 1 },
      { id: 'b', x: 2, y: 1 },
      { id: 'c', x: 2, y: 2 },
    ];

    const graph = buildSeatGraph(seats);
    expect(graph.get('a')?.orthogonal).toContain('b');
    expect(graph.get('a')?.diagonal).toContain('c');
  });
});
