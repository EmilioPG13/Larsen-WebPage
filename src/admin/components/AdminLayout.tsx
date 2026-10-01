import { useState } from 'react';
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
  const user = getStoredUser();

  const handleLogout = () => {
    adminApi.logout();
    navigate('/admin/login');
  };

  const visibleItems = user ? navItems.filter((item) => item.roles.includes(user.role)) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Larsen Admin</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {visibleItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-larsen-red text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 space-y-2">
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
      <div className="ml-64">
        {children}
      </div>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

export default AdminLayout;
