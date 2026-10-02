import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportMenu from '../components/ExportMenu';

const closed = () => waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

describe('ExportMenu', () => {
  it('exports Excel with one click on the main button', async () => {
    const onExport = vi.fn();
    const user = userEvent.setup();
    render(<ExportMenu busy={false} disabled={false} onExport={onExport} />);

    await user.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    expect(onExport).toHaveBeenCalledWith('xlsx');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('offers Excel and PDF from the arrow', async () => {
    const user = userEvent.setup();
    render(<ExportMenu busy={false} disabled={false} onExport={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Más formatos de exportación' }));

    expect(screen.getByRole('menu', { name: 'Formato de exportación' })).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('Excel (.xlsx)'),
      expect.stringContaining('PDF'),
    ]);
    expect(screen.getByRole('button', { name: 'Más formatos de exportación' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('exports a PDF from the menu and closes it', async () => {
    const onExport = vi.fn();
    const user = userEvent.setup();
    render(<ExportMenu busy={false} disabled={false} onExport={onExport} />);

    await user.click(screen.getByRole('button', { name: 'Más formatos de exportación' }));
    await user.click(screen.getByRole('menuitem', { name: /PDF/ }));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledWith('pdf');
    await closed();
  });

  it('moves between the items with the arrow keys and closes with Escape, returning focus to the arrow', async () => {
    const user = userEvent.setup();
    render(<ExportMenu busy={false} disabled={false} onExport={vi.fn()} />);
    const toggle = screen.getByRole('button', { name: 'Más formatos de exportación' });

    await user.click(toggle);
    const [excel, pdf] = screen.getAllByRole('menuitem');
    await waitFor(() => expect(excel).toHaveFocus());

    await user.keyboard('{ArrowDown}');
    expect(pdf).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(excel).toHaveFocus();

    await user.keyboard('{Escape}');
    await closed();
    expect(toggle).toHaveFocus();
  });

  it('closes when clicking elsewhere', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>Fuera</button>
        <ExportMenu busy={false} disabled={false} onExport={vi.fn()} />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Más formatos de exportación' }));
    await user.click(screen.getByRole('button', { name: 'Fuera' }));

    await closed();
  });

  it('locks both buttons while a file is being generated', () => {
    render(<ExportMenu busy disabled={false} onExport={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Exportando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Más formatos de exportación' })).toBeDisabled();
  });

  it('is disabled when there is nothing to export', () => {
    render(<ExportMenu busy={false} disabled onExport={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Exportar Excel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Más formatos de exportación' })).toBeDisabled();
  });
});
