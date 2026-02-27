import type { Assignment, Cell, GridConfig, Seat, Table } from './types';

function tableCells(table: Table): Cell[] {
  const { x, y } = table.anchor;
  if (table.orientation === 'horizontal') {
    return [
      { x, y },
      { x: x + 1, y },
    ];
  }
  return [
    { x, y },
    { x, y: y + 1 },
  ];
}

export function getTableCells(table: Table): Cell[] {
  return tableCells(table);
}

export function isCellInBounds(cell: Cell, grid: GridConfig): boolean {
  return cell.x >= 0 && cell.y >= 0 && cell.x < grid.width && cell.y < grid.height;
}

export function canPlaceTable(table: Table, tables: Table[], grid: GridConfig, ignoreTableId?: string): boolean {
  const cells = tableCells(table);
  if (!cells.every((cell) => isCellInBounds(cell, grid))) {
    return false;
  }

  const occupied = new Set<string>();
  for (const other of tables) {
    if (other.id === ignoreTableId) {
      continue;
    }
    for (const cell of tableCells(other)) {
      occupied.add(`${cell.x},${cell.y}`);
    }
  }

  return cells.every((cell) => !occupied.has(`${cell.x},${cell.y}`));
}

export function generateSeats(tables: Table[]): Seat[] {
  const seats: Seat[] = [];
  for (const table of tables) {
    for (const cell of tableCells(table)) {
      seats.push({
        id: `${table.id}:${cell.x},${cell.y}`,
        x: cell.x,
        y: cell.y,
        tableId: table.id,
      });
    }
  }
  return seats;
}

export function indexAssignments(assignments: Assignment[]): Map<string, string> {
  return new Map(assignments.map((item) => [item.seatId, item.studentId]));
}

export function buildStudentSeatIndex(assignments: Assignment[]): Map<string, string> {
  return new Map(assignments.map((item) => [item.studentId, item.seatId]));
}

export interface SeatNeighbors {
  orthogonal: string[];
  diagonal: string[];
}

export function buildSeatGraph(seats: Seat[]): Map<string, SeatNeighbors> {
  const byCoord = new Map<string, Seat>();
  for (const seat of seats) {
    byCoord.set(`${seat.x},${seat.y}`, seat);
  }

  const graph = new Map<string, SeatNeighbors>();
  const orthOffsets = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const diagOffsets = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];

  for (const seat of seats) {
    const orthogonal: string[] = [];
    const diagonal: string[] = [];

    for (const [dx, dy] of orthOffsets) {
      const neighbor = byCoord.get(`${seat.x + dx},${seat.y + dy}`);
      if (neighbor) {
        orthogonal.push(neighbor.id);
      }
    }

    for (const [dx, dy] of diagOffsets) {
      const neighbor = byCoord.get(`${seat.x + dx},${seat.y + dy}`);
      if (neighbor) {
        diagonal.push(neighbor.id);
      }
    }

    graph.set(seat.id, { orthogonal, diagonal });
  }

  return graph;
}
