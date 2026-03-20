import { useEffect, useRef, type RefObject } from 'react';
import { ExportIcon, LoadIcon, NewProjectIcon, PrivacyIcon, SaveIcon, TrashIcon } from './icons';

interface TopBarProps {
  appVersion: string;
  onNewProject: () => void;
  onSaveLocal: () => void;
  onLoadLocal: () => void;
  onClearLocal: () => void;
  onExportLayout: () => void;
  onExportRoster: () => void;
}

export function TopBar({
  appVersion,
  onNewProject,
  onSaveLocal,
  onLoadLocal,
  onClearLocal,
  onExportLayout,
  onExportRoster,
}: TopBarProps) {
  const projectMenuRef = useRef<HTMLDetailsElement>(null);
  const privacyMenuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeMenus = (): void => {
      projectMenuRef.current?.removeAttribute('open');
      privacyMenuRef.current?.removeAttribute('open');
    };

    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node | null;
      if (
        target &&
        [projectMenuRef.current, privacyMenuRef.current].some((menu) => menu?.contains(target))
      ) {
        return;
      }
      closeMenus();
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        closeMenus();
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  function runMenuAction(action: () => void, menuRef: RefObject<HTMLDetailsElement | null>): void {
    action();
    menuRef.current?.removeAttribute('open');
  }

  return (
    <header className="app-bar">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto flex flex-wrap items-center gap-2">
          <h1 className="text-base font-semibold uppercase tracking-[0.08em] text-slate-800">DeskGrid</h1>
          <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            v{appVersion}
          </span>
          <span className="privacy-pill">
            <PrivacyIcon />
            <span>All data stays on your device</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <details className="app-menu" ref={privacyMenuRef}>
            <summary className="ui-btn">
              <PrivacyIcon />
              Privacy
            </summary>
            <div className="app-menu-panel privacy-panel">
              <div className="privacy-panel-header">
                <div>
                  <p className="privacy-panel-eyebrow">Privacy</p>
                  <h2 className="privacy-panel-title">All data stays on your device</h2>
                </div>
              </div>
              <p className="privacy-panel-copy">
                DeskGrid runs entirely in your browser. Student data, seating plans, constraints, and assignments
                are stored locally in this browser via <code>localStorage</code>.
              </p>
              <ul className="privacy-panel-list">
                <li>No account required</li>
                <li>No cloud sync</li>
                <li>No analytics or tracking</li>
                <li>Clear local data or export project files at any time</li>
              </ul>
              <div className="privacy-panel-actions">
                <button className="app-menu-item" onClick={() => runMenuAction(onSaveLocal, privacyMenuRef)}>
                  <SaveIcon />
                  Save Local
                </button>
                <button className="app-menu-item" onClick={() => runMenuAction(onLoadLocal, privacyMenuRef)}>
                  <LoadIcon />
                  Load Local
                </button>
                <button className="app-menu-item" onClick={() => runMenuAction(onExportLayout, privacyMenuRef)}>
                  <ExportIcon />
                  Export layout.json
                </button>
                <button className="app-menu-item" onClick={() => runMenuAction(onExportRoster, privacyMenuRef)}>
                  <ExportIcon />
                  Export roster.json
                </button>
                <button
                  className="app-menu-item text-red-700"
                  onClick={() => runMenuAction(onClearLocal, privacyMenuRef)}
                >
                  <TrashIcon />
                  Clear Local
                </button>
              </div>
            </div>
          </details>
          <details className="app-menu" ref={projectMenuRef}>
            <summary className="ui-btn">Project</summary>
            <div className="app-menu-panel">
              <button className="app-menu-item" onClick={() => runMenuAction(onNewProject, projectMenuRef)}>
                <NewProjectIcon />
                New Project
              </button>
              <button className="app-menu-item" onClick={() => runMenuAction(onSaveLocal, projectMenuRef)}>
                <SaveIcon />
                Save Local
              </button>
              <button className="app-menu-item" onClick={() => runMenuAction(onLoadLocal, projectMenuRef)}>
                <LoadIcon />
                Load Local
              </button>
              <button className="app-menu-item text-red-700" onClick={() => runMenuAction(onClearLocal, projectMenuRef)}>
                <TrashIcon />
                Clear Local
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
