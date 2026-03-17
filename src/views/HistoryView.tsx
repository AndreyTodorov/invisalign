import { useState } from 'react'
import { useSessions } from '../hooks/useSessions'
import { useDataContext } from '../contexts/DataContext'
import SessionList from '../components/dashboard/SessionList'
import SessionEditModal from '../components/sessions/SessionEditModal'
import AddSessionModal from '../components/sessions/AddSessionModal'
import { toLocalDate, formatDateKey, formatDurationShort, diffMinutes } from '../utils/time'
import type { Session } from '../types'

export default function HistoryView() {
  const { sessions } = useSessions()
  const { loaded } = useDataContext()
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  // FIX LG-1: group by LOCAL date using each session's stored timezone offset
  const byDate = sessions
    .filter(s => s.endTime !== null)
    .reduce<Record<string, Session[]>>((acc, s) => {
      const localDate = formatDateKey(toLocalDate(s.startTime, s.startTimezoneOffset))
      acc[localDate] = [...(acc[localDate] ?? []), s]
      return acc
    }, {})

  const sortedDates = Object.keys(byDate).sort().reverse()

  if (!loaded) return (
    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-faint)' }}>Loading…</div>
  )

  return (
    <div style={{ padding: '0 16px 16px', maxWidth: 440, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>History</h1>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            fontSize: 13, fontWeight: 600, color: 'var(--cyan)',
            background: 'var(--cyan-bg)', border: '1px solid rgba(34,211,238,0.2)',
            borderRadius: 20, padding: '5px 14px',
            fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          + Add
        </button>
      </div>

      {sortedDates.length === 0 && (
        <p style={{ color: 'var(--text-faint)', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>
          No sessions yet
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sortedDates.map(date => (
          <div key={date}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                {byDate[date].length} {byDate[date].length === 1 ? 'session' : 'sessions'} · {formatDurationShort(byDate[date].reduce((sum, s) => sum + (s.endTime ? diffMinutes(s.startTime, s.endTime) : 0), 0))}
              </span>
            </div>
            <SessionList sessions={byDate[date]} onEdit={setEditingSession} />
          </div>
        ))}
      </div>

      {editingSession && (
        <SessionEditModal session={editingSession} onClose={() => setEditingSession(null)} />
      )}
      {showAdd && <AddSessionModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
