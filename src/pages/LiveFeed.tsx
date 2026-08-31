import { useState } from 'react';

export function LiveFeed() {
  const [accepted, setAccepted] = useState<number[]>([]);
  const [dismissed, setDismissed] = useState(false);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Status pill ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="pulse" style={{ width: 10, height: 10, borderRadius: '50%', background: dismissed ? 'var(--text-dim)' : 'var(--amber)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {dismissed ? 'No active windows — polling every 30s' : 'Monitoring active — live delay detected'}
        </span>
      </div>

      {/* ── Main opportunity card ── */}
      {!dismissed && (
        <div className="card card-shadow-lg" style={{ overflow: 'hidden', borderTop: '4px solid var(--amber)' }}>

          {/* Header */}
          <div style={{ background: 'var(--amber-soft)', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--amber)', color: '#fff', padding: '4px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
                <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                Live Delay-Triggered Window
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                12002 Shatabdi Express
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>GWL Station · Delay registered 14:12</div>
              <div style={{ fontSize: 15, color: 'var(--amber-status)', fontWeight: 700, marginTop: 10 }}>
                Window: 14:30 → 17:30
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="t-mono" style={{ fontSize: 56, fontWeight: 900, color: 'var(--amber-status)', lineHeight: 1, letterSpacing: '-0.04em' }}>
                180<span style={{ fontSize: 22 }}>m</span>
              </div>
              <div className="t-label" style={{ color: 'var(--amber-status)', marginTop: 4 }}>Available</div>
              <div style={{ marginTop: 12, background: 'var(--red-soft)', border: '1px solid var(--red)', borderRadius: 8, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--red)', fontWeight: 700 }}>
                ⏱ Expires in 01:24:38
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div style={{ padding: '28px 32px' }}>
            <div className="t-label" style={{ color: 'var(--text-muted)', marginBottom: 16 }}>AI Recommended Shadow Packing</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                { id: 0, dept: 'TRK', type: 'track', label: 'Weld inspection GWL yard', score: 91, time: '45 min', status: 'Shadow Eligible' },
                { id: 1, dept: 'SIG', type: 'signal', label: 'Track circuit repair Km142', score: 88, time: '120 min', status: 'CRITICAL' },
              ].map(task => (
                <div key={task.id} onClick={() => setAccepted(a => a.includes(task.id) ? a.filter(x => x !== task.id) : [...a, task.id])} style={{
                  background: accepted.includes(task.id) ? 'var(--green-soft)' : 'var(--panel)',
                  border: `1px solid ${accepted.includes(task.id) ? 'var(--green)' : 'var(--border)'}`,
                  borderRadius: 10, padding: '16px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`dept-tag dept-${task.type}`}>{task.dept}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{task.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <span className="t-mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Score {task.score}</span>
                    <span className="t-mono" style={{ fontSize: 13, fontWeight: 700 }}>{task.time}</span>
                    <span style={{ fontSize: 11, color: task.status === 'CRITICAL' ? 'var(--red)' : 'var(--green)', fontWeight: 700, width: 90, textAlign: 'right' }}>{accepted.includes(task.id) ? '✓ Selected' : task.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--green-soft)', border: '1px solid var(--green)', borderRadius: 10, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 14 }}>
              <span style={{ color: 'var(--green)', fontWeight: 500 }}>AI Plan: <strong>165 min</strong> of 180 min available</span>
              <span style={{ color: 'var(--green)', fontWeight: 800 }}>Shadow Multiplier: 2.1×</span>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-primary" style={{ flex: 1, padding: '14px', borderRadius: 10 }}>Approve AI Recommendation</button>
              <button className="btn-outline" style={{ flex: 1, padding: '12px', borderRadius: 10 }} onClick={() => setDismissed(true)}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Events ── */}
      <div>
        <div className="t-label" style={{ color: 'var(--text-muted)', marginBottom: 14 }}>Recent Events</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Train 11078 delay at ET — window closed 2h ago', tag: 'Dismissed', c: 'var(--red-soft)', tc: 'var(--red)' },
            { label: 'Train 22119 delay at JHS — block created, in planner', tag: 'Accepted', c: 'var(--green-soft)', tc: 'var(--green)' },
          ].map((e, i) => (
            <div key={i} className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ background: e.c, color: e.tc, padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>{e.tag}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{e.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
