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
  const budgetPct = Math.min(100, ((totalOffMinutes + activeMinutes) / maxOffMinutes) * 100)

  const budgetColor = budgetPct >= 85 ? 'var(--rose)' : budgetPct >= 60 ? 'var(--amber)' : 'var(--green)'

  const stats = [
    {
      label: 'Off Time',
      value: formatDuration(totalOffMinutes + activeMinutes),
      color: activeMinutes > 0 ? 'var(--cyan)' : 'var(--text)',
    },
    {
      label: 'Removals',
      value: String(removals),
      color: 'var(--text)',
    },
    {
      label: 'Budget Left',
      value: formatDuration(budgetRemainingMinutes),
      color: budgetColor,
    },
  ]

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Today
        </span>
        <StreakBadge streak={streak} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {stats.map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '12px 8px',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: label === 'Removals' ? 26 : 17,
              fontWeight: 600,
              color,
              lineHeight: 1,
              marginBottom: 6,
            }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, letterSpacing: '0.04em' }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
