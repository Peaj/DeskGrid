import { beforeEach, describe, expect, it } from 'vitest';
import { useDeskGridStore } from './useDeskGridStore';

beforeEach(() => {
  useDeskGridStore.setState({
    grid: { width: 14, height: 10, frontEdge: 'bottom' },
    tables: [],
    students: [],
    pairConstraints: [],
    positionConstraints: [],
    assignments: [],
    selectedTableId: undefined,
    unassignedStudentIds: [],
    hardViolations: [],
    scoreBreakdown: { hardViolations: 0, softPenalty: 0, totalPenalty: 0 },
    notices: [],
  });
});

describe('DeskGrid store', () => {
  it('random assignment leaves overflow students unassigned', () => {
    const store = useDeskGridStore.getState();
    store.addTableAt(0, 0);

    useDeskGridStore.setState({
      students: [
        { id: 's1', name: 'A' },
        { id: 's2', name: 'B' },
        { id: 's3', name: 'C' },
      ],
    });

    useDeskGridStore.getState().randomAssign();

    const next = useDeskGridStore.getState();
    expect(next.assignments).toHaveLength(2);
    expect(next.unassignedStudentIds).toHaveLength(1);
  });
});
