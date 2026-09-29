export type AdminRole = 'ADMIN' | 'INVENTARIO';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
}

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = (): AdminUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AdminUser;
    return user && (user.role === 'ADMIN' || user.role === 'INVENTARIO') ? user : null;
  } catch {
    return null;
  }
};

export const storeSession = (token: string | null, user: AdminUser | null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({ id: user.id, email: user.email, name: user.name ?? null, role: user.role })
    );
  }
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/** Landing page for each role. */
export const roleHome = (role: AdminRole): string =>
  role === 'INVENTARIO' ? '/admin/inventario' : '/admin/dashboard';
