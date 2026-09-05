import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';

/* ─────────────────────────────────────────────
   Design tokens mirroring rail-ops-login-vivid
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

  :root {
    --chief:   #0f9d78;
    --track:   #2f6fed;
    --signal:  #16a34a;
    --traction:#ea7c1f;
    --text-0: #1c2534;
    --text-1: #57667c;
    --text-2: #889ab0;
    --glass-left:  rgba(255,255,255,0.50);
    --glass-right: rgba(255,255,255,0.82);
    --glass-solo:  rgba(255,255,255,0.68);
    --field-bg:    rgba(255,255,255,0.72);
    --field-border:rgba(32,41,56,0.12);
    --border:      rgba(32,41,56,0.10);
  }

  .rv-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .rv-root {
    font-family: 'IBM Plex Sans', sans-serif;
    color: var(--text-0);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(1100px 650px at 20% 10%, rgba(255,196,140,0.6), transparent 60%),
      radial-gradient(900px 600px at 85% 90%, rgba(150,190,255,0.5), transparent 55%),
      linear-gradient(160deg, #f6ede2 0%, #eef1f6 55%, #e7edf6 100%);
  }

  .rv-bg-photo { position: absolute; inset: 0; z-index: 0; }
  .rv-bg-photo img { width: 100%; height: 100%; object-fit: cover; filter: saturate(1.35) brightness(1.06) contrast(1.05); }
  .rv-bg-wash {
    position: absolute; inset: 0; z-index: 1;
    background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.30) 40%, rgba(255,255,255,0.55) 100%);
  }
  .rv-glow-blob {
    position: absolute; z-index: 1;
    width: 640px; height: 640px;
    top: 50%; left: 50%; transform: translate(-50%,-46%);
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.4;
    transition: background-color 0.5s ease;
    mix-blend-mode: multiply;
    pointer-events: none;
  }

  /* ── STEP 1 solo card ── */
  .rv-card-solo {
    position: relative; z-index: 2;
    width: 540px; max-width: 100%;
    border-radius: 24px;
    background: var(--glass-solo);
    border: 1px solid rgba(255,255,255,0.7);
    box-shadow: 0 45px 100px -35px rgba(20,30,50,0.4), inset 0 1px 0 rgba(255,255,255,0.6);
    backdrop-filter: blur(20px) saturate(1.3);
    -webkit-backdrop-filter: blur(20px) saturate(1.3);
    padding: 0;
    overflow: hidden;
  }
  .rv-accent-bar { height: 5px; width: 100%; transition: background-color 0.4s ease; }
  .rv-card-inner { padding: 36px 38px 32px; }

  header.rv-header { text-align: center; margin-bottom: 18px; }
  .rv-brand { display: flex; align-items: center; justify-content: center; gap: 11px; margin-bottom: 6px; }
  .rv-brand-mark {
    width: 38px; height: 38px; border-radius: 11px;
    background: linear-gradient(145deg, #1c2534, #0a101c);
    display: flex; align-items: center; justify-content: center;
  }
  .rv-brand-mark svg { width: 19px; height: 19px; }
  .rv-brand-name { font-weight: 700; font-size: 22px; letter-spacing: 0.3px; }
  .rv-division { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 1.3px; color: var(--text-2); }

  .rv-signal-lamp { display: flex; justify-content: center; align-items: center; gap: 9px; margin: 16px 0 18px; }
  .rv-rail-line { height: 1px; width: 52px; background: linear-gradient(90deg, transparent, var(--border)); }
  .rv-rail-line.right { background: linear-gradient(270deg, transparent, var(--border)); }
  .rv-lamp-dot { width: 8px; height: 8px; border-radius: 50%; }
  .rv-lamp-dot.red   { background: #e5484d; box-shadow: 0 0 8px rgba(229,72,77,0.6); }
  .rv-lamp-dot.amber { background: #f2a93b; box-shadow: 0 0 8px rgba(242,169,59,0.5); opacity: 0.55; }
  .rv-lamp-dot.green { background: #16a34a; box-shadow: 0 0 8px rgba(22,163,74,0.6); animation: rvLampPulse 2.2s infinite; }
  @keyframes rvLampPulse { 0%,100%{ opacity:1; } 50%{ opacity:0.55; } }

  .rv-title    { font-size: 20px; font-weight: 700; text-align: center; color: var(--text-0); letter-spacing: -0.2px; }
  .rv-subtitle { text-align: center; font-size: 13px; color: var(--text-1); margin-top: 5px; margin-bottom: 26px; }

  .rv-carousel { position: relative; height: 130px; display: flex; align-items: center; justify-content: center; }
  .rv-carousel-track { position: relative; width: 100%; height: 100%; }
  .rv-avatar-ring {
    position: absolute; top: 50%; left: 50%;
    border-radius: 50%;
    transition: transform 0.38s cubic-bezier(.2,.8,.25,1), opacity 0.38s ease;
  }
  .rv-avatar-ring.is-current { padding: 3px; }
  .rv-avatar-ring.is-current .rv-avatar { box-shadow: 0 14px 30px -12px rgba(20,30,50,0.4); }
  .rv-avatar {
    width: 100%; height: 100%; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    background: rgba(255,255,255,0.6);
    border: 2px solid var(--border);
    transition: background 0.2s, border-color 0.2s;
  }
  .rv-avatar svg { width: 28px; height: 28px; }

  .rv-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 34px; height: 34px; border-radius: 50%;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.65);
    color: var(--text-1);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 15px;
    transition: background 0.2s, color 0.2s;
    z-index: 20;
  }
  .rv-arrow:hover { background: #fff; color: var(--text-0); }
  .rv-arrow.left  { left:  -6px; }
  .rv-arrow.right { right: -6px; }

  .rv-persona-info  { text-align: center; margin-top: 22px; }
  .rv-persona-name  { font-size: 17.5px; font-weight: 700; color: var(--text-0); }
  .rv-persona-badge {
    display: inline-block; font-family: 'IBM Plex Mono', monospace;
    font-size: 10px; font-weight: 600; letter-spacing: 1px;
    padding: 3px 10px; border-radius: 20px; margin-top: 8px; color: #fff;
  }
  .rv-persona-desc { font-size: 12.5px; color: var(--text-1); margin-top: 10px; line-height: 1.55; max-width: 380px; margin-left: auto; margin-right: auto; }
  .rv-tap-hint { text-align: center; font-size: 11px; color: var(--text-2); margin-top: 22px; }

  /* ── STEP 2 two-column shell ── */
  .rv-shell {
    position: relative; z-index: 2;
    width: 920px; max-width: 100%;
    min-height: 520px;
    display: grid;
    grid-template-columns: 320px 1fr;
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.6);
    box-shadow: 0 40px 90px -35px rgba(20,30,50,0.35), inset 0 1px 0 rgba(255,255,255,0.5);
    backdrop-filter: blur(18px) saturate(1.2);
    -webkit-backdrop-filter: blur(18px) saturate(1.2);
  }

  .rv-rail {
    position: relative;
    background: var(--glass-left);
    border-right: 1px solid var(--border);
    padding: 30px 28px;
    display: flex; flex-direction: column;
  }
  .rv-back-link {
    display: flex; align-items: center; gap: 7px;
    font-size: 12.5px; color: var(--text-1);
    cursor: pointer; width: fit-content;
    transition: color 0.15s;
    background: none; border: none; font-family: inherit;
  }
  .rv-back-link:hover { color: var(--text-0); }

  .rv-role-block { margin-top: auto; margin-bottom: auto; padding: 32px 0; }
  .rv-role-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: rgba(0,0,0,0.06);
    border: 1px solid rgba(0,0,0,0.10);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 18px;
  }
  .rv-role-icon svg { width: 24px; height: 24px; }
  .rv-role-badge2 { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 1.2px; font-weight: 500; margin-bottom: 8px; }
  .rv-role-title  { font-size: 19px; font-weight: 600; line-height: 1.3; margin-bottom: 6px; }
  .rv-role-sub    { font-size: 12.5px; color: var(--text-1); line-height: 1.55; }

  .rv-track-motif {
    margin-top: auto; height: 34px;
    background-image: repeating-linear-gradient(90deg, rgba(32,41,56,0.14) 0 3px, transparent 3px 16px);
    background-position: bottom; background-repeat: repeat-x; background-size: auto 3px;
    position: relative;
  }
  .rv-track-motif::before { content: ""; position: absolute; left: 0; right: 0; bottom: 9px; height: 2px; background: rgba(32,41,56,0.18); }
  .rv-track-motif::after  { content: ""; position: absolute; left: 0; right: 0; bottom: 2px; height: 2px; background: rgba(32,41,56,0.18); }

  .rv-form-side {
    position: relative;
    background: var(--glass-right);
    padding: 46px 50px;
    display: flex; flex-direction: column; justify-content: center;
  }
  .rv-form-heading { font-size: 24px; font-weight: 600; margin-bottom: 7px; }
  .rv-form-sub { font-size: 13.5px; color: var(--text-1); margin-bottom: 30px; }

  .rv-field { margin-bottom: 15px; }
  .rv-field label { display: block; font-size: 11.5px; color: var(--text-1); margin-bottom: 6px; }
  .rv-field-input {
    position: relative; display: flex; align-items: center;
    background: var(--field-bg);
    border: 1px solid var(--field-border);
    border-radius: 10px;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .rv-field-input:focus-within { box-shadow: 0 0 0 3px rgba(47,111,237,0.14); background: #ffffff; }
  .rv-field-input svg { width: 16px; height: 16px; margin-left: 13px; color: var(--text-2); flex-shrink: 0; }
  .rv-field-input input {
    flex: 1; background: transparent; border: none; outline: none;
    color: var(--text-0); font-family: 'IBM Plex Sans', sans-serif;
    font-size: 14px; padding: 12px 13px;
  }
  .rv-field-input input::placeholder { color: var(--text-2); }
  .rv-toggle-eye {
    margin-right: 11px; cursor: pointer; color: var(--text-2);
    display: flex; align-items: center; transition: color 0.15s;
    background: none; border: none;
  }
  .rv-toggle-eye:hover { color: var(--text-1); }
  .rv-toggle-eye svg { width: 16px; height: 16px; margin: 0; }

  .rv-submit-btn {
    margin-top: 12px; width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 13px; border: none; border-radius: 10px;
    color: #fff; font-family: 'IBM Plex Sans', sans-serif;
    font-weight: 600; font-size: 14.5px;
    cursor: pointer; transition: filter 0.15s, transform 0.05s;
  }
  .rv-submit-btn:hover  { filter: brightness(1.06); }
  .rv-submit-btn:active { transform: translateY(1px); }
  .rv-submit-btn svg { width: 16px; height: 16px; }

  .rv-status-msg { font-size: 12px; color: var(--text-2); text-align: center; margin-top: 14px; min-height: 16px; }

  .rv-fade-slide { animation: rvFadeSlide 0.32s ease; }
  @keyframes rvFadeSlide { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }

  @media (max-width: 720px) {
    .rv-shell { grid-template-columns: 1fr; }
    .rv-rail  { border-right: none; border-bottom: 1px solid var(--border); }
    .rv-role-block { margin: 16px 0; }
    .rv-track-motif { display: none; }
    .rv-form-side { padding: 36px 26px; }
  }
`;

/* ─── Persona / role definitions ──────────── */
type Persona = {
  id:       string;
  role:     string;
  name:     string;
  badge:    string;
  color:    string;
  scope:    string;
  desc:     string;
  icon:     string;
  redirect: string;
};

const PERSONAS: Persona[] = [
  {
    id: 'controller', role: 'CONTROLLER',
    name: 'Chief Controller', badge: 'MASTER', color: '#0f9d78',
    scope: 'Master UI, live status, Mega Blocks, What-If Gantt.',
    desc:  'Master UI, live status, Mega Blocks, What-If Gantt. The only role that can approve blocks.',
    icon:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>',
    redirect: '/pending.html',
  },
  {
    id: 'sse-pway', role: 'ENGINEER_TRACK',
    name: 'SSE - P.Way (Track)', badge: 'TRACK', color: '#2f6fed',
    scope: 'Track defects, fractures, and Traffic Block requests for your assigned section.',
    desc:  'TMS: Track defects, fractures. Submits requests for Traffic Blocks & machine availability.',
    icon:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="3" width="12" height="15" rx="4"/><path d="M6 13h12M9 21l-1.5 2M15 21l1.5 2"/><circle cx="9.5" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="9" r="1" fill="currentColor" stroke="none"/></svg>',
    redirect: '/eng-tms.html',
  },
  {
    id: 'sse-signal', role: 'ENGINEER_SIGNAL',
    name: 'SSE - Signal & Telecom', badge: 'SIGNAL', color: '#16a34a',
    scope: 'Point machines and track circuits across your signalling section.',
    desc:  'SMMS: Point machines, track circuits. Requests Disconnections or full Traffic Blocks.',
    icon:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="2" width="8" height="18" rx="4"/><circle cx="12" cy="7" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="11" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none"/><path d="M8 22h8"/></svg>',
    redirect: '/eng-smms.html',
  },
  {
    id: 'sse-trd', role: 'ENGINEER_TRACTION',
    name: 'SSE - Traction (TRD)', badge: 'TRACTION', color: '#ea7c1f',
    scope: 'OHE and insulator maintenance, plus Power Block requests.',
    desc:  'TDMS: OHE, Insulators. Requests Power Blocks (diesel trains can still run!).',
    icon:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
    redirect: '/eng-tdms.html',
  },
];

/* ─── Raw SVG renderer ─────────────────────── */
function RawIcon({ html, style }: { html: string; style?: React.CSSProperties }) {
  return <span style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ─── Shared background layers ─────────────── */
function BgLayers({ color }: { color: string }) {
  return (
    <>
      <div className="rv-bg-photo">
        <img
          src="https://images.unsplash.com/photo-1495066815128-6f6c8dc4d70a?auto=format&fit=crop&w=1920&q=80"
          alt="Railway tracks at golden hour"
          onError={e => (e.currentTarget as HTMLImageElement).remove()}
        />
      </div>
      <div className="rv-glow-blob" style={{ background: color }} />
      <div className="rv-bg-wash" />
    </>
  );
}

/* ─── STEP 1: Persona Carousel ─────────────── */
function PersonaCarousel({ onSelect }: { onSelect: (p: Persona) => void }) {
  const [current, setCurrent] = useState(0);
  const len = PERSONAS.length;

  function shift(dir: number) { setCurrent(c => (c + dir + len) % len); }
  function avatarClick(i: number) {
    if (i === current) onSelect(PERSONAS[current]); else setCurrent(i);
  }

  const p = PERSONAS[current];
  const avatars = PERSONAS.map((persona, i) => {
    let diff = i - current;
    if (diff > len / 2) diff -= len;
    if (diff <= -len / 2) diff += len;
    const isCurrent = diff === 0;
    return { persona, i, isCurrent,
      size: isCurrent ? 98 : 74,
      tx:   diff * 104,
      opacity: isCurrent ? 1 : (Math.abs(diff) === 1 ? 0.62 : 0.3),
    };
  });

  return (
    <div className="rv-root">
      <BgLayers color={p.color} />
      <div className="rv-card-solo">
        <div className="rv-accent-bar" style={{ background: p.color }} />
        <div className="rv-card-inner">

          <header className="rv-header">
            <div className="rv-brand">
              <div className="rv-brand-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <rect x="6" y="3" width="12" height="15" rx="4"/>
                  <path d="M6 13h12M9 21l-1.5 2M15 21l1.5 2"/>
                  <circle cx="9.5" cy="9" r="1" fill="#ffffff" stroke="none"/>
                  <circle cx="14.5" cy="9" r="1" fill="#ffffff" stroke="none"/>
                </svg>
              </div>
              <div className="rv-brand-name">RAIL-OPS</div>
            </div>
            <div className="rv-division">MINISTRY OF RAILWAYS &middot; NCR DIVISION</div>
          </header>

          <div className="rv-signal-lamp">
            <span className="rv-rail-line" />
            <span className="rv-lamp-dot red" />
            <span className="rv-lamp-dot amber" />
            <span className="rv-lamp-dot green" />
            <span className="rv-rail-line right" />
          </div>

          <div className="rv-title">Select your identity</div>
          <div className="rv-subtitle">Choose a persona to access its tailored dashboard.</div>

          <div className="rv-carousel">
            <button className="rv-arrow left" onClick={() => shift(-1)}>&#10094;</button>
            <div className="rv-carousel-track">
              {avatars.map(({ persona, i, isCurrent, size, tx, opacity }) => (
                <div
                  key={persona.id}
                  className={`rv-avatar-ring${isCurrent ? ' is-current' : ''}`}
                  style={{
                    width: size, height: size,
                    background: isCurrent
                      ? `conic-gradient(${persona.color}, ${persona.color}99, ${persona.color})`
                      : undefined,
                    transform: `translate(-50%,-50%) translateX(${tx}px)`,
                    opacity,
                    zIndex: 10 - Math.abs(i - current),
                  }}
                >
                  <div
                    className="rv-avatar"
                    style={{
                      background:  isCurrent ? `${persona.color}22` : 'rgba(255,255,255,0.6)',
                      borderColor: isCurrent ? persona.color : 'var(--border)',
                      color:       isCurrent ? persona.color : 'var(--text-1)',
                    }}
                    onClick={() => avatarClick(i)}
                  >
                    <RawIcon html={persona.icon} />
                  </div>
                </div>
              ))}
            </div>
            <button className="rv-arrow right" onClick={() => shift(1)}>&#10095;</button>
          </div>

          <div className="rv-persona-info">
            <div className="rv-persona-name">{p.name}</div>
            <span className="rv-persona-badge" style={{ background: p.color }}>{p.badge}</span>
            <div className="rv-persona-desc">{p.desc}</div>
          </div>

          <div className="rv-tap-hint">Tap the centred avatar to continue</div>
        </div>
      </div>
    </div>
  );
}

/* ─── STEP 2: Auth Form (two-column shell) ─── */
function AuthForm({ persona, onBack, onSubmit }: {
  persona: Persona;
  onBack:  () => void;
  onSubmit:(name: string) => void;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const [name,    setName]    = useState('');
  const [city,    setCity]    = useState('');
  const [status,  setStatus]  = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Verifying credentials\u2026');
    setTimeout(() => onSubmit(name), 600);
  }

  return (
    <div className="rv-root">
      <BgLayers color={persona.color} />
      <div className="rv-shell rv-fade-slide">

        {/* Left rail */}
        <div className="rv-rail">
          <button className="rv-back-link" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to role selection
          </button>

          <div className="rv-role-block">
            <div className="rv-role-icon"
              style={{ color: persona.color, background: `${persona.color}22`, borderColor: `${persona.color}55` }}>
              <RawIcon html={persona.icon} />
            </div>
            <div className="rv-role-badge2" style={{ color: persona.color }}>{persona.badge} ROLE</div>
            <div className="rv-role-title">{persona.name}</div>
            <div className="rv-role-sub">{persona.scope}</div>
          </div>

          <div className="rv-track-motif" />
        </div>

        {/* Right form */}
        <div className="rv-form-side">
          <div className="rv-form-heading">Welcome back</div>
          <div className="rv-form-sub">Enter your details to access RAIL-OPS.</div>

          <form onSubmit={handleSubmit}>
            <div className="rv-field">
              <label>Full name</label>
              <div className="rv-field-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                </svg>
                <input ref={nameRef} type="text" placeholder="e.g. Ramesh Kumar" autoComplete="off"
                  value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>

            <div className="rv-field">
              <label>City or division</label>
              <div className="rv-field-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>
                </svg>
                <input type="text" placeholder="e.g. Jhansi" autoComplete="off"
                  value={city} onChange={e => setCity(e.target.value)} required />
              </div>
            </div>

            <div className="rv-field">
              <label>Password</label>
              <div className="rv-field-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                </svg>
                <input type={showPwd ? 'text' : 'password'} placeholder="Enter password"
                  autoComplete="current-password" required />
                <button type="button" className="rv-toggle-eye"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}>
                  {showPwd ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 1l22 22M9.9 9.9a3 3 0 0 0 4.2 4.2M6.1 6.1C3.4 7.9 1 12 1 12s4 7 11 7c2 0 3.7-.5 5.1-1.2M14.1 5.1C13.4 5 12.7 5 12 5c-7 0-11 7-11 7"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="rv-submit-btn"
              style={{ background: persona.color, boxShadow: `0 10px 24px -10px ${persona.color}88` }}>
              Access RAIL-OPS
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </button>
          </form>

          <div className="rv-status-msg">{status}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page entry point ───────────────────── */
export function Login() {
  // @ts-ignore — role type is broader; cast at use-site
  const setRole        = useAuthStore(s => s.setRole);
  const setDisplayName = useAuthStore(s => s.setDisplayName);
  const [step,     setStep]     = useState<'pick' | 'form'>('pick');
  const [selected, setSelected] = useState<Persona>(PERSONAS[0]);

  function handleRolePick(persona: Persona) { setSelected(persona); setStep('form'); }

  function handleSubmit(name: string) {
    // @ts-ignore
    setRole(selected.role);
    setDisplayName(name);
    window.location.href = selected.redirect;
  }

  return (
    <>
      <style>{CSS}</style>
      {step === 'pick'
        ? <PersonaCarousel onSelect={handleRolePick} />
        : <AuthForm persona={selected} onBack={() => setStep('pick')} onSubmit={handleSubmit} />
      }
    </>
  );
}
