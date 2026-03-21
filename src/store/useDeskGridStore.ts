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
  ProjectFile,
  RosterFile,
  ScoreBreakdown,
  Seat,
  Student,
} from '../domain/types';
import { evaluateAssignments, solveSeating } from '../solver';
import {
  clearLocalStorageProject,
  loadLayoutFromLocalStorage,
  loadRosterFromLocalStorage,
  parseLayoutFromJson,
  parseProjectFromJson,
  parseRosterFromJson,
  saveLayoutToLocalStorage,
  saveRosterToLocalStorage,
  saveTextFile,
  serializeLayout,
  serializeProject,
  serializeRoster,
} from '../storage/persistence';

const SCHEMA_VERSION = 2;
const PROJECT_SCHEMA_VERSION = 1;
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

interface DerivedPlanState {
  assignments: Assignment[];
  unassignedStudentIds: string[];
  hardViolations: HardViolation[];
  scoreBreakdown: ScoreBreakdown;
}

export interface Notice {
  id: string;
  message: string;
}

function createNotice(message: string): Notice {
  return {
    id: createId('notice'),
    message,
  };
}

function createNotices(messages: string[]): Notice[] {
  return messages.map((message) => createNotice(message));
}

function derivePlanState(
  state: Pick<DeskGridState, 'grid' | 'seats' | 'students' | 'pairConstraints' | 'positionConstraints'>,
  assignments: Assignment[],
): DerivedPlanState {
  const normalizedAssignments = cleanupAssignments(assignments, state.seats);
  const unassignedStudentIds = computeUnassigned(state.students, normalizedAssignments);
  const evaluation =
    normalizedAssignments.length === 0 && state.pairConstraints.length === 0 && state.positionConstraints.length === 0
      ? { hardViolations: [], scoreBreakdown: defaultScore }
      : evaluateAssignments(
          normalizedAssignments,
          state.seats,
          state.students,
          state.pairConstraints,
          state.positionConstraints,
          state.grid.height,
        );

  return {
    assignments: normalizedAssignments,
    unassignedStudentIds,
    hardViolations: evaluation.hardViolations,
    scoreBreakdown: evaluation.scoreBreakdown,
  };
}

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
  const derivedPlan = derivePlanState(
    {
      grid,
      seats,
      students,
      pairConstraints,
      positionConstraints,
    },
    roster?.assignments ?? [],
  );

  return {
    grid,
    seats,
    students,
    pairConstraints,
    positionConstraints,
    assignments: derivedPlan.assignments,
    unassignedStudentIds: derivedPlan.unassignedStudentIds,
    hardViolations: derivedPlan.hardViolations,
    scoreBreakdown: derivedPlan.scoreBreakdown,
    notices: createNotices(notices),
  };
}

function withProjectPersistence(state: DeskGridState): void {
  saveLayoutToLocalStorage(buildLayoutFile(state));
  saveRosterToLocalStorage(buildRosterFile(state));
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

function buildLayoutFile(state: Pick<DeskGridState, 'grid' | 'seats'>): LayoutFile {
  return {
    schemaVersion: SCHEMA_VERSION,
    grid: state.grid,
    seats: state.seats,
  };
}

function buildRosterFile(
  state: Pick<DeskGridState, 'students' | 'pairConstraints' | 'positionConstraints' | 'assignments'>,
): RosterFile {
  return {
    schemaVersion: 1,
    students: state.students,
    pairConstraints: state.pairConstraints,
    positionConstraints: state.positionConstraints,
    assignments: state.assignments,
  };
}

function buildProjectFile(state: Pick<
  DeskGridState,
  'grid' | 'seats' | 'students' | 'pairConstraints' | 'positionConstraints' | 'assignments'
>): ProjectFile {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    layout: buildLayoutFile(state),
    roster: buildRosterFile(state),
  };
}

function parseLayoutOrProjectJson(text: string): LayoutFile {
  try {
    return parseLayoutFromJson(text);
  } catch {
    return parseProjectFromJson(text).layout;
  }
}

function parseRosterOrProjectJson(text: string): RosterFile {
  try {
    return parseRosterFromJson(text);
  } catch {
    return parseProjectFromJson(text).roster;
  }
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
  notices: Notice[];

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
  removeNotice: (id: string) => void;
  clearProjectLocal: () => void;
  exportProjectFile: () => Promise<void>;
  importProjectJson: (text: string) => void;
  exportLayoutFile: () => Promise<void>;
  exportRosterFile: () => Promise<void>;
  importLayoutJson: (text: string) => void;
  importRosterJson: (text: string) => void;
}

export const useDeskGridStore = create<DeskGridState>((set, get) => ({
  ...createHydratedState(),

  resetProject: () => {
    clearLocalStorageProject();
    set({ ...createDefaultState(), notices: createNotices(['Started a new project.']) });
  },

  toggleSeat: (x, y) => {
    const state = get();
    const seats = toggleSeatAt(state.seats, x, y, state.grid);
    const derivedPlan = derivePlanState(
      {
        grid: state.grid,
        seats,
        students: state.students,
        pairConstraints: state.pairConstraints,
        positionConstraints: state.positionConstraints,
      },
      state.assignments,
    );

    set({
      seats,
      assignments: derivedPlan.assignments,
      unassignedStudentIds: derivedPlan.unassignedStudentIds,
      hardViolations: derivedPlan.hardViolations,
      scoreBreakdown: derivedPlan.scoreBreakdown,
      notices: [],
    });
    withProjectPersistence(get());
  },

  importStudentsFromCsvText: (text) => {
    const state = get();
    try {
      const result = parseStudentsCsv(text);
      const derivedPlan = derivePlanState(
        {
          grid: state.grid,
          seats: state.seats,
          students: result.students,
          pairConstraints: state.pairConstraints,
          positionConstraints: state.positionConstraints,
        },
        [],
      );
      set({
        students: result.students,
        assignments: derivedPlan.assignments,
        unassignedStudentIds: derivedPlan.unassignedStudentIds,
        hardViolations: derivedPlan.hardViolations,
        scoreBreakdown: derivedPlan.scoreBreakdown,
        notices: createNotices(result.warnings.length > 0 ? result.warnings.slice(0, 5) : ['Imported students.']),
      });
      withProjectPersistence(get());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSV import failed.';
      set({ notices: createNotices([message, ...state.notices.map((notice) => notice.message)].slice(0, 5)) });
    }
  },

  randomAssign: () => {
    const state = get();
    const random = randomizeAssignments(state.students, state.seats);
    const derivedPlan = derivePlanState(state, random.assignments);
    set({
      assignments: derivedPlan.assignments,
      unassignedStudentIds: derivedPlan.unassignedStudentIds,
      hardViolations: derivedPlan.hardViolations,
      scoreBreakdown: derivedPlan.scoreBreakdown,
      notices: createNotices(['Random assignment generated.']),
    });
    withProjectPersistence(get());
  },

  benchAllStudents: () => {
    const state = get();
    const derivedPlan = derivePlanState(state, []);
    set({
      assignments: derivedPlan.assignments,
      unassignedStudentIds: derivedPlan.unassignedStudentIds,
      hardViolations: derivedPlan.hardViolations,
      scoreBreakdown: derivedPlan.scoreBreakdown,
      notices: createNotices(['All students moved back to the bench.']),
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
          ? createNotices([`Solved with ${result.hardViolations.length} hard constraint conflict(s).`])
          : createNotices(['Solved seating plan.']),
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
    const derivedPlan = derivePlanState(state, normalized);
    set({
      assignments: derivedPlan.assignments,
      unassignedStudentIds: derivedPlan.unassignedStudentIds,
      hardViolations: derivedPlan.hardViolations,
      scoreBreakdown: derivedPlan.scoreBreakdown,
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

    const derivedPlan = derivePlanState(state, assignments);
    set({
      assignments: derivedPlan.assignments,
      unassignedStudentIds: derivedPlan.unassignedStudentIds,
      hardViolations: derivedPlan.hardViolations,
      scoreBreakdown: derivedPlan.scoreBreakdown,
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

    const derivedPlan = derivePlanState(
      {
        grid: state.grid,
        seats: state.seats,
        students: state.students,
        pairConstraints,
        positionConstraints: state.positionConstraints,
      },
      state.assignments,
    );

    set({
      pairConstraints,
      hardViolations: derivedPlan.hardViolations,
      scoreBreakdown: derivedPlan.scoreBreakdown,
      notices: createNotices(['Pair constraint updated.']),
    });
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

    const positionConstraints = [...filtered, next];
    const derivedPlan = derivePlanState(
      {
        grid: state.grid,
        seats: state.seats,
        students: state.students,
        pairConstraints: state.pairConstraints,
        positionConstraints,
      },
      state.assignments,
    );

    set({
      positionConstraints,
      hardViolations: derivedPlan.hardViolations,
      scoreBreakdown: derivedPlan.scoreBreakdown,
      notices: createNotices(['Position preference updated.']),
    });
    withProjectPersistence(get());
  },

  removePairConstraint: (constraintId) => {
    const state = get();
    const pairConstraints = state.pairConstraints.filter((constraint) => constraint.id !== constraintId);
    const derivedPlan = derivePlanState(
      {
        grid: state.grid,
        seats: state.seats,
        students: state.students,
        pairConstraints,
        positionConstraints: state.positionConstraints,
      },
      state.assignments,
    );
    set({
      pairConstraints,
      hardViolations: derivedPlan.hardViolations,
      scoreBreakdown: derivedPlan.scoreBreakdown,
    });
    withProjectPersistence(get());
  },

  removePositionConstraint: (constraintId) => {
    const state = get();
    const positionConstraints = state.positionConstraints.filter((constraint) => constraint.id !== constraintId);
    const derivedPlan = derivePlanState(
      {
        grid: state.grid,
        seats: state.seats,
        students: state.students,
        pairConstraints: state.pairConstraints,
        positionConstraints,
      },
      state.assignments,
    );
    set({
      positionConstraints,
      hardViolations: derivedPlan.hardViolations,
      scoreBreakdown: derivedPlan.scoreBreakdown,
    });
    withProjectPersistence(get());
  },

  removeNotice: (id) => {
    const state = get();
    set({ notices: state.notices.filter((notice) => notice.id !== id) });
  },

  clearProjectLocal: () => {
    clearLocalStorageProject();
    set({ notices: createNotices(['Local storage cleared.']) });
  },

  exportProjectFile: async () => {
    await saveTextFile('project.json', serializeProject(buildProjectFile(get())));
  },

  importProjectJson: (text) => {
    try {
      const project = parseProjectFromJson(text);
      const derivedPlan = derivePlanState(
        {
          grid: project.layout.grid,
          seats: project.layout.seats,
          students: project.roster.students,
          pairConstraints: project.roster.pairConstraints,
          positionConstraints: project.roster.positionConstraints,
        },
        project.roster.assignments,
      );
      set({
        grid: project.layout.grid,
        seats: project.layout.seats,
        students: project.roster.students,
        pairConstraints: project.roster.pairConstraints,
        positionConstraints: project.roster.positionConstraints,
        assignments: derivedPlan.assignments,
        unassignedStudentIds: derivedPlan.unassignedStudentIds,
        hardViolations: derivedPlan.hardViolations,
        scoreBreakdown: derivedPlan.scoreBreakdown,
        notices: createNotices(['Imported project.']),
      });
      withProjectPersistence(get());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Project import failed.';
      set({ notices: createNotices([message]) });
    }
  },

  exportLayoutFile: async () => {
    await saveTextFile('layout.json', serializeLayout(buildLayoutFile(get())));
  },

  exportRosterFile: async () => {
    await saveTextFile('roster.json', serializeRoster(buildRosterFile(get())));
  },

  importLayoutJson: (text) => {
    const state = get();
    try {
      const layout = parseLayoutOrProjectJson(text);
      const derivedPlan = derivePlanState(
        {
          grid: layout.grid,
          seats: layout.seats,
          students: state.students,
          pairConstraints: state.pairConstraints,
          positionConstraints: state.positionConstraints,
        },
        state.assignments,
      );
      set({
        grid: layout.grid,
        seats: layout.seats,
        assignments: derivedPlan.assignments,
        unassignedStudentIds: derivedPlan.unassignedStudentIds,
        hardViolations: derivedPlan.hardViolations,
        scoreBreakdown: derivedPlan.scoreBreakdown,
        notices: createNotices(['Imported layout.']),
      });
      withProjectPersistence(get());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Layout import failed.';
      set({ notices: createNotices([message]) });
    }
  },

  importRosterJson: (text) => {
    const state = get();
    try {
      const roster = parseRosterOrProjectJson(text);
      const derivedPlan = derivePlanState(
        {
          grid: state.grid,
          seats: state.seats,
          students: roster.students,
          pairConstraints: roster.pairConstraints,
          positionConstraints: roster.positionConstraints,
        },
        roster.assignments,
      );
      set({
        students: roster.students,
        pairConstraints: roster.pairConstraints,
        positionConstraints: roster.positionConstraints,
        assignments: derivedPlan.assignments,
        unassignedStudentIds: derivedPlan.unassignedStudentIds,
        hardViolations: derivedPlan.hardViolations,
        scoreBreakdown: derivedPlan.scoreBreakdown,
        notices: createNotices(['Imported roster.']),
      });
      withProjectPersistence(get());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Roster import failed.';
      set({ notices: createNotices([message]) });
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
