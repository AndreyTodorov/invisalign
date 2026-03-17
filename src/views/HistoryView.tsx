import { useState } from 'react'
import { useSessions } from '../hooks/useSessions'
import { useDataContext } from '../contexts/DataContext'
import SessionList from '../components/dashboard/SessionList'
import SessionEditModal from '../components/sessions/SessionEditModal'
import AddSessionModal from '../components/sessions/AddSessionModal'
import { toLocalDate, formatDateKey } from '../utils/time'
import { Session } from '../types'

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

  if (!loaded) return <div className="p-8 text-center text-gray-400">Loading…</div>

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-xl font-bold text-gray-800">History</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="text-sm text-indigo-500 font-semibold"
        >
          + Add
        </button>
      </div>

      {sortedDates.length === 0 && (
        <p className="text-gray-400 text-center py-8 text-sm">No sessions yet</p>
      )}

      {sortedDates.map(date => (
        <div key={date}>
          <div className="text-sm font-semibold text-gray-500 mb-2">
            {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
            })}
          </div>
          <SessionList sessions={byDate[date]} onEdit={setEditingSession} />
        </div>
      ))}

      {editingSession && (
        <SessionEditModal session={editingSession} onClose={() => setEditingSession(null)} />
      )}
      {showAdd && <AddSessionModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
