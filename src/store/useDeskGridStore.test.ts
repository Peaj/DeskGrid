import { beforeEach, describe, expect, it } from 'vitest';
import { useDeskGridStore } from './useDeskGridStore';

function noticeMessages(): string[] {
  return useDeskGridStore.getState().notices.map((notice) => notice.message);
}

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
      pairConstraints: [{ id: 'pair:1', type: 'must_not_next_to', studentAId: 's1', studentBId: 's2', hard: true }],
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
    expect(next.hardViolations).toHaveLength(1);
    expect(next.scoreBreakdown.hardViolations).toBe(1);
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

  it('benches all students and recalculates solver state', () => {
    useDeskGridStore.setState({
      seats: [
        { id: 'seat:0,0', x: 0, y: 0 },
        { id: 'seat:1,0', x: 1, y: 0 },
      ],
      students: [
        { id: 's1', name: 'A' },
        { id: 's2', name: 'B' },
      ],
      pairConstraints: [{ id: 'pair:1', type: 'must_next_to', studentAId: 's1', studentBId: 's2', hard: true }],
      positionConstraints: [{ id: 'pos:1', studentId: 's1', type: 'prefer_front', hard: false }],
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
    expect(next.hardViolations).toEqual([{ constraintId: 'pair:1', message: 'A and/or B is unassigned.' }]);
    expect(next.scoreBreakdown).toEqual({ hardViolations: 1, softPenalty: 10, totalPenalty: 100010 });
  });

  it('starts a new project by resetting state and clearing local storage', () => {
    window.localStorage.setItem('deskgrid.layout.current', '{"stale":true}');
    window.localStorage.setItem('deskgrid.roster.current', '{"stale":true}');

    useDeskGridStore.setState({
      seats: [{ id: 'seat:0,0', x: 0, y: 0 }],
      students: [{ id: 's1', name: 'A' }],
      assignments: [{ seatId: 'seat:0,0', studentId: 's1' }],
      notices: [],
    });

    useDeskGridStore.getState().resetProject();

    const next = useDeskGridStore.getState();
    expect(next.seats).toEqual([]);
    expect(next.students).toEqual([]);
    expect(next.assignments).toEqual([]);
    expect(noticeMessages()).toEqual(['Started a new project.']);
    expect(window.localStorage.getItem('deskgrid.layout.current')).toBeNull();
    expect(window.localStorage.getItem('deskgrid.roster.current')).toBeNull();
  });

  it('imports the layout section when loading a full project file through load layout', () => {
    useDeskGridStore.setState({
      students: [{ id: 's1', name: 'A' }],
      assignments: [{ seatId: 'seat:9,9', studentId: 's1' }],
    });

    useDeskGridStore.getState().importLayoutJson(
      JSON.stringify({
        schemaVersion: 1,
        layout: {
          schemaVersion: 2,
          grid: { width: 8, height: 6, frontEdge: 'bottom' },
          seats: [{ id: 'seat:1,1', x: 1, y: 1 }],
        },
        roster: {
          schemaVersion: 1,
          students: [{ id: 's1', name: 'A' }],
          pairConstraints: [],
          positionConstraints: [],
          assignments: [{ seatId: 'seat:1,1', studentId: 's1' }],
        },
      }),
    );

    const next = useDeskGridStore.getState();
    expect(next.grid).toEqual({ width: 8, height: 6, frontEdge: 'bottom' });
    expect(next.seats).toEqual([{ id: 'seat:1,1', x: 1, y: 1 }]);
    expect(next.assignments).toEqual([]);
    expect(noticeMessages()).toEqual(['Imported layout.']);
  });

  it('imports the roster section when loading a full project file through load roster', () => {
    useDeskGridStore.setState({
      seats: [{ id: 'seat:2,2', x: 2, y: 2 }],
    });

    useDeskGridStore.getState().importRosterJson(
      JSON.stringify({
        schemaVersion: 1,
        layout: {
          schemaVersion: 2,
          grid: { width: 10, height: 8, frontEdge: 'bottom' },
          seats: [{ id: 'seat:2,2', x: 2, y: 2 }],
        },
        roster: {
          schemaVersion: 1,
          students: [{ id: 's2', name: 'B' }],
          pairConstraints: [],
          positionConstraints: [{ id: 'pos-1', studentId: 's2', type: 'prefer_front', hard: false }],
          assignments: [{ seatId: 'seat:2,2', studentId: 's2' }],
        },
      }),
    );

    const next = useDeskGridStore.getState();
    expect(next.students).toEqual([{ id: 's2', name: 'B' }]);
    expect(next.positionConstraints).toEqual([{ id: 'pos-1', studentId: 's2', type: 'prefer_front', hard: false }]);
    expect(next.assignments).toEqual([{ seatId: 'seat:2,2', studentId: 's2' }]);
    expect(next.unassignedStudentIds).toEqual([]);
    expect(noticeMessages()).toEqual(['Imported roster.']);
  });
});
