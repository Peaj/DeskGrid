import { useRef } from 'react';

interface TopBarProps {
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
    <header className="topbar">
      <h1>DeskGrid</h1>
      <div className="toolbar-actions">
        <button onClick={onNewProject}>New</button>
        <button onClick={onSaveLocal}>Save Local</button>
        <button onClick={onLoadLocal}>Load Local</button>
        <button onClick={onClearLocal}>Clear Local</button>
        <button onClick={onExportLayout}>Export layout.json</button>
        <button onClick={onExportRoster}>Export roster.json</button>
        <button onClick={() => layoutInputRef.current?.click()}>Import layout.json</button>
        <button onClick={() => rosterInputRef.current?.click()}>Import roster.json</button>
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
