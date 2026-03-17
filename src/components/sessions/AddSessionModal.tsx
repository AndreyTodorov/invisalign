import { useState } from 'react'
import { useSessions } from '../../hooks/useSessions'
import { useDataContext } from '../../contexts/DataContext'

interface Props { onClose: () => void }

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
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-bold">Add Missed Session</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">Start Time (local)</label>
          <input type="datetime-local" value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="w-full border rounded-xl p-2" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-gray-600">End Time (local)</label>
          <input type="datetime-local" value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="w-full border rounded-xl p-2" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-3 font-semibold">
            Cancel
          </button>
          <button onClick={handleAdd}
            className="flex-1 bg-indigo-500 text-white rounded-xl py-3 font-semibold">
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
