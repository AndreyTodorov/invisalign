import { formatDuration } from '../../utils/time'

interface Props {
  elapsedMinutes: number
  reminderFired: boolean
}

export default function ActiveTimer({ elapsedMinutes, reminderFired }: Props) {
  const color = reminderFired ? 'var(--rose)' : 'var(--cyan)'
  const glow = reminderFired ? 'var(--rose-glow)' : 'var(--cyan-glow)'
  const bg = reminderFired ? 'var(--rose-bg)' : 'var(--cyan-bg)'

  return (
    <div
      className="animate-fade-in"
      style={{
        background: bg,
        border: `1px solid ${reminderFired ? 'rgba(248,113,113,0.2)' : 'rgba(34,211,238,0.15)'}`,
        borderRadius: 20,
        padding: '20px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 52,
          fontWeight: 600,
          color,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          filter: `drop-shadow(0 0 16px ${glow})`,
          animation: reminderFired ? 'timer-pulse 1.2s ease-in-out infinite' : undefined,
        }}
      >
        {formatDuration(elapsedMinutes)}
      </div>
      <div style={{
        fontSize: 12,
        fontWeight: 500,
        color,
        opacity: 0.7,
        marginTop: 8,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}>
        {reminderFired ? '⚠ Time to put back' : 'Aligners out'}
      </div>
    </div>
  )
}
