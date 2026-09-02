# Quick Check: Are Firebase Emulators Running?

If you're getting the "api-key-not-valid" error, the most likely cause is that **Firebase emulators are not running**.

## Quick Fix

1. **Open a new terminal window**
2. **Navigate to project root:**
   ```bash
   cd "c:\Devansh\Build.exe hackathon\VeinLink-mvp"
   ```
3. **Start Firebase emulators:**
   ```bash
   firebase emulators:start
   ```
4. **Wait for this message:**
   ```
   ✔  All emulators ready! It is now safe to connect.
   ```
5. **Verify Emulator UI is accessible:**
   - Open http://localhost:4000 in your browser
   - You should see the Firebase Emulator Suite UI

6. **Restart your Next.js dev server:**
   - Stop it (Ctrl+C)
   - Start again: `cd web && pnpm dev`

7. **Refresh your browser** at http://localhost:3000/login

## Verify Emulators Are Running

Check if emulators are accessible:
- **Emulator UI:** http://localhost:4000
- **Auth Emulator:** http://localhost:9099
- **Firestore Emulator:** http://localhost:8080

If these URLs don't respond, emulators are not running.

## Common Issues

### Issue: Port already in use
**Solution:** Stop other services using ports 4000, 8080, 9099, or 5001

### Issue: Firebase CLI not installed
**Solution:** 
```bash
npm install -g firebase-tools
firebase login
```

### Issue: Still getting API key error after starting emulators
**Solution:**
1. Make sure emulators are fully started (wait for "All emulators ready!")
2. Restart Next.js dev server
3. Clear browser cache and hard refresh (Ctrl+Shift+R)
4. Check browser console for emulator connection messages
