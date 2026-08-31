import { Link } from 'react-router-dom';
import type { Department } from '../../store/useAuthStore';

interface EngineerDashboardProps {
  department: Department;
  displayName?: string;
}

const DEPT_CONFIG = {
  Track: {
    label: 'Track (TMS)', color: 'var(--blue)', bg: 'var(--blue-soft)',
    critical: 4, pending: 16, overdue: 1, scheduled: 6,
    tag: 'dept-track',
  },
  Signal: {
    label: 'Signal (SMMS)', color: 'var(--amber-status)', bg: 'var(--amber-status-soft)',
    critical: 5, pending: 12, overdue: 2, scheduled: 4,
    tag: 'dept-signal',
  },
  Traction: {
    label: 'Traction (TDMS)', color: 'var(--green)', bg: 'var(--green-soft)',
    critical: 3, pending: 10, overdue: 0, scheduled: 5,
    tag: 'dept-traction',
  },
};

/**
 * EngineerDashboard (Mode 2b)
 * Restricted single-department view — only defects, asset urgency,
 * and crew dispatch for the engineer's own department. No live feed access.
 */
export function EngineerDashboard({ department, displayName }: EngineerDashboardProps) {
  const dept = department ?? 'Track';
  const cfg  = DEPT_CONFIG[dept];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Role badge ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ background: 'var(--green-soft)', color: 'var(--green)', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 9999, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Dept Engineer · {dept} Dept
        </span>
        {displayName && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Welcome, {displayName}</span>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 'auto', fontWeight: 500 }}>
          Read-only access to Live Opportunity Feed
        </span>
      </div>

      {/* ── Department KPI cards (filtered) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {[
          { label: `${dept} Critical`,  value: cfg.critical.toString(), color: 'var(--red)' },
          { label: 'Pending Tasks',     value: cfg.pending.toString(),  color: 'var(--text-primary)' },
          { label: 'Overdue',           value: cfg.overdue.toString(),  color: 'var(--amber-status)' },
          { label: 'Scheduled Blocks',  value: cfg.scheduled.toString(),color: 'var(--green)' },
        ].map((kpi, i) => (
          <div key={i} className="card card-shadow" style={{ padding: '24px 20px' }}>
            <div className="t-label" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{kpi.label}</div>
            <div className="t-mono" style={{ fontSize: 36, fontWeight: 800, color: kpi.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* ── Asset urgency strip ── */}
      <div className="card card-shadow" style={{ padding: '20px 28px' }}>
        <div className="t-label" style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Asset Urgency — {cfg.label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { asset: dept === 'Track' ? 'Rail Km 142' : dept === 'Signal' ? 'Point Machine GWL-3' : 'OHE Catenary BPL', score: 91, status: 'CRITICAL', shadow: true },
            { asset: dept === 'Track' ? 'Ballast GWL Yd' : dept === 'Signal' ? 'Track Circuit JHS' : 'Section Insulator ET', score: 74, status: 'HIGH',     shadow: true },
            { asset: dept === 'Track' ? 'Gauge Km 156'  : dept === 'Signal' ? 'Relay Humidity BPL' : 'OHE Mast JHS',       score: 55, status: 'MEDIUM',   shadow: false },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--panel)', borderRadius: 10, padding: '12px 16px' }}>
              <span className={`dept-tag ${cfg.tag}`}>{dept.slice(0, 3).toUpperCase()}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row.asset}</span>
              <span className="t-mono" style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>Score {row.score}</span>
              <span className={`badge badge-${row.status.toLowerCase()}`}>{row.status}</span>
              {row.shadow && <span className="badge badge-yes" style={{ fontSize: 11 }}>Shadow ✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Crew dispatch state ── */}
      <div className="card card-shadow" style={{ padding: '20px 28px' }}>
        <div className="t-label" style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Crew Dispatch State</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { crew: 'Crew A', status: 'Deployed', location: 'GWL Yard', c: 'var(--green)', bg: 'var(--green-soft)' },
            { crew: 'Crew B', status: 'Standby',  location: 'JHS Base',  c: 'var(--amber-status)', bg: 'var(--amber-status-soft)' },
            { crew: 'Crew C', status: 'En Route', location: 'Km 147',    c: 'var(--blue)', bg: 'var(--blue-soft)' },
          ].map(c => (
            <div key={c.crew} style={{ background: c.bg, borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.c, marginBottom: 4 }}>{c.crew}</div>
              <div style={{ fontSize: 12, color: c.c, opacity: 0.75 }}>{c.status} · {c.location}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA (restricted — no Live Feed link) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Link to="/backlog" style={{ textDecoration: 'none' }}>
          <div className="card card-shadow" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-dark)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>My Backlog</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{cfg.pending} pending · {cfg.critical} critical · {dept} only</div>
            </div>
            <div style={{ fontSize: 24, color: 'var(--brand-mid)' }}>→</div>
          </div>
        </Link>
        <Link to="/planner" style={{ textDecoration: 'none' }}>
          <div className="card card-shadow" style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-dark)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Block Schedule</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>View Gantt (Read-only) · {cfg.scheduled} blocks assigned</div>
            </div>
            <div style={{ fontSize: 24, color: 'var(--brand-mid)' }}>→</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
