import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTimer } from '../hooks/useTimer'
import { useSessions } from '../hooks/useSessions'
import { useReports } from '../hooks/useReports'
import { useDataContext } from '../contexts/DataContext'
import ActiveTimer from '../components/timer/ActiveTimer'
import TimerButton from '../components/timer/TimerButton'
import TimerAlert from '../components/timer/TimerAlert'
import DailySummary from '../components/dashboard/DailySummary'
import SessionList from '../components/dashboard/SessionList'
import TreatmentProgress from '../components/dashboard/TreatmentProgress'
import SessionEditModal from '../components/sessions/SessionEditModal'
import { computeDailyStats } from '../utils/stats'
import { toLocalDate, formatDateKey } from '../utils/time'
import type { Session } from '../types'
import {
  DEFAULT_DAILY_WEAR_GOAL_MINUTES,
  DEFAULT_REMINDER_THRESHOLD_MINUTES,
  DEFAULT_AUTO_CAP_MINUTES,
} from '../constants'

export default function HomeView() {
  const { profile, treatment, loaded } = useDataContext()
  const navigate = useNavigate()

  const goalMinutes = profile?.dailyWearGoalMinutes ?? DEFAULT_DAILY_WEAR_GOAL_MINUTES
  const reminderMins = profile?.reminderThresholdMinutes ?? DEFAULT_REMINDER_THRESHOLD_MINUTES
  const autoCapMins = profile?.autoCapMinutes ?? DEFAULT_AUTO_CAP_MINUTES
  const currentSet = treatment?.currentSetNumber ?? 1

  const { elapsedMinutes, isRunning, reminderFired, autoCapped, start, stop } =
    useTimer(reminderMins, autoCapMins, currentSet)

  const { sessions } = useSessions()
  const { streak, allSegments } = useReports(goalMinutes)

  // FIX LG-1: Use device local timezone to compute "today" date key
  const todayKey = formatDateKey(toLocalDate(new Date().toISOString(), -new Date().getTimezoneOffset()))

  const todayStats = computeDailyStats(todayKey, allSegments, goalMinutes)

  // FIX LG-1: filter today's sessions by LOCAL date using each session's own timezone offset
  const todaySessions = sessions.filter(s => {
    const localDate = formatDateKey(toLocalDate(s.startTime, s.startTimezoneOffset))
    return localDate === todayKey
  })

  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [showAlert, setShowAlert] = useState(false)
  const [alertShownForSessionRef] = useState<{ id: string | null }>({ id: null })

  // Redirect to onboarding if no treatment set up
  useEffect(() => {
    if (loaded && !treatment) navigate('/onboarding', { replace: true })
  }, [loaded, treatment, navigate])

  // Show alert dialog when reminder fires (once per session)
  useEffect(() => {
    if (reminderFired && alertShownForSessionRef.id !== (treatment ? String(currentSet) : null)) {
      setShowAlert(true)
      alertShownForSessionRef.id = String(currentSet)
    }
  }, [reminderFired])

  // Suppress stats rendering until data is loaded
  if (!loaded) return <div className="p-8 text-center text-gray-400">Loading…</div>

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-xl font-bold text-gray-800">AlignerTrack</h1>
        {treatment && (
          <span className="text-sm text-gray-500">
            Set {treatment.currentSetNumber}
            {treatment.totalSets ? `/${treatment.totalSets}` : ''}
          </span>
        )}
      </div>

      {isRunning && (
        <ActiveTimer elapsedMinutes={elapsedMinutes} reminderFired={reminderFired} />
      )}

      {autoCapped && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
          Session was automatically ended after {autoCapMins} minutes.
        </div>
      )}

      <div className="flex justify-center py-2">
        <TimerButton isRunning={isRunning} onPress={isRunning ? stop : start} />
      </div>

      <DailySummary
        totalOffMinutes={todayStats.totalOffMinutes}
        removals={todayStats.removals}
        goalMinutes={goalMinutes}
        streak={streak}
        activeMinutes={isRunning ? elapsedMinutes : 0}
      />

      <div>
        <h3 className="font-semibold text-gray-700 text-sm mb-2">Today's Sessions</h3>
        <SessionList sessions={todaySessions} onEdit={setEditingSession} />
      </div>

      <TreatmentProgress
        treatment={treatment}
        defaultSetDurationDays={treatment?.defaultSetDurationDays ?? 7}
      />

      {showAlert && (
        <TimerAlert
          thresholdMinutes={reminderMins}
          onDismiss={() => setShowAlert(false)}
        />
      )}

      {editingSession && (
        <SessionEditModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
        />
      )}
    </div>
  )
}
