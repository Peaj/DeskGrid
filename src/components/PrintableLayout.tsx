import type { CSSProperties } from 'react';
import type { Assignment, GridConfig, Seat, Student } from '../domain/types';
import type { PrintOrientation, PrintTone } from '../print';

interface PrintableLayoutProps {
  grid: GridConfig;
  seats: Seat[];
  students: Student[];
  assignments: Assignment[];
  tone: PrintTone;
  orientation: PrintOrientation;
  repoUrl?: string;
}

const PRINT_PAGE_DIMENSIONS_MM: Record<PrintOrientation, { width: number; height: number; padding: number }> = {
  portrait: { width: 190, height: 277, padding: 8 },
  landscape: { width: 277, height: 190, padding: 8 },
};

const LABEL_BAND_MM = 8;
const FOOTER_BAND_MM = 10;
const CONTENT_GAP_MM = 3;

export function PrintableLayout({ grid, seats, students, assignments, tone, orientation, repoUrl }: PrintableLayoutProps) {
  const dimensions = PRINT_PAGE_DIMENSIONS_MM[orientation];
  const printableWidth = dimensions.width - dimensions.padding * 2;
  const printableHeight =
    dimensions.height - dimensions.padding * 2 - LABEL_BAND_MM * 2 - FOOTER_BAND_MM - CONTENT_GAP_MM * 3;
  const cellSize = Math.min(printableWidth / Math.max(grid.width, 1), printableHeight / Math.max(grid.height, 1));
  const studentById = new Map(students.map((student) => [student.id, student]));
  const studentIdBySeatId = new Map(assignments.map((assignment) => [assignment.seatId, assignment.studentId]));
  const seatByCoord = new Map(seats.map((seat) => [`${seat.x},${seat.y}`, seat]));
  const pageStyle: CSSProperties = {
    width: `${dimensions.width}mm`,
    height: `${dimensions.height}mm`,
    padding: `${dimensions.padding}mm`,
  };

  const gridStyle: CSSProperties = {
    width: `${grid.width * cellSize}mm`,
    height: `${grid.height * cellSize}mm`,
    gridTemplateColumns: `repeat(${grid.width}, ${cellSize}mm)`,
    gridTemplateRows: `repeat(${grid.height}, ${cellSize}mm)`,
  };

  return (
    <div className="print-root" data-testid="print-root" data-print-tone={tone} data-print-orientation={orientation}>
      <section
        aria-label="Printable seating layout"
        className={`print-page print-page-${orientation} print-tone-${tone}`}
        data-testid="printable-layout"
        style={pageStyle}
      >
        <div className="print-orientation-label" data-testid="print-back-label">
          Back
        </div>
        <div className="print-layout-frame" data-testid="print-layout-frame">
          <div className="print-layout-grid" style={gridStyle}>
            {Array.from({ length: grid.width * grid.height }).map((_, index) => {
              const x = index % grid.width;
              const y = Math.floor(index / grid.width);
              const seat = seatByCoord.get(`${x},${y}`);
              const studentId = seat ? studentIdBySeatId.get(seat.id) : undefined;
              const studentName = studentId ? studentById.get(studentId)?.name ?? studentId : '';

              return (
                <div
                  key={`${x}-${y}`}
                  className={seat ? 'print-seat' : 'print-gap'}
                  data-testid={seat ? 'print-seat' : undefined}
                >
                  {seat ? <span className="print-seat-name">{studentName}</span> : null}
                </div>
              );
            })}
          </div>
        </div>
        <div className="print-orientation-label print-front-label" data-testid="print-front-label">
          Front
        </div>
        <footer className="print-footer" data-testid="print-footer">
          <span>Created with DESKGRID</span>
          {repoUrl ? (
            <a href={repoUrl} target="_blank" rel="noreferrer">
              {repoUrl}
            </a>
          ) : null}
        </footer>
      </section>
    </div>
  );
}
