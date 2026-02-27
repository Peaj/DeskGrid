import { describe, expect, it } from 'vitest';
import { evaluateStateForDebug, generateInitialAssignment, solveSeating } from './index';
import type { PairConstraint, PositionConstraint, Seat, Student } from '../domain/types';

const seats: Seat[] = [
  { id: 'a', x: 0, y: 0, tableId: 't1' },
  { id: 'b', x: 1, y: 0, tableId: 't1' },
  { id: 'c', x: 0, y: 1, tableId: 't2' },
  { id: 'd', x: 1, y: 1, tableId: 't2' },
];

const students: Student[] = [
  { id: 's1', name: 'A' },
  { id: 's2', name: 'B' },
  { id: 's3', name: 'C' },
  { id: 's4', name: 'D' },
];

const noPosition: PositionConstraint[] = [];

describe('solver', () => {
  it('returns unique seat and student assignments', () => {
    const result = solveSeating({
      grid: { width: 2, height: 2, frontEdge: 'bottom' },
      seats,
      students,
      pairConstraints: [],
      positionConstraints: noPosition,
      seed: 42,
    });

    const seatIds = result.assignments.map((item) => item.seatId);
    const studentIds = result.assignments.map((item) => item.studentId);

    expect(new Set(seatIds).size).toBe(seatIds.length);
    expect(new Set(studentIds).size).toBe(studentIds.length);
  });

  it('satisfies hard pair constraints when solvable', () => {
    const constraints: PairConstraint[] = [
      { id: 'p1', type: 'must_next_to', studentAId: 's1', studentBId: 's2', hard: true },
    ];

    const result = solveSeating({
      grid: { width: 2, height: 2, frontEdge: 'bottom' },
      seats,
      students,
      pairConstraints: constraints,
      positionConstraints: noPosition,
      seed: 1,
    });

    expect(result.hardViolations).toHaveLength(0);
  });

  it('reports hard conflicts for unsatisfiable constraints', () => {
    const constraints: PairConstraint[] = [
      { id: 'p1', type: 'must_next_to', studentAId: 's1', studentBId: 's2', hard: true },
    ];

    const result = solveSeating({
      grid: { width: 1, height: 1, frontEdge: 'bottom' },
      seats: [{ id: 'only', x: 0, y: 0, tableId: 't1' }],
      students: students.slice(0, 2),
      pairConstraints: constraints,
      positionConstraints: noPosition,
      seed: 7,
    });

    expect(result.hardViolations.length).toBeGreaterThan(0);
  });

  it('improves total penalty from initial random state', () => {
    const pairConstraints: PairConstraint[] = [
      { id: 'p1', type: 'must_next_to', studentAId: 's1', studentBId: 's2', hard: true },
    ];
    const positionConstraints: PositionConstraint[] = [
      { id: 'pp1', type: 'prefer_front', studentId: 's1', hard: false },
      { id: 'pp2', type: 'prefer_back', studentId: 's2', hard: false },
    ];

    const initial = generateInitialAssignment(students, seats, 12);
    const initialScore = evaluateStateForDebug(
      initial.assignments,
      seats,
      students,
      pairConstraints,
      positionConstraints,
      2,
    );

    const solved = solveSeating({
      grid: { width: 2, height: 2, frontEdge: 'bottom' },
      seats,
      students,
      pairConstraints,
      positionConstraints,
      previousAssignments: initial.assignments,
      seed: 12,
    });

    expect(solved.scoreBreakdown.totalPenalty).toBeLessThanOrEqual(initialScore.totalPenalty);
  });
});
