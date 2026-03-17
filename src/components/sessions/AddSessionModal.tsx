import { useState } from 'react'
import { useSessions } from '../../hooks/useSessions'
import { useDataContext } from '../../contexts/DataContext'

interface Props { onClose: () => void }

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 500,
  color: 'var(--text-muted)', letterSpacing: '0.06em',
  textTransform: 'uppercase', marginBottom: 6,
}

export default function AddSessionModal({ onClose }: Props) {
  const { addManualSession } = useSessions()
  const { treatment } = useDataContext()
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    try {
      await addManualSession(
        new Date(startTime).toISOString(),
        new Date(endTime).toISOString(),
        treatment?.currentSetNumber ?? 1
      )
      onClose()
    } catch (e: unknown) {
      setError((e as Error).message)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border-strong)',
          borderRadius: '24px 24px 0 0',
          padding: '24px 20px 36px',
          width: '100%', maxWidth: 440,
          display: 'flex', flexDirection: 'column', gap: 18,
        }}
      >
        <div style={{ width: 36, height: 4, background: 'var(--border-strong)', borderRadius: 2, margin: '-8px auto 0' }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Add Session</h2>

        {error && (
          <p style={{
            fontSize: 13, color: 'var(--rose)',
            background: 'var(--rose-bg)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 10, padding: '10px 14px',
          }}>{error}</p>
        )}

        <div>
          <label style={labelStyle}>Start Time</label>
          <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>End Time</label>
          <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, background: 'var(--surface-3)', color: 'var(--text-muted)',
              border: '1px solid var(--border)', borderRadius: 12,
              padding: '13px 0', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            style={{
              flex: 1, background: 'var(--cyan)', color: '#06090f',
              border: 'none', borderRadius: 12,
              padding: '13px 0', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
