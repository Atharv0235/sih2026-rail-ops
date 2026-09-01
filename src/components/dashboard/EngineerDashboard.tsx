import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export function EngineerDashboard() {
  const role = useAuthStore(s => s.role) as string;
  const displayName = useAuthStore(s => s.displayName);

  let title = '';
  let dataCol = '';
  let resource = '';
  let blockType = '';
  let deptConfig: any = {};
  let mockData: any[] = [];
  let crewData: any[] = [];

  if (role === 'ENGINEER_TRACK') {
    title = 'Department: Engineering (P.Way)';
    dataCol = 'Chainage (Km)';
    resource = 'BCM / Tamping Machine';
    blockType = 'Traffic Block';
    deptConfig = { label: 'Track (TMS)', color: 'var(--blue)', bg: 'var(--blue-soft)', critical: 4, pending: 16, overdue: 1, scheduled: 6, tag: 'dept-track' };
    mockData = [
      { asset: 'Rail Km 142', score: 91, status: 'CRITICAL', shadow: true },
      { asset: 'Ballast GWL Yd', score: 74, status: 'HIGH', shadow: true },
      { asset: 'Gauge Km 156', score: 55, status: 'MEDIUM', shadow: false },
    ];
    crewData = [
      { crew: 'P.Way Gang A', status: 'Deployed', location: 'GWL Yard', c: 'var(--green)', bg: 'var(--green-soft)' },
      { crew: 'P.Way Gang B', status: 'Standby', location: 'JHS Base', c: 'var(--amber-status)', bg: 'var(--amber-status-soft)' }
    ];
  } else if (role === 'ENGINEER_SIGNAL') {
    title = 'Department: Signal & Telecom';
    dataCol = 'Signal ID';
    resource = 'Testing Kit';
    blockType = 'Disconnection / Traffic Block';
    deptConfig = { label: 'Signal (SMMS)', color: 'var(--amber-status)', bg: 'var(--amber-status-soft)', critical: 5, pending: 12, overdue: 2, scheduled: 4, tag: 'dept-signal' };
    mockData = [
      { asset: 'Point Machine GWL-3', score: 91, status: 'CRITICAL', shadow: true },
      { asset: 'Track Circuit JHS', score: 74, status: 'HIGH', shadow: true },
      { asset: 'Relay Humidity BPL', score: 55, status: 'MEDIUM', shadow: false },
    ];
    crewData = [
      { crew: 'S&T Unit 1', status: 'En Route', location: 'Km 147', c: 'var(--blue)', bg: 'var(--blue-soft)' }
    ];
  } else if (role === 'ENGINEER_TRACTION') {
    title = 'Department: Traction Distribution (TRD)';
    dataCol = 'Mast Number';
    resource = 'Tower Wagon';
    blockType = 'Power Block';
    deptConfig = { label: 'Traction (TDMS)', color: 'var(--green)', bg: 'var(--green-soft)', critical: 3, pending: 10, overdue: 0, scheduled: 5, tag: 'dept-traction' };
    mockData = [
      { asset: 'OHE Catenary BPL', score: 91, status: 'CRITICAL', shadow: true },
      { asset: 'Section Insulator ET', score: 74, status: 'HIGH', shadow: true },
      { asset: 'OHE Mast JHS', score: 55, status: 'MEDIUM', shadow: false },
    ];
    crewData = [
      { crew: 'TRD Tower A', status: 'Deployed', location: 'ET Yard', c: 'var(--green)', bg: 'var(--green-soft)' }
    ];
  } else {
    // Fallback if accessed via direct routing somehow
    title = 'Department: Unknown';
    dataCol = 'Asset';
    deptConfig = { label: 'Unknown', color: '#999', bg: '#eee', critical: 0, pending: 0, overdue: 0, scheduled: 0, tag: '' };
  }

  const deptShort = deptConfig.label?.split(' ')[0] || 'Unknown';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Role badge & Restrict header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ background: 'var(--green-soft)', color: 'var(--green)', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 9999, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Dept Engineer · {deptShort} Dept
        </span>
        {displayName && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Welcome, {displayName}</span>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 'auto', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>lock</span>
          Restricted View (Silo Enforced)
        </span>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{title}</h1>

      {/* ── Department KPI cards (filtered) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {[
          { label: `${deptShort} Critical`,  value: deptConfig.critical.toString(), color: 'var(--red)' },
          { label: 'Pending Tasks',     value: deptConfig.pending.toString(),  color: 'var(--text-primary)' },
          { label: 'Overdue',           value: deptConfig.overdue.toString(),  color: 'var(--amber-status)' },
          { label: 'Scheduled Blocks',  value: deptConfig.scheduled.toString(),color: 'var(--green)' },
        ].map((kpi, i) => (
          <div key={i} className="card card-shadow" style={{ padding: '24px 20px' }}>
            <div className="t-label" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{kpi.label}</div>
            <div className="t-mono" style={{ fontSize: 36, fontWeight: 800, color: kpi.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* ── Asset urgency strip ── */}
      <div className="card card-shadow" style={{ padding: '20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="t-label" style={{ color: 'var(--text-muted)' }}>Asset Urgency — {deptConfig.label}</div>
          <div className="t-label" style={{ color: 'var(--text-muted)' }}>{dataCol}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mockData.map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--panel)', borderRadius: 10, padding: '12px 16px' }}>
              <span className={`dept-tag ${deptConfig.tag}`}>{deptShort.slice(0, 3).toUpperCase()}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row.asset}</span>
              <span className="t-mono" style={{ fontSize: 13, fontWeight: 700, color: deptConfig.color }}>Score {row.score}</span>
              <span className={`badge badge-${row.status.toLowerCase()}`}>{row.status}</span>
              {row.shadow && <span className="badge badge-yes" style={{ fontSize: 11 }}>Shadow ✓</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* ── Request Form (Locked) ── */}
        <div className="card card-shadow" style={{ padding: '20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-muted)' }}>lock</span>
            <div className="t-label" style={{ color: 'var(--text-muted)' }}>Siloed Request Form</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Required Resource</label>
              <div style={{ background: 'var(--panel)', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                {resource} (Locked)
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Block Type</label>
              <div style={{ background: 'var(--panel)', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                {blockType} (Locked)
              </div>
            </div>
            <button style={{ background: deptConfig.bg, color: deptConfig.color, border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
              Submit Request
            </button>
          </div>
        </div>

        {/* ── Crew dispatch state ── */}
        <div className="card card-shadow" style={{ padding: '20px 28px' }}>
          <div className="t-label" style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Crew Dispatch State</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {crewData.map(c => (
              <div key={c.crew} style={{ background: c.bg, borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.c, marginBottom: 4 }}>{c.crew}</div>
                  <div style={{ fontSize: 12, color: c.c, opacity: 0.75 }}>{c.location}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: c.c, background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 999 }}>
                  {c.status}
                </div>
              </div>
            ))}
          </div>
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
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{deptConfig.pending} pending · {deptConfig.critical} critical · {deptShort} only</div>
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
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>View Gantt (Read-only) · {deptConfig.scheduled} blocks assigned</div>
            </div>
            <div style={{ fontSize: 24, color: 'var(--brand-mid)' }}>→</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
