# Set Edit Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the "Current" badge appearing on future sets, disable Save when nothing has changed, allow editing a set's number, and allow deleting a set.

**Architecture:** All changes are contained to `SetEditModal` (UI) and `useSets` (data layer). The badge fix is a one-line date guard. The save-disabled change adds a `hasChanges` boolean. Set number editing extends `updateSet`. Delete adds a new `deleteSet` function plus a two-stage confirmation UI in the modal.

**Tech Stack:** React, TypeScript, Vitest, Firebase Realtime Database, Dexie (IndexedDB)

---

## File Map

| File | Change |
|------|--------|
| `src/hooks/useSets.ts` | Add `deleteSet`, extend `updateSet` to accept `setNumber` |
| `src/hooks/useSets.test.ts` | Add tests for `deleteSet` and `updateSet` with `setNumber` |
| `src/components/sets/SetEditModal.tsx` | Add set number field, `hasChanges` guard, delete flow |
| `src/views/HistoryView.tsx` | Add date guard to `isCurrent` |

No new files. No changes to `syncManager`, `types`, or `firebase` — `delete` is already a supported operation throughout (`SyncQueueItem.operation: 'set' | 'update' | 'delete'` and `syncManager` already calls `remove(fbRef)` for it).

---

## Task 1: Fix the "Current" badge on future sets

**Files:**
- Modify: `src/views/HistoryView.tsx`

### Background

`isCurrent` is computed at two places in `HistoryView`:

1. **Line 156** (list render): `const isCurrent = s.setNumber === treatment?.currentSetNumber`
2. **Line 234** (modal prop): `isCurrent={editingSet.setNumber === treatment?.currentSetNumber}`

Both need a date guard so a future set can never appear as "Current". `todayLocalDate` is available from `'../utils/time'` but is not currently imported in HistoryView.

- [ ] **Step 1: Add `todayLocalDate` to HistoryView imports**

In `src/views/HistoryView.tsx`, change:
```ts
import { toLocalDate, formatDateKey, formatDurationShort, diffMinutes, dateDiffDays } from '../utils/time'
```
To:
```ts
import { toLocalDate, formatDateKey, formatDurationShort, diffMinutes, dateDiffDays, todayLocalDate } from '../utils/time'
```

- [ ] **Step 2: Add date guard to list `isCurrent` (line 156)**

Change:
```ts
const isCurrent = s.setNumber === treatment?.currentSetNumber
```
To:
```ts
const isCurrent = s.setNumber === treatment?.currentSetNumber
  && s.startDate.slice(0, 10) <= todayLocalDate()
```

- [ ] **Step 3: Add date guard to modal `isCurrent` prop (line 234)**

Change:
```ts
isCurrent={editingSet.setNumber === treatment?.currentSetNumber}
```
To:
```ts
isCurrent={editingSet.setNumber === treatment?.currentSetNumber
  && editingSet.startDate.slice(0, 10) <= todayLocalDate()}
```

- [ ] **Step 4: Verify manually**

```bash
npm run dev
```

Create a set with a future start date (e.g., tomorrow). Confirm it does **not** show the "Current" badge. The existing set (start date today or earlier) should still show it.

- [ ] **Step 5: Commit**

```bash
git add src/views/HistoryView.tsx
git commit -m "fix: only show Current badge when set start date is today or earlier"
```

---

## Task 2: Disable Save when no changes

**Files:**
- Modify: `src/components/sets/SetEditModal.tsx`

### Background

`SetEditModal` already tracks `startChanged` and `endChanged` (lines 53–57). We add `noteChanged` and a `setNumberChanged` placeholder (wired up in Task 3) and require `hasChanges` in `canSave`.

Current `canSave` (line 83):
```ts
const canSave = !saving && !durationError && !startDateError && !adjacencyError
```

- [ ] **Step 1: Add `noteChanged`, `setNumberChanged`, and `hasChanges` after `endChanged`**

After the `endChanged` line (line 57), add:
```ts
const noteChanged = (note.trim() || null) !== set.note
const setNumberChanged = false // wired up in Task 3
const hasChanges = startChanged || endChanged || noteChanged || setNumberChanged
```

- [ ] **Step 2: Update `canSave` to require `hasChanges`**

Change:
```ts
const canSave = !saving && !durationError && !startDateError && !adjacencyError
```
To:
```ts
const canSave = hasChanges && !saving && !durationError && !startDateError && !adjacencyError
```

- [ ] **Step 3: Verify manually**

```bash
npm run dev
```

Open any set. Save should be dimmed. Edit the note or a date — Save becomes active. Revert the change — Save dims again.

- [ ] **Step 4: Commit**

```bash
git add src/components/sets/SetEditModal.tsx
git commit -m "fix: disable Save in SetEditModal when no fields have changed"
```

---

## Task 3: Edit set number

**Files:**
- Modify: `src/hooks/useSets.ts`
- Modify: `src/hooks/useSets.test.ts`
- Modify: `src/components/sets/SetEditModal.tsx`

### Background

`updateSet` in `useSets.ts` currently accepts:
```ts
Partial<Pick<AlignerSet, 'startDate' | 'endDate' | 'note'>>
```

Firebase `update` does a shallow merge, so simply extending the type to include `setNumber` is all that's needed at the data layer. No logic changes.

If the set being edited is the current set (`isCurrent` prop is `true`) and its number changes, we also call `updateTreatment({ currentSetNumber: newNumber })`.

### Step 3a — Data layer

- [ ] **Step 1: Write the failing test for `updateSet` with `setNumber`**

Add to `src/hooks/useSets.test.ts`, after the existing `updateTreatment` describe block:

```ts
describe('updateSet', () => {
  it('updates setNumber in localDB and Firebase when online', async () => {
    const { result } = renderHook(() => useSets())
    await act(async () => {
      await result.current.updateSet('s1', { setNumber: 7 })
    })

    expect(localDB.sets.update).toHaveBeenCalledWith('s1', { setNumber: 7 })
    expect(fbUpdate).toHaveBeenCalled()
    expect(queueWrite).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails (TypeScript error)**

```bash
npm test -- useSets --run
```

Expected: TypeScript compile error — `setNumber` is not in the allowed keys.

- [ ] **Step 3: Extend `updateSet` type in `useSets.ts`**

Change line 75:
```ts
updates: Partial<Pick<AlignerSet, 'startDate' | 'endDate' | 'note'>>
```
To:
```ts
updates: Partial<Pick<AlignerSet, 'startDate' | 'endDate' | 'note' | 'setNumber'>>
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- useSets --run
```

Expected: all tests green.

- [ ] **Step 5: Commit data layer**

```bash
git add src/hooks/useSets.ts src/hooks/useSets.test.ts
git commit -m "feat: allow updateSet to update setNumber"
```

### Step 3b — UI

- [ ] **Step 6: Add set number state to `SetEditModal`**

The hook call at the top of the component currently is:
```ts
const { updateSet } = useSets()
```

Change to:
```ts
const { updateSet, updateTreatment, sets, treatment: hookTreatment } = useSets()
```

(`treatment` from the hook is used for the conflict check; the `isCurrent` prop still comes from the parent for badge display.)

Then add state and validation after the existing `useState` calls:
```ts
const [setNumber, setSetNumberState] = useState(String(set.setNumber))
const setNumberVal = parseInt(setNumber)
const setNumberError =
  setNumber === '' || isNaN(setNumberVal) || setNumberVal < 1
    ? 'Enter a valid set number'
    : sets.find(s => s.id !== set.id && s.setNumber === setNumberVal)
      ? `Set ${setNumberVal} already exists`
      : null
```

- [ ] **Step 7: Wire `setNumberChanged` to the real value (replaces Task 2 placeholder)**

Replace:
```ts
const setNumberChanged = false // wired up in Task 3
```
With:
```ts
const setNumberChanged = setNumberVal !== set.setNumber && !setNumberError
```

- [ ] **Step 8: Add Set Number input to the JSX (above Start Date)**

Add this block immediately before the Start Date `<div>` (around line 177):
```tsx
<div>
  <label style={labelStyle}>Set Number</label>
  <input
    type="number"
    min="1"
    value={setNumber}
    onChange={e => setSetNumberState(e.target.value)}
  />
  {setNumberError && <p style={{ fontSize: 11, color: 'var(--rose)', margin: '4px 0 0' }}>{setNumberError}</p>}
</div>
```

- [ ] **Step 9: Include `setNumberError` in `canSave`**

Change:
```ts
const canSave = hasChanges && !saving && !durationError && !startDateError && !adjacencyError
```
To:
```ts
const canSave = hasChanges && !saving && !durationError && !startDateError && !adjacencyError && !setNumberError
```

- [ ] **Step 10: Include `setNumber` in the save payload and update treatment if current**

In `handleSave`, change the `updates` object from:
```ts
const updates: Partial<Pick<AlignerSet, 'startDate' | 'endDate' | 'note'>> = {
  startDate,
  endDate: computedEndDate ?? set.endDate,
  note: note.trim() || null,
}
await updateSet(set.id, updates)
```
To:
```ts
const updates: Partial<Pick<AlignerSet, 'startDate' | 'endDate' | 'note' | 'setNumber'>> = {
  startDate,
  endDate: computedEndDate ?? set.endDate,
  note: note.trim() || null,
  ...(setNumberChanged ? { setNumber: setNumberVal } : {}),
}
await updateSet(set.id, updates)
```

Then, after the existing adjacent-set cascade block (the `if (startChanged && prevSet)` and `if (computedEndDate && endChanged && nextSet)` calls) and before `onClose()`, add:
```ts
if (setNumberChanged && isCurrent) {
  await updateTreatment({ currentSetNumber: setNumberVal })
}
```

- [ ] **Step 11: Verify manually**

```bash
npm run dev
```

- Open a set → "Set Number" field appears above Start Date.
- Enter a number that already exists → error shown, Save stays disabled.
- Enter a unique number → Save becomes enabled, saves correctly, list updates.
- Change number of the current set → "Current" badge follows the new number.

- [ ] **Step 12: Commit UI**

```bash
git add src/components/sets/SetEditModal.tsx
git commit -m "feat: add editable set number field to SetEditModal"
```

---

## Task 4: Delete a set

**Files:**
- Modify: `src/hooks/useSets.ts`
- Modify: `src/hooks/useSets.test.ts`
- Modify: `src/components/sets/SetEditModal.tsx`

### Background

The modal has three UI states managed by a `view` variable: `'edit'` (normal), `'confirmDelete'`, and `'pickCurrent'` (only shown after deleting the current set). `syncManager` and `SyncQueueItem` already support `operation: 'delete'`. Firebase's `remove` is already imported in `firebase.ts`. No infrastructure changes needed.

### Step 4a — Data layer

- [ ] **Step 1: Extend the firebase mock and add `delete` to the sets mock**

In `src/hooks/useSets.test.ts`, make these additions:

```ts
// 1. Add `remove` to the firebase mock factory:
vi.mock('../services/firebase', () => ({
  push: vi.fn(() => ({ key: 'new-set-id' })),
  set: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),       // ← add
  ref: vi.fn(() => ({})),
  db: {},
  setsRef: vi.fn(() => ({})),
}))

// 2. Add `delete` to localDB.sets mock:
vi.mock('../services/db', () => ({
  localDB: {
    sets: {
      put: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),   // ← add
    },
    treatment: { update: vi.fn() },
  },
}))

// 3. Add to imports:
import { set as fbSet, update as fbUpdate, remove as fbRemove } from '../services/firebase'

// 4. Add to beforeEach:
vi.mocked(fbRemove).mockResolvedValue(undefined as never)
vi.mocked(localDB.sets.delete).mockResolvedValue(undefined as never)
```

- [ ] **Step 2: Write the failing tests for `deleteSet`**

Add after the `updateSet` describe block:

```ts
describe('deleteSet', () => {
  it('deletes from localDB and Firebase when online', async () => {
    vi.mocked(useDataContext).mockReturnValue({
      sets: [makeSet('s1', 3)],
      treatment: makeTreatment(3),
    } as never)

    const { result } = renderHook(() => useSets())
    await act(async () => { await result.current.deleteSet('s1') })

    expect(localDB.sets.delete).toHaveBeenCalledWith('s1')
    expect(fbRemove).toHaveBeenCalled()
    expect(queueWrite).not.toHaveBeenCalled()
  })

  it('queues delete when offline', async () => {
    vi.mocked(useOnlineStatus).mockReturnValue(false)
    vi.mocked(useDataContext).mockReturnValue({
      sets: [makeSet('s1', 3)],
      treatment: makeTreatment(3),
    } as never)

    const { result } = renderHook(() => useSets())
    await act(async () => { await result.current.deleteSet('s1') })

    expect(fbRemove).not.toHaveBeenCalled()
    expect(queueWrite).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'delete', path: 'users/user1/sets/s1' })
    )
  })
})
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
npm test -- useSets --run
```

Expected: `result.current.deleteSet is not a function`.

- [ ] **Step 4: Implement `deleteSet` in `useSets.ts`**

Verify `remove` is in the firebase import at line 2. If not, add it:
```ts
import { push, set, update, remove, ref, db, setsRef } from '../services/firebase'
```

Add `deleteSet` inside `useSets`, after `updateSet`:
```ts
const deleteSet = useCallback(async (setId: string) => {
  const path = `users/${uid}/sets/${setId}`
  await localDB.sets.delete(setId)
  if (online) await remove(ref(db, path))
  else await queueWrite({ operation: 'delete', path, data: null, timestamp: nowISO(), deviceId })
}, [uid, online, deviceId])
```

Add to the return:
```ts
return { sets, treatment, startNewSet, updateTreatment, updateSet, deleteSet }
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test -- useSets --run
```

Expected: all tests green.

- [ ] **Step 6: Commit data layer**

```bash
git add src/hooks/useSets.ts src/hooks/useSets.test.ts
git commit -m "feat: add deleteSet to useSets hook"
```

### Step 4b — UI

- [ ] **Step 7: Add `view` and `deleting` state, and destructure `deleteSet`**

At the top of `SetEditModal`, change:
```ts
const { updateSet, updateTreatment, sets, treatment: hookTreatment } = useSets()
```
To:
```ts
const { updateSet, updateTreatment, deleteSet, sets, treatment: hookTreatment } = useSets()
```

Add new state after the existing `useState` declarations:
```ts
type ModalView = 'edit' | 'confirmDelete' | 'pickCurrent'
const [view, setView] = useState<ModalView>('edit')
const [deleting, setDeleting] = useState(false)
```

- [ ] **Step 8: Add `handleDelete` and `handlePickCurrent` functions**

Add after `handleSave`:
```ts
const handleDelete = async () => {
  setDeleting(true)
  try {
    await deleteSet(set.id)
    if (isCurrent) {
      setView('pickCurrent')
    } else {
      onClose()
    }
  } catch (e: unknown) {
    setError((e as Error).message)
    setDeleting(false)
  }
}

const handlePickCurrent = async (pickedSet: AlignerSet) => {
  await updateTreatment({
    currentSetNumber: pickedSet.setNumber,
    currentSetStartDate: pickedSet.startDate.slice(0, 10),
  })
  onClose()
}
```

The `AlignerSet` type is already imported at the top of the file.

- [ ] **Step 9: Replace the bottom button area with view-conditional JSX**

The current bottom of the modal content (the Cancel/Save `<div>`, lines 229–246) becomes:

```tsx
{view === 'edit' && (
  <>
    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={onClose} style={{ ...btnBase, background: 'var(--surface-3)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={!canSave}
        style={{
          ...btnBase,
          background: canSave ? 'var(--cyan)' : 'var(--surface-3)',
          color: canSave ? '#06090f' : 'var(--text-faint)',
          border: canSave ? 'none' : '1px solid var(--border)',
          cursor: canSave ? 'pointer' : 'default',
        }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
    <button
      onClick={() => setView('confirmDelete')}
      style={{
        width: '100%', border: '1px solid rgba(248,113,113,0.3)',
        borderRadius: 12, padding: '13px 0', fontSize: 14, fontWeight: 600,
        fontFamily: 'inherit', cursor: 'pointer',
        background: 'transparent', color: 'var(--rose)',
      }}
    >
      Delete Set
    </button>
  </>
)}

{view === 'confirmDelete' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{
      background: 'var(--rose-bg)', border: '1px solid rgba(248,113,113,0.25)',
      borderRadius: 12, padding: 16, textAlign: 'center',
    }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--rose)', margin: '0 0 6px' }}>
        Delete Set {set.setNumber}?
      </p>
      {stats.totalRemovals > 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          {stats.totalRemovals} session{stats.totalRemovals === 1 ? '' : 's'} during this set will remain in history but won't be grouped under a set.
        </p>
      )}
    </div>
    <div style={{ display: 'flex', gap: 10 }}>
      <button
        onClick={() => setView('edit')}
        style={{ ...btnBase, background: 'var(--surface-3)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
      >
        Cancel
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        style={{ ...btnBase, background: 'var(--rose)', border: 'none', color: '#fff', cursor: deleting ? 'default' : 'pointer' }}
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  </div>
)}

{view === 'pickCurrent' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>
        Set {set.setNumber} deleted.
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
        Which set are you currently wearing?
      </p>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[...sets]
        .filter(s => s.id !== set.id)
        .sort((a, b) => b.setNumber - a.setNumber)
        .map(s => (
          <button
            key={s.id}
            onClick={() => handlePickCurrent(s)}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 16px', textAlign: 'left',
              fontFamily: 'inherit', cursor: 'pointer', width: '100%',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Set {s.setNumber}</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
              {s.startDate.slice(0, 10)}{s.endDate ? ` → ${s.endDate.slice(0, 10)}` : ' → ongoing'}
            </div>
          </button>
        ))}
    </div>
  </div>
)}
```

- [ ] **Step 10: Verify manually**

```bash
npm run dev
```

- A set with sessions shows the session count in the confirmation message.
- A set with 0 sessions omits the sessions line.
- Canceling from confirm returns to the edit view.
- Deleting a non-current set closes the modal; the set disappears from the list.
- Deleting the current set shows "Pick New Current Set" with all remaining sets.
- Tapping a set from the picker updates the "Current" badge and closes the modal.

- [ ] **Step 11: Run all tests**

```bash
npm test -- --run
```

Expected: all tests green.

- [ ] **Step 12: Commit**

```bash
git add src/components/sets/SetEditModal.tsx
git commit -m "feat: add delete set flow to SetEditModal"
```
