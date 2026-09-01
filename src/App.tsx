import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { EngTaskBacklogPage } from './pages/EngTaskBacklogPage';
import { useEffect } from 'react';

// Redirect component — sends browser straight to the static HTML file in /public
function StaticRedirect({ to }: { to: string }) {
  useEffect(() => { window.location.replace(to); }, [to]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<Navigate to="/login" replace />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/dashboard"     element={<StaticRedirect to="/dashboard.html" />} />
        <Route path="/backlog"       element={<StaticRedirect to="/backlog.html" />} />
        <Route path="/planner"       element={<StaticRedirect to="/planner.html" />} />
        <Route path="/live"          element={<StaticRedirect to="/live.html" />} />
        {/* ── Dept Engineer pages ── */}
        <Route path="/eng-backlog"   element={<EngTaskBacklogPage />} />
        <Route path="*"              element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
