import { useMemo } from 'react';
import type { HardViolation, PairConstraint, PositionConstraint, Student } from '../domain/types';
import { ConflictIcon, PairRuleIcon, PositionRuleIcon, TrashIcon } from './icons';

interface ConstraintPanelProps {
  students: Student[];
  pairConstraints: PairConstraint[];
  positionConstraints: PositionConstraint[];
  hardViolations: HardViolation[];
  onRemovePairConstraint: (constraintId: string) => void;
  onRemovePositionConstraint: (constraintId: string) => void;
}

export function ConstraintPanel({
  students,
  pairConstraints,
  positionConstraints,
  hardViolations,
  onRemovePairConstraint,
  onRemovePositionConstraint,
}: ConstraintPanelProps) {
  const studentNameById = useMemo(() => new Map(students.map((student) => [student.id, student.name])), [students]);

  return (
    <section className="panel constraint-panel">
      <h2>Constraints</h2>

      <h3 className="section-title-with-icon">
        <PairRuleIcon />
        <span>Pair Rules (Hard)</span>
      </h3>
      <ul className="scroll-list">
        {pairConstraints.length === 0 && <li>No pair rules.</li>}
        {pairConstraints.map((constraint) => (
          <li key={constraint.id}>
            <span>
              {studentNameById.get(constraint.studentAId) ?? 'Unknown'} {constraint.type === 'must_next_to' ? 'next to' : 'not next to'}{' '}
              {studentNameById.get(constraint.studentBId) ?? 'Unknown'}
            </span>
            <button className="ui-btn ui-btn-compact ui-btn-danger" onClick={() => onRemovePairConstraint(constraint.id)}>
              <TrashIcon />
              <span>Delete</span>
            </button>
          </li>
        ))}
      </ul>

      <h3 className="section-title-with-icon">
        <PositionRuleIcon />
        <span>Front/Back Preferences (Soft)</span>
      </h3>
      <ul className="scroll-list">
        {positionConstraints.length === 0 && <li>No front/back preferences.</li>}
        {positionConstraints.map((constraint) => (
          <li key={constraint.id}>
            <span>
              {studentNameById.get(constraint.studentId) ?? 'Unknown'} {constraint.type === 'prefer_front' ? 'prefer front' : 'prefer back'}
            </span>
            <button className="ui-btn ui-btn-compact ui-btn-danger" onClick={() => onRemovePositionConstraint(constraint.id)}>
              <TrashIcon />
              <span>Delete</span>
            </button>
          </li>
        ))}
      </ul>

      <h3 className="section-title-with-icon">
        <ConflictIcon />
        <span>Hard Conflicts</span>
      </h3>
      <ul className="scroll-list violations">
        {hardViolations.length === 0 && <li>No hard conflicts.</li>}
        {hardViolations.map((violation) => (
          <li key={`${violation.constraintId}-${violation.message}`}>{violation.message}</li>
        ))}
      </ul>
    </section>
  );
}
