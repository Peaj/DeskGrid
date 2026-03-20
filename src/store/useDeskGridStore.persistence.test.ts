import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveLayoutToLocalStorage, saveRosterToLocalStorage } from '../storage/persistence';

describe('DeskGrid store persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetModules();
  });

  it('hydrates the initial store state from local storage', async () => {
    saveLayoutToLocalStorage({
      schemaVersion: 2,
      grid: { width: 8, height: 6, frontEdge: 'bottom' },
      seats: [{ id: 'seat:1,2', x: 1, y: 2 }],
    });

    saveRosterToLocalStorage({
      schemaVersion: 1,
      students: [{ id: 'student-1', name: 'Alice' }],
      pairConstraints: [],
      positionConstraints: [],
      assignments: [{ seatId: 'seat:1,2', studentId: 'student-1' }],
    });

    const { useDeskGridStore } = await import('./useDeskGridStore');
    const state = useDeskGridStore.getState();

    expect(state.grid).toEqual({ width: 8, height: 6, frontEdge: 'bottom' });
    expect(state.seats).toEqual([{ id: 'seat:1,2', x: 1, y: 2 }]);
    expect(state.students).toEqual([{ id: 'student-1', name: 'Alice' }]);
    expect(state.assignments).toEqual([{ seatId: 'seat:1,2', studentId: 'student-1' }]);
    expect(state.unassignedStudentIds).toEqual([]);
    expect(state.notices).toEqual([]);
  });

  it('hydrates available local data even if only the layout exists', async () => {
    saveLayoutToLocalStorage({
      schemaVersion: 2,
      grid: { width: 9, height: 7, frontEdge: 'bottom' },
      seats: [{ id: 'seat:0,0', x: 0, y: 0 }],
    });

    const { useDeskGridStore } = await import('./useDeskGridStore');
    const state = useDeskGridStore.getState();

    expect(state.grid).toEqual({ width: 9, height: 7, frontEdge: 'bottom' });
    expect(state.seats).toEqual([{ id: 'seat:0,0', x: 0, y: 0 }]);
    expect(state.students).toEqual([]);
    expect(state.assignments).toEqual([]);
  });
});
