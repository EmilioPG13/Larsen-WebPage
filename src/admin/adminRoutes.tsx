import { Navigate, Route } from 'react-router-dom';
import AdminLogin from './pages/Login';
import AdminDashboard from './pages/Dashboard';
import AdminProducts from './pages/Products';
import AdminMachines from './pages/Machines';
import AdminBrands from './pages/Brands';
import AdminLeads from './pages/Leads';
import AdminUsers from './pages/Users';
import AdminReports from './pages/Reports';
import AdminInventory from './pages/Inventory';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import RequireRole from './components/RequireRole';
import type { AdminRole } from './services/session';

const ADMIN: AdminRole[] = ['ADMIN'];
const BOTH: AdminRole[] = ['ADMIN', 'INVENTARIO'];

/**
 * The panel as one nested route: ProtectedRoute and AdminLayout sit above every
 * page, so changing page keeps them mounted. The session is validated and the
 * menu built once, and only the page inside the layout is swapped.
 */
export const adminRoutes = (
  <>
    {/* The bare /admin is what people type: send it to the panel, which asks for a login when there is no session. */}
    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route
      element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/admin/dashboard" element={<RequireRole roles={ADMIN}><AdminDashboard /></RequireRole>} />
      <Route path="/admin/products" element={<RequireRole roles={ADMIN}><AdminProducts /></RequireRole>} />
      <Route path="/admin/machines" element={<RequireRole roles={ADMIN}><AdminMachines /></RequireRole>} />
      <Route path="/admin/brands" element={<RequireRole roles={ADMIN}><AdminBrands /></RequireRole>} />
      <Route path="/admin/leads" element={<RequireRole roles={ADMIN}><AdminLeads /></RequireRole>} />
      <Route path="/admin/usuarios" element={<RequireRole roles={ADMIN}><AdminUsers /></RequireRole>} />
      <Route path="/admin/inventario" element={<RequireRole roles={BOTH}><AdminInventory /></RequireRole>} />
      <Route path="/admin/reportes" element={<RequireRole roles={ADMIN}><AdminReports /></RequireRole>} />
    </Route>
  </>
);
