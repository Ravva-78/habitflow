# HabitFlow — Play Store Deployment Guide

## Step 1: Deploy the API Proxy Server (FREE)

1. Go to railway.app → New Project → Deploy from GitHub
2. Upload the /server folder
3. Add environment variable: ANTHROPIC_API_KEY = your_key_here
4. Railway gives you a URL like: https://habitflow-api.railway.app
5. Open src/config/env.js → paste that URL → set IS_PRODUCTION = true

## Step 2: Firebase Setup (FREE tier)

1. Go to console.firebase.google.com
2. Create project "habitflow"
3. Add Android app → package: com.arjun.habitflow
4. Download google-services.json → put in project root
5. Open firebase.js → paste your config
6. Enable Firestore Database (start in test mode)

## Step 3: App Icon + Screenshots

Need to create (1024x1024px):
- assets/icon.png         → App icon
- assets/adaptive-icon.png → Android adaptive icon
- assets/splash.png        → Splash screen

Play Store also needs:
- Feature graphic: 1024x500px
- At least 2 phone screenshots (1080x1920px)

## Step 4: Privacy Policy

Create a simple page at any URL (e.g. GitHub Pages) with:
- What data you collect (AsyncStorage only, no server unless Firebase enabled)
- How it's used
- Contact email

Free template: app-privacy-policy-generator.firebaseapp.com

## Step 5: Build final AAB (Play Store requires AAB not APK)

```
eas build --platform android --profile production
```

Add to eas.json:
```json
{
  "build": {
    "production": {
      "android": { "buildType": "app-bundle" }
    },
    "preview": {
      "android": { "buildType": "apk" }
    }
  }
}
```

## Step 6: Google Play Console

1. pay.google.com/gp/developer → Pay $25 one-time
2. Create app → Internal testing first
3. Upload AAB → fill store listing → submit for review
4. Review takes 1-3 days for new apps

## Checklist before submitting:
- [ ] API proxy deployed and working
- [ ] Firebase configured (optional but recommended)
- [ ] App icon (not default Expo icon)
- [ ] Privacy policy URL
- [ ] At least 2 screenshots
- [ ] App description written
- [ ] Tested on real device thoroughly
- [ ] Version code incremented in app.json
