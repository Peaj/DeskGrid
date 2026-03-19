import type { ReactNode } from 'react';
import type { Assignment, PairConstraint, PositionConstraint, Seat } from '../domain/types';
import { BackIcon, FrontIcon, NotNextToIcon, PairRuleIcon } from './icons';

interface ConstraintOverlayProps {
  width: number;
  height: number;
  cellSize: number;
  seats: Seat[];
  assignments: Assignment[];
  pairConstraints: PairConstraint[];
  positionConstraints: PositionConstraint[];
  hoveredConstraintId: string | null;
  onHoveredConstraintChange: (constraintId: string | null) => void;
  interactionEnabled: boolean;
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

function areSeatsDirectlyAdjacent(seatA: Seat, seatB: Seat): boolean {
  const deltaX = Math.abs(seatA.x - seatB.x);
  const deltaY = Math.abs(seatA.y - seatB.y);
  return deltaX <= 1 && deltaY <= 1 && (deltaX !== 0 || deltaY !== 0);
}

function getQuadraticMidpoint(
  from: { x: number; y: number },
  control: { x: number; y: number },
  to: { x: number; y: number },
): { x: number; y: number } {
  return {
    x: 0.25 * from.x + 0.5 * control.x + 0.25 * to.x,
    y: 0.25 * from.y + 0.5 * control.y + 0.25 * to.y,
  };
}

function getPairGeometry(
  seatA: Seat,
  seatB: Seat,
  from: { x: number; y: number },
  to: { x: number; y: number },
  width: number,
  height: number,
  cellSize: number,
): { path: string; midpoint: { x: number; y: number } } {
  const straightMidpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 1 || areSeatsDirectlyAdjacent(seatA, seatB)) {
    return {
      path: `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
      midpoint: straightMidpoint,
    };
  }

  const midX = straightMidpoint.x;
  const midY = straightMidpoint.y;
  const perpX = -dy / distance;
  const perpY = dx / distance;
  const centerOffsetX = midX - width / 2;
  const centerOffsetY = midY - height / 2;
  const outwardDot = perpX * centerOffsetX + perpY * centerOffsetY;
  const fallbackSign = midY <= height / 2 ? -1 : 1;
  const bendSign = outwardDot === 0 ? fallbackSign : Math.sign(outwardDot);
  const bend = clamp(distance * 0.22, cellSize * 0.4, cellSize * 1.3);
  const padding = cellSize * 0.3;
  const control = {
    x: clamp(midX + perpX * bendSign * bend, padding, width - padding),
    y: clamp(midY + perpY * bendSign * bend, padding, height - padding),
  };

  return {
    path: `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`,
    midpoint: getQuadraticMidpoint(from, control, to),
  };
}

function getLineMidpoint(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number } {
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  };
}

interface LineIconBadgeProps {
  x: number;
  y: number;
  className: string;
  label: string;
  children: ReactNode;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

function LineIconBadge({ x, y, className, label, children, onPointerEnter, onPointerLeave }: LineIconBadgeProps) {
  return (
    <div
      className={`constraint-line-icon-badge ${className}`}
      aria-label={label}
      style={{
        left: x,
        top: y,
      }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>
  );
}

export function ConstraintOverlay({
  width,
  height,
  cellSize,
  seats,
  assignments,
  pairConstraints,
  positionConstraints,
  hoveredConstraintId,
  onHoveredConstraintChange,
  interactionEnabled,
}: ConstraintOverlayProps) {
  const seatById = new Map(seats.map((seat) => [seat.id, seat]));
  const seatByStudent = new Map<string, Seat>();

  for (const assignment of assignments) {
    const seat = seatById.get(assignment.seatId);
    if (seat) {
      seatByStudent.set(assignment.studentId, seat);
    }
  }

  const pairItems = pairConstraints.flatMap((constraint) => {
    const seatA = seatByStudent.get(constraint.studentAId);
    const seatB = seatByStudent.get(constraint.studentBId);
    if (!seatA || !seatB) {
      return [];
    }

    const from = seatCenter(seatA, cellSize);
    const to = seatCenter(seatB, cellSize);
    const className = constraint.type === 'must_next_to' ? 'pair-next' : 'pair-not-next';
    const { path, midpoint } = getPairGeometry(seatA, seatB, from, to, width, height, cellSize);

    return [{ constraint, className, path, midpoint }];
  });

  const positionItems = positionConstraints.flatMap((constraint) => {
    const seat = seatByStudent.get(constraint.studentId);
    if (!seat) {
      return [];
    }

    const from = seatCenter(seat, cellSize);
    const to = {
      x: width / 2,
      y: constraint.type === 'prefer_front' ? height - 8 : 8,
    };

    return [{ constraint, from, to, midpoint: getLineMidpoint(from, to) }];
  });

  return (
    <>
      <svg className="constraint-overlay" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {pairItems.map(({ constraint, className, path }) => (
          <g key={constraint.id}>
            <path
              className={`pair-link-underlay ${hoveredConstraintId === constraint.id ? 'is-linked-hover' : ''}`}
              d={path}
              fill="none"
              strokeWidth="6"
            />
            <path
              className={`${className} ${hoveredConstraintId === constraint.id ? 'is-linked-hover' : ''}`}
              d={path}
              fill="none"
              strokeWidth="3.5"
            />
            <path
              className="constraint-link-hit-area"
              d={path}
              fill="none"
              strokeWidth="16"
              onPointerEnter={interactionEnabled ? () => onHoveredConstraintChange(constraint.id) : undefined}
              onPointerLeave={interactionEnabled ? () => onHoveredConstraintChange(null) : undefined}
            />
          </g>
        ))}

        {positionItems.map(({ constraint, from, to }) => (
          <g key={constraint.id}>
            <line
              className={`position-link ${hoveredConstraintId === constraint.id ? 'is-linked-hover' : ''}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              strokeWidth="2"
            />
            <line
              className="constraint-link-hit-area"
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              strokeWidth="16"
              onPointerEnter={interactionEnabled ? () => onHoveredConstraintChange(constraint.id) : undefined}
              onPointerLeave={interactionEnabled ? () => onHoveredConstraintChange(null) : undefined}
            />
          </g>
        ))}
      </svg>

      <div className="constraint-overlay-icons" style={{ width, height }}>
        {pairItems.map(({ constraint, midpoint }) => (
          <LineIconBadge
            key={constraint.id}
            x={midpoint.x}
            y={midpoint.y}
            className={`${constraint.type === 'must_next_to' ? 'pair-next-badge' : 'pair-not-next-badge'} ${
              hoveredConstraintId === constraint.id ? 'is-linked-hover' : ''
            }`}
            label={constraint.type === 'must_next_to' ? 'Together rule' : 'Avoid rule'}
            onPointerEnter={interactionEnabled ? () => onHoveredConstraintChange(constraint.id) : undefined}
            onPointerLeave={interactionEnabled ? () => onHoveredConstraintChange(null) : undefined}
          >
            {constraint.type === 'must_next_to' ? <PairRuleIcon className="constraint-line-icon" /> : <NotNextToIcon className="constraint-line-icon" />}
          </LineIconBadge>
        ))}

        {positionItems.map(({ constraint, midpoint }) => (
          <LineIconBadge
            key={constraint.id}
            x={midpoint.x}
            y={midpoint.y}
            className={`position-link-badge ${hoveredConstraintId === constraint.id ? 'is-linked-hover' : ''}`}
            label={constraint.type === 'prefer_front' ? 'Front preference' : 'Back preference'}
            onPointerEnter={interactionEnabled ? () => onHoveredConstraintChange(constraint.id) : undefined}
            onPointerLeave={interactionEnabled ? () => onHoveredConstraintChange(null) : undefined}
          >
            {constraint.type === 'prefer_front' ? <FrontIcon className="constraint-line-icon" /> : <BackIcon className="constraint-line-icon" />}
          </LineIconBadge>
        ))}
      </div>
    </>
  );
}
