import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TopBar } from './TopBar';

describe('TopBar privacy messaging', () => {
  it('shows the device-local privacy statement and only the clear-local action', async () => {
    const user = userEvent.setup();
    const onClearLocal = vi.fn();

    render(
      <TopBar
        appVersion="0.4.0"
        repoUrl="https://github.com/Peaj/DeskGrid"
        onNewProject={vi.fn()}
        onSaveProject={vi.fn()}
        onLoadProject={vi.fn()}
        onClearLocal={onClearLocal}
      />,
    );

    expect(screen.getAllByText('All data stays on your device')[0]).toBeVisible();
    expect(screen.getByRole('link', { name: /open the deskgrid github repository/i })).toHaveAttribute(
      'href',
      'https://github.com/Peaj/DeskGrid',
    );

    await user.click(screen.getByText('Privacy', { selector: 'summary' }));

    expect(screen.getByText(/DeskGrid runs entirely in your browser\./)).toBeVisible();
    expect(screen.getByText(/DeskGrid is open source on/i)).toBeVisible();
    expect(screen.getByText(/auto-save in this browser via/i)).toBeVisible();
    expect(screen.getByText('No analytics or tracking')).toBeVisible();
    expect(screen.getByText('Import or export project files from the Project menu')).toBeVisible();
    expect(screen.getByText('Clear local storage')).toBeVisible();
    expect(screen.queryByText('Export layout.json')).not.toBeInTheDocument();
    expect(screen.queryByText('Export roster.json')).not.toBeInTheDocument();

    await user.click(screen.getByText('Clear local storage'));

    expect(onClearLocal).toHaveBeenCalledTimes(1);
  });

  it('routes project menu save/load actions through project.json handlers', async () => {
    const user = userEvent.setup();
    const onSaveProject = vi.fn(async () => {});
    const onLoadProject = vi.fn();

    render(
      <TopBar
        appVersion="0.4.0"
        repoUrl=""
        onNewProject={vi.fn()}
        onSaveProject={onSaveProject}
        onLoadProject={onLoadProject}
        onClearLocal={vi.fn()}
      />,
    );

    await user.click(screen.getByText('Project', { selector: 'summary' }));
    await user.click(screen.getByText('Save Project'));
    await user.click(screen.getByText('Project', { selector: 'summary' }));
    await user.click(screen.getByText('Load Project'));

    expect(onSaveProject).toHaveBeenCalledTimes(1);
    expect(onLoadProject).toHaveBeenCalledTimes(1);
  });
});
