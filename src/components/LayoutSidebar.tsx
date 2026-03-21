import type { GridConfig, Seat, Student } from '../domain/types';
import { DeskLayerIcon, StudentPortraitIcon } from './icons';

interface LayoutSidebarProps {
  grid: GridConfig;
  seats: Seat[];
  students: Student[];
}

export function LayoutSidebar({ grid, seats, students }: LayoutSidebarProps) {
  const totalCells = grid.width * grid.height;
  const seatCount = seats.length;
  const openFloorCount = Math.max(0, totalCells - seatCount);
  const coverage = totalCells === 0 ? 0 : Math.round((seatCount / totalCells) * 100);
  const studentCount = students.length;
  const seatDelta = seatCount - studentCount;
  const seatBalanceText =
    studentCount === 0
      ? 'No roster loaded yet.'
      : seatDelta === 0
        ? 'Seat count matches the roster.'
        : seatDelta > 0
          ? `${seatDelta} more seat${seatDelta === 1 ? '' : 's'} than students.`
          : `${Math.abs(seatDelta)} more student${Math.abs(seatDelta) === 1 ? '' : 's'} than seats.`;

  return (
    <>
      <section className="panel flex flex-col gap-2.5">
        <div className="panel-header">
          <h3 className="panel-section-title section-title-with-icon">
            <DeskLayerIcon />
            <span>Layout</span>
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2">
          <div className="solver-stat-card">
            <span className="solver-stat-label">Grid</span>
            <strong className="solver-stat-value">
              {grid.width} x {grid.height}
            </strong>
          </div>
          <div className="solver-stat-card">
            <span className="solver-stat-label">Seats</span>
            <strong className="solver-stat-value">{seatCount}</strong>
          </div>
          <div className="solver-stat-card">
            <span className="solver-stat-label">Open Floor</span>
            <strong className="solver-stat-value">{openFloorCount}</strong>
          </div>
          <div className="solver-stat-card">
            <span className="solver-stat-label">Coverage</span>
            <strong className="solver-stat-value">{coverage}%</strong>
          </div>
        </div>
        <p className="meta m-0">Paint seats directly on the grid. Drag across empty cells to add seats, or across existing seats to delete them.</p>
      </section>

      <section className="panel flex flex-col gap-2.5">
        <div className="panel-header">
          <h3 className="panel-section-title section-title-with-icon">
            <StudentPortraitIcon />
            <span>Next Step</span>
          </h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <p className="m-0 text-sm font-semibold text-slate-700">{seatBalanceText}</p>
          <p className="mt-1 text-sm text-slate-500">Switch to Student Layer when the room is ready to import a roster, add rules, and generate a seating plan.</p>
        </div>
        <div className="grid gap-2">
          <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Load or save layouts</span> from the toolbar while you iterate on the room shape.
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-700">Roster loaded:</span> {studentCount === 0 ? 'not yet' : `${studentCount} student${studentCount === 1 ? '' : 's'}`}
          </div>
        </div>
      </section>
    </>
  );
}
