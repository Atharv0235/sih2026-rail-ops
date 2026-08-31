interface BlockInspectorProps {
  blockId: string;
  label: string;
  color: string;
  canApprove: boolean; // true = CONTROLLER, false = ENGINEER (read-only)
}

const PACKED_TASKS = [
  { color: '#1D6FA8', label: 'TRK: Destressing',       type: 'Primary' },
  { color: '#157A4D', label: 'OHE: Inspection',        type: 'Shadow'  },
  { color: '#B86800', label: 'SIG: Track Circuit Chk', type: 'Shadow'  },
];

/**
 * BlockInspector — side drawer for the Block Planner.
 * `canApprove` = false renders it read-only (Engineer mode):
 *   - Approve Block & Modify Parameters buttons are hidden
 *   - A "View Only" badge is shown instead
 */
export function BlockInspector({ blockId, label, color, canApprove }: BlockInspectorProps) {
  return (
    <div className="card card-shadow" style={{ width: 320, padding: '24px', display: 'flex', flexDirection: 'column', gap: 20, flexShrink: 0 }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div className="t-label" style={{ color: 'var(--text-muted)' }}>Selected Block</div>
          {canApprove
            ? <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--brand-light)', color: 'var(--brand-dark)', padding: '2px 8px', borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Approver</span>
            : <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--panel)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.06em' }}>View Only</span>
          }
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 4 }}>{label}</h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>ID: BLK-2026-{blockId}9A</div>
      </div>

      {/* Block metadata */}
      <div style={{ background: 'var(--panel)', borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { l: 'Corridor', v: 'GWL → JHS' },
          { l: 'Section',  v: 'Km 140–145' },
          { l: 'Time',     v: '10:00 – 13:00 (3h)' },
        ].map(r => (
          <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{r.l}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.v}</span>
          </div>
        ))}
      </div>

      {/* Packed tasks */}
      <div>
        <div className="t-label" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>Packed Tasks ({PACKED_TASKS.length})</div>
        {PACKED_TASKS.map(t => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 13 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 500, flex: 1, color: 'var(--text-primary)' }}>{t.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{t.type}</span>
          </div>
        ))}
      </div>

      {/* Shadow multiplier */}
      <div style={{ background: 'var(--green-soft)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="t-label" style={{ color: 'var(--green)' }}>Shadow Multiplier</span>
        <span className="t-mono" style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>2.1×</span>
      </div>

      {/* Action buttons — CONTROLLER only */}
      {canApprove ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
          <button className="btn-primary" style={{ borderRadius: 10, padding: '13px', fontSize: 14 }}>
            ✓ Approve Block
          </button>
          <button className="btn-outline" style={{ borderRadius: 10, padding: '11px', fontSize: 14 }}>
            ✎ Modify Parameters
          </button>
        </div>
      ) : (
        /* ENGINEER — Read-only notice */
        <div style={{ marginTop: 'auto', background: 'var(--panel)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            Block approval is reserved for the Chief Controller.<br />
            <span style={{ color: 'var(--brand-mid)' }}>Shadow compatibility confirmed ✓</span>
          </div>
        </div>
      )}
    </div>
  );
}
