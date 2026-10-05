import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminRoleContext } from '../services/sessionContext';
import { roleHome, type AdminRole } from '../services/session';

interface RequireRoleProps {
  roles: AdminRole[];
  children: React.ReactNode;
}

/**
 * Per-page role check inside the persistent panel layout. The session is
 * validated once by ProtectedRoute; this only sends a wrong role home, so a
 * page change does not hit the API again.
 */
const RequireRole: React.FC<RequireRoleProps> = ({ roles, children }) => {
  const role = useContext(AdminRoleContext);

  if (role && !roles.includes(role)) {
    return <Navigate to={roleHome(role)} replace />;
  }

  return <>{children}</>;
};

export default RequireRole;
