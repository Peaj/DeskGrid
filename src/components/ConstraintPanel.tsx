import { useMemo } from 'react';
import { buildSeatGraph } from '../domain/grid';
import type { Assignment, GridConfig, PairConstraint, PositionConstraint, Seat, Student } from '../domain/types';
import {
  BackIcon,
  CheckIcon,
  CrossIcon,
  FrontIcon,
  MinusIcon,
  NextToIcon,
  NotNextToIcon,
  PairRuleIcon,
  PositionRuleIcon,
  TrashIcon,
} from './icons';

interface ConstraintPanelProps {
  grid: GridConfig;
  seats: Seat[];
  assignments: Assignment[];
  students: Student[];
  pairConstraints: PairConstraint[];
  positionConstraints: PositionConstraint[];
  onRemovePairConstraint: (constraintId: string) => void;
  onRemovePositionConstraint: (constraintId: string) => void;
}

export function ConstraintPanel({
  grid,
  seats,
  assignments,
  students,
  pairConstraints,
  positionConstraints,
  onRemovePairConstraint,
  onRemovePositionConstraint,
}: ConstraintPanelProps) {
  const studentNameById = useMemo(() => new Map(students.map((student) => [student.id, student.name])), [students]);
  const seatById = useMemo(() => new Map(seats.map((seat) => [seat.id, seat])), [seats]);
  const seatIdByStudentId = useMemo(() => new Map(assignments.map((item) => [item.studentId, item.seatId])), [assignments]);
  const seatGraph = useMemo(() => buildSeatGraph(seats), [seats]);

  const pairStates = useMemo(
    () =>
      pairConstraints.map((constraint) => {
        const seatAId = seatIdByStudentId.get(constraint.studentAId);
        const seatBId = seatIdByStudentId.get(constraint.studentBId);
        if (!seatAId || !seatBId) {
          return { constraint, state: 'pending' as const };
        }

        const neighbors = seatGraph.get(seatAId);
        const orthogonal = neighbors?.orthogonal.includes(seatBId) ?? false;
        const diagonal = neighbors?.diagonal.includes(seatBId) ?? false;
        const adjacent = orthogonal || diagonal;
        const pass = constraint.type === 'must_next_to' ? adjacent : !orthogonal;

        return { constraint, state: pass ? ('pass' as const) : ('fail' as const) };
      }),
    [pairConstraints, seatIdByStudentId, seatGraph],
  );

  const positionStates = useMemo(
    () =>
      positionConstraints.map((constraint) => {
        const seatId = seatIdByStudentId.get(constraint.studentId);
        if (!seatId) {
          return { constraint, state: 'pending' as const };
        }

        const seat = seatById.get(seatId);
        if (!seat) {
          return { constraint, state: 'pending' as const };
        }

        const denominator = Math.max(1, grid.height - 1);
        const normalizedFromBack = seat.y / denominator;
        const pass = constraint.type === 'prefer_front' ? normalizedFromBack >= 0.5 : normalizedFromBack <= 0.5;

        return { constraint, state: pass ? ('pass' as const) : ('fail' as const) };
      }),
    [grid.height, positionConstraints, seatById, seatIdByStudentId],
  );

  const totalRules = pairStates.length + positionStates.length;

  return (
    <section className="panel constraint-panel flex min-h-0 flex-col">
      <h3 className="section-title-with-icon">
        <PairRuleIcon />
        <span>Rules</span>
      </h3>
      <div className="constraint-rule-list">
        {totalRules === 0 && <p className="constraint-empty">No rules.</p>}
        {pairStates.map(({ constraint, state }) => (
          <article key={constraint.id} className={`constraint-rule-card state-${state}`}>
            <span className="constraint-status-icon" title={state === 'pass' ? 'Rule satisfied' : state === 'fail' ? 'Rule violated' : 'Pending'}>
              {state === 'pass' ? <CheckIcon /> : state === 'fail' ? <CrossIcon /> : <MinusIcon />}
            </span>
            <div className="constraint-rule-body">
              <div className="constraint-rule-line">
                <span className="constraint-rule-type" title="Pair rule">
                  <PairRuleIcon />
                </span>
                <span className="constraint-student">{studentNameById.get(constraint.studentAId) ?? 'Unknown'}</span>
                <span className="constraint-link-icon" title={constraint.type === 'must_next_to' ? 'Must sit next to' : 'Must not sit next to'}>
                  {constraint.type === 'must_next_to' ? <NextToIcon /> : <NotNextToIcon />}
                </span>
                <span className="constraint-student">{studentNameById.get(constraint.studentBId) ?? 'Unknown'}</span>
              </div>
            </div>
            <button
              className="ui-btn ui-btn-danger icon-btn"
              onClick={() => onRemovePairConstraint(constraint.id)}
              title="Delete rule"
              aria-label="Delete rule"
            >
              <TrashIcon />
            </button>
          </article>
        ))}
        {positionStates.map(({ constraint, state }) => (
          <article key={constraint.id} className={`constraint-rule-card state-${state}`}>
            <span className="constraint-status-icon" title={state === 'pass' ? 'Preference met' : state === 'fail' ? 'Preference not met' : 'Pending'}>
              {state === 'pass' ? <CheckIcon /> : state === 'fail' ? <CrossIcon /> : <MinusIcon />}
            </span>
            <div className="constraint-rule-body">
              <div className="constraint-rule-line">
                <span className="constraint-rule-type" title="Position preference">
                  <PositionRuleIcon />
                </span>
                <span className="constraint-student">{studentNameById.get(constraint.studentId) ?? 'Unknown'}</span>
                <span className="constraint-link-icon" title={constraint.type === 'prefer_front' ? 'Prefer front' : 'Prefer back'}>
                  {constraint.type === 'prefer_front' ? <FrontIcon /> : <BackIcon />}
                </span>
              </div>
            </div>
            <button
              className="ui-btn ui-btn-danger icon-btn"
              onClick={() => onRemovePositionConstraint(constraint.id)}
              title="Delete rule"
              aria-label="Delete rule"
            >
              <TrashIcon />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
