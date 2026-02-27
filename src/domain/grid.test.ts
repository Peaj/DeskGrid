import { describe, expect, it } from 'vitest';
import { buildSeatGraph, generateSeats, getTableCells } from './grid';
import type { Table } from './types';

describe('grid utilities', () => {
  it('generates seat cells from table orientation', () => {
    const tables: Table[] = [
      { id: 't1', anchor: { x: 2, y: 1 }, orientation: 'horizontal' },
      { id: 't2', anchor: { x: 0, y: 0 }, orientation: 'vertical' },
    ];

    const seats = generateSeats(tables);
    const coords = seats.map((seat) => `${seat.x},${seat.y}`).sort();
    expect(coords).toEqual(['0,0', '0,1', '2,1', '3,1']);

    expect(getTableCells(tables[1])).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ]);
  });

  it('classifies orthogonal and diagonal neighbors', () => {
    const seats = [
      { id: 'a', x: 1, y: 1, tableId: 't1' },
      { id: 'b', x: 2, y: 1, tableId: 't2' },
      { id: 'c', x: 2, y: 2, tableId: 't3' },
    ];

    const graph = buildSeatGraph(seats);
    expect(graph.get('a')?.orthogonal).toContain('b');
    expect(graph.get('a')?.diagonal).toContain('c');
  });
});
