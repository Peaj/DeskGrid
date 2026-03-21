import { useEffect, useRef, useState } from 'react';
import { ConstraintPanel } from './components/ConstraintPanel';
import { GridCanvas } from './components/GridCanvas';
import type { GridLayer } from './components/GridCanvas';
import { MAX_CELL_SIZE } from './components/gridConstants';
import { LayoutSidebar } from './components/LayoutSidebar';
import { PrintableLayout } from './components/PrintableLayout';
import { SolveControls } from './components/SolveControls';
import { StudentBench } from './components/StudentBench';
import { TopBar } from './components/TopBar';
import { ToastStack } from './components/ToastStack';
import { Toolbar } from './components/Toolbar';
import { DeskLayerIcon, ImportIcon, LoadIcon, SaveIcon, StudentPortraitIcon } from './components/icons';
import { applyPrintPageStyle, getPrintOrientation, type PrintTone } from './print';
import { useDeskGridStore } from './store/useDeskGridStore';

async function readFileText(file: File): Promise<string> {
  return file.text();
}

const ACTIVE_LAYER_STORAGE_KEY = 'deskgrid.active-layer';

function parseLayerHash(hash: string): GridLayer | null {
  const normalized = hash.replace(/^#/, '').toLowerCase();
  if (normalized === 'layout' || normalized === 'desk-layer') {
    return 'layout';
  }
  if (normalized === 'student' || normalized === 'student-layer') {
    return 'student';
  }
  return null;
}

function getLayerHash(layer: GridLayer): string {
  return layer === 'layout' ? '#layout' : '#student';
}

function readInitialActiveLayer(): GridLayer {
  if (typeof window === 'undefined') {
    return 'layout';
  }

  const layerFromHash = parseLayerHash(window.location.hash);
  if (layerFromHash) {
    return layerFromHash;
  }

  const storedLayer = window.localStorage.getItem(ACTIVE_LAYER_STORAGE_KEY);
  return storedLayer === 'student' || storedLayer === 'layout' ? storedLayer : 'layout';
}

export default function App() {
  const appVersion = __APP_VERSION__;
  const repoUrl = __REPO_URL__;
  const [activeLayer, setActiveLayer] = useState<GridLayer>(readInitialActiveLayer);
  const [printTone, setPrintTone] = useState<PrintTone>('color');
  const [gridShellWidth, setGridShellWidth] = useState(0);
  const [hoveredConstraintId, setHoveredConstraintId] = useState<string | null>(null);
  const hasSyncedInitialLayerRef = useRef(false);
  const pendingPrintCleanupRef = useRef<(() => void) | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const layoutInputRef = useRef<HTMLInputElement>(null);
  const rosterInputRef = useRef<HTMLInputElement>(null);
  const {
    grid,
    seats,
    students,
    pairConstraints,
    positionConstraints,
    assignments,
    unassignedStudentIds,
    scoreBreakdown,
    notices,
    resetProject,
    toggleSeat,
    importStudentsFromCsvText,
    randomAssign,
    benchAllStudents,
    solve,
    moveStudentToSeat,
    unassignStudent,
    addPairConstraint,
    addPositionConstraint,
    removePairConstraint,
    removePositionConstraint,
    removeNotice,
    clearProjectLocal,
    exportProjectFile,
    importProjectJson,
    exportLayoutFile,
    exportRosterFile,
    importLayoutJson,
    importRosterJson,
  } = useDeskGridStore();

  const layoutToolbarActions = [
    {
      id: 'load-layout',
      tooltip: 'Load Layout',
      icon: <LoadIcon />,
      onClick: () => layoutInputRef.current?.click(),
    },
    {
      id: 'save-layout',
      tooltip: 'Save Layout',
      icon: <SaveIcon />,
      onClick: exportLayoutFile,
    },
  ];

  const studentToolbarActions = [
    {
      id: 'import-students',
      tooltip: 'Import students.csv',
      icon: <ImportIcon />,
      onClick: () => csvInputRef.current?.click(),
    },
    {
      id: 'load-roster',
      tooltip: 'Load Roster',
      icon: <LoadIcon />,
      onClick: () => rosterInputRef.current?.click(),
    },
    {
      id: 'save-roster',
      tooltip: 'Save Roster',
      icon: <SaveIcon />,
      onClick: exportRosterFile,
    },
  ];
  const toolbarHelperText =
    activeLayer === 'layout'
      ? 'Click or drag to paint or delete seats'
      : 'Drag students between bench and seats, to another student (pair rule), or to front/back anchors';
  const printOrientation = getPrintOrientation(grid);

  useEffect(() => {
    return () => {
      pendingPrintCleanupRef.current?.();
      pendingPrintCleanupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const applyLayerFromHash = (): void => {
      const layerFromHash = parseLayerHash(window.location.hash);
      if (layerFromHash) {
        setActiveLayer((current) => (current === layerFromHash ? current : layerFromHash));
      }
    };

    window.addEventListener('hashchange', applyLayerFromHash);
    return () => window.removeEventListener('hashchange', applyLayerFromHash);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_LAYER_STORAGE_KEY, activeLayer);

    const targetHash = getLayerHash(activeLayer);
    if (window.location.hash === targetHash) {
      hasSyncedInitialLayerRef.current = true;
      return;
    }

    const nextUrl = `${window.location.pathname}${window.location.search}${targetHash}`;
    if (!hasSyncedInitialLayerRef.current) {
      window.history.replaceState(null, '', nextUrl);
      hasSyncedInitialLayerRef.current = true;
      return;
    }

    window.location.hash = targetHash;
  }, [activeLayer]);

  function handleOpenPrintPreview(): void {
    pendingPrintCleanupRef.current?.();
    pendingPrintCleanupRef.current = applyPrintPageStyle(printOrientation);

    const cleanupAfterPrint = (): void => {
      pendingPrintCleanupRef.current?.();
      pendingPrintCleanupRef.current = null;
    };

    window.addEventListener('afterprint', cleanupAfterPrint, { once: true });
    window.print();
  }

  return (
    <div className="app-root relative isolate min-h-screen p-3 md:p-4">
      <div className="app-shell-screen">
        <TopBar
          appVersion={appVersion}
          repoUrl={repoUrl}
          printTone={printTone}
          canPrint={seats.length > 0}
          onPrintToneChange={setPrintTone}
          onOpenPrintPreview={handleOpenPrintPreview}
          onNewProject={resetProject}
          onSaveProject={exportProjectFile}
          onLoadProject={() => projectInputRef.current?.click()}
          onClearLocal={clearProjectLocal}
        />

        <section className={`mt-3 workspace-stage ${activeLayer === 'layout' ? 'mode-layout' : 'mode-student'}`}>
          <div className="layer-tabs" role="tablist" aria-label="Workspace layer tabs">
            <button
              role="tab"
              aria-selected={activeLayer === 'layout'}
              className={`layer-tab layer-tab-layout ${activeLayer === 'layout' ? 'is-active' : ''}`}
              onClick={() => setActiveLayer('layout')}
            >
              <DeskLayerIcon className="layer-tab-icon" />
              <span>Desk Layer</span>
            </button>
            <button
              role="tab"
              aria-selected={activeLayer === 'student'}
              className={`layer-tab layer-tab-student ${activeLayer === 'student' ? 'is-active' : ''}`}
              onClick={() => setActiveLayer('student')}
            >
              <StudentPortraitIcon className="layer-tab-icon" />
              <span>Student Layer</span>
            </button>
          </div>

          <div className="panel workspace-shell" style={{ ['--workspace-grid-max-width' as string]: `${grid.width * MAX_CELL_SIZE}px` }}>
            <Toolbar
              ariaLabel={activeLayer === 'layout' ? 'Desk toolbar' : 'Student toolbar'}
              actions={activeLayer === 'layout' ? layoutToolbarActions : studentToolbarActions}
              helperText={toolbarHelperText}
            />

            <main className="workspace-main relative z-0 mt-3 flex min-h-0 flex-col gap-3 xl:flex-row xl:items-start">
              <div className="flex min-h-0 min-w-0 flex-col gap-3 xl:flex-1">
                <GridCanvas
                  activeLayer={activeLayer}
                  grid={grid}
                  seats={seats}
                  students={students}
                  assignments={assignments}
                  pairConstraints={pairConstraints}
                  positionConstraints={positionConstraints}
                  onToggleSeat={toggleSeat}
                  onAddPairConstraint={addPairConstraint}
                  onAddPositionConstraint={addPositionConstraint}
                  onMoveStudentToSeat={moveStudentToSeat}
                  onUnassignStudent={unassignStudent}
                  onShellWidthChange={setGridShellWidth}
                  hoveredConstraintId={hoveredConstraintId}
                  onHoveredConstraintChange={setHoveredConstraintId}
                />
                {activeLayer === 'student' && (
                  <div className="grid-shell" style={{ width: gridShellWidth || undefined, maxWidth: '100%' }}>
                    <StudentBench
                      students={students}
                      unassignedStudentIds={unassignedStudentIds}
                      onImportCsvText={importStudentsFromCsvText}
                    />
                  </div>
                )}
              </div>

              <aside className="workspace-sidebar flex h-full min-h-0 flex-col gap-3">
                {activeLayer === 'layout' ? (
                  <LayoutSidebar grid={grid} seats={seats} students={students} />
                ) : (
                  <>
                    <SolveControls
                      scoreBreakdown={scoreBreakdown}
                      onRandomAssign={randomAssign}
                      onBenchAllStudents={benchAllStudents}
                      onSolve={solve}
                    />
                    <ConstraintPanel
                      grid={grid}
                      seats={seats}
                      assignments={assignments}
                      students={students}
                      pairConstraints={pairConstraints}
                      positionConstraints={positionConstraints}
                      onRemovePairConstraint={removePairConstraint}
                      onRemovePositionConstraint={removePositionConstraint}
                      hoveredConstraintId={hoveredConstraintId}
                      onHoveredConstraintChange={setHoveredConstraintId}
                    />
                  </>
                )}
              </aside>
            </main>
          </div>
        </section>

        <input
          hidden
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={async (event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            if (!file) {
              return;
            }
            importStudentsFromCsvText(await readFileText(file));
            input.value = '';
          }}
        />

        <input
          hidden
          ref={projectInputRef}
          type="file"
          accept="application/json"
          onChange={async (event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            if (!file) {
              return;
            }
            importProjectJson(await readFileText(file));
            input.value = '';
          }}
        />

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
            importLayoutJson(await readFileText(file));
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
            importRosterJson(await readFileText(file));
            input.value = '';
          }}
        />

        <ToastStack notices={notices} onDismiss={removeNotice} />
      </div>

      <PrintableLayout
        grid={grid}
        seats={seats}
        students={students}
        assignments={assignments}
        tone={printTone}
        orientation={printOrientation}
        repoUrl={repoUrl}
      />
    </div>
  );
}
