import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { PRINT_PAGE_STYLE_ID } from './print';

const storeHook = vi.hoisted(() => vi.fn());

vi.mock('./store/useDeskGridStore', () => ({
  useDeskGridStore: storeHook,
}));

interface MockStateOverrides {
  grid?: { width: number; height: number; frontEdge: 'bottom' };
  seats?: Array<{ id: string; x: number; y: number }>;
  students?: Array<{ id: string; name: string }>;
  assignments?: Array<{ seatId: string; studentId: string }>;
}

function createMockState(overrides: MockStateOverrides = {}) {
  return {
    grid: overrides.grid ?? { width: 6, height: 4, frontEdge: 'bottom' as const },
    seats: overrides.seats ?? [{ id: 'seat-a', x: 0, y: 0 }],
    students: overrides.students ?? [{ id: 's1', name: 'Alice Example' }],
    pairConstraints: [],
    positionConstraints: [],
    assignments: overrides.assignments ?? [{ seatId: 'seat-a', studentId: 's1' }],
    unassignedStudentIds: [],
    scoreBreakdown: { hardViolations: 0, softPenalty: 0, totalPenalty: 0 },
    notices: [],
    resetProject: vi.fn(),
    toggleSeat: vi.fn(),
    importStudentsFromCsvText: vi.fn(),
    randomAssign: vi.fn(),
    benchAllStudents: vi.fn(),
    solve: vi.fn(),
    moveStudentToSeat: vi.fn(),
    unassignStudent: vi.fn(),
    addPairConstraint: vi.fn(),
    addPositionConstraint: vi.fn(),
    removePairConstraint: vi.fn(),
    removePositionConstraint: vi.fn(),
    removeNotice: vi.fn(),
    clearProjectLocal: vi.fn(),
    exportProjectFile: vi.fn(async () => {}),
    importProjectJson: vi.fn(),
    exportLayoutFile: vi.fn(async () => {}),
    exportRosterFile: vi.fn(async () => {}),
    importLayoutJson: vi.fn(),
    importRosterJson: vi.fn(),
  };
}

describe('App print mode', () => {
  let currentState = createMockState();

  beforeEach(() => {
    document.getElementById(PRINT_PAGE_STYLE_ID)?.remove();
    currentState = createMockState();
    storeHook.mockImplementation(() => currentState);
    window.localStorage.clear();
    window.location.hash = '';
    window.print = vi.fn();
  });

  afterEach(() => {
    document.getElementById(PRINT_PAGE_STYLE_ID)?.remove();
  });

  it('chooses landscape orientation for wider layouts and portrait for taller layouts', () => {
    currentState = createMockState({ grid: { width: 8, height: 4, frontEdge: 'bottom' } });
    const { rerender } = render(<App />);

    expect(screen.getByTestId('print-root')).toHaveAttribute('data-print-orientation', 'landscape');

    currentState = createMockState({ grid: { width: 4, height: 8, frontEdge: 'bottom' } });
    rerender(<App />);

    expect(screen.getByTestId('print-root')).toHaveAttribute('data-print-orientation', 'portrait');
  });

  it('calls window.print and injects the matching A4 page style', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('Print', { selector: 'summary' }));
    await user.click(screen.getByText('Open Print Preview'));

    expect(window.print).toHaveBeenCalledTimes(1);
    expect(document.getElementById(PRINT_PAGE_STYLE_ID)?.textContent).toContain('A4 landscape');
  });

  it('applies the selected print tone to the printable sheet', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByTestId('print-root')).toHaveAttribute('data-print-tone', 'color');

    await user.click(screen.getByText('Print', { selector: 'summary' }));
    await user.click(screen.getByText('Black & White'));

    expect(screen.getByTestId('print-root')).toHaveAttribute('data-print-tone', 'bw');
  });
});
