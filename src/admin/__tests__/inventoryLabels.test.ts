import { describe, it, expect } from 'vitest';
import { daysSince, monthOf, movementAuthor, reservedLabel } from '../utils/inventoryLabels';

describe('movementAuthor', () => {
  it('prefers the user name and falls back to the email', () => {
    expect(movementAuthor({ action: 'UPDATE', user: { id: 'u1', name: 'Ana', email: 'ana@example.com' } })).toBe('Ana');
    expect(movementAuthor({ action: 'UPDATE', user: { id: 'u1', name: null, email: 'ana@example.com' } })).toBe(
      'ana@example.com',
    );
  });

  it('labels an import, which has no user by design', () => {
    expect(movementAuthor({ action: 'IMPORT', user: null })).toBe('Importación');
  });

  it('does not pass off a deleted account as an import', () => {
    expect(movementAuthor({ action: 'STATUS', user: null })).toBe('Usuario eliminado');
  });
});

describe('day helpers (Mexico City calendar)', () => {
  it('counts whole calendar days, not 24-hour blocks', () => {
    // 23:00 on 1 October and 01:00 on 2 October are two hours apart but one calendar day apart in Mexico City.
    expect(daysSince('2026-10-02T05:00:00Z', new Date('2026-10-02T07:00:00Z'))).toBe(1);
    expect(daysSince('2026-10-02T18:00:00Z', new Date('2026-10-02T23:00:00Z'))).toBe(0);
    expect(daysSince('2026-09-02T18:00:00Z', new Date('2026-10-02T18:00:00Z'))).toBe(30);
  });

  it('uses the Mexico City day, which lags UTC in the evening', () => {
    // 21:00 on 1 October in Mexico City is already 2 October in UTC.
    expect(daysSince('2026-10-02T03:00:00Z', new Date('2026-10-02T18:00:00Z'))).toBe(1);
  });

  it('never goes negative', () => {
    expect(daysSince('2026-10-10T18:00:00Z', new Date('2026-10-02T18:00:00Z'))).toBe(0);
  });

  it('finds the month a moment falls in, as Mexico City sees it', () => {
    expect(monthOf(new Date('2026-11-01T03:00:00Z'))).toBe('2026-10');
    expect(monthOf(new Date('2026-11-01T06:00:00Z'))).toBe('2026-11');
  });

  it('words the age of a reservation', () => {
    expect(reservedLabel(0)).toBe('Apartada hoy');
    expect(reservedLabel(1)).toBe('Apartada hace 1 día');
    expect(reservedLabel(18)).toBe('Apartada hace 18 días');
  });
});
