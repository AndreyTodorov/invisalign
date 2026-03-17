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

const sectionStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 18, padding: '18px 18px',
  display: 'flex', flexDirection: 'column', gap: 16,
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 500,
  color: 'var(--text-muted)', letterSpacing: '0.06em',
  textTransform: 'uppercase', marginBottom: 6,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
  letterSpacing: '0.06em', textTransform: 'uppercase',
}

const primaryBtn: React.CSSProperties = {
  width: '100%', background: 'var(--cyan)', color: '#06090f',
  border: 'none', borderRadius: 12, padding: '13px 0',
  fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
  letterSpacing: '0.02em',
}

const secondaryBtn: React.CSSProperties = {
  width: '100%', background: 'var(--surface-3)', color: 'var(--text)',
  border: '1px solid var(--border-strong)', borderRadius: 12, padding: '13px 0',
  fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
}

export default function SettingsPageView() {
  const { user, signOut } = useAuthContext()
  const { profile, treatment } = useDataContext()
  const { updateTreatment, startNewSet } = useSets()
  const { status, queueCount } = useSync()

  const [goalHours, setGoalHours] = useState(DEFAULT_DAILY_WEAR_GOAL_MINUTES / 60)
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
    <div style={{ padding: '0 16px 32px', maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>Settings</h1>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          {status}{queueCount > 0 ? ` · ${queueCount} pending` : ''}
        </span>
      </div>

      {saveError && (
        <div style={{
          background: 'var(--rose-bg)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 12, padding: '12px 14px', fontSize: 13, color: 'var(--rose)',
        }}>
          {saveError}
        </div>
      )}

      {/* Wear goal */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Wear Goal</span>
        <div>
          <label style={labelStyle}>Daily wear goal (hours)</label>
          <input type="number" min="1" max="24" step="0.5" value={goalHours}
            onChange={e => setGoalHours(parseFloat(e.target.value))} />
        </div>
        <div>
          <label style={labelStyle}>Reminder threshold (minutes)</label>
          <input type="number" min="5" max="120" value={reminderMins}
            onChange={e => setReminderMins(parseInt(e.target.value))} />
        </div>
        <div>
          <label style={labelStyle}>Auto-cap duration (minutes)</label>
          <input type="number" min="30" max="480" value={autoCapMins}
            onChange={e => setAutoCapMins(parseInt(e.target.value))} />
        </div>
        <button onClick={saveProfile} style={primaryBtn}>Save Preferences</button>
      </div>

      {/* Treatment */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Treatment Plan</span>
        <div>
          <label style={labelStyle}>Total aligner sets (leave blank if unknown)</label>
          <input type="number" min="1" value={totalSets}
            onChange={e => setTotalSets(e.target.value)} placeholder="e.g. 30" />
        </div>
        <div>
          <label style={labelStyle}>Default set duration (days)</label>
          <input type="number" min="1" max="30" value={defaultDuration}
            onChange={e => setDefaultDuration(parseInt(e.target.value))} />
        </div>
        <button onClick={saveTreatment} style={primaryBtn}>Save Treatment Settings</button>
      </div>

      {/* Switch set */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Switch Aligner Set</span>
        <div>
          <label style={labelStyle}>New set number</label>
          <input type="number" min="1" value={newSetNumber}
            onChange={e => setNewSetNumber(e.target.value)}
            placeholder={`e.g. ${(treatment?.currentSetNumber ?? 0) + 1}`} />
        </div>
        {/* FIX SF-2: in-UI confirmation, no window.confirm() */}
        {confirmNewSet !== null ? (
          <div style={{
            background: 'var(--amber-bg)', border: '1px solid rgba(252,211,77,0.2)',
            borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <p style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 500, textAlign: 'center' }}>
              Start Set {confirmNewSet}? This will close Set {treatment?.currentSetNumber}.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmNewSet(null)}
                style={{ flex: 1, ...secondaryBtn, width: 'auto' }}>
                Cancel
              </button>
              <button onClick={confirmStartNewSet}
                style={{ flex: 1, background: 'var(--green)', color: '#06090f', border: 'none', borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                Confirm
              </button>
            </div>
          </div>
        ) : (
          <button onClick={handleStartNewSet}
            style={{ ...secondaryBtn, color: 'var(--green)', borderColor: 'rgba(74,222,128,0.25)' }}>
            Start New Set
          </button>
        )}
      </div>

      {/* Notifications */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Notifications</span>
        {notifGranted ? (
          <p style={{ fontSize: 13, color: 'var(--green)' }}>Push notifications enabled ✓</p>
        ) : (
          <button onClick={handleRequestNotifications} style={secondaryBtn}>
            Enable Push Notifications
          </button>
        )}
      </div>

      <ExportButton />

      <button
        onClick={signOut}
        style={{
          width: '100%', background: 'transparent',
          color: 'var(--rose)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer',
        }}
      >
        Sign Out
      </button>
    </div>
  )
}
