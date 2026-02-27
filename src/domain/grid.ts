import type { Assignment, Cell, GridConfig, Seat } from './types';

export function makeSeatId(x: number, y: number): string {
  return `seat:${x},${y}`;
}

export function isCellInBounds(cell: Cell, grid: GridConfig): boolean {
  return cell.x >= 0 && cell.y >= 0 && cell.x < grid.width && cell.y < grid.height;
}

export function hasSeatAt(seats: Seat[], x: number, y: number): boolean {
  return seats.some((seat) => seat.x === x && seat.y === y);
}

export function toggleSeatAt(seats: Seat[], x: number, y: number, grid: GridConfig): Seat[] {
  if (!isCellInBounds({ x, y }, grid)) {
    return seats;
  }

  const existing = seats.find((seat) => seat.x === x && seat.y === y);
  if (existing) {
    return seats.filter((seat) => seat.id !== existing.id);
  }

  return [...seats, { id: makeSeatId(x, y), x, y }];
}

export function cleanupAssignments(assignments: Assignment[], seats: Seat[]): Assignment[] {
  const seatSet = new Set(seats.map((seat) => seat.id));
  const seenStudents = new Set<string>();
  const output: Assignment[] = [];

  for (const assignment of assignments) {
    if (!seatSet.has(assignment.seatId)) {
      continue;
    }
    if (seenStudents.has(assignment.studentId)) {
      continue;
    }
    seenStudents.add(assignment.studentId);
    output.push(assignment);
  }

  return output;
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
