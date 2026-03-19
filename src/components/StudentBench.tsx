import { useEffect, useMemo, useState } from 'react';
import type { Student } from '../domain/types';
import { StudentPortraitIcon } from './icons';

interface StudentBenchProps {
  students: Student[];
  unassignedStudentIds: string[];
  onImportCsvText: (text: string) => void;
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

export function StudentBench({ students, unassignedStudentIds, onImportCsvText }: StudentBenchProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingStudentId, setDraggingStudentId] = useState<string | null>(null);
  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
  const benchStudents = useMemo(
    () => unassignedStudentIds.map((studentId) => studentById.get(studentId)).filter((student): student is Student => Boolean(student)),
    [studentById, unassignedStudentIds],
  );

  useEffect(() => {
    const stopHandler = (): void => setDraggingStudentId(null);
    window.addEventListener('deskgrid-stop-student-drag', stopHandler);
    return () => window.removeEventListener('deskgrid-stop-student-drag', stopHandler);
  }, []);

  return (
    <section
      className={`panel bench-panel student-bench-dropzone ${isDragOver ? 'bench-dragover' : ''}`}
      onDragEnter={(event) => {
        const hasFile = event.dataTransfer.types.includes('Files');
        const hasStudent = event.dataTransfer.types.includes('text/student-id');
        if (!hasFile && !hasStudent) {
          return;
        }
        setIsDragOver(true);
      }}
      onDragLeave={(event) => {
        const related = event.relatedTarget as Node | null;
        if (related && event.currentTarget.contains(related)) {
          return;
        }
        setIsDragOver(false);
      }}
      onDragOver={(event) => {
        const hasFile = event.dataTransfer.types.includes('Files');
        const hasStudent = event.dataTransfer.types.includes('text/student-id');
        if (!hasFile && !hasStudent) {
          return;
        }
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDrop={async (event) => {
        event.preventDefault();
        setIsDragOver(false);
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
          const csvFile = Array.from(files).find((file) => file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv'));
          if (csvFile) {
            onImportCsvText(await csvFile.text());
          }
          return;
        }
      }}
      onDragEnd={() => setIsDragOver(false)}
    >
      <div className="panel-header">
        <h2>Student Bench</h2>
        <p className="meta">
          Total: {students.length} | Bench: {benchStudents.length}
        </p>
      </div>

      {students.length === 0 ? (
        <p className="meta">Import a CSV to populate students.</p>
      ) : benchStudents.length === 0 ? (
        <div className="bench-empty-dropzone">
          <p>Bench empty</p>
          <p>Drop `students.csv` here to import a new class.</p>
          <p>Drag seated students here to move them back to the bench.</p>
        </div>
      ) : (
        <div className="student-bench-row">
          {benchStudents.map((student) => {
            return (
              <div
                key={student.id}
                className={`student-chip bench-student-chip ${draggingStudentId === student.id ? 'is-drag-origin' : ''}`}
                onPointerDown={(event) => {
                  if (event.button !== 0) {
                    return;
                  }
                  event.preventDefault();
                  const tokenRect = event.currentTarget.getBoundingClientRect();
                  const detail: BenchDragStartEventDetail = {
                    studentId: student.id,
                    startClientX: event.clientX,
                    startClientY: event.clientY,
                    pointerOffsetX: event.clientX - tokenRect.left,
                    pointerOffsetY: event.clientY - tokenRect.top,
                    tokenWidth: tokenRect.width,
                    tokenHeight: tokenRect.height,
                  };
                  setDraggingStudentId(student.id);
                  window.dispatchEvent(new CustomEvent<BenchDragStartEventDetail>('deskgrid-start-student-drag', { detail }));
                }}
                title="Drag to an empty or occupied seat to place this student."
              >
                <span className="student-chip-portrait" aria-hidden="true">
                  <StudentPortraitIcon className="student-chip-portrait-icon" />
                </span>
                <span className="student-chip-name">{student.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
