import { z } from 'zod';

export const gridConfigSchema = z.object({
  width: z.number().int().min(4).max(60),
  height: z.number().int().min(4).max(60),
  frontEdge: z.literal('bottom'),
});

export const tableSchema = z.object({
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

export const layoutFileSchema = z.object({
  schemaVersion: z.literal(1),
  grid: gridConfigSchema,
  tables: z.array(tableSchema),
});

export const rosterFileSchema = z.object({
  schemaVersion: z.literal(1),
  students: z.array(studentSchema),
  pairConstraints: z.array(pairConstraintSchema),
  positionConstraints: z.array(positionConstraintSchema),
  assignments: z.array(assignmentSchema),
});
