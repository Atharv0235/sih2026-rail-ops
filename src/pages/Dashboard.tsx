import { useAuthStore } from '../store/useAuthStore';
import { ControllerDashboard } from '../components/dashboard/ControllerDashboard';
import { EngineerDashboard }   from '../components/dashboard/EngineerDashboard';
import { useEffect } from 'react';

/**
 * Dashboard — conditional render based on role.
 * CONTROLLER → ControllerDashboard (Command Center)
 * ENGINEER   → EngineerDashboard   (Mode 2b)
 * No role   → auto-sets CONTROLLER for dev preview
 */
export function Dashboard() {
  const role        = useAuthStore(s => s.role);
  const department  = useAuthStore(s => s.department);
  const displayName = useAuthStore(s => s.displayName);
  const setRole     = useAuthStore(s => s.setRole);

  // Dev convenience: if no role set, default to CONTROLLER
  useEffect(() => {
    if (!role) {
      setRole('CONTROLLER');
    }
  }, [role, setRole]);

  const effectiveRole = role || 'CONTROLLER';

  return effectiveRole === 'CONTROLLER'
    ? <ControllerDashboard />
    : <EngineerDashboard department={department} displayName={displayName} />;
}
