interface SetStats {
  avgWearPct: number
  totalRemovals: number
  complianceDays: number
  avgRemovalsPerDay: number
}

interface Props {
  setNumber: number
  current: SetStats
  previous: SetStats | null
}

function Delta({ current, previous, suffix = '' }: {
  current: number
  previous: number | null
  suffix?: string
}) {
  if (previous === null) return null
  const diff = current - previous
  const color = diff >= 0 ? 'var(--green)' : 'var(--rose)'
  return (
    <span style={{ fontSize: 11, color, marginLeft: 6, fontWeight: 500 }}>
      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}{suffix}
    </span>
  )
}

export default function SetReportCard({ setNumber, current, previous }: Props) {
  const rows = [
    {
      label: 'Avg Wear',
      value: `${current.avgWearPct.toFixed(1)}%`,
      delta: <Delta current={current.avgWearPct} previous={previous?.avgWearPct ?? null} suffix="%" />,
      color: current.avgWearPct >= 90 ? 'var(--green)' : current.avgWearPct >= 75 ? 'var(--amber)' : 'var(--rose)',
    },
    {
      label: 'Total Removals',
      value: String(current.totalRemovals),
      delta: <Delta current={current.totalRemovals} previous={previous?.totalRemovals ?? null} />,
      color: 'var(--text)',
    },
    {
      label: 'Compliance Days',
      value: String(current.complianceDays),
      delta: <Delta current={current.complianceDays} previous={previous?.complianceDays ?? null} />,
      color: 'var(--text)',
    },
    {
      label: 'Avg Removals/Day',
      value: current.avgRemovalsPerDay.toFixed(1),
      delta: <Delta current={current.avgRemovalsPerDay} previous={previous?.avgRemovalsPerDay ?? null} />,
      color: 'var(--text-muted)',
    },
  ]

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 18, padding: '16px 18px',
    }}>
      <div style={{
        fontSize: 12, fontWeight: 600, color: 'var(--cyan)',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        marginBottom: 14,
      }}>
        Set {setNumber}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.label}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: row.color }}>
              {row.value}{row.delta}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
