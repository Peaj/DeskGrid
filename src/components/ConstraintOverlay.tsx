import type { Assignment, PairConstraint, PositionConstraint, Seat } from '../domain/types';

interface ConstraintOverlayProps {
  width: number;
  height: number;
  cellSize: number;
  seats: Seat[];
  assignments: Assignment[];
  pairConstraints: PairConstraint[];
  positionConstraints: PositionConstraint[];
}

function seatCenter(seat: Seat, cellSize: number): { x: number; y: number } {
  return {
    x: seat.x * cellSize + cellSize / 2,
    y: seat.y * cellSize + cellSize / 2,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildPairArcPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  width: number,
  height: number,
  cellSize: number,
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 1) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const perpX = -dy / distance;
  const perpY = dx / distance;
  const centerOffsetX = midX - width / 2;
  const centerOffsetY = midY - height / 2;
  const outwardDot = perpX * centerOffsetX + perpY * centerOffsetY;
  const fallbackSign = midY <= height / 2 ? -1 : 1;
  const bendSign = outwardDot === 0 ? fallbackSign : Math.sign(outwardDot);
  const bend = clamp(distance * 0.22, cellSize * 0.4, cellSize * 1.3);
  const padding = cellSize * 0.3;
  const controlX = clamp(midX + perpX * bendSign * bend, padding, width - padding);
  const controlY = clamp(midY + perpY * bendSign * bend, padding, height - padding);

  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
}

export function ConstraintOverlay({
  width,
  height,
  cellSize,
  seats,
  assignments,
  pairConstraints,
  positionConstraints,
}: ConstraintOverlayProps) {
  const seatById = new Map(seats.map((seat) => [seat.id, seat]));
  const seatByStudent = new Map<string, Seat>();

  for (const assignment of assignments) {
    const seat = seatById.get(assignment.seatId);
    if (seat) {
      seatByStudent.set(assignment.studentId, seat);
    }
  }

  return (
    <svg className="constraint-overlay" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {pairConstraints.map((constraint) => {
        const seatA = seatByStudent.get(constraint.studentAId);
        const seatB = seatByStudent.get(constraint.studentBId);
        if (!seatA || !seatB) {
          return null;
        }

        const from = seatCenter(seatA, cellSize);
        const to = seatCenter(seatB, cellSize);
        const className = constraint.type === 'must_next_to' ? 'pair-next' : 'pair-not-next';
        const path = buildPairArcPath(from, to, width, height, cellSize);

        return (
          <g key={constraint.id}>
            <path className="pair-link-underlay" d={path} fill="none" strokeWidth="6" />
            <path className={className} d={path} fill="none" strokeWidth="3.5" />
          </g>
        );
      })}

      {positionConstraints.map((constraint) => {
        const seat = seatByStudent.get(constraint.studentId);
        if (!seat) {
          return null;
        }

        const from = seatCenter(seat, cellSize);
        const to = {
          x: width / 2,
          y: constraint.type === 'prefer_front' ? height - 8 : 8,
        };

        return (
          <line
            key={constraint.id}
            className="position-link"
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}
