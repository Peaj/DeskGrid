import { DndContext } from '@dnd-kit/core';
import { ConstraintPanel } from './components/ConstraintPanel';
import { GridCanvas } from './components/GridCanvas';
import { RosterPanel } from './components/RosterPanel';
import { SolveControls } from './components/SolveControls';
import { TopBar } from './components/TopBar';
import { useDeskGridStore } from './store/useDeskGridStore';

export default function App() {
  const {
    grid,
    tables,
    students,
    pairConstraints,
    positionConstraints,
    assignments,
    selectedTableId,
    unassignedStudentIds,
    hardViolations,
    scoreBreakdown,
    notices,
    resetProject,
    addTableAt,
    moveTable,
    rotateTable,
    deleteTable,
    setSelectedTable,
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
    <DndContext>
      <div className="app-shell">
        <TopBar
          onNewProject={resetProject}
          onSaveLocal={saveProjectLocal}
          onLoadLocal={loadProjectLocal}
          onClearLocal={clearProjectLocal}
          onExportLayout={exportLayoutFile}
          onExportRoster={exportRosterFile}
          onImportLayout={importLayoutJson}
          onImportRoster={importRosterJson}
        />

        <main className="workspace">
          <RosterPanel
            students={students}
            unassignedStudentIds={unassignedStudentIds}
            onImportCsvText={importStudentsFromCsvText}
          />

          <GridCanvas
            grid={grid}
            tables={tables}
            students={students}
            assignments={assignments}
            pairConstraints={pairConstraints}
            positionConstraints={positionConstraints}
            selectedTableId={selectedTableId}
            onAddTable={addTableAt}
            onMoveTable={moveTable}
            onRotateTable={rotateTable}
            onDeleteTable={deleteTable}
            onSelectTable={setSelectedTable}
            onAddPairConstraint={addPairConstraint}
            onAddPositionConstraint={addPositionConstraint}
          />

          <aside className="right-column">
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

        <section className="notice-area" aria-live="polite">
          {notices.map((notice, index) => (
            <div key={`${notice}-${index}`} className="notice">
              <span>{notice}</span>
              <button onClick={() => removeNotice(index)} aria-label="Dismiss message">
                x
              </button>
            </div>
          ))}
        </section>
      </div>
    </DndContext>
  );
}
