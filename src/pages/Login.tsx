import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, type Role, type Department } from '../store/useAuthStore';

/* ── Constants ── */
const RAILWAY_BG = 'https://lh3.googleusercontent.com/aida/AEtjO1X9Rsr-HDFlvjbvREJ-iivgmgkq50poMLM6XhBn0fWv61Fwnnsg_UOKLwZPc4L8Zxw0I5LEOc_isdHyy37bkbx8sgZYfnZ-WuYA-GubIujCzFIlnE2zoFPhpgMRhvBYHDU_8l4xO2wlfhNM6T4qtbnQjtoGWrdcDg6-QMs1YQPQ4M9917T0XI_WLSnCSdVCgRUyHv1Quj9Ryib9SPaIP2Y5xovLjxDGUu7bd7ntjyCbijx6yEMAy1vfwnE';
const LOGO_IMG  = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmOI8i2gYzZShtTdrdeTTFk56tk8FT0ichbJ0UPGGJ1xeIjtTB11z1_t0SOFkLDkHqKlf0jMo5tcxHdXSxvZC0loUoKciiXOPXj1MP6mAignE1GBZRCBzt-1p5W7R_4Qa6jXDMUSglB4jziHcaN08wROJ1SIZaRqXJYDX5rGf40sn2RhpOvkUtn1INA_L_MenXLpKp7juMcybhKfSHt0wxCZqNACEEhamAb2kR5DaZOmcnGR93w1SQcjGe8mzqzTwr011xNr2y22A';
const TEAL      = '#14C9A0';

type LoginPersona = {
  id: string;
  role: Role;
  dept?: Department;
  label: string;
  icon: string;
  sub: string;
};

const ROLES: LoginPersona[] = [
  {
    id: 'controller',
    role: 'CONTROLLER',
    label: 'Chief Controller',
    icon: 'dashboard',
    sub: 'Master UI, live status, Mega Blocks, What-If Gantt. The only role that can Approve Blocks.',
  },
  {
    id: 'sse-pway',
    role: 'ENGINEER',
    dept: 'Track',
    label: 'SSE - P.Way',
    icon: 'directions_railway',
    sub: 'TMS: Track defects, fractures. Submits requests for Traffic Blocks & machine availability.',
  },
  {
    id: 'sse-signal',
    role: 'ENGINEER',
    dept: 'Signal',
    label: 'SSE - Signal',
    icon: 'traffic',
    sub: 'SMMS: Point machines, track circuits. Requests Disconnections or full Traffic Blocks.',
  },
  {
    id: 'sse-trd',
    role: 'ENGINEER',
    dept: 'Traction',
    label: 'SSE - TRD / CTPC',
    icon: 'electric_bolt',
    sub: 'TDMS: OHE, Insulators. Requests Power Blocks (diesel trains can still run!).',
  },
];

/* ── Injected CSS (from Stitch, adapted for React) ── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

  .ro-body    { font-family: 'Geist', sans-serif; }
  .ro-mono    { font-family: 'JetBrains Mono', monospace; }

  /* SOLID card — no glass */
  .ro-card {
    background: #111827;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 28px;
    padding: 56px 48px;
    width: 100%;
    max-width: 520px;
    box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  /* Role mini-cards */
  .ro-role-card {
    background: #1A2332;
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 16px;
    padding: 20px 20px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
    outline: none;
  }
  .ro-role-card:hover {
    border-color: ${TEAL};
    background: #1e2d40;
    transform: translateY(-2px);
  }
  .ro-role-card:focus-visible {
    border-color: ${TEAL};
    box-shadow: 0 0 0 3px rgba(20,201,160,0.25);
  }

  /* Input fields */
  .ro-input {
    width: 100%;
    height: 48px;
    background: #1A2332;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    padding-left: 48px;
    padding-right: 16px;
    color: #fff;
    font-size: 14px;
    font-family: 'Geist', sans-serif;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .ro-input::placeholder { color: rgba(255,255,255,0.35); }
  .ro-input:focus {
    border-color: ${TEAL};
    box-shadow: 0 0 0 2px rgba(20,201,160,0.20);
  }

  /* Primary button */
  .ro-btn {
    width: 100%;
    height: 52px;
    background: ${TEAL};
    color: #000;
    font-weight: 700;
    font-size: 15px;
    font-family: 'Geist', sans-serif;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    transition: filter 0.2s, transform 0.1s;
  }
  .ro-btn:hover  { filter: brightness(1.1); }
  .ro-btn:active { transform: scale(0.99); }

  /* Pulsing corridor dot */
  .ro-pulse {
    animation: roPulse 2s infinite;
  }
  @keyframes roPulse {
    0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(20,201,160,0.7); }
    70%  { transform: scale(1);    box-shadow: 0 0 0 6px rgba(20,201,160,0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(20,201,160,0); }
  }
`;

/* ── Corridor pill (shared) ── */
function CorridorPill() {
  return (
    <div style={{ position: 'absolute', bottom: 32, zIndex: 10 }}>
      <div style={{
        background: 'rgba(26,35,50,0.85)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 9999,
        padding: '8px 16px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div className="ro-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: TEAL, flexShrink: 0 }} />
        <span className="ro-mono" style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)', letterSpacing: '0.08em' }}>
          ACTIVE CORRIDOR GWL → JHS
        </span>
      </div>
    </div>
  );
}

/* ── Shared background wrapper ── */
function BgWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="ro-body" style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Railway background */}
      <img
        src={RAILWAY_BG}
        alt="Railway tracks at golden hour"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      />
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        {children}
      </div>

      <CorridorPill />
    </div>
  );
}

/* ── STEP 1: Role Picker ── */
function RolePicker({ onSelect }: { onSelect: (persona: LoginPersona) => void }) {
  return (
    <BgWrapper>
      <div className="ro-card">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <img src={LOGO_IMG} alt="RAIL-OPS" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} />
          <span style={{ color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em' }}>RAIL-OPS</span>
        </div>

        {/* Ministry label */}
        <p className="ro-mono" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
          Ministry of Railways · NCR Division
        </p>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.10)', marginBottom: 28 }} />

        {/* Heading */}
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Select Your Role</h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 32 }}>
          No credentials required · prototype mode
        </p>

        {/* Role cards — side by side */}
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
          {ROLES.map(r => (
            <button key={r.id} className="ro-role-card" style={{ height: '100%' }} onClick={() => onSelect(r)}>
              <span className="material-symbols-outlined" style={{ color: TEAL, fontSize: 30, marginBottom: 14, fontVariationSettings: "'FILL' 1" }}>
                {r.icon}
              </span>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{r.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.60)', fontSize: 12, lineHeight: 1.5 }}>{r.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </BgWrapper>
  );
}

/* ── STEP 2: Login Form ── */
function LoginForm({ persona, onBack, onSubmit }: {
  persona: LoginPersona;
  onBack: () => void;
  onSubmit: (name: string) => void;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const [name, setName]       = useState('');
  const roleLabel = persona.label;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(name);
  }

  return (
    <BgWrapper>
      <div className="ro-card">
        {/* Role pill badge */}
        <div className="ro-mono" style={{
          background: TEAL, color: '#000', fontWeight: 700,
          fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '4px 14px', borderRadius: 9999, marginBottom: 24,
        }}>
          {roleLabel}
        </div>

        {/* Welcome heading */}
        <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
          Welcome, {roleLabel}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: 14, marginBottom: 32 }}>
          Enter your details to access RAIL-OPS
        </p>

        {/* Form */}
        <form style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmit}>

          {/* Full Name */}
          <div style={{ position: 'relative', width: '100%' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: TEAL, fontSize: 20, pointerEvents: 'none' }}>person</span>
            <input className="ro-input" type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* City / Division */}
          <div style={{ position: 'relative', width: '100%' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: TEAL, fontSize: 20, pointerEvents: 'none' }}>location_on</span>
            <input className="ro-input" type="text" placeholder="City or Division" required />
          </div>

          {/* Employee ID */}
          <div style={{ position: 'relative', width: '100%' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: TEAL, fontSize: 20, pointerEvents: 'none' }}>badge</span>
            <input className="ro-input" type="text" placeholder="Employee ID (e.g. NCR-2026-001)" required />
          </div>

          {/* Password */}
          <div style={{ position: 'relative', width: '100%' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: TEAL, fontSize: 20, pointerEvents: 'none' }}>lock</span>
            <input className="ro-input" type={showPwd ? 'text' : 'password'} placeholder="Password" style={{ paddingRight: 48 }} required />
            <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', padding: 0, display: 'flex', alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showPwd ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>

          {/* Submit */}
          <button className="ro-btn" type="submit" style={{ marginTop: 8 }}>
            Access RAIL-OPS
          </button>
        </form>

        {/* Back link */}
        <button
          onClick={onBack}
          style={{ marginTop: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', fontSize: 14, fontFamily: 'inherit', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.80)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.40)')}
        >
          ← Back to role selection
        </button>
      </div>
    </BgWrapper>
  );
}

/* ── Page entry point ── */
export function Login() {
  const navigate   = useNavigate();
  const setRole        = useAuthStore(s => s.setRole);
  const setDepartment  = useAuthStore(s => s.setDepartment);
  const setDisplayName = useAuthStore(s => s.setDisplayName);
  const [step, setStep]         = useState<'pick' | 'form'>('pick');
  const [selected, setSelected] = useState<LoginPersona>(ROLES[0]);

  function handleRolePick(persona: LoginPersona) {
    setSelected(persona);
    setStep('form');
  }

  function handleSubmit(name: string) {
    if (selected.role) setRole(selected.role);
    setDisplayName(name);
    
    // Assign a default department to engineers for the prototype
    if (selected.dept) {
      setDepartment(selected.dept);
    }
    
    if (selected.role === 'ENGINEER') {
      window.location.href = '/eng-dashboard.html';
    } else {
      navigate('/dashboard');
    }
  }

  return (
    <>
      <style>{styles}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />

      {step === 'pick'
        ? <RolePicker onSelect={handleRolePick} />
        : <LoginForm persona={selected} onBack={() => setStep('pick')} onSubmit={handleSubmit} />
      }
    </>
  );
}
