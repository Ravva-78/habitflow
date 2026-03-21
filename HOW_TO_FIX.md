# HabitFlow Fix — Step by Step
# Only 2 files need replacing + 1 Railway step

## PROBLEM DIAGNOSIS
1. env.js was missing "https://" → URL was broken
2. server/index.js CORS blocked mobile apps (only allowed localhost)
3. server/index.js port was hardcoded to 3000 but Railway uses 8080

---

## STEP 1: Replace 2 files in your project

### File 1: Replace src/config/env.js
→ Copy env.js from this zip to: YourProject/src/config/env.js

### File 2: Replace server/index.js  
→ Copy server/index.js from this zip to: YourProject/server/index.js

---

## STEP 2: Redeploy server to Railway (takes 2 minutes)

You already have Railway running — just push the updated server/index.js:

**Option A — If server is connected to GitHub:**
1. Copy new server/index.js into your repo
2. git add . → git commit -m "fix cors and port" → git push
3. Railway auto-redeploys in ~1 minute

**Option B — If you uploaded files manually to Railway:**
1. Go to railway.app → your habitflow project
2. Click on the service → "Deploy" tab
3. Drag and drop the new server/index.js
4. Railway will redeploy automatically

---

## STEP 3: Add your Anthropic API key to Railway (CRITICAL)

This is likely why it fails — the API key must be set as a Railway variable:

1. Go to railway.app → habitflow project → click the service
2. Click "Variables" tab at the top
3. Click "+ New Variable"
4. Name: ANTHROPIC_API_KEY
5. Value: paste your Anthropic API key (from console.anthropic.com)
6. Click Add → Railway will restart automatically

---

## STEP 4: Test the server is working

Open this URL in your browser:
https://habitflow-production-0efc.up.railway.app/

You should see: {"status": "✅ HabitFlow API running", "version": "1.0.0"}

If you see that → AI Coach will work on your phone immediately.
If you see an error → Railway hasn't redeployed yet, wait 1 minute and refresh.

---

## STEP 5: Rebuild APK with fixed env.js

After fixing env.js, rebuild your APK:

cd C:\MYHABIT\HabitFlow
eas build -p android --profile preview

Install new APK on your phone → AI Coach will work!

---

## ADDING NEW HABITS (your other question)

You can add habits from Settings screen:
- Go to Settings tab → tap "+ Add New Habit"
- Fill in name, icon, reminder time
- It saves immediately and shows on Home screen

If you want a quick-add button on Home screen too, let me know
and I'll add that in the next update.

---

## CHECKLIST
- [ ] Replaced src/config/env.js
- [ ] Replaced server/index.js  
- [ ] Set ANTHROPIC_API_KEY in Railway Variables
- [ ] Redeployed server (or pushed to GitHub)
- [ ] Tested https://habitflow-production-0efc.up.railway.app/ in browser
- [ ] Rebuilt APK with eas build
- [ ] Installed new APK on phone
- [ ] Tested AI Coach → should work now!
