import Papa from 'papaparse';
import type { ParseError } from 'papaparse';
import { createId } from './id';
import type { Student } from './types';

export interface CsvImportResult {
  students: Student[];
  warnings: string[];
}

export function parseStudentsCsv(csvText: string): CsvImportResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  const fatalErrors = parsed.errors.filter((entry: ParseError) => entry.code !== 'UndetectableDelimiter');
  if (fatalErrors.length > 0) {
    throw new Error(fatalErrors.map((entry) => entry.message).join('; '));
  }

  if (!parsed.meta.fields || parsed.meta.fields.length === 0) {
    throw new Error('CSV must include headers. Required header: name');
  }

  const nameHeader = parsed.meta.fields.find((field) => field.toLowerCase() === 'name');
  if (!nameHeader) {
    throw new Error('CSV must contain a `name` column.');
  }

  const warnings: string[] = [];
  const students: Student[] = [];

  for (const [index, row] of parsed.data.entries()) {
    const rawName = row[nameHeader]?.trim() ?? '';
    if (!rawName) {
      warnings.push(`Row ${index + 2}: missing name, skipped.`);
      continue;
    }

    students.push({
      id: createId('stu'),
      name: rawName,
    });
  }

  return { students, warnings };
}
