import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import {
  clearSession,
  getStoredUser,
  getToken,
  roleHome,
  type AdminRole,
} from '../services/session';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles allowed on this route. Any signed-in user passes when omitted. */
  roles?: AdminRole[];
}

type Status = 'checking' | 'valid' | 'expired';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const token = getToken();
  const [status, setStatus] = useState<Status>('checking');
  // Role confirmed by the server; falls back to the stored user until then.
  const [serverRole, setServerRole] = useState<AdminRole | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    adminApi
      .getMe()
      .then((user) => {
        if (cancelled) return;
        setServerRole(user.role);
        setStatus('valid');
      })
      .catch((err) => {
        if (cancelled) return;
        const httpStatus = err?.response?.status;
        if (httpStatus === 401 || httpStatus === 403) {
          clearSession();
          setStatus('expired');
        } else if (getStoredUser()) {
          // Server unreachable: keep the session, the API still enforces roles.
          setStatus('valid');
        } else {
          clearSession();
          setStatus('expired');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token || status === 'expired') {
    return <Navigate to="/admin/login" replace />;
  }

  const role = serverRole ?? getStoredUser()?.role ?? null;

  // Redirect a wrong role as soon as it is known, without waiting for /me.
  if (roles && role && !roles.includes(role)) {
    return <Navigate to={roleHome(role)} replace />;
  }

  if (status === 'checking') {
    return (
      <div className="adm adm-label-sm flex min-h-screen items-center justify-center" role="status">
        Verificando sesión...
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
