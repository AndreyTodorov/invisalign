import { useState } from 'react'
import { useReports } from '../hooks/useReports'
import { useDataContext } from '../contexts/DataContext'
import WearChart from '../components/reports/WearChart'
import StatsGrid from '../components/reports/StatsGrid'
import SetReportCard from '../components/reports/SetReportCard'
import { DEFAULT_DAILY_WEAR_GOAL_MINUTES } from '../constants'

type Period = '7d' | 'week' | 'month' | 'set'

// FIX OS-4: get today's date in LOCAL timezone
function getTodayLocal(): string {
  const now = new Date()
  const offsetMs = -now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() + offsetMs).toISOString().slice(0, 10)
}

function getDateRange(period: Exclude<Period, 'set'>): string[] {
  const todayStr = getTodayLocal()
  const today = new Date(todayStr + 'T00:00:00')
  const dates: string[] = []

  if (period === '7d') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      dates.push(d.toLocaleDateString('sv'))
    }
  } else if (period === 'week') {
    const day = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((day + 6) % 7))
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      dates.push(d.toLocaleDateString('sv'))
    }
  } else {
    const year = today.getFullYear()
    const month = today.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      dates.push(d.toLocaleDateString('sv'))
    }
  }
  return dates
}

export default function ReportsView() {
  const [period, setPeriod] = useState<Period>('7d')
  const { profile, sets } = useDataContext()
  const goalMinutes = profile?.dailyWearGoalMinutes ?? DEFAULT_DAILY_WEAR_GOAL_MINUTES
  const { getDailyStatsRange, getSetStats } = useReports(goalMinutes)

  const tabs: { key: Period; label: string }[] = [
    { key: '7d', label: '7 Days' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'set', label: 'By Set' },
  ]

  const stats = period !== 'set'
    ? getDailyStatsRange(getDateRange(period)).filter(s => s.removals > 0)
    : []

  return (
    <div style={{ padding: '0 16px 16px', maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', paddingTop: 20 }}>
        Reports
      </h1>

      {/* Tab switcher */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14, padding: 4,
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setPeriod(t.key)}
            style={{
              flex: 1, padding: '8px 0',
              borderRadius: 10, border: 'none',
              fontSize: 13, fontWeight: 500,
              fontFamily: 'inherit', cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
              background: period === t.key ? 'var(--surface-3)' : 'transparent',
              color: period === t.key ? 'var(--cyan)' : 'var(--text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {period !== 'set' && stats.length === 0 && (
        <p style={{ color: 'var(--text-faint)', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>
          No sessions in this period
        </p>
      )}

      {period !== 'set' && stats.length > 0 && (
        <>
          <WearChart data={stats} goalMinutes={goalMinutes} />
          <StatsGrid stats={stats} />
        </>
      )}

      {period === 'set' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...sets]
            .sort((a, b) => b.setNumber - a.setNumber)
            .map(s => {
              const current = getSetStats(s.setNumber)
              const prevSet = sets.find(x => x.setNumber === s.setNumber - 1)
              const previous = prevSet ? getSetStats(prevSet.setNumber) : null
              return (
                <SetReportCard
                  key={s.id}
                  setNumber={s.setNumber}
                  current={current}
                  previous={previous}
                />
              )
            })}
        </div>
      )}
    </div>
  )
}
