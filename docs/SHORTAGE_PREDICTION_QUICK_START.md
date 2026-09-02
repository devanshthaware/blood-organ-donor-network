# Quick Start: Blood Shortage Prediction Feature

## Overview

This feature demonstrates real-time ML-based blood shortage prediction with automatic alert generation.

## Quick Setup (3 Steps)

### Step 1: Start Services

```bash
# Terminal 1: Firebase Emulators
firebase emulators:start

# Terminal 2: ML Backend
cd ml-backend
uvicorn ml_inference.api.main:app --reload --port 8000

# Terminal 3: Next.js
cd web
npm run dev
```

### Step 2: Seed Data

```bash
cd web
npm run seed:shortage
```

This creates:
- 4 hospitals (one per region)
- 8 blood inventory records (with varying shortage scenarios)
- 30 days of historical demand data
- Active donation requests

### Step 3: View Alerts

1. Open: http://localhost:3000/hospital/alerts
2. Log in as: `hospital1@veinlink.demo` (or any hospital user)
3. **Alerts should appear automatically** based on ML predictions

## What You'll See

### Alerts Generated

The system will automatically create alerts for:

- **CRITICAL** (≥70% ML prediction):
  - O+ in Region 1 (Supply: 15, Demand: 45)
  - B+ in Region 1 (Supply: 8, Demand: 35)
  - O- in Region 3 (Supply: 5, Demand: 25)

- **HIGH** (≥50% ML prediction):
  - A+ in Region 2 (Supply: 20, Demand: 60)

- **MEDIUM** (≥30% ML prediction):
  - AB+ in Region 2 (Supply: 30, Demand: 50)
  - A- in Region 4 (Supply: 25, Demand: 40)

### Alert Information

Each alert shows:
- **Severity Badge**: CRITICAL (red) / HIGH (red) / MEDIUM (blue)
- **Title**: "Critical Shortage Risk: O+ Blood in Region 1"
- **Message**: Includes ML prediction percentage and current supply/demand
- **AI Confidence**: ML predicted_demand score (0-100%)
- **Region & Area**: Geographic context
- **Recommended Actions**: Auto-generated action items

## Testing Real-Time Updates

### Test 1: Update Inventory Supply

1. Open Firebase Emulator UI: http://localhost:4000
2. Navigate to Firestore → `blood_inventory`
3. Find: `inventory_O+_region_1`
4. Change `supplyUnits` from `15` to `5`
5. **Watch the Alerts page** - a new CRITICAL alert should appear instantly

### Test 2: Update Inventory Demand

1. In Firestore, find: `inventory_A+_region_3`
2. Change `demandUnits` from `25` to `80`
3. **Watch the Alerts page** - alert severity may change or new alert appears

### Test 3: Create New Inventory Record

1. In Firestore, create new document in `blood_inventory`:
   ```json
   {
     "bloodGroup": "AB-",
     "region": 1,
     "supplyUnits": 10,
     "demandUnits": 50,
     "month": 1,
     "day": 15
   }
   ```
2. **Watch the Alerts page** - new alert should appear if ML predicts high risk

## Understanding ML Predictions

The ML model predicts the **probability of high demand** (0.0 to 1.0):

- **0.85 (85%)**: Very high risk → CRITICAL alert
- **0.65 (65%)**: High risk → HIGH alert
- **0.40 (40%)**: Moderate risk → MEDIUM alert
- **0.20 (20%)**: Low risk → No alert

The prediction is based on:
- Current supply vs demand ratio
- Historical patterns (month/day)
- Regional trends
- Blood group rarity

## Verification Checklist

✅ **Seed data created** (check Firestore Emulator UI)
✅ **ML backend running** (check http://localhost:8000/health)
✅ **Alerts appear** on Hospital Alerts page
✅ **Real-time updates work** (change inventory, see alert update)
✅ **ML confidence displayed** (shows prediction percentage)
✅ **Severity badges correct** (CRITICAL/HIGH/MEDIUM)
✅ **Region/Area shown** (geographic context visible)

## Troubleshooting

**No alerts showing?**
- Check Functions logs in Emulator UI
- Verify ML backend is running: `curl http://localhost:8000/health`
- Check `blood_inventory` collection has data
- Verify hospital user is logged in

**Alerts not updating?**
- Check browser console for Firestore errors
- Verify Firestore listener is active
- Check security rules allow hospital read access

**ML API errors?**
- Ensure ML backend is running on port 8000
- Check ML model files exist
- Verify function logs for ML API errors

## Next Steps

After verifying the feature works:

1. **Test with different scenarios**: Modify inventory data and watch alerts change
2. **Check ML outputs**: View `ml_outputs/shortage_*` documents in Firestore
3. **Review function logs**: See ML predictions and alert generation in action
4. **Demonstrate real-time**: Show how alerts update instantly when data changes

## Files to Review

- **Seed Script**: `web/scripts/seed-shortage-prediction-data.ts`
- **Function**: `functions/src/index.ts` (search for `onBloodInventoryChanged`)
- **Alerts Page**: `web/src/app/hospital/alerts/page.tsx`
- **Documentation**: `docs/SHORTAGE_PREDICTION_IMPLEMENTATION.md`

---

**The feature is now fully functional and ready for demonstration!** 🎉
