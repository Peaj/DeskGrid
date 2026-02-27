import type { ReactNode } from 'react';

export interface ToolbarAction {
  id: string;
  tooltip: string;
  icon: ReactNode;
  onClick: () => void;
  tone?: 'default' | 'danger';
}

interface ToolbarProps {
  ariaLabel: string;
  actions: ToolbarAction[];
}

export function Toolbar({ ariaLabel, actions }: ToolbarProps) {
  return (
    <div className="toolbar" role="toolbar" aria-label={ariaLabel}>
      {actions.map((action) => (
        <button
          key={action.id}
          className={`ui-btn toolbar-icon-btn ${action.tone === 'danger' ? 'ui-btn-danger' : ''}`}
          onClick={action.onClick}
          aria-label={action.tooltip}
          title={action.tooltip}
          data-tooltip={action.tooltip}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}
