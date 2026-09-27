import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore, type Role } from '../../store/useAuthStore';

interface RoleGuardProps {
  allowedRoles: Exclude<Role, null>[];
  redirectTo?: string;
  children: ReactNode;
}

/**
 * RoleGuard — HOC that wraps any route/component.
 * If the authenticated role is NOT in `allowedRoles`, redirects to `redirectTo` (default: /dashboard).
 * If there is no role at all (unauthenticated), redirects to /login.
 */
export function RoleGuard({
  allowedRoles,
  redirectTo = '/dashboard',
  children,
}: RoleGuardProps) {
  const role = useAuthStore(s => s.role);

  // Not logged in at all
  if (!role) return <Navigate to="/login" replace />;

  // Logged in but wrong role
  if (!allowedRoles.includes(role as Exclude<Role, null>)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
