import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import type {
  Assignment,
  GridConfig,
  PairConstraint,
  PairConstraintType,
  PositionConstraint,
  PositionConstraintType,
  Seat,
  Student,
} from '../domain/types';
import { ConstraintOverlay } from './ConstraintOverlay';
import { DEFAULT_CELL_SIZE, MAX_CELL_SIZE, MIN_CELL_SIZE } from './gridConstants';

export type GridLayer = 'layout' | 'student';

interface GridCanvasProps {
  activeLayer: GridLayer;
  grid: GridConfig;
  seats: Seat[];
  students: Student[];
  assignments: Assignment[];
  pairConstraints: PairConstraint[];
  positionConstraints: PositionConstraint[];
  onToggleSeat: (x: number, y: number) => void;
  onAddPairConstraint: (studentAId: string, studentBId: string, type: PairConstraintType) => void;
  onAddPositionConstraint: (studentId: string, type: PositionConstraintType) => void;
  onShellWidthChange?: (width: number) => void;
}

interface PendingPair {
  sourceId: string;
  targetId: string;
}

function readDraggedStudentId(event: DragEvent<HTMLElement>): string | null {
  const value = event.dataTransfer.getData('text/student-id');
  return value || null;
}

export function GridCanvas({
  activeLayer,
  grid,
  seats,
  students,
  assignments,
  pairConstraints,
  positionConstraints,
  onToggleSeat,
  onAddPairConstraint,
  onAddPositionConstraint,
  onShellWidthChange,
}: GridCanvasProps) {
  const [pendingPair, setPendingPair] = useState<PendingPair | null>(null);
  const [paintMode, setPaintMode] = useState<'add' | 'remove' | null>(null);
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const panelRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const paintedCellsRef = useRef<Set<string>>(new Set());

  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
  const studentBySeatId = useMemo(() => new Map(assignments.map((item) => [item.seatId, item.studentId])), [assignments]);
  const occupiedCells = useMemo(() => new Set(seats.map((seat) => `${seat.x},${seat.y}`)), [seats]);

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

  const canvasStyle: CSSProperties = {
    width: gridWidth,
    height: gridHeight,
    ['--cell-size' as string]: `${cellSize}px`,
  };
  const shellStyle: CSSProperties = {
    width: gridWidth,
    maxWidth: '100%',
  };

  useEffect(() => {
    onShellWidthChange?.(gridWidth);
  }, [gridWidth, onShellWidthChange]);

  function paintSeatCell(cell: { x: number; y: number }, mode: 'add' | 'remove'): void {
    const key = `${cell.x},${cell.y}`;
    if (paintedCellsRef.current.has(key)) {
      return;
    }
    paintedCellsRef.current.add(key);

    const hasSeat = occupiedCells.has(key);
    if (mode === 'add' && !hasSeat) {
      onToggleSeat(cell.x, cell.y);
      return;
    }

    if (mode === 'remove' && hasSeat) {
      onToggleSeat(cell.x, cell.y);
    }
  }

  useEffect(() => {
    function stopPaintStroke(): void {
      setPaintMode(null);
      paintedCellsRef.current.clear();
    }

    window.addEventListener('pointerup', stopPaintStroke);
    return () => window.removeEventListener('pointerup', stopPaintStroke);
  }, []);

  return (
    <section className="flex min-h-0 flex-col" ref={panelRef}>
      <div className="grid-shell" style={shellStyle}>
        <div
          className={`grid-canvas ${activeLayer === 'student' ? 'student-layer-active' : 'layout-layer-active'}`}
          ref={canvasRef}
          style={canvasStyle}
          onPointerDown={(event) => {
            if (activeLayer !== 'layout') {
              return;
            }
            if (event.button !== 0) {
              return;
            }
            const target = event.target as HTMLElement;
            if (target.closest('.constraint-popover, .drop-anchor')) {
              return;
            }
            const cell = toGridCell(event.clientX, event.clientY);
            if (!cell) {
              return;
            }
            const startMode: 'add' | 'remove' = occupiedCells.has(`${cell.x},${cell.y}`) ? 'remove' : 'add';
            paintedCellsRef.current.clear();
            paintSeatCell(cell, startMode);
            setPaintMode(startMode);
          }}
          onPointerMove={(event) => {
            if (activeLayer !== 'layout' || !paintMode) {
              return;
            }
            if ((event.buttons & 1) !== 1) {
              setPaintMode(null);
              paintedCellsRef.current.clear();
              return;
            }
            const cell = toGridCell(event.clientX, event.clientY);
            if (!cell) {
              return;
            }
            paintSeatCell(cell, paintMode);
          }}
          onPointerUp={() => {
            setPaintMode(null);
            paintedCellsRef.current.clear();
          }}
        >
          <div className="grid-cells" style={{ gridTemplateColumns: `repeat(${grid.width}, ${cellSize}px)` }}>
            {Array.from({ length: grid.width * grid.height }).map((_, index) => (
              <div key={index} className="grid-cell" />
            ))}
          </div>

          {activeLayer === 'student' && (
            <>
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
            </>
          )}

          {seats.map((seat) => {
            const studentId = studentBySeatId.get(seat.id);
            const student = studentId ? studentById.get(studentId) : undefined;

            return (
              <div key={seat.id} className="seat-spot active-seat" style={{ left: seat.x * cellSize, top: seat.y * cellSize }}>
                {student ? (
                  <div
                    className={`student-chip ${activeLayer === 'layout' ? 'readonly' : ''}`}
                    draggable={activeLayer === 'student'}
                    onDragOver={(event) => {
                      if (activeLayer !== 'student') {
                        return;
                      }
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      if (activeLayer !== 'student') {
                        return;
                      }
                      event.preventDefault();
                      const sourceId = readDraggedStudentId(event);
                      if (!sourceId || sourceId === student.id) {
                        return;
                      }
                      setPendingPair({ sourceId, targetId: student.id });
                    }}
                    onDragStart={(event) => {
                      if (activeLayer !== 'student') {
                        event.preventDefault();
                        return;
                      }
                      event.dataTransfer.setData('text/student-id', student.id);
                      event.dataTransfer.effectAllowed = 'copy';
                    }}
                    title={
                      activeLayer === 'student'
                        ? 'Drag to another student for pair rule. Drag to top/bottom anchors for back/front preference.'
                        : 'Seat occupied'
                    }
                  >
                    <span className="student-chip-name">{student.name}</span>
                  </div>
                ) : (
                  <span className="seat-empty">Seat</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
          {activeLayer === 'layout' ? (
            <>
              <span>Click or drag with mouse down to paint seats on/off.</span>
              <span>Use this layer to design the base seat layout.</span>
            </>
          ) : (
            <>
              <span>Base seats are locked in this layer.</span>
              <span>Drag student chips to other students or front/back anchors to set constraints.</span>
            </>
          )}
        </div>
      </div>

      {pendingPair && (
        <div className="constraint-popover mt-2">
          <span>Create pair rule</span>
          <button
            className="ui-btn"
            onClick={() => {
              onAddPairConstraint(pendingPair.sourceId, pendingPair.targetId, 'must_next_to');
              setPendingPair(null);
            }}
          >
            Must sit next to
          </button>
          <button
            className="ui-btn"
            onClick={() => {
              onAddPairConstraint(pendingPair.sourceId, pendingPair.targetId, 'must_not_next_to');
              setPendingPair(null);
            }}
          >
            Must not sit next to
          </button>
          <button className="ui-btn" onClick={() => setPendingPair(null)}>
            Cancel
          </button>
        </div>
      )}
    </section>
  );
}
