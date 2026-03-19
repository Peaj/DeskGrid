import type { ScoreBreakdown } from '../domain/types';
import { MinusIcon, ShuffleIcon, SolveIcon } from './icons';

interface SolveControlsProps {
  scoreBreakdown: ScoreBreakdown;
  onRandomAssign: () => void;
  onBenchAllStudents: () => void;
  onSolve: () => void;
}

export function SolveControls({ scoreBreakdown, onRandomAssign, onBenchAllStudents, onSolve }: SolveControlsProps) {
  return (
    <section className="panel solve-panel flex flex-col gap-2.5">
      <div className="panel-header">
        <h3 className="panel-section-title section-title-with-icon">
          <SolveIcon />
          <span>Solver</span>
        </h3>
      </div>
      <div className="solver-actions">
        <button className="ui-btn" onClick={onRandomAssign}>
          <ShuffleIcon />
          <span>Random Assign</span>
        </button>
        <button className="ui-btn" onClick={onBenchAllStudents}>
          <MinusIcon />
          <span>Bench All</span>
        </button>
        <button className="ui-btn ui-btn-primary" onClick={onSolve}>
          <SolveIcon />
          <span>Solve Plan</span>
        </button>
      </div>

      <div className="solver-stats-row" role="list" aria-label="Solver stats">
        <div
          className="solver-stat-card"
          role="listitem"
          title="The number of hard seating rules that are currently violated in the plan."
        >
          <span className="solver-stat-label">Violations</span>
          <strong className="solver-stat-value">{scoreBreakdown.hardViolations}</strong>
        </div>
        <div
          className="solver-stat-card"
          role="listitem"
          title="The accumulated penalty from unmet soft preferences such as front/back placement preferences."
        >
          <span className="solver-stat-label">Soft penalty</span>
          <strong className="solver-stat-value">{scoreBreakdown.softPenalty}</strong>
        </div>
        <div
          className="solver-stat-card"
          role="listitem"
          title="The overall score used by the solver, combining hard-rule conflicts and soft-preference penalties."
        >
          <span className="solver-stat-label">Total penalty</span>
          <strong className="solver-stat-value">{scoreBreakdown.totalPenalty}</strong>
        </div>
      </div>
    </section>
  );
}
