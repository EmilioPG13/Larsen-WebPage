import { createContext } from 'react';
import type { AdminRole } from './session';

/** Role of the signed-in user, provided once by ProtectedRoute for the whole panel. */
export const AdminRoleContext = createContext<AdminRole | null>(null);
