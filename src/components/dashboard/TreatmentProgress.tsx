import type { Treatment } from '../../types'

interface Props {
  treatment: Treatment | null
  defaultSetDurationDays: number
}

function estimatedCompletion(treatment: Treatment, defaultDuration: number): string {
  if (!treatment.totalSets) return 'Unknown'
  const setsRemaining = treatment.totalSets - treatment.currentSetNumber
  const daysRemaining = setsRemaining * defaultDuration
  const completion = new Date()
  completion.setDate(completion.getDate() + daysRemaining)
  return completion.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function TreatmentProgress({ treatment, defaultSetDurationDays }: Props) {
  if (!treatment) return null

  const { currentSetNumber, totalSets, currentSetStartDate } = treatment
  const daysSinceStart = Math.floor(
    (Date.now() - new Date(currentSetStartDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  const setProgress = Math.min(1, daysSinceStart / defaultSetDurationDays)
  const overallProgress = totalSets
    ? (currentSetNumber - 1 + setProgress) / totalSets
    : null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-600">
          Set {currentSetNumber}{totalSets ? ` of ${totalSets}` : ''}
        </span>
        {totalSets && (
          <span className="text-xs text-gray-400">
            Est. {estimatedCompletion(treatment, defaultSetDurationDays)}
          </span>
        )}
      </div>
      {overallProgress !== null && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all"
            style={{ width: `${overallProgress * 100}%` }}
          />
        </div>
      )}
      <div className="text-xs text-gray-400 mt-1">
        Day {daysSinceStart + 1} of {defaultSetDurationDays}
      </div>
    </div>
  )
}
