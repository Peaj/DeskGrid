import { CELL_SIZE } from './gridConstants';
import type { Assignment, PairConstraint, PositionConstraint, Seat } from '../domain/types';

interface ConstraintOverlayProps {
  width: number;
  height: number;
  seats: Seat[];
  assignments: Assignment[];
  pairConstraints: PairConstraint[];
  positionConstraints: PositionConstraint[];
}

function seatCenter(seat: Seat): { x: number; y: number } {
  return {
    x: seat.x * CELL_SIZE + CELL_SIZE / 2,
    y: seat.y * CELL_SIZE + CELL_SIZE / 2,
  };
}

export function ConstraintOverlay({
  width,
  height,
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

        const from = seatCenter(seatA);
        const to = seatCenter(seatB);
        const className = constraint.type === 'must_next_to' ? 'pair-next' : 'pair-not-next';

        return (
          <line
            key={constraint.id}
            className={className}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            strokeWidth="3"
          />
        );
      })}

      {positionConstraints.map((constraint) => {
        const seat = seatByStudent.get(constraint.studentId);
        if (!seat) {
          return null;
        }

        const from = seatCenter(seat);
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
