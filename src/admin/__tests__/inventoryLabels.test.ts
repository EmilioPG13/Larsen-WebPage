import { describe, it, expect } from 'vitest';
import { movementAuthor } from '../utils/inventoryLabels';

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
