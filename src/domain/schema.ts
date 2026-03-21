import { z } from 'zod';
import type { LayoutFile, ProjectFile, Seat } from './types';

export const gridConfigSchema = z.object({
  width: z.number().int().min(4).max(60),
  height: z.number().int().min(4).max(60),
  frontEdge: z.literal('bottom'),
});

export const seatSchema = z.object({
  id: z.string().min(1),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

const legacyTableSchema = z.object({
  id: z.string().min(1),
  anchor: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
  }),
  orientation: z.enum(['horizontal', 'vertical']),
});

export const studentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const assignmentSchema = z.object({
  seatId: z.string().min(1),
  studentId: z.string().min(1),
});

export const pairConstraintSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['must_next_to', 'must_not_next_to']),
  studentAId: z.string().min(1),
  studentBId: z.string().min(1),
  hard: z.literal(true),
});

export const positionConstraintSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['prefer_front', 'prefer_back']),
  studentId: z.string().min(1),
  hard: z.literal(false),
});

const layoutFileV2Schema = z.object({
  schemaVersion: z.literal(2),
  grid: gridConfigSchema,
  seats: z.array(seatSchema),
});

const layoutFileLegacySchema = z.object({
  schemaVersion: z.literal(1),
  grid: gridConfigSchema,
  tables: z.array(legacyTableSchema),
});

export function makeSeatId(x: number, y: number): string {
  return `seat:${x},${y}`;
}

function legacyTablesToSeats(
  tables: Array<z.infer<typeof legacyTableSchema>>,
): Seat[] {
  const seatMap = new Map<string, Seat>();

  for (const table of tables) {
    const base = table.anchor;
    const cells =
      table.orientation === 'horizontal'
        ? [
            { x: base.x, y: base.y },
            { x: base.x + 1, y: base.y },
          ]
        : [
            { x: base.x, y: base.y },
            { x: base.x, y: base.y + 1 },
          ];

    for (const cell of cells) {
      const id = makeSeatId(cell.x, cell.y);
      if (!seatMap.has(id)) {
        seatMap.set(id, { id, x: cell.x, y: cell.y });
      }
    }
  }

  return [...seatMap.values()];
}

export function parseLayoutFile(input: unknown): LayoutFile {
  const v2 = layoutFileV2Schema.safeParse(input);
  if (v2.success) {
    return v2.data;
  }

  const legacy = layoutFileLegacySchema.parse(input);
  return {
    schemaVersion: 2,
    grid: legacy.grid,
    seats: legacyTablesToSeats(legacy.tables),
  };
}

export const layoutFileSchema = layoutFileV2Schema;

export const rosterFileSchema = z.object({
  schemaVersion: z.literal(1),
  students: z.array(studentSchema),
  pairConstraints: z.array(pairConstraintSchema),
  positionConstraints: z.array(positionConstraintSchema),
  assignments: z.array(assignmentSchema),
});

export const projectFileSchema = z.object({
  schemaVersion: z.literal(1),
  layout: layoutFileSchema,
  roster: rosterFileSchema,
});

export function parseProjectFile(input: unknown): ProjectFile {
  return projectFileSchema.parse(input);
}
