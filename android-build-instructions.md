# NGA Hub Android Build Instructions

## Prerequisites
1. Install Android Studio: https://developer.android.com/studio
2. Install Java JDK 17+: https://adoptium.net/

## First-time setup (run once)
```bash
npx cap add android
```

## Build APK
```bash
# Option 1: Open in Android Studio (recommended)
npm run cap:open

# Option 2: Build directly
cd android
./gradlew assembleDebug
# APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

## Update after code changes
```bash
npm run build:android
```

## The Android app
- Loads the live NGA Hub web app from Railway
- All features work: camera, notifications, offline storage
- Install the APK on any Android device
