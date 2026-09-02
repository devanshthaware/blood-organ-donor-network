# ML Integration Status

## ✅ Current Status: INTEGRATED

The ML backend is fully integrated with Firebase and updates are reflected in the UI in real-time.

## How It Works

### 1. Flow Overview

```
Hospital creates request
    ↓
Firebase Function: onDonationRequestCreated
    ↓
Calls ML API: /predict/demand
    ↓
Stores ML output in ml_outputs collection
    ↓
Firebase Function: onDemandForecastCreated
    ↓
Queries eligible donors
    ↓
For each donor:
    - Calls ML API: /predict/availability
    - Calls ML API: /predict/reliability
    - Calculates combined score
    ↓
Creates reservations with ML scores
    ↓
UI updates in real-time via Firestore listeners
```

### 2. Firebase Functions Integration

**Function: `onDonationRequestCreated`**
- Trigger: When a donation request is created
- Action: Calls `/predict/demand` ML endpoint
- Stores result in: `ml_outputs/demand_{requestId}`

**Function: `onDemandForecastCreated`**
- Trigger: When demand forecast is created
- Action: 
  - Queries eligible donors
  - For each donor:
    - Calls `/predict/availability`
    - Calls `/predict/reliability`
    - Calculates combined score (60% availability + 40% reliability)
  - Creates reservations with ML scores
- Stores results in: `reservations/{id}` with `mlScores` field

### 3. ML Scores Structure

Reservations contain:
```typescript
{
  mlScores: {
    availability: number,    // 0.0 - 1.0
    reliability: number,     // 0.0 - 1.0
    combined: number         // 0.0 - 1.0 (weighted average)
  },
  explanation: string,       // Human-readable explanation
  distanceKm: number        // Distance from donor to hospital
}
```

### 4. UI Display

**Where ML Scores Are Shown:**

1. **Donor Availability Page** (`/donor/availability`)
   - Shows combined match score as percentage
   - Example: "82.2%"

2. **Hospital Reservations Page** (`/hospital/reservations`)
   - Shows match score for each reservation
   - Sorted by rank (highest score first)

3. **Hospital Dashboard** (`/hospital/dashboard`)
   - Shows match scores in recent reservations widget

### 5. Real-Time Updates

- All UI components use Firestore `onSnapshot` listeners
- When Firebase Functions create/update reservations with ML scores, UI updates automatically
- No page refresh needed

## Configuration

### ML API URL

The ML API URL is configured in `functions/src/index.ts`:

```typescript
const getMLApiUrl = (): string => {
  const config = process.env.ML_API_URL || 
    (admin.app().options.projectId === "demo-veinlink" 
      ? "http://localhost:8000" 
      : "https://your-ml-service.com");
  return config;
};
```

**For Local Development:**
- Default: `http://localhost:8000`
- Make sure ML backend is running on port 8000
- Use `start-all.ps1` script to start everything together

**For Production:**
- Set `ML_API_URL` environment variable in Firebase Functions config
- Or update the default URL in the code

## Testing ML Integration

### 1. Start All Services
```powershell
.\start-all.ps1
```

This starts:
- ML Backend (uvicorn) on port 8000
- Firebase Emulators
- Next.js dev server

### 2. Create a Donation Request

1. Login as hospital: `hospital1@example.com` / `password123`
2. Go to Requests page
3. Click "Create Request"
4. Fill in blood type, quantity, urgency
5. Submit

### 3. Verify ML Integration

**Check Firebase Functions Logs:**
- Look for: "Calling ML API: http://localhost:8000/predict/demand"
- Look for: "Calling ML API: http://localhost:8000/predict/availability"
- Look for: "Calling ML API: http://localhost:8000/predict/reliability"

**Check Firestore:**
- `ml_outputs/demand_{requestId}` - Should contain demand forecast
- `ml_outputs/availability_{reservationId}` - Should contain availability predictions
- `ml_outputs/reliability_{reservationId}` - Should contain reliability scores
- `reservations/{id}` - Should contain `mlScores` field

**Check UI:**
- Go to Hospital Reservations page
- You should see reservations with match scores (e.g., "82.2%")
- Scores should appear automatically (real-time)

### 4. Verify ML API is Running

```bash
curl http://localhost:8000/health
```

Should return:
```json
{"status": "ok", "models_loaded": true}
```

## Troubleshooting

### Issue: ML Scores Not Appearing

**Check:**
1. Is ML backend running? (`http://localhost:8000/health`)
2. Are Firebase Functions running? (Check emulator logs)
3. Are there eligible donors? (Check `donors` collection)
4. Check Firebase Functions logs for errors

**Common Errors:**
- `ML API call failed: connect ECONNREFUSED` - ML backend not running
- `ML API call failed: timeout` - ML backend too slow (increase timeout)
- No reservations created - No eligible donors found

### Issue: ML Scores Show "N/A"

**Possible Causes:**
1. ML API call failed (check function logs)
2. Reservation created before ML scores calculated
3. Error in ML API response format

**Solution:**
- Check Firebase Functions logs
- Verify ML API is returning correct format
- Check `ml_outputs` collection for errors

### Issue: Real-Time Updates Not Working

**Check:**
1. Firestore listeners are active (check browser console)
2. Network tab shows WebSocket connections
3. No errors in browser console

## ML API Endpoints Used

1. **POST /predict/demand**
   - Input: region, blood_group, demand_units, supply_units, month, day
   - Output: `{ predicted_demand: number }`

2. **POST /predict/availability**
   - Input: blood_group, distance_km, days_since_last_donation, past_acceptance_rate, urgency_level, time_of_day
   - Output: `{ availability_probability: number }`

3. **POST /predict/reliability**
   - Input: total_requests, accepted_requests, completed_donations, no_shows, avg_response_time_minutes
   - Output: `{ reliability_score: number }`

## Summary

✅ **ML is fully integrated with Firebase**
✅ **ML scores are stored in Firestore**
✅ **UI displays ML scores in real-time**
✅ **All three ML models are called automatically**
✅ **Real-time updates work via Firestore listeners**

The system is production-ready for ML integration. Just make sure:
1. ML backend is running (port 8000)
2. Firebase Functions can reach ML API
3. Eligible donors exist in database
