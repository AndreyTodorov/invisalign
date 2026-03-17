interface Props { streak: number }

export default function StreakBadge({ streak }: Props) {
  if (streak === 0) return null
  return (
    <div className="flex items-center gap-1 text-amber-600 font-semibold">
      <span>🔥</span>
      <span>{streak} day{streak !== 1 ? 's' : ''}</span>
    </div>
  )
}
