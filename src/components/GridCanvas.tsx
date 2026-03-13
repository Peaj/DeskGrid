import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
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
  onMoveStudentToSeat: (studentId: string, targetSeatId: string) => void;
  onUnassignStudent: (studentId: string) => void;
  onShellWidthChange?: (width: number) => void;
}

interface PendingPair {
  sourceId: string;
  targetId: string;
}

interface PendingPairPosition {
  left: number;
  top: number;
}

interface ActiveStudentDrag {
  studentId: string;
  sourceSeatId: string | null;
  startClientX: number;
  startClientY: number;
  currentClientX: number;
  currentClientY: number;
  pointerOffsetX: number;
  pointerOffsetY: number;
  tokenWidth: number;
  tokenHeight: number;
}

interface DragHoverTarget {
  seatId: string | null;
  studentId: string | null;
}

interface BenchDragStartEventDetail {
  studentId: string;
  startClientX: number;
  startClientY: number;
  pointerOffsetX: number;
  pointerOffsetY: number;
  tokenWidth: number;
  tokenHeight: number;
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
  onMoveStudentToSeat,
  onUnassignStudent,
  onShellWidthChange,
}: GridCanvasProps) {
  const [pendingPair, setPendingPair] = useState<PendingPair | null>(null);
  const [pendingPairPosition, setPendingPairPosition] = useState<PendingPairPosition | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveStudentDrag | null>(null);
  const [dragHover, setDragHover] = useState<DragHoverTarget>({ seatId: null, studentId: null });
  const [paintMode, setPaintMode] = useState<'add' | 'remove' | null>(null);
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const panelRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const paintedCellsRef = useRef<Set<string>>(new Set());

  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
  const studentBySeatId = useMemo(() => new Map(assignments.map((item) => [item.seatId, item.studentId])), [assignments]);
  const seatByStudentId = useMemo(() => new Map(assignments.map((item) => [item.studentId, item.seatId])), [assignments]);
  const seatById = useMemo(() => new Map(seats.map((seat) => [seat.id, seat])), [seats]);
  const seatByCoord = useMemo(() => new Map(seats.map((seat) => [`${seat.x},${seat.y}`, seat])), [seats]);
  const occupiedCells = useMemo(() => new Set(seats.map((seat) => `${seat.x},${seat.y}`)), [seats]);

  const gridWidth = grid.width * cellSize;
  const gridHeight = grid.height * cellSize;

  function getSeatCenter(seat: Seat): { x: number; y: number } {
    return {
      x: seat.x * cellSize + cellSize / 2,
      y: seat.y * cellSize + cellSize / 2,
    };
  }

  function getPendingPairPosition(pair: PendingPair): PendingPairPosition | null {
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) {
      return null;
    }

    const sourceSeatId = seatByStudentId.get(pair.sourceId);
    const targetSeatId = seatByStudentId.get(pair.targetId);
    if (!sourceSeatId || !targetSeatId) {
      return null;
    }

    const sourceSeat = seatById.get(sourceSeatId);
    const targetSeat = seatById.get(targetSeatId);
    if (!sourceSeat || !targetSeat) {
      return null;
    }

    const sourceCenter = getSeatCenter(sourceSeat);
    const targetCenter = getSeatCenter(targetSeat);

    return {
      left: canvasRect.left + (sourceCenter.x + targetCenter.x) / 2,
      top: canvasRect.top + (sourceCenter.y + targetCenter.y) / 2,
    };
  }

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
  const isDraggingStudent = activeDrag !== null;
  const draggedStudent = activeDrag ? studentById.get(activeDrag.studentId) : undefined;

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

  useEffect(() => {
    if (!isDraggingStudent) {
      return;
    }

    const onPointerMove = (event: PointerEvent): void => {
      const dropTarget = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const targetStudentChip = dropTarget?.closest<HTMLElement>('.student-chip[data-student-id]');
      const targetStudentId = targetStudentChip?.dataset.studentId ?? null;
      const cell = toGridCell(event.clientX, event.clientY);
      const targetSeatId = cell ? seatByCoord.get(`${cell.x},${cell.y}`)?.id ?? null : null;

      setDragHover({
        seatId: targetSeatId,
        studentId: targetStudentId,
      });

      setActiveDrag((current) =>
        current
          ? {
              ...current,
              currentClientX: event.clientX,
              currentClientY: event.clientY,
            }
          : current,
      );
    };

    const onPointerUp = (event: PointerEvent): void => {
      setDragHover({ seatId: null, studentId: null });
      setActiveDrag((current) => {
        if (!current) {
          return current;
        }

        const dropTarget = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
        const anchor = dropTarget?.closest('.drop-anchor');

        if (anchor?.classList.contains('back-anchor')) {
          onAddPositionConstraint(current.studentId, 'prefer_back');
          return null;
        }

        if (anchor?.classList.contains('front-anchor')) {
          onAddPositionConstraint(current.studentId, 'prefer_front');
          return null;
        }

        const targetStudentChip = dropTarget?.closest<HTMLElement>('.student-chip[data-student-id]');
        const targetStudentId = targetStudentChip?.dataset.studentId;
        if (targetStudentId && targetStudentId !== current.studentId) {
          if (current.sourceSeatId === null) {
            const targetSeatId = seatByStudentId.get(targetStudentId);
            if (targetSeatId) {
              onMoveStudentToSeat(current.studentId, targetSeatId);
            }
            return null;
          }
          setPendingPair({ sourceId: current.studentId, targetId: targetStudentId });
          return null;
        }

        const benchDropZone = dropTarget?.closest('.student-bench-dropzone');
        if (benchDropZone) {
          onUnassignStudent(current.studentId);
          return null;
        }

        const cell = toGridCell(event.clientX, event.clientY);
        if (!cell) {
          return null;
        }

        const targetSeat = seatByCoord.get(`${cell.x},${cell.y}`);
        if (!targetSeat || targetSeat.id === current.sourceSeatId) {
          return null;
        }

        onMoveStudentToSeat(current.studentId, targetSeat.id);
        return null;
      });
      window.dispatchEvent(new CustomEvent('deskgrid-stop-student-drag'));
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setDragHover({ seatId: null, studentId: null });
      window.dispatchEvent(new CustomEvent('deskgrid-stop-student-drag'));
    };
  }, [isDraggingStudent, onAddPositionConstraint, onMoveStudentToSeat, onUnassignStudent, seatByCoord, seatByStudentId]);

  useEffect(() => {
    const onBenchDragStart = (event: Event): void => {
      const detail = (event as CustomEvent<BenchDragStartEventDetail>).detail;
      if (!detail) {
        return;
      }
      setPendingPair(null);
      setActiveDrag({
        studentId: detail.studentId,
        sourceSeatId: null,
        startClientX: detail.startClientX,
        startClientY: detail.startClientY,
        currentClientX: detail.startClientX,
        currentClientY: detail.startClientY,
        pointerOffsetX: detail.pointerOffsetX,
        pointerOffsetY: detail.pointerOffsetY,
        tokenWidth: detail.tokenWidth,
        tokenHeight: detail.tokenHeight,
      });
    };

    window.addEventListener('deskgrid-start-student-drag', onBenchDragStart as EventListener);
    return () => window.removeEventListener('deskgrid-start-student-drag', onBenchDragStart as EventListener);
  }, []);

  useEffect(() => {
    if (!pendingPair) {
      setPendingPairPosition(null);
      return;
    }

    const updatePosition = (): void => {
      const nextPosition = getPendingPairPosition(pendingPair);
      if (!nextPosition) {
        setPendingPair(null);
        return;
      }
      setPendingPairPosition(nextPosition);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [cellSize, pendingPair, seatById, seatByStudentId]);

  useEffect(() => {
    if (!pendingPair) {
      return;
    }

    const dismissPendingPair = (): void => setPendingPair(null);
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.constraint-popover')) {
        return;
      }
      dismissPendingPair();
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        dismissPendingPair();
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [pendingPair]);

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
              <div className="drop-anchor back-anchor">Back</div>

              <div className="drop-anchor front-anchor">Front</div>

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
            const isSourceSeat = activeDrag?.sourceSeatId === seat.id;
            const isSeatDropTarget =
              isDraggingStudent && dragHover.studentId === null && dragHover.seatId === seat.id && !isSourceSeat;

            return (
              <div key={seat.id}>
                <div
                  className={`seat-spot active-seat ${isSourceSeat ? 'drag-source-seat' : ''} ${
                    isDraggingStudent ? 'drop-seat-candidate' : ''
                  } ${isSeatDropTarget ? 'drop-seat-hover' : ''}`}
                  style={{ left: seat.x * cellSize, top: seat.y * cellSize }}
                >
                  {student ? null : <span className="seat-empty">Seat</span>}
                </div>

                {student ? (
                  <div
                    className={`student-chip student-seat-chip ${activeLayer === 'layout' ? 'readonly' : ''} ${
                      activeDrag?.studentId === student.id ? 'is-drag-origin' : ''
                    } ${
                      isDraggingStudent && student.id !== activeDrag?.studentId ? 'drop-student-candidate' : ''
                    } ${isDraggingStudent && dragHover.studentId === student.id ? 'drop-student-hover' : ''}`}
                    data-student-id={student.id}
                    style={{ left: seat.x * cellSize + 7, top: seat.y * cellSize + 7 }}
                    onPointerDown={(event) => {
                      if (activeLayer !== 'student') {
                        return;
                      }
                      if (event.button !== 0) {
                        return;
                      }
                      event.preventDefault();
                      setPendingPair(null);
                      const tokenRect = event.currentTarget.getBoundingClientRect();
                      setActiveDrag({
                        studentId: student.id,
                        sourceSeatId: seat.id,
                        startClientX: event.clientX,
                        startClientY: event.clientY,
                        currentClientX: event.clientX,
                        currentClientY: event.clientY,
                        pointerOffsetX: event.clientX - tokenRect.left,
                        pointerOffsetY: event.clientY - tokenRect.top,
                        tokenWidth: tokenRect.width,
                        tokenHeight: tokenRect.height,
                      });
                    }}
                    title={
                      activeLayer === 'student'
                        ? 'Drag to another student for pair rule. Drag to top/bottom anchors for back/front preference.'
                        : 'Seat occupied'
                    }
                  >
                    <span className="student-chip-name">{student.name}</span>
                  </div>
                ) : null}
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
              <span>Drag students between bench and seats, to another student (pair rule), or to front/back anchors.</span>
            </>
          )}
        </div>
      </div>

      {pendingPair && pendingPairPosition &&
        createPortal(
          <div
            className="constraint-popover"
            style={{
              left: pendingPairPosition.left,
              top: pendingPairPosition.top,
            }}
          >
            <div className="constraint-popover-title">Create pair rule</div>
            <div className="constraint-popover-students">
              <span>{studentById.get(pendingPair.sourceId)?.name ?? 'Unknown'}</span>
              <span>+</span>
              <span>{studentById.get(pendingPair.targetId)?.name ?? 'Unknown'}</span>
            </div>
            <div className="constraint-popover-actions">
              <button
                className="ui-btn ui-btn-compact"
                autoFocus
                onClick={() => {
                  onAddPairConstraint(pendingPair.sourceId, pendingPair.targetId, 'must_next_to');
                  setPendingPair(null);
                }}
              >
                Must sit next to
              </button>
              <button
                className="ui-btn ui-btn-compact"
                onClick={() => {
                  onAddPairConstraint(pendingPair.sourceId, pendingPair.targetId, 'must_not_next_to');
                  setPendingPair(null);
                }}
              >
                Must not sit next to
              </button>
              <button className="ui-btn ui-btn-compact" onClick={() => setPendingPair(null)}>
                Cancel
              </button>
            </div>
          </div>,
          document.body,
        )}

      {activeDrag && draggedStudent &&
        createPortal(
          <div
            className="student-chip drag-ghost"
            style={{
              left: activeDrag.currentClientX - activeDrag.pointerOffsetX,
              top: activeDrag.currentClientY - activeDrag.pointerOffsetY,
              width: activeDrag.tokenWidth,
              height: activeDrag.tokenHeight,
            }}
          >
            <span className="student-chip-name">{draggedStudent.name}</span>
          </div>,
          document.body,
        )}
    </section>
  );
}
