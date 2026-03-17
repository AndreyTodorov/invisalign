import { formatDuration } from '../../utils/time'

interface Props {
  elapsedMinutes: number
  reminderFired: boolean
}

export default function ActiveTimer({ elapsedMinutes, reminderFired }: Props) {
  return (
    <div className={`text-center py-6 rounded-2xl transition-colors ${
      reminderFired ? 'bg-red-50' : 'bg-indigo-50'
    }`}>
      <div className={`text-5xl font-mono font-bold tabular-nums ${
        reminderFired ? 'text-red-600' : 'text-indigo-600'
      }`}>
        {formatDuration(elapsedMinutes)}
      </div>
      <div className={`text-sm mt-2 ${reminderFired ? 'text-red-400' : 'text-indigo-400'}`}>
        Aligners Out
      </div>
    </div>
  )
}
