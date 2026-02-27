import { useMemo, useRef } from 'react';
import type { Student } from '../domain/types';

interface RosterPanelProps {
  students: Student[];
  unassignedStudentIds: string[];
  onImportCsvText: (text: string) => void;
}

export function RosterPanel({ students, unassignedStudentIds, onImportCsvText }: RosterPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unassignedNames = useMemo(() => {
    const byId = new Map(students.map((student) => [student.id, student.name]));
    return unassignedStudentIds.map((id) => byId.get(id) ?? id);
  }, [students, unassignedStudentIds]);

  return (
    <section className="panel roster-panel">
      <div className="panel-header">
        <h2>Students</h2>
        <button onClick={() => fileInputRef.current?.click()}>Import CSV</button>
      </div>

      <p className="meta">Total: {students.length}</p>

      <ul className="scroll-list">
        {students.map((student) => (
          <li key={student.id}>{student.name}</li>
        ))}
      </ul>

      <h3>Unassigned</h3>
      <ul className="scroll-list">
        {unassignedNames.length === 0 && <li>None</li>}
        {unassignedNames.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>

      <input
        hidden
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={async (event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];
          if (!file) {
            return;
          }
          onImportCsvText(await file.text());
          input.value = '';
        }}
      />
    </section>
  );
}
