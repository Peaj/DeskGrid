import type { ScoreBreakdown } from '../domain/types';

interface SolveControlsProps {
  scoreBreakdown: ScoreBreakdown;
  onRandomAssign: () => void;
  onSolve: () => void;
}

export function SolveControls({ scoreBreakdown, onRandomAssign, onSolve }: SolveControlsProps) {
  return (
    <section className="panel solve-panel">
      <h2>Solver</h2>
      <div className="solver-actions">
        <button onClick={onRandomAssign}>Random Assign</button>
        <button className="primary" onClick={onSolve}>
          Solve / Update Plan
        </button>
      </div>

      <ul className="meta-list">
        <li>Hard violations: {scoreBreakdown.hardViolations}</li>
        <li>Soft penalty: {scoreBreakdown.softPenalty}</li>
        <li>Total penalty: {scoreBreakdown.totalPenalty}</li>
      </ul>
    </section>
  );
}
