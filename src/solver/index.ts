import { buildSeatGraph } from '../domain/grid';
import type {
  Assignment,
  HardViolation,
  PairConstraint,
  PositionConstraint,
  ScoreBreakdown,
  Seat,
  SolveInput,
  SolveResult,
  Student,
} from '../domain/types';

interface InternalState {
  assignmentBySeat: Map<string, string | undefined>;
  seatByStudent: Map<string, string>;
}

interface EvalResult {
  hardViolations: HardViolation[];
  hardCount: number;
  softPenalty: number;
  totalPenalty: number;
}

class SeededRandom {
  private state: number;

  constructor(seed?: number) {
    this.state = seed ?? Date.now();
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }
}

function cloneState(state: InternalState): InternalState {
  return {
    assignmentBySeat: new Map(state.assignmentBySeat),
    seatByStudent: new Map(state.seatByStudent),
  };
}

function swapSeats(state: InternalState, seatA: string, seatB: string): void {
  const studentA = state.assignmentBySeat.get(seatA);
  const studentB = state.assignmentBySeat.get(seatB);

  if (studentA) {
    state.seatByStudent.delete(studentA);
  }
  if (studentB) {
    state.seatByStudent.delete(studentB);
  }

  state.assignmentBySeat.set(seatA, studentB);
  state.assignmentBySeat.set(seatB, studentA);

  if (studentB) {
    state.seatByStudent.set(studentB, seatA);
  }
  if (studentA) {
    state.seatByStudent.set(studentA, seatB);
  }
}

function createEmptyState(seats: Seat[]): InternalState {
  const assignmentBySeat = new Map<string, string | undefined>();
  for (const seat of seats) {
    assignmentBySeat.set(seat.id, undefined);
  }
  return {
    assignmentBySeat,
    seatByStudent: new Map<string, string>(),
  };
}

function toAssignments(state: InternalState): Assignment[] {
  const assignments: Assignment[] = [];
  for (const [seatId, studentId] of state.assignmentBySeat) {
    if (studentId) {
      assignments.push({ seatId, studentId });
    }
  }
  return assignments;
}

function shuffle<T>(items: T[], rng: SeededRandom): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = rng.int(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateInitialAssignment(
  students: Student[],
  seats: Seat[],
  rngSeed?: number,
  previousAssignments: Assignment[] = [],
): { assignments: Assignment[]; unassignedStudentIds: string[] } {
  const rng = new SeededRandom(rngSeed);
  const state = createEmptyState(seats);
  const seatSet = new Set(seats.map((seat) => seat.id));
  const studentSet = new Set(students.map((student) => student.id));

  for (const assignment of previousAssignments) {
    if (!seatSet.has(assignment.seatId) || !studentSet.has(assignment.studentId)) {
      continue;
    }
    if (state.assignmentBySeat.get(assignment.seatId)) {
      continue;
    }
    if (state.seatByStudent.has(assignment.studentId)) {
      continue;
    }
    state.assignmentBySeat.set(assignment.seatId, assignment.studentId);
    state.seatByStudent.set(assignment.studentId, assignment.seatId);
  }

  const freeSeats = seats
    .map((seat) => seat.id)
    .filter((seatId) => !state.assignmentBySeat.get(seatId));

  const remainingStudents = students
    .map((student) => student.id)
    .filter((studentId) => !state.seatByStudent.has(studentId));

  const seatOrder = shuffle(freeSeats, rng);
  const studentOrder = shuffle(remainingStudents, rng);

  const pairCount = Math.min(seatOrder.length, studentOrder.length);
  for (let i = 0; i < pairCount; i += 1) {
    const seatId = seatOrder[i];
    const studentId = studentOrder[i];
    state.assignmentBySeat.set(seatId, studentId);
    state.seatByStudent.set(studentId, seatId);
  }

  const unassignedStudentIds = studentOrder.slice(pairCount);
  return {
    assignments: toAssignments(state),
    unassignedStudentIds,
  };
}

function evaluate(
  state: InternalState,
  seats: Seat[],
  students: Student[],
  pairConstraints: PairConstraint[],
  positionConstraints: PositionConstraint[],
  gridHeight: number,
): EvalResult {
  const seatGraph = buildSeatGraph(seats);
  const seatById = new Map(seats.map((seat) => [seat.id, seat]));
  const studentById = new Map(students.map((student) => [student.id, student]));

  const hardViolations: HardViolation[] = [];
  let softPenalty = 0;

  for (const constraint of pairConstraints) {
    const seatA = state.seatByStudent.get(constraint.studentAId);
    const seatB = state.seatByStudent.get(constraint.studentBId);
    const studentA = studentById.get(constraint.studentAId)?.name ?? constraint.studentAId;
    const studentB = studentById.get(constraint.studentBId)?.name ?? constraint.studentBId;

    if (!seatA || !seatB) {
      hardViolations.push({
        constraintId: constraint.id,
        message: `${studentA} and/or ${studentB} is unassigned.`,
      });
      continue;
    }

    const neighbors = seatGraph.get(seatA);
    if (!neighbors) {
      continue;
    }

    const isOrth = neighbors.orthogonal.includes(seatB);
    const isDiag = neighbors.diagonal.includes(seatB);
    const isNear = isOrth || isDiag;

    if (constraint.type === 'must_next_to') {
      if (!isNear) {
        hardViolations.push({
          constraintId: constraint.id,
          message: `${studentA} must sit next to ${studentB}.`,
        });
        softPenalty += 4;
      } else if (isDiag) {
        softPenalty += 1;
      }
    } else {
      if (isOrth) {
        hardViolations.push({
          constraintId: constraint.id,
          message: `${studentA} must not sit directly next to ${studentB}.`,
        });
      } else if (isDiag) {
        softPenalty += 1;
      }
    }
  }

  for (const constraint of positionConstraints) {
    const seatId = state.seatByStudent.get(constraint.studentId);
    if (!seatId) {
      softPenalty += gridHeight;
      continue;
    }

    const seat = seatById.get(seatId);
    if (!seat) {
      continue;
    }

    if (constraint.type === 'prefer_front') {
      softPenalty += gridHeight - 1 - seat.y;
    } else {
      softPenalty += seat.y;
    }
  }

  const hardCount = hardViolations.length;
  return {
    hardViolations,
    hardCount,
    softPenalty,
    totalPenalty: hardCount * 100000 + softPenalty,
  };
}

export function repairHardConstraints(
  initialState: InternalState,
  seats: Seat[],
  students: Student[],
  pairConstraints: PairConstraint[],
  positionConstraints: PositionConstraint[],
  gridHeight: number,
  maxIterations = 150,
): InternalState {
  let state = cloneState(initialState);
  const seatIds = seats.map((seat) => seat.id);
  const rng = new SeededRandom();

  for (let iter = 0; iter < maxIterations; iter += 1) {
    const baseEval = evaluate(state, seats, students, pairConstraints, positionConstraints, gridHeight);
    if (baseEval.hardCount === 0) {
      return state;
    }

    let bestState: InternalState | null = null;
    let bestEval = baseEval;

    for (let i = 0; i < seatIds.length; i += 1) {
      for (let j = i + 1; j < seatIds.length; j += 1) {
        const seatA = seatIds[i];
        const seatB = seatIds[j];

        const candidate = cloneState(state);
        swapSeats(candidate, seatA, seatB);

        const candidateEval = evaluate(
          candidate,
          seats,
          students,
          pairConstraints,
          positionConstraints,
          gridHeight,
        );

        if (candidateEval.hardCount < bestEval.hardCount) {
          bestEval = candidateEval;
          bestState = candidate;
        }
      }
    }

    if (bestState && bestEval.hardCount < baseEval.hardCount) {
      state = bestState;
      continue;
    }

    const randomA = seatIds[rng.int(seatIds.length)];
    const randomB = seatIds[rng.int(seatIds.length)];
    if (randomA !== randomB) {
      swapSeats(state, randomA, randomB);
    }
  }

  return state;
}

export function optimizeSoftScore(
  initialState: InternalState,
  seats: Seat[],
  students: Student[],
  pairConstraints: PairConstraint[],
  positionConstraints: PositionConstraint[],
  gridHeight: number,
  maxIterations = 250,
  seed?: number,
): InternalState {
  const seatIds = seats.map((seat) => seat.id);
  const rng = new SeededRandom(seed);

  let bestState = cloneState(initialState);
  let bestEval = evaluate(bestState, seats, students, pairConstraints, positionConstraints, gridHeight);

  for (let iter = 0; iter < maxIterations; iter += 1) {
    const seatA = seatIds[rng.int(seatIds.length)];
    const seatB = seatIds[rng.int(seatIds.length)];
    if (seatA === seatB) {
      continue;
    }

    const candidate = cloneState(bestState);
    swapSeats(candidate, seatA, seatB);

    const candidateEval = evaluate(
      candidate,
      seats,
      students,
      pairConstraints,
      positionConstraints,
      gridHeight,
    );

    if (candidateEval.totalPenalty <= bestEval.totalPenalty) {
      bestState = candidate;
      bestEval = candidateEval;
    }
  }

  return bestState;
}

export function solveSeating(input: SolveInput): SolveResult {
  const { grid, seats, students, pairConstraints, positionConstraints, previousAssignments, seed } = input;

  const initial = generateInitialAssignment(students, seats, seed, previousAssignments);
  const initialState = createEmptyState(seats);
  for (const assignment of initial.assignments) {
    initialState.assignmentBySeat.set(assignment.seatId, assignment.studentId);
    initialState.seatByStudent.set(assignment.studentId, assignment.seatId);
  }

  const repaired = repairHardConstraints(
    initialState,
    seats,
    students,
    pairConstraints,
    positionConstraints,
    grid.height,
  );

  const optimized = optimizeSoftScore(
    repaired,
    seats,
    students,
    pairConstraints,
    positionConstraints,
    grid.height,
    400,
    seed,
  );

  const resultEval = evaluate(optimized, seats, students, pairConstraints, positionConstraints, grid.height);
  const assignedStudents = new Set(toAssignments(optimized).map((entry) => entry.studentId));

  return {
    assignments: toAssignments(optimized),
    hardViolations: resultEval.hardViolations,
    scoreBreakdown: {
      hardViolations: resultEval.hardCount,
      softPenalty: resultEval.softPenalty,
      totalPenalty: resultEval.totalPenalty,
    },
    unassignedStudentIds: students
      .map((student) => student.id)
      .filter((studentId) => !assignedStudents.has(studentId)),
  };
}

export function evaluateAssignments(
  assignments: Assignment[],
  seats: Seat[],
  students: Student[],
  pairConstraints: PairConstraint[],
  positionConstraints: PositionConstraint[],
  gridHeight: number,
): Pick<SolveResult, 'hardViolations' | 'scoreBreakdown'> {
  const state = createEmptyState(seats);
  for (const assignment of assignments) {
    if (!state.assignmentBySeat.has(assignment.seatId)) {
      continue;
    }
    state.assignmentBySeat.set(assignment.seatId, assignment.studentId);
    state.seatByStudent.set(assignment.studentId, assignment.seatId);
  }

  const evalResult = evaluate(state, seats, students, pairConstraints, positionConstraints, gridHeight);
  return {
    hardViolations: evalResult.hardViolations,
    scoreBreakdown: {
      hardViolations: evalResult.hardCount,
      softPenalty: evalResult.softPenalty,
      totalPenalty: evalResult.totalPenalty,
    },
  };
}

export function evaluateStateForDebug(
  assignments: Assignment[],
  seats: Seat[],
  students: Student[],
  pairConstraints: PairConstraint[],
  positionConstraints: PositionConstraint[],
  gridHeight: number,
): ScoreBreakdown {
  return evaluateAssignments(assignments, seats, students, pairConstraints, positionConstraints, gridHeight).scoreBreakdown;
}
