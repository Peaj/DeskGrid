import { describe, expect, it } from 'vitest';
import {
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
});
