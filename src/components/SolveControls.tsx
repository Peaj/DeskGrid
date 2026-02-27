import type { ScoreBreakdown } from '../domain/types';
import { ShuffleIcon, SolveIcon } from './icons';

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
        <button className="ui-btn" onClick={onRandomAssign}>
          <ShuffleIcon />
          <span>Random Assign</span>
        </button>
        <button className="ui-btn ui-btn-primary" onClick={onSolve}>
          <SolveIcon />
          <span>Solve / Update Plan</span>
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
