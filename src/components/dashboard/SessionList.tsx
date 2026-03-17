import type { Session } from '../../types'
import { formatDuration, diffMinutes } from '../../utils/time'

interface Props {
  sessions: Session[]
  onEdit: (session: Session) => void
}

// FIX LG-4: reliable local time formatting using explicit UTC field reads after offset shift
function formatLocalTime(isoString: string, offsetMinutes: number): string {
  const local = new Date(new Date(isoString).getTime() + offsetMinutes * 60_000)
  const h = String(local.getUTCHours()).padStart(2, '0')
  const m = String(local.getUTCMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export default function SessionList({ sessions, onEdit }: Props) {
  const completed = sessions
    .filter(s => s.endTime != null)
    .sort((a, b) => b.startTime.localeCompare(a.startTime))

  if (completed.length === 0) return (
    <p style={{ color: 'var(--text-faint)', textAlign: 'center', padding: '16px 0', fontSize: 14 }}>
      No sessions yet today
    </p>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {completed.map(s => {
        const duration = diffMinutes(s.startTime, s.endTime!)
        return (
          <button
            key={s.id}
            onClick={() => onEdit(s)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '12px 16px',
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
            onPointerEnter={e => {
              e.currentTarget.style.background = 'var(--surface-2)'
              e.currentTarget.style.borderColor = 'var(--border-strong)'
            }}
            onPointerLeave={e => {
              e.currentTarget.style.background = 'var(--surface)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>
              {formatLocalTime(s.startTime, s.startTimezoneOffset)}
              <span style={{ margin: '0 6px', opacity: 0.4 }}>→</span>
              {formatLocalTime(s.endTime!, s.endTimezoneOffset ?? s.startTimezoneOffset)}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {s.autoCapped && (
                <span style={{
                  fontSize: 10, color: 'var(--amber)',
                  background: 'var(--amber-bg)',
                  border: '1px solid rgba(252,211,77,0.2)',
                  borderRadius: 6, padding: '2px 6px', fontWeight: 500,
                }}>
                  auto
                </span>
              )}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14, fontWeight: 600,
                color: 'var(--text)',
              }}>
                {formatDuration(duration)}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
