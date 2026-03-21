import { useEffect, useRef, type RefObject } from 'react';
import { LoadIcon, NewProjectIcon, PrivacyIcon, SaveIcon, TrashIcon } from './icons';

type MenuAction = () => void | Promise<void>;

interface TopBarProps {
  appVersion: string;
  repoUrl: string;
  onNewProject: () => void;
  onSaveProject: () => Promise<void>;
  onLoadProject: () => void;
  onClearLocal: () => void;
}

export function TopBar({
  appVersion,
  repoUrl,
  onNewProject,
  onSaveProject,
  onLoadProject,
  onClearLocal,
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

  function runMenuAction(action: MenuAction, menuRef: RefObject<HTMLDetailsElement | null>): void {
    action();
    menuRef.current?.removeAttribute('open');
  }

  const versionBadge = repoUrl ? (
    <a
      className="version-pill version-pill-link"
      href={repoUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open the DeskGrid GitHub repository (version ${appVersion})`}
    >
      v{appVersion}
    </a>
  ) : (
    <span className="version-pill">v{appVersion}</span>
  );

  return (
    <header className="app-bar">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto flex flex-wrap items-center gap-2">
          <h1 className="text-base font-semibold uppercase tracking-[0.08em] text-slate-800">DeskGrid</h1>
          {versionBadge}
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
                auto-save in this browser via <code>localStorage</code> and auto-load the next time you open DeskGrid
                here.
              </p>
              {repoUrl ? (
                <p className="privacy-panel-note">
                  DeskGrid is open source on{' '}
                  <a href={repoUrl} target="_blank" rel="noreferrer">
                    GitHub
                  </a>
                  .
                </p>
              ) : null}
              <ul className="privacy-panel-list">
                <li>No account required</li>
                <li>No cloud sync</li>
                <li>No analytics or tracking</li>
                <li>Import or export project files from the Project menu</li>
              </ul>
              <div className="privacy-panel-actions">
                <button
                  className="app-menu-item text-red-700"
                  onClick={() => runMenuAction(onClearLocal, privacyMenuRef)}
                >
                  <TrashIcon />
                  Clear local storage
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
              <button className="app-menu-item" onClick={() => runMenuAction(onSaveProject, projectMenuRef)}>
                <SaveIcon />
                Save Project
              </button>
              <button className="app-menu-item" onClick={() => runMenuAction(onLoadProject, projectMenuRef)}>
                <LoadIcon />
                Load Project
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
