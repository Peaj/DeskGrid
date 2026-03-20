import { describe, expect, it } from 'vitest';
import {
  clearLocalStorageProject,
  loadLayoutFromLocalStorage,
  loadRosterFromLocalStorage,
  saveLayoutToLocalStorage,
  saveRosterToLocalStorage,
  parseLayoutFromJson,
  parseRosterFromJson,
  serializeLayout,
  serializeRoster,
} from './persistence';

describe('persistence schema', () => {
  it('serializes and parses layout and roster with schemaVersion', () => {
    const layout = {
      schemaVersion: 2 as const,
      grid: { width: 10, height: 8, frontEdge: 'bottom' as const },
      seats: [{ id: 'seat:1,1', x: 1, y: 1 }],
    };

    const roster = {
      schemaVersion: 1 as const,
      students: [{ id: 's1', name: 'A' }],
      pairConstraints: [],
      positionConstraints: [],
      assignments: [],
    };

    expect(parseLayoutFromJson(serializeLayout(layout))).toEqual(layout);
    expect(parseRosterFromJson(serializeRoster(roster))).toEqual(roster);
  });

  it('clears the saved local project without changing storage keys', () => {
    saveLayoutToLocalStorage({
      schemaVersion: 2,
      grid: { width: 12, height: 9, frontEdge: 'bottom' },
      seats: [{ id: 'seat:2,2', x: 2, y: 2 }],
    });

    saveRosterToLocalStorage({
      schemaVersion: 1,
      students: [{ id: 's-1', name: 'Ada' }],
      pairConstraints: [],
      positionConstraints: [],
      assignments: [],
    });

    clearLocalStorageProject();

    expect(loadLayoutFromLocalStorage()).toBeNull();
    expect(loadRosterFromLocalStorage()).toBeNull();
    expect(window.localStorage.getItem('deskgrid.layout.current')).toBeNull();
    expect(window.localStorage.getItem('deskgrid.roster.current')).toBeNull();
  });
});
