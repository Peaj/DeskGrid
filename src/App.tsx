import { useRef, useState } from 'react';
import { ConstraintPanel } from './components/ConstraintPanel';
import { GridCanvas } from './components/GridCanvas';
import type { GridLayer } from './components/GridCanvas';
import { SolveControls } from './components/SolveControls';
import { StudentBench } from './components/StudentBench';
import { TopBar } from './components/TopBar';
import { Toolbar } from './components/Toolbar';
import { ImportIcon, LoadIcon, SaveIcon } from './components/icons';
import { useDeskGridStore } from './store/useDeskGridStore';

async function readFileText(file: File): Promise<string> {
  return file.text();
}

export default function App() {
  const appVersion = __APP_VERSION__;
  const [activeLayer, setActiveLayer] = useState<GridLayer>('layout');
  const [gridShellWidth, setGridShellWidth] = useState(0);
  const [hoveredConstraintId, setHoveredConstraintId] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
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
    saveProjectLocal,
    loadProjectLocal,
    clearProjectLocal,
    exportLayoutFile,
    exportRosterFile,
    importLayoutJson,
    importRosterJson,
  } = useDeskGridStore();

  const layoutToolbarActions = [
    {
      id: 'load-layout',
      tooltip: 'Load layout.json',
      icon: <LoadIcon />,
      onClick: () => layoutInputRef.current?.click(),
    },
    {
      id: 'save-layout',
      tooltip: 'Save layout.json',
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
      tooltip: 'Load roster.json',
      icon: <LoadIcon />,
      onClick: () => rosterInputRef.current?.click(),
    },
    {
      id: 'save-roster',
      tooltip: 'Save roster.json',
      icon: <SaveIcon />,
      onClick: exportRosterFile,
    },
  ];

  return (
    <div className="relative isolate min-h-screen p-3 md:p-4">
      <TopBar
        appVersion={appVersion}
        onNewProject={resetProject}
        onSaveLocal={saveProjectLocal}
        onLoadLocal={loadProjectLocal}
        onClearLocal={clearProjectLocal}
      />

      <section className="mt-3">
        <div className="layer-tabs" role="tablist" aria-label="Workspace layer tabs">
          <button
            role="tab"
            aria-selected={activeLayer === 'layout'}
            className={`layer-tab layer-tab-layout ${activeLayer === 'layout' ? 'is-active' : ''}`}
            onClick={() => setActiveLayer('layout')}
          >
            Layout Layer
          </button>
          <button
            role="tab"
            aria-selected={activeLayer === 'student'}
            className={`layer-tab layer-tab-student ${activeLayer === 'student' ? 'is-active' : ''}`}
            onClick={() => setActiveLayer('student')}
          >
            Student Layer
          </button>
        </div>

        <div className={`panel workspace-shell ${activeLayer === 'layout' ? 'mode-layout' : 'mode-student'}`}>
          <Toolbar
            ariaLabel={activeLayer === 'layout' ? 'Layout toolbar' : 'Student toolbar'}
            actions={activeLayer === 'layout' ? layoutToolbarActions : studentToolbarActions}
          />

          <main
            className={`relative z-0 mt-3 grid min-h-0 grid-cols-1 gap-3 ${
              activeLayer === 'student' ? 'xl:grid-cols-[minmax(0,1fr)_minmax(360px,460px)]' : ''
            }`}
          >
            <div className="flex min-h-0 flex-col gap-3">
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

            {activeLayer === 'student' && (
              <aside className="flex h-full min-h-0 flex-col gap-3">
                <SolveControls scoreBreakdown={scoreBreakdown} onRandomAssign={randomAssign} onBenchAllStudents={benchAllStudents} onSolve={solve} />
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
              </aside>
            )}
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

      <section className="mt-3 flex flex-wrap gap-2" aria-live="polite">
        {notices.map((notice, index) => (
          <div
            key={`${notice}-${index}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/95 px-3 py-1.5 text-sm text-slate-700 shadow-sm"
          >
            <span>{notice}</span>
            <button className="ui-btn px-2 py-0.5 text-xs" onClick={() => removeNotice(index)} aria-label="Dismiss message">
              x
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
