import { describe, expect, it } from 'vitest';
import { parseStudentsCsv } from './csv';

describe('CSV import', () => {
  it('imports students from name header and skips empty rows', () => {
    const csv = 'name\nAlice\n\nBob\n';
    const result = parseStudentsCsv(csv);

    expect(result.students).toHaveLength(2);
    expect(result.students.map((student) => student.name)).toEqual(['Alice', 'Bob']);
  });

  it('rejects csv without name column', () => {
    expect(() => parseStudentsCsv('first,last\nA,B')).toThrow(/name/i);
  });
});
