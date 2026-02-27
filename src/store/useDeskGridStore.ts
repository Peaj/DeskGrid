import { create } from 'zustand';
import { parseStudentsCsv } from '../domain/csv';
import { canPlaceTable, generateSeats } from '../domain/grid';
import { createId } from '../domain/id';
import type {
  Assignment,
  GridConfig,
  HardViolation,
  LayoutFile,
  PairConstraint,
  PairConstraintType,
  PositionConstraint,
  PositionConstraintType,
  RosterFile,
  ScoreBreakdown,
  Student,
  Table,
} from '../domain/types';
import { solveSeating } from '../solver';
import {
  clearLocalStorageProject,
  downloadTextFile,
  loadLayoutFromLocalStorage,
  loadRosterFromLocalStorage,
  parseLayoutFromJson,
  parseRosterFromJson,
  saveLayoutToLocalStorage,
  saveRosterToLocalStorage,
  serializeLayout,
  serializeRoster,
} from '../storage/persistence';

const SCHEMA_VERSION = 1;
const defaultGrid: GridConfig = {
  width: 14,
  height: 10,
  frontEdge: 'bottom',
};

const defaultScore: ScoreBreakdown = {
  hardViolations: 0,
  softPenalty: 0,
  totalPenalty: 0,
};

function cleanupAssignments(assignments: Assignment[], tables: Table[]): Assignment[] {
  const seatSet = new Set(generateSeats(tables).map((seat) => seat.id));
  const seenStudents = new Set<string>();
  const output: Assignment[] = [];

  for (const assignment of assignments) {
    if (!seatSet.has(assignment.seatId)) {
      continue;
    }
    if (seenStudents.has(assignment.studentId)) {
      continue;
    }
    seenStudents.add(assignment.studentId);
    output.push(assignment);
  }
  return output;
}

function withProjectPersistence(state: DeskGridState): void {
  const layout: LayoutFile = {
    schemaVersion: SCHEMA_VERSION,
    grid: state.grid,
    tables: state.tables,
  };

  const roster: RosterFile = {
    schemaVersion: SCHEMA_VERSION,
    students: state.students,
    pairConstraints: state.pairConstraints,
    positionConstraints: state.positionConstraints,
    assignments: state.assignments,
  };

  saveLayoutToLocalStorage(layout);
  saveRosterToLocalStorage(roster);
}

function randomizeAssignments(students: Student[], tables: Table[]): { assignments: Assignment[]; unassignedStudentIds: string[] } {
  const seats = generateSeats(tables);
  const seatIds = seats.map((seat) => seat.id);
  const shuffledStudents = [...students];

  for (let i = shuffledStudents.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledStudents[i], shuffledStudents[j]] = [shuffledStudents[j], shuffledStudents[i]];
  }

  const assignedCount = Math.min(shuffledStudents.length, seatIds.length);
  const assignments: Assignment[] = [];

  for (let i = 0; i < assignedCount; i += 1) {
    assignments.push({
      seatId: seatIds[i],
      studentId: shuffledStudents[i].id,
    });
  }

  return {
    assignments,
    unassignedStudentIds: shuffledStudents.slice(assignedCount).map((student) => student.id),
  };
}

function computeUnassigned(students: Student[], assignments: Assignment[]): string[] {
  const assigned = new Set(assignments.map((entry) => entry.studentId));
  return students.map((student) => student.id).filter((studentId) => !assigned.has(studentId));
}

interface DeskGridState {
  grid: GridConfig;
  tables: Table[];
  students: Student[];
  pairConstraints: PairConstraint[];
  positionConstraints: PositionConstraint[];
  assignments: Assignment[];
  selectedTableId?: string;
  unassignedStudentIds: string[];
  hardViolations: HardViolation[];
  scoreBreakdown: ScoreBreakdown;
  notices: string[];

  resetProject: () => void;
  addTableAt: (x: number, y: number) => void;
  moveTable: (tableId: string, x: number, y: number) => void;
  rotateTable: (tableId: string) => void;
  deleteTable: (tableId: string) => void;
  setSelectedTable: (tableId?: string) => void;
  importStudentsFromCsvText: (text: string) => void;
  randomAssign: () => void;
  solve: () => void;
  addPairConstraint: (studentAId: string, studentBId: string, type: PairConstraintType) => void;
  addPositionConstraint: (studentId: string, type: PositionConstraintType) => void;
  removePairConstraint: (constraintId: string) => void;
  removePositionConstraint: (constraintId: string) => void;
  removeNotice: (index: number) => void;
  saveProjectLocal: () => void;
  loadProjectLocal: () => void;
  clearProjectLocal: () => void;
  exportLayoutFile: () => void;
  exportRosterFile: () => void;
  importLayoutJson: (text: string) => void;
  importRosterJson: (text: string) => void;
}

export const useDeskGridStore = create<DeskGridState>((set, get) => ({
  grid: defaultGrid,
  tables: [],
  students: [],
  pairConstraints: [],
  positionConstraints: [],
  assignments: [],
  unassignedStudentIds: [],
  hardViolations: [],
  scoreBreakdown: defaultScore,
  notices: [],

  resetProject: () => {
    set({
      grid: defaultGrid,
      tables: [],
      students: [],
      pairConstraints: [],
      positionConstraints: [],
      assignments: [],
      selectedTableId: undefined,
      unassignedStudentIds: [],
      hardViolations: [],
      scoreBreakdown: defaultScore,
      notices: ['Started a new project.'],
    });
    withProjectPersistence(get());
  },

  addTableAt: (x, y) => {
    const state = get();
    const table: Table = {
      id: createId('tbl'),
      anchor: { x, y },
      orientation: 'horizontal',
    };

    if (!canPlaceTable(table, state.tables, state.grid)) {
      set({ notices: ['Cannot place table at that location.', ...state.notices].slice(0, 5) });
      return;
    }

    const tables = [...state.tables, table];
    set({
      tables,
      selectedTableId: table.id,
      notices: [],
    });
    withProjectPersistence(get());
  },

  moveTable: (tableId, x, y) => {
    const state = get();
    const current = state.tables.find((table) => table.id === tableId);
    if (!current) {
      return;
    }

    const nextTable: Table = {
      ...current,
      anchor: { x, y },
    };

    if (!canPlaceTable(nextTable, state.tables, state.grid, tableId)) {
      return;
    }

    const tables = state.tables.map((table) => (table.id === tableId ? nextTable : table));
    const assignments = cleanupAssignments(state.assignments, tables);

    set({
      tables,
      assignments,
      unassignedStudentIds: computeUnassigned(state.students, assignments),
    });
    withProjectPersistence(get());
  },

  rotateTable: (tableId) => {
    const state = get();
    const table = state.tables.find((entry) => entry.id === tableId);
    if (!table) {
      return;
    }

    const rotated: Table = {
      ...table,
      orientation: table.orientation === 'horizontal' ? 'vertical' : 'horizontal',
    };

    if (!canPlaceTable(rotated, state.tables, state.grid, tableId)) {
      set({ notices: ['Cannot rotate here due to collision or bounds.', ...state.notices].slice(0, 5) });
      return;
    }

    const tables = state.tables.map((entry) => (entry.id === tableId ? rotated : entry));
    const assignments = cleanupAssignments(state.assignments, tables);
    set({
      tables,
      assignments,
      unassignedStudentIds: computeUnassigned(state.students, assignments),
      notices: [],
    });
    withProjectPersistence(get());
  },

  deleteTable: (tableId) => {
    const state = get();
    const tables = state.tables.filter((table) => table.id !== tableId);
    const assignments = cleanupAssignments(state.assignments, tables);

    set({
      tables,
      assignments,
      selectedTableId: state.selectedTableId === tableId ? undefined : state.selectedTableId,
      unassignedStudentIds: computeUnassigned(state.students, assignments),
    });
    withProjectPersistence(get());
  },

  setSelectedTable: (tableId) => set({ selectedTableId: tableId }),

  importStudentsFromCsvText: (text) => {
    const state = get();
    try {
      const result = parseStudentsCsv(text);
      set({
        students: result.students,
        assignments: [],
        unassignedStudentIds: result.students.map((student) => student.id),
        notices: result.warnings.length > 0 ? result.warnings.slice(0, 5) : ['Imported students.'],
      });
      withProjectPersistence(get());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSV import failed.';
      set({ notices: [message, ...state.notices].slice(0, 5) });
    }
  },

  randomAssign: () => {
    const state = get();
    const random = randomizeAssignments(state.students, state.tables);
    set({
      assignments: random.assignments,
      unassignedStudentIds: random.unassignedStudentIds,
      hardViolations: [],
      scoreBreakdown: defaultScore,
      notices: ['Random assignment generated.'],
    });
    withProjectPersistence(get());
  },

  solve: () => {
    const state = get();
    const seats = generateSeats(state.tables);

    const result = solveSeating({
      grid: state.grid,
      seats,
      students: state.students,
      pairConstraints: state.pairConstraints,
      positionConstraints: state.positionConstraints,
      previousAssignments: state.assignments,
    });

    set({
      assignments: result.assignments,
      hardViolations: result.hardViolations,
      scoreBreakdown: result.scoreBreakdown,
      unassignedStudentIds: result.unassignedStudentIds,
      notices:
        result.hardViolations.length > 0
          ? [`Solved with ${result.hardViolations.length} hard constraint conflict(s).`]
          : ['Solved seating plan.'],
    });
    withProjectPersistence(get());
  },

  addPairConstraint: (studentAId, studentBId, type) => {
    if (studentAId === studentBId) {
      return;
    }

    const state = get();
    const ordered = [studentAId, studentBId].sort();
    const existing = state.pairConstraints.find((constraint) => {
      const pair = [constraint.studentAId, constraint.studentBId].sort();
      return pair[0] === ordered[0] && pair[1] === ordered[1];
    });

    const nextConstraint: PairConstraint = {
      id: existing?.id ?? createId('pair'),
      type,
      studentAId,
      studentBId,
      hard: true,
    };

    const pairConstraints = existing
      ? state.pairConstraints.map((constraint) => (constraint.id === existing.id ? nextConstraint : constraint))
      : [...state.pairConstraints, nextConstraint];

    set({ pairConstraints, notices: ['Pair constraint updated.'] });
    withProjectPersistence(get());
  },

  addPositionConstraint: (studentId, type) => {
    const state = get();
    const filtered = state.positionConstraints.filter((constraint) => constraint.studentId !== studentId);
    const next: PositionConstraint = {
      id: createId('pos'),
      studentId,
      type,
      hard: false,
    };

    set({
      positionConstraints: [...filtered, next],
      notices: ['Position preference updated.'],
    });
    withProjectPersistence(get());
  },

  removePairConstraint: (constraintId) => {
    const state = get();
    set({
      pairConstraints: state.pairConstraints.filter((constraint) => constraint.id !== constraintId),
    });
    withProjectPersistence(get());
  },

  removePositionConstraint: (constraintId) => {
    const state = get();
    set({
      positionConstraints: state.positionConstraints.filter((constraint) => constraint.id !== constraintId),
    });
    withProjectPersistence(get());
  },

  removeNotice: (index) => {
    const state = get();
    set({ notices: state.notices.filter((_, noticeIndex) => noticeIndex !== index) });
  },

  saveProjectLocal: () => {
    withProjectPersistence(get());
    set({ notices: ['Saved to local storage.'] });
  },

  loadProjectLocal: () => {
    const layout = loadLayoutFromLocalStorage();
    const roster = loadRosterFromLocalStorage();

    if (!layout || !roster) {
      set({ notices: ['No valid local project found.'] });
      return;
    }

    const assignments = cleanupAssignments(roster.assignments, layout.tables);

    set({
      grid: layout.grid,
      tables: layout.tables,
      students: roster.students,
      pairConstraints: roster.pairConstraints,
      positionConstraints: roster.positionConstraints,
      assignments,
      selectedTableId: undefined,
      unassignedStudentIds: computeUnassigned(roster.students, assignments),
      hardViolations: [],
      scoreBreakdown: defaultScore,
      notices: ['Loaded project from local storage.'],
    });
  },

  clearProjectLocal: () => {
    clearLocalStorageProject();
    set({ notices: ['Local storage cleared.'] });
  },

  exportLayoutFile: () => {
    const state = get();
    const payload: LayoutFile = {
      schemaVersion: SCHEMA_VERSION,
      grid: state.grid,
      tables: state.tables,
    };
    downloadTextFile('layout.json', serializeLayout(payload));
  },

  exportRosterFile: () => {
    const state = get();
    const payload: RosterFile = {
      schemaVersion: SCHEMA_VERSION,
      students: state.students,
      pairConstraints: state.pairConstraints,
      positionConstraints: state.positionConstraints,
      assignments: state.assignments,
    };
    downloadTextFile('roster.json', serializeRoster(payload));
  },

  importLayoutJson: (text) => {
    const state = get();
    try {
      const layout = parseLayoutFromJson(text);
      const assignments = cleanupAssignments(state.assignments, layout.tables);
      set({
        grid: layout.grid,
        tables: layout.tables,
        assignments,
        selectedTableId: undefined,
        unassignedStudentIds: computeUnassigned(state.students, assignments),
        notices: ['Imported layout.json'],
      });
      withProjectPersistence(get());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'layout.json import failed.';
      set({ notices: [message] });
    }
  },

  importRosterJson: (text) => {
    const state = get();
    try {
      const roster = parseRosterFromJson(text);
      const assignments = cleanupAssignments(roster.assignments, state.tables);
      set({
        students: roster.students,
        pairConstraints: roster.pairConstraints,
        positionConstraints: roster.positionConstraints,
        assignments,
        unassignedStudentIds: computeUnassigned(roster.students, assignments),
        notices: ['Imported roster.json'],
      });
      withProjectPersistence(get());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'roster.json import failed.';
      set({ notices: [message] });
    }
  },
}));

export const deskGridDefaults = {
  defaultGrid,
};
