import { useState, useEffect } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { useDataContext } from '../contexts/DataContext'
import { useSets } from '../hooks/useSets'
import { useSync } from '../hooks/useSync'
import ExportButton from '../components/settings/ExportButton'
import { requestNotificationPermission } from '../services/notifications'
import { update, ref, db } from '../services/firebase'
import { localDB } from '../services/db'
import {
  DEFAULT_DAILY_WEAR_GOAL_MINUTES,
  DEFAULT_REMINDER_THRESHOLD_MINUTES,
  DEFAULT_AUTO_CAP_MINUTES,
} from '../constants'

export default function SettingsPageView() {
  const { user, signOut } = useAuthContext()
  const { profile, treatment } = useDataContext()
  const { updateTreatment, startNewSet } = useSets()
  const { status, queueCount } = useSync()

  const [goalHours, setGoalHours] = useState(
    (DEFAULT_DAILY_WEAR_GOAL_MINUTES / 60)
  )
  const [reminderMins, setReminderMins] = useState(DEFAULT_REMINDER_THRESHOLD_MINUTES)
  const [autoCapMins, setAutoCapMins] = useState(DEFAULT_AUTO_CAP_MINUTES)
  const [totalSets, setTotalSets] = useState<string>('')
  const [defaultDuration, setDefaultDuration] = useState(7)
  const [newSetNumber, setNewSetNumber] = useState<string>('')
  // FIX SF-2: in-UI confirmation instead of window.confirm()
  const [confirmNewSet, setConfirmNewSet] = useState<number | null>(null)
  const [notifGranted, setNotifGranted] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  )
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setGoalHours(profile.dailyWearGoalMinutes / 60)
      setReminderMins(profile.reminderThresholdMinutes)
      setAutoCapMins(profile.autoCapMinutes)
    }
    if (treatment) {
      setTotalSets(treatment.totalSets ? String(treatment.totalSets) : '')
      setDefaultDuration(treatment.defaultSetDurationDays)
    }
  }, [profile, treatment])

  const saveProfile = async () => {
    if (!user) return
    setSaveError(null)
    try {
      const updates = {
        dailyWearGoalMinutes: Math.round(goalHours * 60),
        reminderThresholdMinutes: reminderMins,
        autoCapMinutes: autoCapMins,
      }
      await update(ref(db, `users/${user.uid}/profile`), updates)
      await localDB.profile.update(user.uid, updates)
    } catch (e: unknown) {
      setSaveError((e as Error).message)
    }
  }

  const saveTreatment = async () => {
    setSaveError(null)
    try {
      await updateTreatment({
        totalSets: totalSets ? parseInt(totalSets) : null,
        defaultSetDurationDays: defaultDuration,
      })
    } catch (e: unknown) {
      setSaveError((e as Error).message)
    }
  }

  const handleStartNewSet = () => {
    const num = parseInt(newSetNumber)
    if (isNaN(num) || num < 1) return
    setConfirmNewSet(num)
  }

  const confirmStartNewSet = async () => {
    if (confirmNewSet === null) return
    try {
      await startNewSet(confirmNewSet)
      setNewSetNumber('')
      setConfirmNewSet(null)
    } catch (e: unknown) {
      setSaveError((e as Error).message)
      setConfirmNewSet(null)
    }
  }

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission()
    setNotifGranted(granted)
  }

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pb-8">
      <h1 className="text-xl font-bold text-gray-800 pt-2">Settings</h1>

      <div className="text-xs text-gray-400">
        Sync: {status}{queueCount > 0 ? ` (${queueCount} pending)` : ''}
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
          {saveError}
        </div>
      )}

      {/* Wear goal */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-700">Wear Goal</h2>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Daily wear goal (hours)</label>
          <input type="number" min="1" max="24" step="0.5" value={goalHours}
            onChange={e => setGoalHours(parseFloat(e.target.value))}
            className="w-full border rounded-xl p-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Reminder threshold (minutes)</label>
          <input type="number" min="5" max="120" value={reminderMins}
            onChange={e => setReminderMins(parseInt(e.target.value))}
            className="w-full border rounded-xl p-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Auto-cap duration (minutes)</label>
          <input type="number" min="30" max="480" value={autoCapMins}
            onChange={e => setAutoCapMins(parseInt(e.target.value))}
            className="w-full border rounded-xl p-2" />
        </div>
        <button onClick={saveProfile}
          className="w-full bg-indigo-500 text-white rounded-xl py-3 font-semibold">
          Save Preferences
        </button>
      </div>

      {/* Treatment */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-700">Treatment Plan</h2>
        <div>
          <label className="block text-sm text-gray-500 mb-1">
            Total aligner sets (leave blank if unknown)
          </label>
          <input type="number" min="1" value={totalSets}
            onChange={e => setTotalSets(e.target.value)}
            className="w-full border rounded-xl p-2" placeholder="e.g. 30" />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Default set duration (days)</label>
          <input type="number" min="1" max="30" value={defaultDuration}
            onChange={e => setDefaultDuration(parseInt(e.target.value))}
            className="w-full border rounded-xl p-2" />
        </div>
        <button onClick={saveTreatment}
          className="w-full bg-indigo-500 text-white rounded-xl py-3 font-semibold">
          Save Treatment Settings
        </button>
      </div>

      {/* Switch set */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-700">Switch Aligner Set</h2>
        <div>
          <label className="block text-sm text-gray-500 mb-1">New set number</label>
          <input type="number" min="1" value={newSetNumber}
            onChange={e => setNewSetNumber(e.target.value)}
            className="w-full border rounded-xl p-2"
            placeholder={`e.g. ${(treatment?.currentSetNumber ?? 0) + 1}`} />
        </div>
        {/* FIX SF-2: in-UI confirmation, no window.confirm() */}
        {confirmNewSet !== null ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-2">
            <p className="text-sm text-yellow-800 font-medium">
              Start Set {confirmNewSet}? This will close Set {treatment?.currentSetNumber}.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmNewSet(null)}
                className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-2 text-sm font-semibold">
                Cancel
              </button>
              <button onClick={confirmStartNewSet}
                className="flex-1 bg-green-500 text-white rounded-lg py-2 text-sm font-semibold">
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <button onClick={handleStartNewSet}
            className="w-full bg-green-500 text-white rounded-xl py-3 font-semibold">
            Start New Set
          </button>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-700">Notifications</h2>
        {notifGranted ? (
          <p className="text-sm text-green-600">Push notifications enabled</p>
        ) : (
          <button onClick={handleRequestNotifications}
            className="w-full bg-gray-100 text-gray-700 rounded-xl py-3 font-semibold text-sm">
            Enable Push Notifications
          </button>
        )}
      </div>

      <ExportButton />

      <button onClick={signOut}
        className="w-full bg-red-100 text-red-600 rounded-xl py-3 font-semibold">
        Sign Out
      </button>
    </div>
  )
}
