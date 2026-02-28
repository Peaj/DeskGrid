import { useMemo } from 'react';
import type { Assignment, Student } from '../domain/types';

interface StudentBenchProps {
  students: Student[];
  assignments: Assignment[];
  unassignedStudentIds: string[];
}

export function StudentBench({ students, assignments, unassignedStudentIds }: StudentBenchProps) {
  const assignedStudentIds = useMemo(() => new Set(assignments.map((assignment) => assignment.studentId)), [assignments]);
  const unassignedSet = useMemo(() => new Set(unassignedStudentIds), [unassignedStudentIds]);

  return (
    <section className="panel bench-panel">
      <div className="panel-header">
        <h2>Student Bench</h2>
        <p className="meta">
          Total: {students.length} | Bench: {unassignedStudentIds.length}
        </p>
      </div>

      {students.length === 0 ? (
        <p className="meta">Import a CSV to populate students.</p>
      ) : (
        <div className="student-bench-row">
          {students.map((student) => {
            const isAssigned = assignedStudentIds.has(student.id);
            const isUnassigned = unassignedSet.has(student.id);
            return (
              <div key={student.id} className={`student-bench-chip ${isUnassigned ? 'is-unassigned' : 'is-assigned'}`}>
                <span className="student-bench-name">{student.name}</span>
                <span className="student-bench-state">{isAssigned ? 'Seated' : 'Bench'}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
