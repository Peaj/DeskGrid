import { useEffect, useRef } from 'react';
import { LoadIcon, NewProjectIcon, SaveIcon, TrashIcon } from './icons';

interface TopBarProps {
  appVersion: string;
  onNewProject: () => void;
  onSaveLocal: () => void;
  onLoadLocal: () => void;
  onClearLocal: () => void;
}

export function TopBar({
  appVersion,
  onNewProject,
  onSaveLocal,
  onLoadLocal,
  onClearLocal,
}: TopBarProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeMenu = (): void => {
      menuRef.current?.removeAttribute('open');
    };

    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node | null;
      if (target && menuRef.current?.contains(target)) {
        return;
      }
      closeMenu();
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  function runMenuAction(action: () => void): void {
    action();
    menuRef.current?.removeAttribute('open');
  }

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
          <details className="app-menu" ref={menuRef}>
            <summary className="ui-btn">Project</summary>
            <div className="app-menu-panel">
              <button className="app-menu-item" onClick={() => runMenuAction(onNewProject)}>
                <NewProjectIcon />
                New Project
              </button>
              <button className="app-menu-item" onClick={() => runMenuAction(onSaveLocal)}>
                <SaveIcon />
                Save Local
              </button>
              <button className="app-menu-item" onClick={() => runMenuAction(onLoadLocal)}>
                <LoadIcon />
                Load Local
              </button>
              <button className="app-menu-item text-red-700" onClick={() => runMenuAction(onClearLocal)}>
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
