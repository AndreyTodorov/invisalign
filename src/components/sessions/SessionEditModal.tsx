import { useState } from 'react'
import { useSessions } from '../../hooks/useSessions'
import type { Session } from '../../types'

// FIX CR-5: convert UTC ISO to local time for datetime-local input
// datetime-local expects "YYYY-MM-DDTHH:MM" in LOCAL time
function toDatetimeLocal(utcIso: string, offsetMinutes: number): string {
  const local = new Date(new Date(utcIso).getTime() + offsetMinutes * 60_000)
  return local.toISOString().slice(0, 16)
}

interface Props {
  session: Session
  onClose: () => void
}

export default function SessionEditModal({ session, onClose }: Props) {
  const { updateSession, deleteSession } = useSessions()
  // FIX CR-5: initialize with LOCAL time using session's own timezone offset
  const [startTime, setStartTime] = useState(
    toDatetimeLocal(session.startTime, session.startTimezoneOffset)
  )
  const [endTime, setEndTime] = useState(
    session.endTime
      ? toDatetimeLocal(session.endTime, session.endTimezoneOffset ?? session.startTimezoneOffset)
      : ''
  )
  const [error, setError] = useState<string | null>(null)
  // FIX SF-2: in-UI confirmation instead of window.confirm()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const handleSave = async () => {
    try {
      // Browser interprets datetime-local as local time → new Date().toISOString() gives correct UTC
      await updateSession(session.id, {
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
      })
      onClose()
    } catch (e: unknown) {
      setError((e as Error).message)
    }
  }

  const handleDelete = async () => {
    await deleteSession(session.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-bold">Edit Session</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">Start Time (local)</label>
          <input
            type="datetime-local" value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="w-full border rounded-xl p-2"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">End Time (local)</label>
          <input
            type="datetime-local" value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="w-full border rounded-xl p-2"
          />
        </div>

        {confirmingDelete ? (
          <div className="space-y-2">
            <p className="text-sm text-red-600 font-medium text-center">
              Delete this session?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-3 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 text-white rounded-xl py-3 font-semibold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex-1 bg-red-100 text-red-600 rounded-xl py-3 font-semibold"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-3 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-indigo-500 text-white rounded-xl py-3 font-semibold"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
