import { Link } from 'react-router-dom';
import { useState } from 'react';

/* ─── tiny sub-components ─── */
function NavBar() {
  return (
    <nav style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', padding: '0 5vw',
      height: 72,
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', marginRight: 'auto' }}>
        <div style={{
          width: 36, height: 36, background: '#D4820A', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 900, color: '#fff',
          boxShadow: '0 4px 14px rgba(212,130,10,0.5)',
        }}>R</div>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>RAIL-OPS</span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {['Features', 'How it works', 'Corridors', 'About'].map(l => (
          <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`} style={{
            padding: '8px 16px', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.82)',
            textDecoration: 'none', borderRadius: 8, transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>{l}</a>
        ))}
        <Link to="/login" style={{
          marginLeft: 12, padding: '9px 22px',
          background: '#fff', color: '#00443C',
          borderRadius: 9999, fontSize: 14, fontWeight: 700,
          textDecoration: 'none', transition: 'opacity 0.15s',
        }}>Sign in</Link>
      </div>
    </nav>
  );
}

const CORRIDORS = ['GWL → JHS', 'BPL → ET', 'Pune → MUM'];
const DEPTS = ['All Departments', 'Track (TMS)', 'Signal (SMMS)', 'Traction (TDMS)'];

function HeroSearchCard() {
  const [corridor, setCorridor] = useState(CORRIDORS[0]);
  const [dept, setDept] = useState(DEPTS[0]);

  const selectStyle: React.CSSProperties = {
    flex: 1, minWidth: 180, padding: '14px 16px',
    border: 'none', outline: 'none', background: 'transparent',
    fontSize: 15, fontWeight: 600, color: '#0D1C19', cursor: 'pointer',
  };
  const dividerStyle: React.CSSProperties = {
    width: 1, height: 40, background: '#D1D9D7', flexShrink: 0,
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 18,
      boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
      padding: '10px',
      display: 'flex', flexDirection: 'column', gap: 0,
      maxWidth: 720, width: '100%',
    }}>
      {/* Row 1 */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#F4F6F5', borderRadius: 12, marginBottom: 10 }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 18, color: '#00443C' }}>⊗</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#7A9690', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>Corridor</div>
            <select value={corridor} onChange={e => setCorridor(e.target.value)} style={{ ...selectStyle, padding: 0, background: 'transparent', fontSize: 16, fontWeight: 700, color: '#0D1C19', appearance: 'none', width: '100%' }}>
              {CORRIDORS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={dividerStyle} />
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 18, color: '#00443C' }}>☰</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#7A9690', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>Department</div>
            <select value={dept} onChange={e => setDept(e.target.value)} style={{ ...selectStyle, padding: 0, background: 'transparent', fontSize: 16, fontWeight: 700, color: '#0D1C19', appearance: 'none', width: '100%' }}>
              {DEPTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Link to="/login" style={{
        display: 'block', textAlign: 'center',
        background: '#00443C', color: '#fff',
        borderRadius: 12, padding: '16px',
        fontSize: 16, fontWeight: 700, textDecoration: 'none',
        transition: 'background 0.2s',
        letterSpacing: '-0.01em',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#005c50')}
      onMouseLeave={e => (e.currentTarget.style.background = '#00443C')}>
        Open Block Planner →
      </Link>
    </div>
  );
}

/* ─── Main Landing export ─── */
export function Landing() {
  return (
    <div style={{ background: '#F5F7F6', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ══════════════════════════════════════
          HERO — Trainline teal hero
          ══════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(160deg, #003530 0%, #005c50 60%, #00795e 100%)',
        padding: '0 5vw 100px', minHeight: 640,
        display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle background texture circles */}
        <div style={{ position: 'absolute', right: -120, top: -80, width: 600, height: 600, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 80, top: 120, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <NavBar />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: 100, paddingBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 9999, padding: '6px 16px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: 28, letterSpacing: '0.02em' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D4820A', display: 'inline-block' }} />
            SIH 2026 — Problem Statement 26027
          </div>

          <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.04em', maxWidth: 780, marginBottom: 24 }}>
            Smarter maintenance.<br />Fewer delays. Every time.
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255,255,255,0.72)', maxWidth: 560, lineHeight: 1.6, marginBottom: 48, fontWeight: 400 }}>
            RAIL-OPS packs Track, Signal, and Traction maintenance into shared windows — so one stoppage does the work of three.
          </p>

          <HeroSearchCard />
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS STRIP — bold numbers
          ══════════════════════════════════════ */}
      <section style={{ background: '#fff', borderBottom: '1px solid #E3E8E7' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5vw', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { value: '2.75×',   label: 'Shadow Maintenance Multiplier',   sub: 'Tasks packed per block' },
            { value: '124 hrs', label: 'Downtime Saved This Month',        sub: 'Across all corridors' },
            { value: '3 depts', label: 'Integrated in One Pane',           sub: 'TMS · SMMS · TDMS' },
            { value: '<30 s',   label: 'Delay-Triggered Reaction Time',    sub: 'Live opportunity alerts' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '36px 32px',
              borderRight: i < 3 ? '1px solid #E3E8E7' : 'none',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#00443C', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0D1C19', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 13, color: '#7A9690', fontWeight: 500 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURE SECTION 1 — Integration story
          ══════════════════════════════════════ */}
      <section id="features" style={{ padding: '96px 5vw' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

          {/* Text */}
          <div>
            <div style={{ display: 'inline-block', background: '#E8F5F1', color: '#00443C', borderRadius: 9999, padding: '5px 14px', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
              TMS · SMMS · TDMS
            </div>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: '#0D1C19', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
              Three departments.<br />One unified view.
            </h2>
            <p style={{ fontSize: 17, color: '#4A635E', lineHeight: 1.65, marginBottom: 32, fontWeight: 400 }}>
              Maintenance data from Track Management System, Signalling &amp; Maintenance System, and Traction Distribution System is pulled into a single ranked backlog. No more siloed requests. No more missed windows.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'Unified criticality scoring across all three departments',
                'Shadow-eligible tasks automatically flagged',
                'Real-time sync with COA block availability',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#E8F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 12, color: '#00443C', fontWeight: 800 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 15, color: '#0D1C19', fontWeight: 500, lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual card stack */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { dept: 'TMS',  label: 'Rail fracture Km142',      score: 91, color: '#1D6FA8', bg: '#EBF4FC', badge: 'CRITICAL' },
              { dept: 'SMMS', label: 'Point machine sluggish',    score: 78, color: '#B86800', bg: '#FFF8EE', badge: 'HIGH' },
              { dept: 'TDMS', label: 'OHE mast lean >2°',         score: 74, color: '#157A4D', bg: '#ECFAF4', badge: 'HIGH' },
            ].map((row, i) => (
              <div key={i} style={{
                background: '#fff', border: '1px solid #E3E8E7', borderRadius: 14,
                padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: '0 2px 8px rgba(13,28,25,0.06)',
                transform: i === 0 ? 'none' : `translateX(${i * 12}px)`,
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: row.color, flexShrink: 0 }}>{row.dept}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0D1C19', marginBottom: 2 }}>{row.label}</div>
                  <div style={{ fontSize: 12, color: '#7A9690', fontWeight: 500 }}>Score: {row.score} · Shadow Eligible</div>
                </div>
                <div style={{ padding: '3px 10px', borderRadius: 9999, background: row.bg, color: row.color, fontSize: 11, fontWeight: 700 }}>{row.badge}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURE SECTION 2 — Shadow Maintenance
          ══════════════════════════════════════ */}
      <section id="how-it-works" style={{ background: '#00443C', padding: '96px 5vw' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

          {/* Gantt visual */}
          <div>
            <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '24px', overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weekly Block View — GWL→JHS</div>
              {/* Fake gantt bars */}
              {[
                { label: 'GWL Yard', bars: [{ w: '55%', color: '#1D6FA8', txt: 'TRK: Destressing' }, { w: '30%', color: '#157A4D', offset: '0%', txt: 'TDMS shadow' }] },
                { label: 'Km 140-145', bars: [{ w: '40%', color: '#B86800', txt: 'SIG: Point Overhaul' }] },
              ].map((row, ri) => (
                <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', width: 90, flexShrink: 0 }}>{row.label}</div>
                  <div style={{ flex: 1, height: 38, background: 'rgba(255,255,255,0.06)', borderRadius: 8, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'stretch' }}>
                    {row.bars.map((bar, bi) => (
                      <div key={bi} style={{ width: bar.w, height: '100%', background: bar.color, display: 'flex', alignItems: 'center', paddingLeft: 10, borderRadius: 8, marginLeft: bi > 0 ? 4 : 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bar.txt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(212,130,10,0.2)', borderRadius: 8, border: '1px solid rgba(212,130,10,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Shadow Multiplier for this block</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#D4820A', fontVariantNumeric: 'tabular-nums' }}>2.75×</span>
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(212,130,10,0.2)', color: '#D4820A', borderRadius: 9999, padding: '5px 14px', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
              Shadow Maintenance
            </div>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
              One stoppage.<br />Three teams' work done.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.68)', lineHeight: 1.65, marginBottom: 32, fontWeight: 400 }}>
              RAIL-OPS finds every moment the track is clear and packs the highest-priority compatible tasks from all three departments into that single window — automatically.
            </p>
            <Link to="/login" style={{ display: 'inline-block', background: '#D4820A', color: '#fff', borderRadius: 9999, padding: '14px 32px', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 24px rgba(212,130,10,0.4)', transition: 'transform 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              Open the Planner →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURE SECTION 3 — Live Opportunities
          ══════════════════════════════════════ */}
      <section id="corridors" style={{ padding: '96px 5vw', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 42, fontWeight: 900, color: '#0D1C19', letterSpacing: '-0.03em', marginBottom: 16 }}>React to delays. Instantly.</h2>
          <p style={{ fontSize: 18, color: '#4A635E', maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>
            When a train is delayed, RAIL-OPS fires an alert in under 30 seconds — with AI-suggested tasks ready to pack into the window.
          </p>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            {
              icon: '◎',
              title: 'Delay Detected',
              desc: 'Train 12002 delayed 180 min. A 14:30–17:30 window opens automatically on GWL→JHS.',
              color: '#B86800', bg: '#FFF8EE',
            },
            {
              icon: '⊕',
              title: 'AI Suggests Tasks',
              desc: 'The system scores and ranks backlog tasks by criticality, eligibility, and window fit — instantly.',
              color: '#1D6FA8', bg: '#EBF4FC',
            },
            {
              icon: '✓',
              title: 'Controller Approves',
              desc: 'One click. Block is created, departments are notified, and the window is logged for reports.',
              color: '#157A4D', bg: '#ECFAF4',
            },
          ].map((card, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #E3E8E7', borderRadius: 16, padding: '36px 32px', boxShadow: '0 2px 12px rgba(13,28,25,0.06)' }}>
              <div style={{ width: 52, height: 52, background: card.bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: card.color, marginBottom: 24 }}>{card.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0D1C19', marginBottom: 12, letterSpacing: '-0.01em' }}>{card.title}</h3>
              <p style={{ fontSize: 15, color: '#4A635E', lineHeight: 1.6 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA BANNER
          ══════════════════════════════════════ */}
      <section style={{ background: '#F5F7F6', padding: '80px 5vw' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', background: '#00443C', borderRadius: 24, padding: '64px', boxShadow: '0 24px 64px rgba(0,68,60,0.25)' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16 }}>Ready to eliminate siloed planning?</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.68)', lineHeight: 1.6, marginBottom: 40 }}>Sign in as a Chief Controller or Department Engineer to explore the full RAIL-OPS platform.</p>
          <Link to="/login" style={{ display: 'inline-block', background: '#fff', color: '#00443C', borderRadius: 9999, padding: '16px 48px', fontSize: 17, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transition: 'transform 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
            Get started — it's free
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
          ══════════════════════════════════════ */}
      <footer id="about" style={{ background: '#0D1C19', padding: '56px 5vw 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 56 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, background: '#D4820A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>R</div>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>RAIL-OPS</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 280 }}>
                AI-powered automatic block planning to maximise asset availability for Indian Railways train operations.
              </p>
            </div>

            {[
              { heading: 'Platform', links: ['Dashboard', 'Backlog Registry', 'Block Planner', 'Live Feed'] },
              { heading: 'Corridors', links: ['GWL → JHS', 'BPL → ET', 'Pune → MUM', 'More soon'] },
              { heading: 'Info', links: ['Problem Statement 26027', 'Ministry of Railways', 'NCR Division', 'SIH 2026'] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>{col.heading}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 10, fontWeight: 500, cursor: 'default' }}>{l}</div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
              © 2026 RAIL-OPS · SIH Team · Built for Ministry of Railways
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
              Problem Statement 26027
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
