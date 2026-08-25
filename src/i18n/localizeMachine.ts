import type { Lang } from './dictionary';
import type { Machine } from '../types';

/**
 * Devuelve la máquina con sus campos traducidos al idioma activo.
 * En español, o si la máquina no trae bloque `en`, regresa el objeto original.
 * Los campos ausentes en `en` conservan su valor en español.
 */
export function localizeMachine(machine: Machine, lang: Lang): Machine {
  if (lang !== 'en' || !machine.en) return machine;

  const overrides = Object.fromEntries(
    Object.entries(machine.en).filter(([, value]) => value !== undefined && value !== null),
  );

  return { ...machine, ...overrides } as Machine;
}
