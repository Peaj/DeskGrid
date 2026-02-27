export type FrontEdge = 'bottom';
export type TableOrientation = 'horizontal' | 'vertical';

export interface GridConfig {
  width: number;
  height: number;
  frontEdge: FrontEdge;
}

export interface Cell {
  x: number;
  y: number;
}

export interface Table {
  id: string;
  anchor: Cell;
  orientation: TableOrientation;
}

export interface Seat {
  id: string;
  x: number;
  y: number;
  tableId: string;
}

export interface Student {
  id: string;
  name: string;
}

export interface Assignment {
  seatId: string;
  studentId: string;
}

export type PairConstraintType = 'must_next_to' | 'must_not_next_to';

export interface PairConstraint {
  id: string;
  type: PairConstraintType;
  studentAId: string;
  studentBId: string;
  hard: true;
}

export type PositionConstraintType = 'prefer_front' | 'prefer_back';

export interface PositionConstraint {
  id: string;
  type: PositionConstraintType;
  studentId: string;
  hard: false;
}

export interface ScoreBreakdown {
  hardViolations: number;
  softPenalty: number;
  totalPenalty: number;
}

export interface HardViolation {
  constraintId: string;
  message: string;
}

export interface SolveResult {
  assignments: Assignment[];
  hardViolations: HardViolation[];
  scoreBreakdown: ScoreBreakdown;
  unassignedStudentIds: string[];
}

export interface SolveInput {
  grid: GridConfig;
  seats: Seat[];
  students: Student[];
  pairConstraints: PairConstraint[];
  positionConstraints: PositionConstraint[];
  previousAssignments?: Assignment[];
  seed?: number;
}

export interface LayoutFile {
  schemaVersion: number;
  grid: GridConfig;
  tables: Table[];
}

export interface RosterFile {
  schemaVersion: number;
  students: Student[];
  pairConstraints: PairConstraint[];
  positionConstraints: PositionConstraint[];
  assignments: Assignment[];
}
