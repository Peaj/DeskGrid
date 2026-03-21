import { parseLayoutFile, parseProjectFile, projectFileSchema, rosterFileSchema } from '../domain/schema';
import type { LayoutFile, ProjectFile, RosterFile } from '../domain/types';

const LAYOUT_KEY = 'deskgrid.layout.current';
const ROSTER_KEY = 'deskgrid.roster.current';
const JSON_MIME_TYPE = 'application/json';

interface SaveFilePickerOptions {
  id?: string;
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}

interface WritableFileStream {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
}

interface SaveFilePickerHandle {
  createWritable: () => Promise<WritableFileStream>;
}

type SaveFilePicker = (options?: SaveFilePickerOptions) => Promise<SaveFilePickerHandle>;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function safeParse<T>(value: string, parser: (input: unknown) => T): T | null {
  try {
    const json = JSON.parse(value);
    return parser(json);
  } catch {
    return null;
  }
}

export function saveLayoutToLocalStorage(layout: LayoutFile): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
}

export function loadLayoutFromLocalStorage(): LayoutFile | null {
  if (!isBrowser()) {
    return null;
  }
  const raw = window.localStorage.getItem(LAYOUT_KEY);
  if (!raw) {
    return null;
  }
  return safeParse(raw, (input) => parseLayoutFile(input));
}

export function saveRosterToLocalStorage(roster: RosterFile): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
}

export function loadRosterFromLocalStorage(): RosterFile | null {
  if (!isBrowser()) {
    return null;
  }
  const raw = window.localStorage.getItem(ROSTER_KEY);
  if (!raw) {
    return null;
  }
  return safeParse(raw, (input) => rosterFileSchema.parse(input));
}

export function clearLocalStorageProject(): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(LAYOUT_KEY);
  window.localStorage.removeItem(ROSTER_KEY);
}

export function serializeLayout(layout: LayoutFile): string {
  return JSON.stringify(parseLayoutFile(layout), null, 2);
}

export function serializeRoster(roster: RosterFile): string {
  return JSON.stringify(rosterFileSchema.parse(roster), null, 2);
}

export function serializeProject(project: ProjectFile): string {
  return JSON.stringify(projectFileSchema.parse(project), null, 2);
}

export function parseLayoutFromJson(text: string): LayoutFile {
  return parseLayoutFile(JSON.parse(text));
}

export function parseRosterFromJson(text: string): RosterFile {
  return rosterFileSchema.parse(JSON.parse(text));
}

export function parseProjectFromJson(text: string): ProjectFile {
  return parseProjectFile(JSON.parse(text));
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function getSaveFilePicker(): SaveFilePicker | null {
  const picker = (window as Window & { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
  return typeof picker === 'function' ? picker.bind(window) : null;
}

export async function saveTextFile(fileName: string, content: string): Promise<void> {
  if (!isBrowser()) {
    return;
  }
  const blob = new Blob([content], { type: JSON_MIME_TYPE });
  const saveFilePicker = getSaveFilePicker();

  if (saveFilePicker) {
    try {
      const handle = await saveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'JSON files',
            accept: { [JSON_MIME_TYPE]: ['.json'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }
  }

  triggerDownload(blob, fileName);
}
