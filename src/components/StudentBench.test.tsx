import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StudentBench } from './StudentBench';

describe('StudentBench', () => {
  it('shows bench instructions for a brand new project with no students', () => {
    render(<StudentBench students={[]} unassignedStudentIds={[]} onImportCsvText={vi.fn()} />);

    expect(screen.getByText('Bench empty')).toBeVisible();
    expect(screen.getByText('Drop `students.csv` here to import a new class.')).toBeVisible();
    expect(screen.getByText('Drag seated students here to move them back to the bench.')).toBeVisible();
  });
});
