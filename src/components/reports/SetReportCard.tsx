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
  const color = diff >= 0 ? 'text-green-500' : 'text-red-500'
  return (
    <span className={`text-xs ${color} ml-1`}>
      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}{suffix}
    </span>
  )
}

export default function SetReportCard({ setNumber, current, previous }: Props) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="font-bold text-gray-700 mb-3">Set {setNumber} Report</h3>
      <div className="space-y-2">
        {[
          {
            label: 'Avg Wear',
            value: `${current.avgWearPct.toFixed(1)}%`,
            delta: <Delta current={current.avgWearPct} previous={previous?.avgWearPct ?? null} suffix="%" />,
          },
          {
            label: 'Total Removals',
            value: String(current.totalRemovals),
            delta: <Delta current={current.totalRemovals} previous={previous?.totalRemovals ?? null} />,
          },
          {
            label: 'Compliance Days',
            value: String(current.complianceDays),
            delta: <Delta current={current.complianceDays} previous={previous?.complianceDays ?? null} />,
          },
          {
            label: 'Avg Removals/Day',
            value: current.avgRemovalsPerDay.toFixed(1),
            delta: <Delta current={current.avgRemovalsPerDay} previous={previous?.avgRemovalsPerDay ?? null} />,
          },
        ].map(row => (
          <div key={row.label} className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{row.label}</span>
            <span className="font-semibold">{row.value}{row.delta}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
