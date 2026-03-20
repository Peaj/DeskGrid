import { create } from 'zustand';
import { parseStudentsCsv } from '../domain/csv';
import { cleanupAssignments, toggleSeatAt } from '../domain/grid';
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
  Seat,
  Student,
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

const SCHEMA_VERSION = 2;
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

function createDefaultState(): Pick<
  DeskGridState,
  | 'grid'
  | 'seats'
  | 'students'
  | 'pairConstraints'
  | 'positionConstraints'
  | 'assignments'
  | 'unassignedStudentIds'
  | 'hardViolations'
  | 'scoreBreakdown'
  | 'notices'
> {
  return {
    grid: defaultGrid,
    seats: [],
    students: [],
    pairConstraints: [],
    positionConstraints: [],
    assignments: [],
    unassignedStudentIds: [],
    hardViolations: [],
    scoreBreakdown: defaultScore,
    notices: [],
  };
}

function createHydratedState(notices: string[] = []): Pick<
  DeskGridState,
  | 'grid'
  | 'seats'
  | 'students'
  | 'pairConstraints'
  | 'positionConstraints'
  | 'assignments'
  | 'unassignedStudentIds'
  | 'hardViolations'
  | 'scoreBreakdown'
  | 'notices'
> {
  const layout = loadLayoutFromLocalStorage();
  const roster = loadRosterFromLocalStorage();

  const grid = layout?.grid ?? defaultGrid;
  const seats = layout?.seats ?? [];
  const students = roster?.students ?? [];
  const pairConstraints = roster?.pairConstraints ?? [];
  const positionConstraints = roster?.positionConstraints ?? [];
  const assignments = cleanupAssignments(roster?.assignments ?? [], seats);

  return {
    grid,
    seats,
    students,
    pairConstraints,
    positionConstraints,
    assignments,
    unassignedStudentIds: computeUnassigned(students, assignments),
    hardViolations: [],
    scoreBreakdown: defaultScore,
    notices,
  };
}

function withProjectPersistence(state: DeskGridState): void {
  const layout: LayoutFile = {
    schemaVersion: SCHEMA_VERSION,
    grid: state.grid,
    seats: state.seats,
  };

  const roster: RosterFile = {
    schemaVersion: 1,
    students: state.students,
    pairConstraints: state.pairConstraints,
    positionConstraints: state.positionConstraints,
    assignments: state.assignments,
  };

  saveLayoutToLocalStorage(layout);
  saveRosterToLocalStorage(roster);
}

function randomizeAssignments(students: Student[], seats: Seat[]): { assignments: Assignment[]; unassignedStudentIds: string[] } {
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
  seats: Seat[];
  students: Student[];
  pairConstraints: PairConstraint[];
  positionConstraints: PositionConstraint[];
  assignments: Assignment[];
  unassignedStudentIds: string[];
  hardViolations: HardViolation[];
  scoreBreakdown: ScoreBreakdown;
  notices: string[];

  resetProject: () => void;
  toggleSeat: (x: number, y: number) => void;
  importStudentsFromCsvText: (text: string) => void;
  randomAssign: () => void;
  benchAllStudents: () => void;
  solve: () => void;
  moveStudentToSeat: (studentId: string, targetSeatId: string) => void;
  unassignStudent: (studentId: string) => void;
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
  ...createHydratedState(),

  resetProject: () => {
    set({ ...createDefaultState(), notices: ['Started a new project.'] });
    withProjectPersistence(get());
  },

  toggleSeat: (x, y) => {
    const state = get();
    const seats = toggleSeatAt(state.seats, x, y, state.grid);
    const assignments = cleanupAssignments(state.assignments, seats);

    set({
      seats,
      assignments,
      unassignedStudentIds: computeUnassigned(state.students, assignments),
      notices: [],
    });
    withProjectPersistence(get());
  },

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
    const random = randomizeAssignments(state.students, state.seats);
    set({
      assignments: random.assignments,
      unassignedStudentIds: random.unassignedStudentIds,
      hardViolations: [],
      scoreBreakdown: defaultScore,
      notices: ['Random assignment generated.'],
    });
    withProjectPersistence(get());
  },

  benchAllStudents: () => {
    const state = get();
    set({
      assignments: [],
      unassignedStudentIds: state.students.map((student) => student.id),
      hardViolations: [],
      scoreBreakdown: defaultScore,
      notices: ['All students moved back to the bench.'],
    });
    withProjectPersistence(get());
  },

  solve: () => {
    const state = get();

    const result = solveSeating({
      grid: state.grid,
      seats: state.seats,
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

  moveStudentToSeat: (studentId, targetSeatId) => {
    const state = get();
    const studentSet = new Set(state.students.map((student) => student.id));
    if (!studentSet.has(studentId)) {
      return;
    }

    const seatSet = new Set(state.seats.map((seat) => seat.id));
    if (!seatSet.has(targetSeatId)) {
      return;
    }

    const sourceAssignment = state.assignments.find((assignment) => assignment.studentId === studentId);
    const targetAssignment = state.assignments.find((assignment) => assignment.seatId === targetSeatId);
    if (sourceAssignment && sourceAssignment.seatId === targetSeatId) {
      return;
    }

    const assignments = [...state.assignments];

    if (sourceAssignment && targetAssignment) {
      for (let i = 0; i < assignments.length; i += 1) {
        if (assignments[i].studentId === studentId) {
          assignments[i] = { seatId: targetSeatId, studentId };
        } else if (assignments[i].seatId === targetSeatId) {
          assignments[i] = { seatId: sourceAssignment.seatId, studentId: targetAssignment.studentId };
        }
      }
    } else if (sourceAssignment && !targetAssignment) {
      for (let i = 0; i < assignments.length; i += 1) {
        if (assignments[i].studentId === studentId) {
          assignments[i] = { seatId: targetSeatId, studentId };
          break;
        }
      }
    } else if (!sourceAssignment && targetAssignment) {
      for (let i = 0; i < assignments.length; i += 1) {
        if (assignments[i].seatId === targetSeatId) {
          assignments[i] = { seatId: targetSeatId, studentId };
          break;
        }
      }
    } else {
      assignments.push({ seatId: targetSeatId, studentId });
    }

    const normalized = cleanupAssignments(assignments, state.seats);
    set({
      assignments: normalized,
      unassignedStudentIds: computeUnassigned(state.students, normalized),
      notices: [],
    });
    withProjectPersistence(get());
  },

  unassignStudent: (studentId) => {
    const state = get();
    const assignments = state.assignments.filter((assignment) => assignment.studentId !== studentId);
    if (assignments.length === state.assignments.length) {
      return;
    }

    set({
      assignments,
      unassignedStudentIds: computeUnassigned(state.students, assignments),
      notices: [],
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

    if (!layout && !roster) {
      set({ notices: ['No valid local project found.'] });
      return;
    }

    set(createHydratedState(['Loaded project from local storage.']));
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
      seats: state.seats,
    };
    downloadTextFile('layout.json', serializeLayout(payload));
  },

  exportRosterFile: () => {
    const state = get();
    const payload: RosterFile = {
      schemaVersion: 1,
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
      const assignments = cleanupAssignments(state.assignments, layout.seats);
      set({
        grid: layout.grid,
        seats: layout.seats,
        assignments,
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
      const assignments = cleanupAssignments(roster.assignments, state.seats);
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

export const deskGridStateFactories = {
  createDefaultState,
  createHydratedState,
};
