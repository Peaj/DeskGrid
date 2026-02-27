import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import { generateSeats } from '../domain/grid';
import type {
  Assignment,
  GridConfig,
  PairConstraint,
  PairConstraintType,
  PositionConstraint,
  PositionConstraintType,
  Seat,
  Student,
  Table,
} from '../domain/types';
import { ConstraintOverlay } from './ConstraintOverlay';
import { DEFAULT_CELL_SIZE, MAX_CELL_SIZE, MIN_CELL_SIZE } from './gridConstants';

interface GridCanvasProps {
  grid: GridConfig;
  tables: Table[];
  students: Student[];
  assignments: Assignment[];
  pairConstraints: PairConstraint[];
  positionConstraints: PositionConstraint[];
  selectedTableId?: string;
  onAddTable: (x: number, y: number) => void;
  onMoveTable: (tableId: string, x: number, y: number) => void;
  onRotateTable: (tableId: string) => void;
  onDeleteTable: (tableId: string) => void;
  onSelectTable: (tableId?: string) => void;
  onAddPairConstraint: (studentAId: string, studentBId: string, type: PairConstraintType) => void;
  onAddPositionConstraint: (studentId: string, type: PositionConstraintType) => void;
}

interface PendingPair {
  sourceId: string;
  targetId: string;
}

interface DragState {
  tableId: string;
  offsetX: number;
  offsetY: number;
}

function readDraggedStudentId(event: DragEvent<HTMLElement>): string | null {
  const value = event.dataTransfer.getData('text/student-id');
  return value || null;
}

export function GridCanvas({
  grid,
  tables,
  students,
  assignments,
  pairConstraints,
  positionConstraints,
  selectedTableId,
  onAddTable,
  onMoveTable,
  onRotateTable,
  onDeleteTable,
  onSelectTable,
  onAddPairConstraint,
  onAddPositionConstraint,
}: GridCanvasProps) {
  const [pendingPair, setPendingPair] = useState<PendingPair | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const panelRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const seats = useMemo(() => generateSeats(tables), [tables]);
  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
  const studentBySeatId = useMemo(() => new Map(assignments.map((item) => [item.seatId, item.studentId])), [assignments]);

  const gridWidth = grid.width * cellSize;
  const gridHeight = grid.height * cellSize;

  function toGridCell(clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }

    const x = Math.floor((clientX - rect.left) / cellSize);
    const y = Math.floor((clientY - rect.top) / cellSize);

    if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) {
      return null;
    }

    return { x, y };
  }

  useEffect(() => {
    const panelElement = panelRef.current;
    if (!panelElement) {
      return;
    }

    const measure = (): void => {
      const availableWidth = Math.max(0, panelElement.clientWidth - 4);
      const computed = Math.floor(availableWidth / grid.width);
      const nextCellSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, computed));
      setCellSize((current) => (current === nextCellSize ? current : nextCellSize));
    };

    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        measure();
      });
      observer.observe(panelElement);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [grid.width]);

  useEffect(() => {
    if (!dragState) {
      return;
    }
    const activeDrag = dragState;

    function onPointerMove(event: PointerEvent): void {
      const cell = toGridCell(event.clientX, event.clientY);
      if (!cell) {
        return;
      }

      onMoveTable(activeDrag.tableId, cell.x - activeDrag.offsetX, cell.y - activeDrag.offsetY);
    }

    function onPointerUp(): void {
      setDragState(null);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [dragState, onMoveTable]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (!selectedTableId) {
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        onDeleteTable(selectedTableId);
      }
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        onRotateTable(selectedTableId);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onDeleteTable, onRotateTable, selectedTableId]);

  const canvasStyle: CSSProperties = {
    width: gridWidth,
    height: gridHeight,
    ['--cell-size' as string]: `${cellSize}px`,
  };

  return (
    <section className="grid-panel" ref={panelRef}>
      <div className="grid-help">
        <span>Click empty cell: add table</span>
        <span>Drag table: move</span>
        <span>Double-click table or press R: rotate</span>
        <span>Delete table: Del</span>
      </div>

      {pendingPair && (
        <div className="constraint-popover">
          <span>Create pair rule</span>
          <button
            onClick={() => {
              onAddPairConstraint(pendingPair.sourceId, pendingPair.targetId, 'must_next_to');
              setPendingPair(null);
            }}
          >
            Must sit next to
          </button>
          <button
            onClick={() => {
              onAddPairConstraint(pendingPair.sourceId, pendingPair.targetId, 'must_not_next_to');
              setPendingPair(null);
            }}
          >
            Must not sit next to
          </button>
          <button onClick={() => setPendingPair(null)}>Cancel</button>
        </div>
      )}

      <div
        className="grid-canvas"
        ref={canvasRef}
        style={canvasStyle}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('.table, .seat-spot, .drop-anchor, .constraint-popover')) {
            return;
          }
          const cell = toGridCell(event.clientX, event.clientY);
          if (!cell) {
            return;
          }
          onAddTable(cell.x, cell.y);
        }}
      >
        <div className="grid-cells" style={{ gridTemplateColumns: `repeat(${grid.width}, ${cellSize}px)` }}>
          {Array.from({ length: grid.width * grid.height }).map((_, index) => (
            <div key={index} className="grid-cell" />
          ))}
        </div>

        <div
          className="drop-anchor back-anchor"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const studentId = readDraggedStudentId(event);
            if (!studentId) {
              return;
            }
            onAddPositionConstraint(studentId, 'prefer_back');
          }}
        >
          Back
        </div>

        <div
          className="drop-anchor front-anchor"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const studentId = readDraggedStudentId(event);
            if (!studentId) {
              return;
            }
            onAddPositionConstraint(studentId, 'prefer_front');
          }}
        >
          Front
        </div>

        <ConstraintOverlay
          width={gridWidth}
          height={gridHeight}
          cellSize={cellSize}
          seats={seats}
          assignments={assignments}
          pairConstraints={pairConstraints}
          positionConstraints={positionConstraints}
        />

        {tables.map((table) => {
          const width = table.orientation === 'horizontal' ? cellSize * 2 : cellSize;
          const height = table.orientation === 'horizontal' ? cellSize : cellSize * 2;
          const selected = selectedTableId === table.id;

          return (
            <div
              key={table.id}
              className={`table ${selected ? 'selected' : ''}`}
              style={{
                left: table.anchor.x * cellSize,
                top: table.anchor.y * cellSize,
                width,
                height,
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelectTable(table.id);
              }}
              onDoubleClick={(event) => {
                event.stopPropagation();
                onRotateTable(table.id);
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                const cell = toGridCell(event.clientX, event.clientY);
                if (!cell) {
                  return;
                }
                setDragState({
                  tableId: table.id,
                  offsetX: Math.max(0, cell.x - table.anchor.x),
                  offsetY: Math.max(0, cell.y - table.anchor.y),
                });
              }}
            >
              <span className="table-label">{table.orientation === 'horizontal' ? '2x1' : '1x2'}</span>
            </div>
          );
        })}

        {seats.map((seat: Seat) => {
          const studentId = studentBySeatId.get(seat.id);
          const student = studentId ? studentById.get(studentId) : undefined;

          return (
            <div key={seat.id} className="seat-spot" style={{ left: seat.x * cellSize, top: seat.y * cellSize }}>
              {student ? (
                <div
                  className="student-chip"
                  draggable
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const sourceId = readDraggedStudentId(event);
                    if (!sourceId || sourceId === student.id) {
                      return;
                    }
                    setPendingPair({ sourceId, targetId: student.id });
                  }}
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/student-id', student.id);
                    event.dataTransfer.effectAllowed = 'copy';
                  }}
                  title="Drag to another student for pair rule. Drag to top/bottom anchors for back/front preference."
                >
                  <span className="drag-handle">::</span>
                  <span>{student.name}</span>
                </div>
              ) : (
                <span className="seat-empty">Empty</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
