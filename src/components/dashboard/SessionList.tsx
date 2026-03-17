import { Session } from '../../types'
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
    .filter(s => s.endTime !== null)
    .sort((a, b) => b.startTime.localeCompare(a.startTime))

  if (completed.length === 0) return (
    <p className="text-gray-400 text-center py-4 text-sm">No sessions yet today</p>
  )

  return (
    <div className="space-y-2">
      {completed.map(s => {
        const duration = diffMinutes(s.startTime, s.endTime!)
        return (
          <button
            key={s.id}
            onClick={() => onEdit(s)}
            className="w-full flex items-center justify-between bg-white rounded-xl p-3 shadow-sm text-left hover:bg-gray-50 active:bg-gray-100"
          >
            <span className="text-sm text-gray-600">
              {formatLocalTime(s.startTime, s.startTimezoneOffset)} –{' '}
              {formatLocalTime(s.endTime!, s.endTimezoneOffset ?? s.startTimezoneOffset)}
            </span>
            <div className="flex items-center gap-2">
              {s.autoCapped && <span className="text-xs text-amber-500">auto</span>}
              <span className="text-sm font-semibold text-gray-700">{formatDuration(duration)}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
