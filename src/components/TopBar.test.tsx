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
        printTone="color"
        canPrint
        onPrintToneChange={vi.fn()}
        onOpenPrintPreview={vi.fn()}
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
        printTone="color"
        canPrint
        onPrintToneChange={vi.fn()}
        onOpenPrintPreview={vi.fn()}
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

  it('shows print controls and routes tone and preview actions', async () => {
    const user = userEvent.setup();
    const onPrintToneChange = vi.fn();
    const onOpenPrintPreview = vi.fn();

    render(
      <TopBar
        appVersion="0.4.0"
        repoUrl=""
        printTone="color"
        canPrint
        onPrintToneChange={onPrintToneChange}
        onOpenPrintPreview={onOpenPrintPreview}
        onNewProject={vi.fn()}
        onSaveProject={vi.fn()}
        onLoadProject={vi.fn()}
        onClearLocal={vi.fn()}
      />,
    );

    await user.click(screen.getByText('Print', { selector: 'summary' }));

    expect(screen.getByText('Color')).toBeVisible();
    expect(screen.getByText('Black & White')).toBeVisible();
    expect(screen.getByText('Open Print Preview')).toBeVisible();

    await user.click(screen.getByText('Black & White'));
    await user.click(screen.getByText('Open Print Preview'));

    expect(onPrintToneChange).toHaveBeenCalledWith('bw');
    expect(onOpenPrintPreview).toHaveBeenCalledTimes(1);
  });

  it('disables print preview when there are no seats to print', async () => {
    const user = userEvent.setup();

    render(
      <TopBar
        appVersion="0.4.0"
        repoUrl=""
        printTone="color"
        canPrint={false}
        onPrintToneChange={vi.fn()}
        onOpenPrintPreview={vi.fn()}
        onNewProject={vi.fn()}
        onSaveProject={vi.fn()}
        onLoadProject={vi.fn()}
        onClearLocal={vi.fn()}
      />,
    );

    await user.click(screen.getByText('Print', { selector: 'summary' }));

    expect(screen.getByText('Open Print Preview')).toBeDisabled();
  });
});
