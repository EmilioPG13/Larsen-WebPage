import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import { getStoredUser, type AdminRole } from '../services/session';
import ChangePasswordModal from './ChangePasswordModal';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: AdminRole[];
}

const navItems: NavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN'] },
  { path: '/admin/inventario', label: 'Inventario', icon: '🗃️', roles: ['ADMIN', 'INVENTARIO'] },
  { path: '/admin/products', label: 'Productos', icon: '📦', roles: ['ADMIN'] },
  { path: '/admin/machines', label: 'Máquinas', icon: '🤖', roles: ['ADMIN'] },
  { path: '/admin/brands', label: 'Marcas', icon: '🏷️', roles: ['ADMIN'] },
  { path: '/admin/leads', label: 'Leads', icon: '📋', roles: ['ADMIN'] },
  { path: '/admin/usuarios', label: 'Usuarios', icon: '👥', roles: ['ADMIN'] },
];

const roleLabels: Record<AdminRole, string> = {
  ADMIN: 'Administrador',
  INVENTARIO: 'Inventario',
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newLeads, setNewLeads] = useState(0);
  const user = getStoredUser();
  const isAdmin = user?.role === 'ADMIN';

  // Only admins see Leads, so only they need the new-leads counter. A failed
  // request just hides the badge; it is not worth interrupting the panel.
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
  }, [isAdmin]);

  const handleLogout = () => {
    adminApi.logout();
    navigate('/admin/login');
  };

  const visibleItems = user ? navItems.filter((item) => item.roles.includes(user.role)) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar (below lg the sidebar becomes a drawer) */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-white px-4 py-3 shadow">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          className="p-2 -ml-2 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-lg font-bold text-gray-900">Larsen Admin</span>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-lg transition-transform duration-200 lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Larsen Admin</h1>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
            className="lg:hidden p-1 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {visibleItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-larsen-red text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.path === '/admin/leads' && newLeads > 0 && (
                    <span
                      aria-label={`${newLeads} leads nuevos`}
                      className="ml-auto rounded-full bg-larsen-red px-2 py-0.5 text-xs font-semibold text-white"
                    >
                      {newLeads}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200 space-y-2">
          {user && (
            <div className="px-1 pb-1 text-sm">
              <div className="font-medium text-gray-900 truncate">{user.name || user.email}</div>
              {user.name && <div className="text-gray-500 truncate">{user.email}</div>}
              <div className="text-xs text-gray-500 mt-1">{roleLabels[user.role]}</div>
            </div>
          )}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cambiar contraseña
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {children}
      </div>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

export default AdminLayout;
