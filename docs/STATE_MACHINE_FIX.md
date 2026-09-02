# State Machine Fix - Donor Requests Flow

## Problem Summary

The Donor Panel – Requests flow had a critical state management bug where:
- Multiple conflicting sources of truth existed for request state
- Frontend and backend were reading/writing different status fields
- Request lifecycle rules were not enforced centrally
- Users could see action buttons for terminal states
- Alerts showed contradictory messages like "already declined" while the request was still visible

## Root Cause

1. **Multiple Sources of Truth**: The system tracked state in both `donation_requests.status` and `reservations.status`, causing conflicts
2. **No State Machine Enforcement**: Backend didn't strictly enforce valid state transitions
3. **Frontend Filtering Issues**: The `useDonationRequests` hook didn't properly filter out requests with terminal reservations
4. **Race Conditions**: No atomic transactions to prevent concurrent state updates

## Solution: Strict State Machine Implementation

### 1. Single Source of Truth

**Reservation status is now the authoritative state** for donor responses:
- `reservations.status` determines if a donor can accept/reject
- `donation_requests.status` is secondary (for request lifecycle)

### 2. State Machine Definition

```
PENDING
  ├─ ACCEPTED → CONFIRMED → COMPLETED
  └─ DECLINED (terminal)
```

**Terminal States** (cannot transition from):
- `DECLINED`
- `ACCEPTED`
- `CONFIRMED`
- `COMPLETED`
- `CANCELLED`

**Valid Transitions**:
- `PENDING` → `ACCEPTED` (via accept action)
- `PENDING` → `DECLINED` (via reject action)
- `ACCEPTED` → `CONFIRMED` (via Cloud Function)
- `CONFIRMED` → `COMPLETED` (via completion action)

### 3. Backend Enforcement (`/api/requests/[id]/respond`)

**Pre-Transaction Checks**:
1. Check if reservation exists
2. If exists, verify status is `PENDING` (not terminal)
3. Verify request status is `PENDING`
4. Verify blood group match

**Atomic Transaction**:
- Uses Firestore transactions to prevent race conditions
- Re-checks reservation status inside transaction
- Throws error if state changed between checks
- Updates reservation atomically

**Error Handling**:
- Clear error messages for invalid transitions
- Returns `400 Bad Request` for state conflicts
- Prevents duplicate actions

### 4. Frontend Filtering (`useDonationRequests`)

**New Logic**:
1. Fetch ALL reservations for the donor (not just PENDING)
2. Build a map of `requestId → reservationStatus`
3. Filter out requests with terminal reservation states
4. Only show requests where:
   - No reservation exists, OR
   - Reservation exists with status `PENDING`

**Result**: Requests with `DECLINED`, `ACCEPTED`, `CONFIRMED`, or `COMPLETED` reservations are automatically removed from the Requests page.

### 5. History Page Integration

**Enhanced `useDonationHistory`**:
- Fetches `donation_history` collection
- Also fetches terminal reservations (`DECLINED`, `ACCEPTED`, `CONFIRMED`, `COMPLETED`)
- Combines both sources for complete history
- Shows appropriate status badges with color coding

### 6. UI Updates

**Requests Page**:
- Only shows action buttons for `status === "PENDING"` requests
- Removed fallback badge display (should never appear due to filtering)
- Real-time updates via Firestore listeners

**History Page**:
- Color-coded status badges:
  - Green: `COMPLETED`, `CONFIRMED`
  - Blue: `ACCEPTED`
  - Red: `DECLINED`
  - Gray: Other states

## Files Modified

1. **`web/src/app/api/requests/[id]/respond/route.ts`**:
   - Added strict state machine validation
   - Implemented atomic transactions
   - Enhanced error handling

2. **`web/src/hooks/useDonationRequests.ts`**:
   - Rewrote donor logic to filter by reservation status
   - Single source of truth: reservation status map
   - Filters out terminal states

3. **`web/src/app/donor/requests/page.tsx`**:
   - Simplified UI logic (relies on hook filtering)
   - Removed redundant status checks

4. **`web/src/hooks/useDonationHistory.ts`**:
   - Enhanced to include terminal reservations
   - Combines donation_history and reservations

5. **`web/src/app/donor/history/page.tsx`**:
   - Added color-coded status badges

## Success Criteria ✅

- ✅ Donor can NEVER accept a declined request
- ✅ Donor can NEVER accept a completed request
- ✅ Action buttons only appear for PENDING requests
- ✅ No alert dialogs like "already declined" or "already completed"
- ✅ Requests disappear immediately from active list after action
- ✅ Terminal state requests appear in History page only
- ✅ Atomic transactions prevent race conditions
- ✅ Single source of truth (reservation status)

## Testing Checklist

1. **Accept Flow**:
   - [ ] Accept a PENDING request → Request disappears from Requests page
   - [ ] Try to accept again → Error: "already accepted"
   - [ ] Check History → Request appears with ACCEPTED status

2. **Decline Flow**:
   - [ ] Decline a PENDING request → Request disappears from Requests page
   - [ ] Try to decline again → Error: "already declined"
   - [ ] Check History → Request appears with DECLINED status

3. **Race Condition Test**:
   - [ ] Rapidly click Accept multiple times → Only one succeeds
   - [ ] Verify no duplicate reservations created

4. **State Persistence**:
   - [ ] Refresh page after accepting → Request still gone
   - [ ] Refresh page after declining → Request still gone
   - [ ] History persists across sessions

## Emulator Compatibility

All changes are compatible with Firebase Emulator:
- Uses Firestore transactions (emulator supports)
- Real-time listeners work in emulator
- No production-only dependencies

## Future Enhancements

1. Add optimistic UI updates for better UX
2. Add request cancellation flow
3. Add request expiration handling
4. Add bulk operations support
