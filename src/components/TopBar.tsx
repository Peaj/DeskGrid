import { useEffect, useRef, type RefObject } from 'react';
import type { PrintTone } from '../print';
import { FeedbackIcon, GitHubIcon, LoadIcon, NewProjectIcon, PrivacyIcon, PrintIcon, SaveIcon, TrashIcon } from './icons';

type MenuAction = () => void | Promise<void>;
const FEEDBACK_EMAIL = 'deskgrid@peaj.de';

interface TopBarProps {
  appVersion: string;
  repoUrl: string;
  printTone: PrintTone;
  canPrint: boolean;
  onPrintToneChange: (tone: PrintTone) => void;
  onOpenPrintPreview: () => void;
  onNewProject: () => void;
  onSaveProject: () => Promise<void>;
  onLoadProject: () => void;
  onClearLocal: () => void;
}

export function TopBar({
  appVersion,
  repoUrl,
  printTone,
  canPrint,
  onPrintToneChange,
  onOpenPrintPreview,
  onNewProject,
  onSaveProject,
  onLoadProject,
  onClearLocal,
}: TopBarProps) {
  const feedbackMenuRef = useRef<HTMLDetailsElement>(null);
  const projectMenuRef = useRef<HTMLDetailsElement>(null);
  const privacyMenuRef = useRef<HTMLDetailsElement>(null);
  const printMenuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeMenus = (): void => {
      feedbackMenuRef.current?.removeAttribute('open');
      projectMenuRef.current?.removeAttribute('open');
      privacyMenuRef.current?.removeAttribute('open');
      printMenuRef.current?.removeAttribute('open');
    };

    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node | null;
      if (
        target &&
        [feedbackMenuRef.current, projectMenuRef.current, privacyMenuRef.current, printMenuRef.current].some((menu) =>
          menu?.contains(target),
        )
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

  function closeMenu(menuRef: RefObject<HTMLDetailsElement | null>): void {
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
  const feedbackBody =
    typeof window === 'undefined'
      ? `App version: v${appVersion}\n\nFeedback:\n`
      : `App version: v${appVersion}\nPage: ${window.location.href}\n\nFeedback:\n`;
  const feedbackHref = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
    `DeskGrid Feedback (v${appVersion})`,
  )}&body=${encodeURIComponent(feedbackBody)}`;
  const githubFeedbackHref = repoUrl ? `${repoUrl}/issues/new/choose` : '';

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
          <details className="app-menu" ref={feedbackMenuRef}>
            <summary className="ui-btn">
              <FeedbackIcon />
              Feedback
            </summary>
            <div className="app-menu-panel feedback-menu-panel">
              {githubFeedbackHref ? (
                <a
                  className="app-menu-item"
                  href={githubFeedbackHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open GitHub issue creation"
                  onClick={() => closeMenu(feedbackMenuRef)}
                >
                  <GitHubIcon />
                  GitHub
                </a>
              ) : null}
              <a
                className="app-menu-item"
                href={feedbackHref}
                aria-label="Send feedback by email"
                onClick={() => closeMenu(feedbackMenuRef)}
              >
                <FeedbackIcon />
                E-Mail
              </a>
            </div>
          </details>
          <details className="app-menu" ref={printMenuRef}>
            <summary className="ui-btn">
              <PrintIcon />
              Print
            </summary>
            <div className="app-menu-panel print-menu-panel">
              <div className="print-menu-section">
                <p className="print-menu-label">Print style</p>
                <div className="print-tone-options" role="group" aria-label="Print style">
                  <button
                    className={`app-menu-item print-tone-option ${printTone === 'color' ? 'is-active' : ''}`}
                    aria-pressed={printTone === 'color'}
                    onClick={() => onPrintToneChange('color')}
                  >
                    <PrintIcon />
                    Color
                  </button>
                  <button
                    className={`app-menu-item print-tone-option ${printTone === 'bw' ? 'is-active' : ''}`}
                    aria-pressed={printTone === 'bw'}
                    onClick={() => onPrintToneChange('bw')}
                  >
                    <PrintIcon />
                    Black &amp; White
                  </button>
                </div>
              </div>
              <button
                className="app-menu-item"
                disabled={!canPrint}
                onClick={() => runMenuAction(onOpenPrintPreview, printMenuRef)}
              >
                <PrintIcon />
                Open Print Preview
              </button>
            </div>
          </details>
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
            <summary className="ui-btn">
              <NewProjectIcon />
              Project
            </summary>
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
