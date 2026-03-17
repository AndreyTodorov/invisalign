import { formatDuration } from '../../utils/time'
import { MINUTES_PER_DAY } from '../../constants'
import StreakBadge from './StreakBadge'

interface Props {
  totalOffMinutes: number
  removals: number
  goalMinutes: number
  streak: number
  activeMinutes?: number
}

export default function DailySummary({ totalOffMinutes, removals, goalMinutes, streak, activeMinutes = 0 }: Props) {
  const maxOffMinutes = MINUTES_PER_DAY - goalMinutes
  const budgetRemainingMinutes = Math.max(0, maxOffMinutes - totalOffMinutes - activeMinutes)

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700">Today</h3>
        <StreakBadge streak={streak} />
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-800">{formatDuration(totalOffMinutes + activeMinutes)}</div>
          <div className="text-xs text-gray-400 mt-1">Off Time</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-800">{removals}</div>
          <div className="text-xs text-gray-400 mt-1">Removals</div>
        </div>
        <div>
          <div className={`text-2xl font-bold ${
            budgetRemainingMinutes === 0 ? 'text-red-500' : 'text-green-600'
          }`}>
            {formatDuration(budgetRemainingMinutes)}
          </div>
          <div className="text-xs text-gray-400 mt-1">Budget Left</div>
        </div>
      </div>
    </div>
  )
}
