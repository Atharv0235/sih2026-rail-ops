import { Outlet } from 'react-router-dom';

// The ControllerDashboard renders its own Sidebar + Header (exact Lovable layout).
// This Layout wrapper just renders the Outlet for routing.
export function Layout() {
  return <Outlet />;
}
