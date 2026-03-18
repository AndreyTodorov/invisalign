# Sync Indicator Design

**Date:** 2026-03-18

## Problem

When reopening the app, users have no feedback about whether data is loaded and connected to Firebase. The existing full-page loading screens ("Loading your data…" and "Syncing with server…") only cover cold-start cases where data isn't available yet. Once the app is running, there is no indication of sync or connection status.

## Solution

A small status pill in the home screen header that appears **only when something is noteworthy** — while syncing on reopen, or when offline. It is invisible during normal operation.

## States

### Hidden (default)
The pill is not rendered. Firebase is connected and data is in sync. No visual noise.

### Syncing (amber)
- **When:** After IndexedDB has loaded (`loaded=true`) but Firebase hasn't yet confirmed data (`firebaseTreatmentLoaded=false`), and local treatment data already exists (so the full UI is shown).
- **Appearance:** Amber pulsing dot + "Syncing…" label, pill with amber border.
- **Dismissal:** Automatically hides when `firebaseTreatmentLoaded` becomes true (Firebase responds, or 5s timeout fires).
- **Note:** When there is no local treatment data and Firebase hasn't responded, the existing full-page "Syncing with server…" screen is retained — the pill is not shown in that case.

### Offline (gray)
- **When:** Firebase `/.info/connected` path becomes `false`, but only after the app has been connected at least once (avoids false alarms during cold start before Firebase has had a chance to connect).
- **Appearance:** Gray dot + "Offline" label, pill with subtle gray border.
- **Dismissal:** Automatically hides when connection is restored.

## Placement

The pill sits in the home screen header row, between the app title ("InvisaTrack") and the existing Set badge. It is only rendered in `HomeView`.

## Implementation

### 1. DataContext changes

Add two new values to `DataContextValue` and `DataProvider`:

- `connected: boolean | null` — Firebase connection state. `null` until the first `.info/connected` event is received (distinguishes "not yet known" from "known to be offline"). Subscribe to `ref(db, '.info/connected')` using `onValue` inside the existing Firebase `useEffect`.
- `syncing: boolean` — derived: `loaded && !firebaseTreatmentLoaded`. No new state needed; computed from existing state.

Expose both via context.

### 2. HomeView changes

In the header row of `HomeView`, conditionally render the sync pill:

```
syncing → amber pill ("Syncing…")
connected === false (and connected !== null) → gray pill ("Offline")
otherwise → nothing
```

The pill is a `<div>` with a colored dot and label, styled consistently with the existing Set badge (rounded pill, dark background, border).

### 3. No changes to full-page loading states

The `!loaded` and `!treatment && !firebaseTreatmentLoaded` full-page screens in `HomeView` remain unchanged.

## Visual Design

```
[InvisaTrack]   [● Syncing…]  [Set 3/20]
[InvisaTrack]   [● Offline]   [Set 3/20]
[InvisaTrack]                 [Set 3/20]   ← normal, pill hidden
```

- Amber dot pulses (CSS animation) during syncing
- Gray dot is static during offline
- Pill styled as: dark tinted background, colored border at 0.25 opacity, 11px font, 500 weight

## Out of Scope

- No "Connected" / green success state — pill is invisible when all is well
- No sync indicator on other views (Reports, Settings) — home screen only
- No retry button or manual refresh action
