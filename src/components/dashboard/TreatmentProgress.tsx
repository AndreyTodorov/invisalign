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

  const progressPct = overallProgress ? Math.round(overallProgress * 100) : null

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Aligner Set
          </span>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginLeft: 10 }}>
            {currentSetNumber}
            {totalSets ? <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}> / {totalSets}</span> : ''}
          </span>
        </div>
        {totalSets && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ~{estimatedCompletion(treatment, defaultSetDurationDays)}
          </span>
        )}
      </div>

      {overallProgress !== null && (
        <div style={{ marginBottom: 8 }}>
          <div style={{
            width: '100%',
            height: 5,
            background: 'var(--surface-3)',
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${overallProgress * 100}%`,
              background: 'linear-gradient(90deg, var(--cyan), var(--green))',
              borderRadius: 3,
              transition: 'width 0.6s ease',
              boxShadow: '0 0 8px var(--cyan-glow)',
            }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          Day {daysSinceStart + 1} of {defaultSetDurationDays}
        </span>
        {progressPct !== null && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {progressPct}% complete
          </span>
        )}
      </div>
    </div>
  )
}
