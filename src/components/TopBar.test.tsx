import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TopBar } from './TopBar';

describe('TopBar privacy messaging', () => {
  it('shows the device-local privacy statement and privacy actions', async () => {
    const user = userEvent.setup();
    const onExportLayout = vi.fn();

    render(
      <TopBar
        appVersion="0.4.0"
        onNewProject={vi.fn()}
        onSaveLocal={vi.fn()}
        onLoadLocal={vi.fn()}
        onClearLocal={vi.fn()}
        onExportLayout={onExportLayout}
        onExportRoster={vi.fn()}
      />,
    );

    expect(screen.getAllByText('All data stays on your device')[0]).toBeVisible();

    await user.click(screen.getByText('Privacy', { selector: 'summary' }));

    expect(screen.getByText(/DeskGrid runs entirely in your browser\./)).toBeVisible();
    expect(screen.getByText(/stored locally in this browser via/i)).toBeVisible();
    expect(screen.getByText('No analytics or tracking')).toBeVisible();
    expect(screen.getByText('Export layout.json')).toBeVisible();
    expect(screen.getByText('Export roster.json')).toBeVisible();

    await user.click(screen.getByText('Export layout.json'));

    expect(onExportLayout).toHaveBeenCalledTimes(1);
  });
});
