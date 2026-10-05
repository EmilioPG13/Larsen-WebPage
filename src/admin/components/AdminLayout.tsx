import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import { getStoredUser, roleHome, type AdminRole } from '../services/session';
import { useOptionalTheme } from '../../context/ThemeContext';
import ChangePasswordModal from './ChangePasswordModal';
import { AdminLogo, Icon, Tag, type IconName } from './ui/kit';

interface AdminLayoutProps {
  /** Page to render. Omitted when the layout is a route element: the matched child route renders instead. */
  children?: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
  roles: AdminRole[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Operación',
    items: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['ADMIN'] },
      { path: '/admin/inventario', label: 'Inventario', icon: 'inventory', roles: ['ADMIN', 'INVENTARIO'] },
      { path: '/admin/reportes', label: 'Reportes', icon: 'reports', roles: ['ADMIN'] },
      { path: '/admin/leads', label: 'Leads', icon: 'leads', roles: ['ADMIN'] },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { path: '/admin/products', label: 'Productos', icon: 'products', roles: ['ADMIN'] },
      { path: '/admin/machines', label: 'Máquinas', icon: 'machines', roles: ['ADMIN'] },
      { path: '/admin/brands', label: 'Marcas', icon: 'brands', roles: ['ADMIN'] },
    ],
  },
  {
    label: 'Sistema',
    items: [{ path: '/admin/usuarios', label: 'Usuarios', icon: 'users', roles: ['ADMIN'] }],
  },
];

const roleLabels: Record<AdminRole, string> = {
  ADMIN: 'Administrador',
  INVENTARIO: 'Inventario',
};

const initialsOf = (value: string) =>
  value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');

const ThemeSwitch: React.FC = () => {
  const theme = useOptionalTheme();
  if (!theme) return null;
  return (
    <div className="adm-theme" role="group" aria-label="Apariencia">
      <button type="button" aria-pressed={!theme.isDark} onClick={() => theme.isDark && theme.toggleTheme()}>
        <Icon name="sun" size={16} />
        Claro
      </button>
      <button type="button" aria-pressed={theme.isDark} onClick={() => !theme.isDark && theme.toggleTheme()}>
        <Icon name="moon" size={16} />
        Oscuro
      </button>
    </div>
  );
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useOptionalTheme();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newLeads, setNewLeads] = useState(0);
  const user = getStoredUser();
  const isAdmin = user?.role === 'ADMIN';
  const homePath = user ? roleHome(user.role) : '/admin/login';

  // Only admins see Leads, so only they need the new-leads counter. It is
  // refreshed on every page change, since the layout no longer remounts and
  // leads can arrive or be handled meanwhile. A failed request just keeps the
  // last number; it is not worth interrupting the panel.
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    adminApi
      .getStats()
      .then((stats) => {
        if (!cancelled) setNewLeads(stats?.leads?.new ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAdmin, location.pathname]);

  const handleLogout = () => {
    adminApi.logout();
    navigate('/admin/login');
  };

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: user ? group.items.filter((item) => item.roles.includes(user.role)) : [],
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="adm">
      {/* Top bar (below lg the sidebar becomes a drawer) */}
      <header className="adm-rail lg:hidden sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-(--a-rail-line) px-2">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          className="adm-brackets flex h-11 w-11 items-center justify-center bg-transparent text-(--a-rail-ink)"
        >
          <Icon name="menu" size={22} />
        </button>
        <Link to={homePath} aria-label="Ir al inicio del panel" className="flex items-center">
          <AdminLogo height={24} onDark={Boolean(theme?.isDark)} />
        </Link>
        {theme && (
          <button
            onClick={theme.toggleTheme}
            aria-label={theme.isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="adm-brackets ml-auto flex h-11 w-11 items-center justify-center bg-transparent text-(--a-rail-ink)"
          >
            <Icon name={theme.isDark ? 'sun' : 'moon'} size={20} />
          </button>
        )}
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-(--a-scrim) lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`adm-rail fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-(--a-rail-line) transition-transform duration-200 lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-(--a-rail-line) px-4 py-5">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Link
              to={homePath}
              onClick={() => setMenuOpen(false)}
              aria-label="Ir al inicio del panel"
              className="adm-brackets self-start"
            >
              <AdminLogo height={32} onDark={Boolean(theme?.isDark)} />
            </Link>
            <div className="text-[13px] text-(--a-rail-muted)">Panel interno</div>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
            className="adm-brackets lg:hidden flex h-10 w-10 items-center justify-center bg-transparent text-(--a-rail-ink)"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="Secciones del panel">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <div className="adm-rail-group">{group.label}</div>
              <ul className="m-0 list-none space-y-0.5 p-0">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      aria-current={location.pathname === item.path ? 'page' : undefined}
                      className="adm-rail-nav-link adm-brackets"
                    >
                      <Icon name={item.icon} />
                      <span>{item.label}</span>
                      {item.path === '/admin/leads' && newLeads > 0 && (
                        <span
                          aria-label={`${newLeads} leads nuevos`}
                          className="adm-num ml-auto min-w-6 bg-(--a-red) px-1.5 text-center text-[13px] font-semibold leading-5 text-white"
                        >
                          {newLeads}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-(--a-rail-line) p-3">
          {user && (
            <div className="flex items-center gap-3 px-1">
              <div
                aria-hidden="true"
                className="adm-num flex h-10 w-10 shrink-0 items-center justify-center border border-(--a-rail-muted) text-[13px] font-medium"
              >
                {initialsOf(user.name || user.email)}
              </div>
              <div className="min-w-0 text-[13px] leading-snug">
                <div className="truncate font-semibold">{user.name || user.email}</div>
                {user.name && <div className="truncate text-(--a-rail-muted)">{user.email}</div>}
                <div className="mt-1">
                  <Tag mark={user.role === 'ADMIN' ? 'sq' : 'sqdash'} tone="plain">
                    {roleLabels[user.role]}
                  </Tag>
                </div>
              </div>
            </div>
          )}
          <ThemeSwitch />
          <div className="border-t border-(--a-rail-line) pt-2">
            <button onClick={() => setShowPasswordModal(true)} className="adm-rail-action adm-brackets">
              <Icon name="key" size={18} />
              Cambiar contraseña
            </button>
            <button onClick={handleLogout} className="adm-rail-action adm-brackets">
              <Icon name="exit" size={18} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {/* Keyed by path so each page fades in; the shell around it stays mounted. */}
      <div key={location.pathname} className="adm-page-enter lg:ml-64">
        {children ?? <Outlet />}
      </div>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

export default AdminLayout;
