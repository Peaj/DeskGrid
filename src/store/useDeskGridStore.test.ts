import { beforeEach, describe, expect, it } from 'vitest';
import { useDeskGridStore } from './useDeskGridStore';

beforeEach(() => {
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
});
