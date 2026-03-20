import { beforeEach, describe, expect, it } from 'vitest';
import { useDeskGridStore } from './useDeskGridStore';

beforeEach(() => {
  window.localStorage.clear();
  useDeskGridStore.setState({
    grid: { width: 14, height: 10, frontEdge: 'bottom' },
    seats: [],
    students: [],
    pairConstraints: [],
    positionConstraints: [],
    assignments: [],
    unassignedStudentIds: [],
    hardViolations: [],
    scoreBreakdown: { hardViolations: 0, softPenalty: 0, totalPenalty: 0 },
    notices: [],
  });
});

describe('DeskGrid store', () => {
  it('random assignment leaves overflow students unassigned', () => {
    const store = useDeskGridStore.getState();
    store.toggleSeat(0, 0);

    useDeskGridStore.setState({
      students: [
        { id: 's1', name: 'A' },
        { id: 's2', name: 'B' },
        { id: 's3', name: 'C' },
      ],
    });

    useDeskGridStore.getState().randomAssign();

    const next = useDeskGridStore.getState();
    expect(next.assignments).toHaveLength(1);
    expect(next.unassignedStudentIds).toHaveLength(2);
  });

  it('swaps students when dropping onto an occupied seat', () => {
    useDeskGridStore.setState({
      seats: [
        { id: 'seat:0,0', x: 0, y: 0 },
        { id: 'seat:1,0', x: 1, y: 0 },
      ],
      students: [
        { id: 's1', name: 'A' },
        { id: 's2', name: 'B' },
      ],
      assignments: [
        { seatId: 'seat:0,0', studentId: 's1' },
        { seatId: 'seat:1,0', studentId: 's2' },
      ],
    });

    useDeskGridStore.getState().moveStudentToSeat('s1', 'seat:1,0');

    const next = useDeskGridStore.getState();
    const bySeat = new Map(next.assignments.map((entry) => [entry.seatId, entry.studentId]));

    expect(bySeat.get('seat:0,0')).toBe('s2');
    expect(bySeat.get('seat:1,0')).toBe('s1');
  });

  it('places unassigned student onto occupied seat and moves displaced student to bench', () => {
    useDeskGridStore.setState({
      seats: [
        { id: 'seat:0,0', x: 0, y: 0 },
        { id: 'seat:1,0', x: 1, y: 0 },
      ],
      students: [
        { id: 's1', name: 'A' },
        { id: 's2', name: 'B' },
        { id: 's3', name: 'C' },
      ],
      assignments: [
        { seatId: 'seat:0,0', studentId: 's1' },
        { seatId: 'seat:1,0', studentId: 's2' },
      ],
      unassignedStudentIds: ['s3'],
    });

    useDeskGridStore.getState().moveStudentToSeat('s3', 'seat:1,0');

    const next = useDeskGridStore.getState();
    const bySeat = new Map(next.assignments.map((entry) => [entry.seatId, entry.studentId]));

    expect(bySeat.get('seat:0,0')).toBe('s1');
    expect(bySeat.get('seat:1,0')).toBe('s3');
    expect(next.unassignedStudentIds).toContain('s2');
  });

  it('moves seated student back to bench', () => {
    useDeskGridStore.setState({
      seats: [{ id: 'seat:0,0', x: 0, y: 0 }],
      students: [
        { id: 's1', name: 'A' },
        { id: 's2', name: 'B' },
      ],
      assignments: [{ seatId: 'seat:0,0', studentId: 's1' }],
    });

    useDeskGridStore.getState().unassignStudent('s1');

    const next = useDeskGridStore.getState();
    expect(next.assignments).toHaveLength(0);
    expect(next.unassignedStudentIds).toContain('s1');
  });

  it('benches all students and resets solver state', () => {
    useDeskGridStore.setState({
      seats: [
        { id: 'seat:0,0', x: 0, y: 0 },
        { id: 'seat:1,0', x: 1, y: 0 },
      ],
      students: [
        { id: 's1', name: 'A' },
        { id: 's2', name: 'B' },
      ],
      assignments: [
        { seatId: 'seat:0,0', studentId: 's1' },
        { seatId: 'seat:1,0', studentId: 's2' },
      ],
      hardViolations: [{ constraintId: 'pair:1', message: 'Conflict' }],
      scoreBreakdown: { hardViolations: 1, softPenalty: 4, totalPenalty: 14 },
    });

    useDeskGridStore.getState().benchAllStudents();

    const next = useDeskGridStore.getState();
    expect(next.assignments).toHaveLength(0);
    expect(next.unassignedStudentIds).toEqual(['s1', 's2']);
    expect(next.hardViolations).toHaveLength(0);
    expect(next.scoreBreakdown).toEqual({ hardViolations: 0, softPenalty: 0, totalPenalty: 0 });
  });
});
