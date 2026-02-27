import { useRef } from 'react';

interface TopBarProps {
  appVersion: string;
  onNewProject: () => void;
  onSaveLocal: () => void;
  onLoadLocal: () => void;
  onClearLocal: () => void;
  onExportLayout: () => void;
  onExportRoster: () => void;
  onImportLayout: (text: string) => void;
  onImportRoster: (text: string) => void;
}

async function readTextFile(file: File): Promise<string> {
  return file.text();
}

export function TopBar({
  appVersion,
  onNewProject,
  onSaveLocal,
  onLoadLocal,
  onClearLocal,
  onExportLayout,
  onExportRoster,
  onImportLayout,
  onImportRoster,
}: TopBarProps) {
  const layoutInputRef = useRef<HTMLInputElement>(null);
  const rosterInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="app-bar">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto flex items-baseline gap-2">
          <h1 className="text-base font-semibold uppercase tracking-[0.08em] text-slate-800">DeskGrid</h1>
          <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            v{appVersion}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <details className="app-menu">
            <summary className="ui-btn">Project</summary>
            <div className="app-menu-panel">
              <button className="app-menu-item" onClick={onNewProject}>
                New Project
              </button>
              <button className="app-menu-item" onClick={onSaveLocal}>
                Save Local
              </button>
              <button className="app-menu-item" onClick={onLoadLocal}>
                Load Local
              </button>
              <button className="app-menu-item text-red-700" onClick={onClearLocal}>
                Clear Local
              </button>
            </div>
          </details>

          <details className="app-menu">
            <summary className="ui-btn">Import / Export</summary>
            <div className="app-menu-panel">
              <button className="app-menu-item" onClick={onExportLayout}>
                Export layout.json
              </button>
              <button className="app-menu-item" onClick={onExportRoster}>
                Export roster.json
              </button>
              <button className="app-menu-item" onClick={() => layoutInputRef.current?.click()}>
                Import layout.json
              </button>
              <button className="app-menu-item" onClick={() => rosterInputRef.current?.click()}>
                Import roster.json
              </button>
            </div>
          </details>
        </div>
      </div>

      <input
        hidden
        ref={layoutInputRef}
        type="file"
        accept="application/json"
        onChange={async (event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];
          if (!file) {
            return;
          }
          onImportLayout(await readTextFile(file));
          input.value = '';
        }}
      />

      <input
        hidden
        ref={rosterInputRef}
        type="file"
        accept="application/json"
        onChange={async (event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];
          if (!file) {
            return;
          }
          onImportRoster(await readTextFile(file));
          input.value = '';
        }}
      />
    </header>
  );
}
