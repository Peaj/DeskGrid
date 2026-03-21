import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearLocalStorageProject,
  loadLayoutFromLocalStorage,
  loadRosterFromLocalStorage,
  saveLayoutToLocalStorage,
  saveRosterToLocalStorage,
  parseLayoutFromJson,
  parseProjectFromJson,
  parseRosterFromJson,
  saveTextFile,
  serializeLayout,
  serializeProject,
  serializeRoster,
} from './persistence';

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker;
});

describe('persistence schema', () => {
  it('serializes and parses layout, roster, and project files with schemaVersion', () => {
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

    const project = {
      schemaVersion: 1 as const,
      layout,
      roster,
    };

    expect(parseLayoutFromJson(serializeLayout(layout))).toEqual(layout);
    expect(parseRosterFromJson(serializeRoster(roster))).toEqual(roster);
    expect(parseProjectFromJson(serializeProject(project))).toEqual(project);
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

  it('uses the browser save file picker when available', async () => {
    const write = vi.fn(async () => {});
    const close = vi.fn(async () => {});
    const showSaveFilePicker = vi.fn(async () => ({
      createWritable: async () => ({ write, close }),
    }));

    Object.assign(window, { showSaveFilePicker });

    await saveTextFile('project.json', '{"ok":true}');

    expect(showSaveFilePicker).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('falls back to download when the save file picker is unavailable', async () => {
    const originalCreateElement = document.createElement.bind(document);
    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    const click = vi.fn();

    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL,
        revokeObjectURL,
      }),
    );
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'a') {
        return {
          click,
          set href(_: string) {},
          set download(_: string) {},
        } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    await saveTextFile('project.json', '{"ok":true}');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
});
