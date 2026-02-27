import { ConstraintPanel } from './components/ConstraintPanel';
import { GridCanvas } from './components/GridCanvas';
import { RosterPanel } from './components/RosterPanel';
import { SolveControls } from './components/SolveControls';
import { TopBar } from './components/TopBar';
import { useDeskGridStore } from './store/useDeskGridStore';

export default function App() {
  const appVersion = __APP_VERSION__;
  const {
    grid,
    seats,
    students,
    pairConstraints,
    positionConstraints,
    assignments,
    unassignedStudentIds,
    hardViolations,
    scoreBreakdown,
    notices,
    resetProject,
    toggleSeat,
    importStudentsFromCsvText,
    randomAssign,
    solve,
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

  return (
    <div className="relative isolate min-h-screen p-3 md:p-4">
      <TopBar
        appVersion={appVersion}
        onNewProject={resetProject}
        onSaveLocal={saveProjectLocal}
        onLoadLocal={loadProjectLocal}
        onClearLocal={clearProjectLocal}
        onExportLayout={exportLayoutFile}
        onExportRoster={exportRosterFile}
        onImportLayout={importLayoutJson}
        onImportRoster={importRosterJson}
      />

      <main className="relative z-0 mt-3 grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(220px,260px)_1fr_minmax(250px,320px)]">
        <RosterPanel
          students={students}
          unassignedStudentIds={unassignedStudentIds}
          onImportCsvText={importStudentsFromCsvText}
        />

        <GridCanvas
          grid={grid}
          seats={seats}
          students={students}
          assignments={assignments}
          pairConstraints={pairConstraints}
          positionConstraints={positionConstraints}
          onToggleSeat={toggleSeat}
          onAddPairConstraint={addPairConstraint}
          onAddPositionConstraint={addPositionConstraint}
        />

        <aside className="flex min-h-0 flex-col gap-3">
          <SolveControls scoreBreakdown={scoreBreakdown} onRandomAssign={randomAssign} onSolve={solve} />
          <ConstraintPanel
            students={students}
            pairConstraints={pairConstraints}
            positionConstraints={positionConstraints}
            hardViolations={hardViolations}
            onRemovePairConstraint={removePairConstraint}
            onRemovePositionConstraint={removePositionConstraint}
          />
        </aside>
      </main>

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
