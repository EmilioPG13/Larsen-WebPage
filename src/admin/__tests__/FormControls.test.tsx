import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from '../components/ui/Select';
import Combobox from '../components/ui/Combobox';
import DatePicker from '../components/ui/DatePicker';

const colors = [
  { value: 'red', label: 'Rojo' },
  { value: 'blue', label: 'Azul' },
  { value: 'green', label: 'Verde' },
];

const closed = () => waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());

describe('Select', () => {
  const Harness = ({ onChange = vi.fn() }: { onChange?: (value: string) => void }) => {
    const [value, setValue] = useState('red');
    return (
      <>
        <label htmlFor="color">Color</label>
        <Select
          id="color"
          value={value}
          options={colors}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
        />
      </>
    );
  };

  it('shows the selected label and opens a list with the current option marked', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByLabelText('Color');
    expect(trigger).toHaveTextContent('Rojo');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(trigger);

    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByRole('option', { name: 'Rojo' })).toHaveAttribute('aria-selected', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('picks an option with the mouse and closes the list', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByLabelText('Color'));
    await user.click(screen.getByRole('option', { name: 'Azul' }));

    expect(onChange).toHaveBeenCalledWith('blue');
    expect(screen.getByLabelText('Color')).toHaveTextContent('Azul');
    await closed();
  });

  it('works from the keyboard and closes with Escape without changing the value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    screen.getByLabelText('Color').focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('blue');
    await closed();

    await user.keyboard('{ArrowDown}{ArrowDown}{Escape}');
    expect(onChange).toHaveBeenCalledTimes(1);
    await closed();
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>Fuera</button>
        <Harness />
      </>,
    );

    await user.click(screen.getByLabelText('Color'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fuera' }));

    await closed();
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(<Select ariaLabel="Color" value="red" options={colors} onChange={vi.fn()} disabled />);

    await user.click(screen.getByLabelText('Color'));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('Combobox', () => {
  const brands = ['Shima Seiki', 'Steiger', 'Protti'];

  const Harness = ({ onSubmit = vi.fn() }: { onSubmit?: () => void }) => {
    const [value, setValue] = useState('');
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label htmlFor="brand">Marca</label>
        <Combobox id="brand" value={value} options={brands} onChange={setValue} />
      </form>
    );
  };

  it('suggests every option on focus and narrows them while typing', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByLabelText('Marca'));
    expect(screen.getAllByRole('option')).toHaveLength(3);

    await user.type(screen.getByLabelText('Marca'), 'st');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Steiger']);
  });

  it('keeps free text that is not in the suggestions', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('Marca'), 'Otra marca');

    expect(screen.getByLabelText('Marca')).toHaveValue('Otra marca');
    await closed();
  });

  it('picks a suggestion with the mouse', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByLabelText('Marca'));
    await user.click(screen.getByRole('option', { name: 'Protti' }));

    expect(screen.getByLabelText('Marca')).toHaveValue('Protti');
    await closed();
  });

  it('uses Enter to pick the highlighted suggestion instead of submitting the form', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText('Marca'));
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(screen.getByLabelText('Marca')).toHaveValue('Steiger');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('DatePicker', () => {
  const Harness = ({
    initial = '2026-09-20',
    allowClear,
    onChange = vi.fn(),
  }: {
    initial?: string;
    allowClear?: boolean;
    onChange?: (value: string) => void;
  }) => {
    const [value, setValue] = useState(initial);
    return (
      <>
        <label htmlFor="date">Fecha</label>
        <DatePicker
          id="date"
          value={value}
          allowClear={allowClear}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
        />
      </>
    );
  };

  const day = (name: string) => screen.getByRole('button', { name });

  it('shows the formatted date and the month of the value when opened', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByLabelText('Fecha')).toHaveTextContent(/20.*sep.*2026/i);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Fecha'));

    expect(screen.getByRole('dialog', { name: 'Elegir fecha' })).toBeInTheDocument();
    expect(screen.getByText('Septiembre 2026')).toBeInTheDocument();
    expect(day('20 de septiembre de 2026')).toHaveAttribute('aria-pressed', 'true');
  });

  it('picks a day and closes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByLabelText('Fecha'));
    await user.click(day('15 de septiembre de 2026'));

    expect(onChange).toHaveBeenCalledWith('2026-09-15');
    expect(screen.getByLabelText('Fecha')).toHaveTextContent(/15.*sep.*2026/i);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('moves between months', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByLabelText('Fecha'));
    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    expect(screen.getByText('Octubre 2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mes anterior' }));
    await user.click(screen.getByRole('button', { name: 'Mes anterior' }));
    expect(screen.getByText('Agosto 2026')).toBeInTheDocument();
  });

  it('picks today with the "Hoy" shortcut', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByLabelText('Fecha'));
    await user.click(screen.getByRole('button', { name: 'Hoy' }));

    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(onChange).toHaveBeenCalledWith(expected);
  });

  it('clears an optional date only when clearing is allowed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(<Harness allowClear onChange={onChange} />);

    await user.click(screen.getByLabelText('Fecha'));
    await user.click(screen.getByRole('button', { name: 'Borrar' }));

    expect(onChange).toHaveBeenCalledWith('');
    expect(screen.getByLabelText('Fecha')).toHaveTextContent('Seleccionar fecha');

    unmount();
    render(<Harness />);
    await user.click(screen.getByLabelText('Fecha'));
    expect(screen.queryByRole('button', { name: 'Borrar' })).not.toBeInTheDocument();
  });

  it('opens on the current month when there is no value', async () => {
    const user = userEvent.setup();
    render(<Harness initial="" />);

    expect(screen.getByLabelText('Fecha')).toHaveTextContent('Seleccionar fecha');
    await user.click(screen.getByLabelText('Fecha'));

    const now = new Date();
    const month = new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(now);
    expect(screen.getByText(new RegExp(`^${month}`, 'i'))).toHaveTextContent(String(now.getFullYear()));
  });

  it('navigates days from the keyboard, crossing months, and closes with Escape', async () => {
    const user = userEvent.setup();
    render(<Harness initial="2026-09-28" />);

    await user.click(screen.getByLabelText('Fecha'));
    await waitFor(() => expect(day('28 de septiembre de 2026')).toHaveFocus());

    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(day('29 de septiembre de 2026')).toHaveFocus());

    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(day('6 de octubre de 2026')).toHaveFocus());
    expect(screen.getByText('Octubre 2026')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Fecha')).toHaveFocus();
  });
});
